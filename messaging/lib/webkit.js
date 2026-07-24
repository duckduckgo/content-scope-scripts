/**
 *
 * A wrapper for messaging on WebKit platforms (iOS, macOS 11+).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, MissingHandler } from '../index.js';
import { isResponseFor, isSubscriptionEventFor } from '../schema.js';
import { ensureNavigatorDuckDuckGo } from '../../injected/src/navigator-global.js';
import {
    JSONparse,
    Error as _Error,
    ReflectApply,
    ReflectDeleteProperty,
    objectDefineProperty,
} from '../../injected/src/captured-globals.js';

/**
 * @example
 * Calls through to `window.webkit.messageHandlers.x.postMessage`.
 *
 * For a `foo` message defined in Swift that accepted the payload `{"bar": "baz"}`,
 * the following would occur:
 *
 * ```js
 * const json = await window.webkit.messageHandlers.foo.postMessage({ bar: "baz" });
 * const response = JSON.parse(json)
 * ```
 * @implements {MessagingTransport}
 */
export class WebkitMessagingTransport {
    /**
     * @type {Record<string, { handler: any, postMessage: Function }>}
     */
    capturedWebkitHandlers;

    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
        if (!config.capturedHandlers) {
            throw new MissingHandler('window.webkit.messageHandlers was absent at config construction', 'all');
        }
        this.capturedWebkitHandlers = config.capturedHandlers;
    }

    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @returns {*}
     * @throws {MissingHandler}
     * @internal
     */
    wkSend(handler, data = {}) {
        const captured = this.capturedWebkitHandlers[handler];
        if (!captured || typeof captured.postMessage !== 'function') {
            throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
        }
        // Use the captured ReflectApply so the send path doesn't go through
        // any page-mutable function (`.call`, `.bind`, etc.).
        return ReflectApply(captured.postMessage, captured.handler, [data]);
    }

    /**
     * Sends message to the webkit layer and waits for the specified response
     * @param {String} handler
     * @param {import('../index.js').RequestMessage} data
     * @returns {Promise<*>}
     * @internal
     */
    async wkSendAndWait(handler, data) {
        const response = await this.wkSend(handler, data);
        return JSONparse(response || '{}');
    }

    /**
     * @param {import('../index.js').NotificationMessage} msg
     * @returns {Promise<void>}
     */
    async notify(msg) {
        await this.wkSend(msg.context, msg);
    }

    /**
     * @param {import('../index.js').RequestMessage} msg
     */
    async request(msg) {
        const data = await this.wkSendAndWait(msg.context, msg);

        if (isResponseFor(msg, data)) {
            if (data.result) {
                return data.result || {};
            }
            // forward the error if one was given explicity
            if (data.error) {
                throw new _Error(data.error.message);
            }
        }

        throw new _Error('an unknown error occurred');
    }

    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
        const target = ensureNavigatorDuckDuckGo().messageHandlers;
        if (msg.subscriptionName in target) {
            throw new _Error(`A subscription with the name ${msg.subscriptionName} already exists`);
        }
        objectDefineProperty(target, msg.subscriptionName, {
            enumerable: false,
            configurable: true,
            writable: false,
            value: (data) => {
                if (data && isSubscriptionEventFor(msg, data)) {
                    callback(data.params);
                } else {
                    console.warn('Received a message that did not match the subscription', data);
                }
            },
        });
        return () => {
            ReflectDeleteProperty(target, msg.subscriptionName);
        };
    }
}

/**
 * Use this configuration to create an instance of {@link Messaging} for WebKit platforms
 * (iOS, macOS 11+).
 *
 * Please see {@link WebkitMessagingTransport} for details on how messages are sent/received
 *
 * [Example](./examples/webkit.example.js)
 */
export class WebkitMessagingConfig {
    /**
     * @param {object} params
     * @param {string[]} params.webkitMessageHandlerNames
     * @internal
     */
    constructor(params) {
        /**
         * A list of WebKit message handler names that a user script can send.
         *
         * For example, if the native platform can receive messages through this:
         *
         * ```js
         * window.webkit.messageHandlers.foo.postMessage('...')
         * ```
         *
         * then, this property would be:
         *
         * ```js
         * webkitMessageHandlerNames: ['foo']
         * ```
         */
        this.webkitMessageHandlerNames = params.webkitMessageHandlerNames;
        /**
         * Snapshot of `window.webkit.messageHandlers` taken at config
         * construction, i.e. C-S-S bootstrap. Read by
         * `WebkitMessagingTransport`'s constructor. See `_snapshotWebkitHandlers`.
         * @type {Record<string, { handler: any, postMessage: Function }> | null}
         */
        this.capturedHandlers = _snapshotWebkitHandlers(this.webkitMessageHandlerNames);
    }
}

/**
 * Snapshot `window.webkit.messageHandlers[name]` refs into a null-prototype
 * cache. Called from `WebkitMessagingConfig`'s constructor at C-S-S bootstrap,
 * before any `ContentFeature` init — so the snapshot precedes any in-C-S-S
 * `apiManipulation` patch that would nullify `messageHandlers` via a
 * prototype-side getter.
 *
 * @param {string[]} handlerNames
 * @returns {Record<string, { handler: any, postMessage: Function }> | null}
 */
function _snapshotWebkitHandlers(handlerNames) {
    const messageHandlers = /** @type {any} */ (window).webkit && /** @type {any} */ (window).webkit.messageHandlers;
    if (!messageHandlers) return null;
    /** @type {any} */
    const captured = { __proto__: null };
    for (const name of handlerNames) {
        const handler = messageHandlers[name];
        if (typeof handler?.postMessage === 'function') {
            captured[name] = { handler, postMessage: handler.postMessage };
        }
    }
    return captured;
}
