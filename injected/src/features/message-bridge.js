import { Messaging } from '@duckduckgo/messaging';
import ContentFeature from '../content-feature.js';
import {
    InstallProxy,
    DidInstall,
    ProxyNotification,
    ProxyRequest,
    ProxyResponse,
    SubscriptionRequest,
    SubscriptionResponse,
    SubscriptionUnsubscribe,
} from './message-bridge/schema.js';
import * as capturedGlobals from '../captured-globals.js';
import { isBeingFramed } from '../utils.js';
import { getSharedMessagingTransport } from '../sendmessage-transport.js';

/**
 * @typedef {Pick<import("../captured-globals.js"),
 *    "dispatchEvent" | "addEventListener" | "CustomEvent">
 * } Captured
 */

/**
 * The features a page may install, by the domain it must be on, before the remote config arrives in the extension.
 * The remote config still decides whether their messages are delivered.
 * @type {Record<string, string>}
 */
const PROVISIONAL_FEATURE_DOMAINS = {
    internalFeedback: 'internalapps.duckduckgo.com',
};

/**
 * How long held messages wait for the remote config before their requests fail.
 */
const HELD_MESSAGES_TIMEOUT_MS = 10_000;

/**
 * This part has access to messaging handlers
 */
export class MessageBridge extends ContentFeature {
    /** @type {Captured} */
    captured = capturedGlobals;
    /**
     * A mapping of feature names to instances of `Messaging`.
     * This allows the bridge to handle more than 1 feature at a time.
     * @type {Map<string, Messaging>}
     */
    proxies = new capturedGlobals.Map();

    /**
     * If any subscriptions are created, we store the cleanup functions
     * for later use.
     * @type {Map<string, () => void>}
     */
    subscriptions = new capturedGlobals.Map();

    /**
     * This side of the bridge can only be instantiated once,
     * so we use this flag to ensure we can handle multiple invocations
     */
    installed = false;

    /**
     * Messages from the page held until the remote config arrives, or null when they are delivered at once.
     * Each one delivers itself, or fails if its feature was not installed.
     * @type {(() => void)[] | null}
     */
    heldMessages = null;

    /**
     * Installs confirmed to the page before the remote config arrived, by feature name.
     * @type {Map<string, () => void>}
     */
    provisionalInstalls = new capturedGlobals.Map();

    /** @type {ReturnType<typeof setTimeout> | undefined} */
    heldMessagesTimeout;

    listenForUpdateChanges = true;

    load(args) {
        /**
         * In the extension, pages call `createMessageBridge()` as they start, which is usually before `init`
         * brings the remote config, and the page needs the install confirmed at once
         */
        if (args.platform?.name !== 'extension') return;
        this.heldMessages = [];
        this.listen(args);
    }

    init(args) {
        this.listen(args);
        this.releaseHeldMessages(true);
    }

    /**
     * @param {string} reason
     */
    markFeatureAsSkipped(reason) {
        super.markFeatureAsSkipped(reason);
        this.releaseHeldMessages(false);
    }

    /**
     * The extension answers requests with update messages, so they are routed to the transport that sent them.
     */
    update(message) {
        if (message?.messageType !== 'response') return;
        getSharedMessagingTransport().onResponse(message);
    }

    /**
     * Delivers the held messages once the remote config has decided the provisional installs.
     * @param {boolean} remoteConfigArrived - false when the bridge was skipped or the remote config never came
     */
    releaseHeldMessages(remoteConfigArrived) {
        const heldMessages = this.heldMessages;
        if (!heldMessages) return;
        this.heldMessages = null;
        clearTimeout(this.heldMessagesTimeout);
        if (remoteConfigArrived) {
            this.provisionalInstalls.forEach((install) => install());
        }
        this.provisionalInstalls.clear();
        heldMessages.forEach((deliver) => deliver());
    }

    /**
     * @param {any} args
     */
    listen(args) {
        if (this.installed) return;
        /**
         * This feature never operates in a frame or insecure context
         */
        if (isBeingFramed() || !isSecureContext) return;
        /**
         * This feature never operates without messageSecret
         */
        if (!args.messageSecret) return;

        this.installed = true;
        const { captured } = this;

        /**
         * @param {string} eventName
         * @return {`${string}-${string}`}
         */
        function appendToken(eventName) {
            return `${eventName}-${args.messageSecret}`;
        }

        /**
         * @param {{name: string; id: string} & Record<string, any>} incoming
         */
        const reply = (incoming) => {
            if (!args.messageSecret) return this.log.info('ignoring because args.messageSecret was absent');
            const eventName = appendToken(incoming.name + '-' + incoming.id);
            const event = new captured.CustomEvent(eventName, { detail: incoming });
            captured.dispatchEvent(event);
        };

        /**
         * @template T
         * @param {{ create: (params: unknown) => T | null, NAME: string }} ClassType - A class with a `create` static method.
         * @param {(instance: T) => void} callback - A callback that receives an instance of the class.
         */
        const accept = (ClassType, callback) => {
            captured.addEventListener(appendToken(ClassType.NAME), (/** @type {CustomEvent<unknown>} */ e) => {
                this.log.info(`${ClassType.NAME}`, JSON.stringify(e.detail));
                const instance = ClassType.create(e.detail);
                if (instance) {
                    callback(instance);
                } else {
                    this.log.info('Failed to create an instance');
                }
            });
        };

        /**
         * Holds a message for a provisionally installed feature until the remote config arrives.
         * @param {string} featureName
         * @param {() => void} deliver
         * @returns {boolean} whether the message was held
         */
        const hold = (featureName, deliver) => {
            if (!this.heldMessages || !this.provisionalInstalls.has(featureName)) return false;
            this.heldMessages.push(deliver);
            return true;
        };

        /**
         * These are all the messages we accept from the page-world.
         */
        this.log.info(`bridge is installing...`);
        accept(InstallProxy, (install) => {
            if (!this.heldMessages) {
                this.installProxyFor(install, args.messagingConfig, reply);
            } else if (PROVISIONAL_FEATURE_DOMAINS[install.featureName] === args.site?.domain) {
                this.installProvisionally(install, args.messagingConfig, reply);
            } else {
                this.log.info('not installing proxy before the remote config arrived for', install.featureName);
            }
        });
        accept(ProxyNotification, (notification) => {
            if (!hold(notification.featureName, () => this.proxyNotification(notification))) {
                this.proxyNotification(notification);
            }
        });
        accept(ProxyRequest, (request) => {
            const deliverOrFail = () => {
                if (this.proxies.has(request.featureName)) {
                    void this.proxyRequest(request, reply);
                } else {
                    this.failRequest(request, reply);
                }
            };
            if (!hold(request.featureName, deliverOrFail)) {
                void this.proxyRequest(request, reply);
            }
        });
        accept(SubscriptionRequest, (subscription) => {
            if (!hold(subscription.featureName, () => this.proxySubscription(subscription, reply))) {
                this.proxySubscription(subscription, reply);
            }
        });
        accept(SubscriptionUnsubscribe, (unsubscribe) => {
            if (this.heldMessages) {
                this.heldMessages.push(() => this.removeSubscription(unsubscribe.id));
            } else {
                this.removeSubscription(unsubscribe.id);
            }
        });
    }

    /**
     * Confirms the install to the page at once, and installs the proxy only if the remote config allows it.
     *
     * @param {InstallProxy} install
     * @param {import('@duckduckgo/messaging').MessagingConfig} config
     * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
     */
    installProvisionally(install, config, reply) {
        const { id, featureName } = install;
        if (this.provisionalInstalls.size === 0) {
            this.heldMessagesTimeout = setTimeout(() => this.releaseHeldMessages(false), HELD_MESSAGES_TIMEOUT_MS);
        }
        if (!this.provisionalInstalls.has(featureName)) {
            this.provisionalInstalls.set(featureName, () => this.installProxyFor(install, config, () => {}));
        }
        this.log.info('did install proxy provisionally for ', featureName);
        reply(new DidInstall({ id }));
    }

    /**
     * @param {ProxyRequest} request
     * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
     */
    failRequest(request, reply) {
        const { id, featureName, method } = request;
        this.log.info('failing request, because the proxy was not installed for', featureName);
        reply(
            new ProxyResponse({
                method,
                featureName,
                error: { message: `${featureName} is not available` },
                id,
            }),
        );
    }

    /**
     * Installing a feature proxy is the act of creating a fresh instance of 'Messaging', but
     * using the same underlying transport
     *
     * @param {InstallProxy} install
     * @param {import('@duckduckgo/messaging').MessagingConfig} config
     * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
     */
    installProxyFor(install, config, reply) {
        const { id, featureName } = install;
        if (this.proxies.has(featureName)) return this.log.info('ignoring `installProxyFor` because it exists', featureName);
        const allowed = this.getFeatureSettingEnabled(featureName);
        if (!allowed) {
            return this.log.info('not installing proxy, because', featureName, 'was not enabled');
        }

        const ctx = { ...this.messaging.messagingContext, featureName };
        const messaging = new Messaging(ctx, config);
        this.proxies.set(featureName, messaging);

        this.log.info('did install proxy for ', featureName);
        reply(new DidInstall({ id }));
    }

    /**
     * @param {ProxyRequest} request
     * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
     */
    async proxyRequest(request, reply) {
        const { id, featureName, method, params } = request;

        const proxy = this.proxies.get(featureName);
        if (!proxy) return this.log.info('proxy was not installed for ', featureName);

        this.log.info('will proxy', request);

        try {
            const result = await proxy.request(method, params);
            const responseEvent = new ProxyResponse({
                method,
                featureName,
                result,
                id,
            });
            reply(responseEvent);
        } catch (e) {
            const errorResponseEvent = new ProxyResponse({
                method,
                featureName,
                error: { message: e.message },
                id,
            });
            reply(errorResponseEvent);
        }
    }

    /**
     * @param {SubscriptionRequest} subscription
     * @param {(payload: {name: string; id: string} & Record<string, any>) => void} reply
     */
    proxySubscription(subscription, reply) {
        const { id, featureName, subscriptionName } = subscription;
        const proxy = this.proxies.get(subscription.featureName);
        if (!proxy) return this.log.info('proxy was not installed for', featureName);

        this.log.info('will setup subscription', subscription);

        // cleanup existing subscriptions first
        const prev = this.subscriptions.get(id);
        if (prev) {
            this.removeSubscription(id);
        }

        const unsubscribe = proxy.subscribe(subscriptionName, (/** @type {Record<string, any>} */ data) => {
            const responseEvent = new SubscriptionResponse({
                subscriptionName,
                featureName,
                params: data,
                id,
            });
            reply(responseEvent);
        });

        this.subscriptions.set(id, unsubscribe);
    }

    /**
     * @param {string} id
     */
    removeSubscription(id) {
        const unsubscribe = this.subscriptions.get(id);
        this.log.info(`will remove subscription`, id);
        unsubscribe?.();
        this.subscriptions.delete(id);
    }

    /**
     * @param {ProxyNotification} notification
     */
    proxyNotification(notification) {
        const proxy = this.proxies.get(notification.featureName);
        if (!proxy) return this.log.info('proxy was not installed for', notification.featureName);

        this.log.info('will proxy notification', notification);
        proxy.notify(notification.method, notification.params);
    }
}

export default MessageBridge;
