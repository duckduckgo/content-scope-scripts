/**
 *
 * A wrapper for messaging on WebKit platforms (iOS, macOS 11+).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, MissingHandler } from '../index.js';
import { isResponseFor, isSubscriptionEventFor } from '../schema.js';
import { ensureNavigatorDuckDuckGo } from '../../injected/src/navigator-global.js';
import { JSONparse, Error as _Error, ReflectDeleteProperty, objectDefineProperty } from '../../injected/src/captured-globals.js';

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
     * Null-prototype cache so a hostile page that pollutes `Object.prototype`
     * cannot supply a callable from there if `capture` ever misses a handler.
     * @type {Record<string, any>}
     */
    capturedWebkitHandlers = Object.create(null);

    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
        // Capture handler references at construction on both legacy and modern WebKit.
        // On modern WebKit this previously read `window.webkit.messageHandlers[handler]`
        // on every send, which means the transport silently breaks if site-level
        // privacy hardening (e.g. apiManipulation-driven nullification of
        // `window.webkit.messageHandlers` to reduce fingerprinting surface) replaces
        // the namespace after init. Capturing once at construction makes the transport
        // resilient to those changes.
        this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
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
        if (typeof captured !== 'function') {
            throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
        }
        return captured(data);
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
     * Capture the `postMessage` method on each webkit messageHandler so the
     * transport can call them later without re-reading `window.webkit.messageHandlers`.
     * Makes the transport resilient to later removal or replacement of
     * `window.webkit.messageHandlers` (e.g. by privacy hardening that nullifies
     * the namespace for site JS to reduce fingerprinting surface).
     *
     * @param {string[]} handlerNames
     */
    captureWebkitHandlers(handlerNames) {
        const handlers = window.webkit.messageHandlers;
        if (!handlers) throw new MissingHandler('window.webkit.messageHandlers was absent', 'all');
        for (const webkitMessageHandlerName of handlerNames) {
            if (typeof handlers[webkitMessageHandlerName]?.postMessage === 'function') {
                /**
                 * `bind` is used here to ensure future calls to the captured
                 * `postMessage` have the correct `this` context
                 */
                const original = handlers[webkitMessageHandlerName];
                const bound = handlers[webkitMessageHandlerName].postMessage?.bind(original);
                this.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
            }
        }
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
    }
}
