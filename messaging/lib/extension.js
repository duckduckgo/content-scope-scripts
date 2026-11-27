/**
 * Messaging for Chrome MV3 extension contexts: the message bridge's isolated-world content script, and
 * extension pages such as the New Tab Page. The extension's background service worker is the host
 * platform.
 *
 * ## Background integration
 *
 * Notifications and requests: the page connects with `chrome.runtime.connect({ name: portName })` and
 * posts each {@link NotificationMessage} and {@link RequestMessage} on that port. The background answers
 * a request on the same port with a {@link MessageResponse}:
 *
 * ```js
 * port.postMessage({ context, featureName, id, result });
 * port.postMessage({ context, featureName, id, error: { message } });
 * ```
 *
 * The port closes when the service worker stops, and the next outgoing message reconnects. Messages are
 * sent once: a request whose port closes before the reply is rejected, never re-sent.
 *
 * Subscriptions: the background delivers each {@link SubscriptionEvent} as a `runtime.onMessage` event,
 * so it can push without a port. For content scripts, send it to the top frame, where the message
 * bridge runs:
 *
 * ```js
 * chrome.tabs.sendMessage(tabId, { context, featureName, subscriptionName, params }, { frameId: 0 });
 * ```
 *
 * For extension pages (special pages such as the New Tab Page), broadcast it:
 *
 * ```js
 * chrome.runtime.sendMessage({ context, featureName, subscriptionName, params });
 * ```
 *
 * @module Extension Messaging
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, NotificationMessage, RequestMessage, MessageResponse, SubscriptionEvent } from '../index.js';

/**
 * @implements {MessagingTransport}
 */
export class ExtensionMessagingTransport {
    /**
     * @param {ExtensionMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
    }

    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
        this.config.postMessage(msg);
    }

    /**
     * @param {import('../index.js').RequestMessage} msg
     * @param {{signal?: AbortSignal}} opts
     * @return {Promise<any>}
     */
    request(msg, { signal } = {}) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
            const off = this.config.onMessage((data) => {
                if (data.id !== msg.id || data.context !== msg.context || data.featureName !== msg.featureName) return;
                cleanup();
                if (data.result) return resolve(data.result);
                reject(new Error(String(data.error?.message || 'unknown error')));
            });
            const onAbort = () => {
                cleanup();
                reject(new DOMException('Aborted', 'AbortError'));
            };
            const onDisconnect = () => {
                cleanup();
                reject(new Error(`${msg.method}: disconnected before a response was received`));
            };
            const port = this.config.postMessage(msg);
            const cleanup = () => {
                off();
                signal?.removeEventListener('abort', onAbort);
                port.onDisconnect.removeListener(onDisconnect);
            };
            port.onDisconnect.addListener(onDisconnect);
            signal?.addEventListener('abort', onAbort);
        });
    }

    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
        return this.config.onMessage((data) => {
            if (data.subscriptionName !== msg.subscriptionName || data.context !== msg.context || data.featureName !== msg.featureName)
                return;
            callback(data.params);
        });
    }
}

export class ExtensionMessagingConfig {
    /** @type {chrome.runtime.Port?} */
    port = null;

    /** @type {Set<(data: any) => void>} */
    handlers = new Set();

    /** Whether the runtime.onMessage listener is registered. */
    listening = false;

    /**
     * @param {object} params
     * @param {string} params.portName
     * @internal
     */
    constructor(params) {
        /** @type {'chrome-mv3'} */
        this.platform = 'chrome-mv3';
        this.portName = params.portName;
    }

    connect() {
        const port = chrome.runtime.connect({ name: this.portName });
        this.port = port;
        port.onMessage.addListener((msg) => {
            for (const handler of this.handlers) {
                handler(msg);
            }
        });
        // The service worker stopped; the next outgoing message reconnects.
        port.onDisconnect.addListener(() => {
            if (this.port === port) this.port = null;
        });
        return port;
    }

    /**
     * Post a message, connecting first if there is no open port.
     * @param {any} msg
     * @returns {chrome.runtime.Port} the port the message was posted on
     */
    postMessage(msg) {
        if (this.port) {
            try {
                this.port.postMessage(msg);
                return this.port;
            } catch {
                // Port died before onDisconnect fired
                this.port = null;
            }
        }
        const port = this.connect();
        port.postMessage(msg);
        return port;
    }

    /**
     * @param {(data: any) => void} handler
     * @returns {() => void}
     */
    onMessage(handler) {
        if (!this.listening) {
            this.listening = true;
            chrome.runtime.onMessage.addListener((msg) => {
                if (msg?.subscriptionName) {
                    for (const fn of this.handlers) {
                        fn(msg);
                    }
                }
            });
        }
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
}
