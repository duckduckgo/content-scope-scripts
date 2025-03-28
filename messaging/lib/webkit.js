/**
 *
 * A wrapper for messaging on WebKit platforms. It supports modern WebKit messageHandlers
 * along with encryption for older versions (like macOS Catalina)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, MissingHandler } from '../index.js';
import { isResponseFor, isSubscriptionEventFor } from '../schema.js';

/**
 * @example
 * On macOS 11+, this will just call through to `window.webkit.messageHandlers.x.postMessage`
 *
 * Eg: for a `foo` message defined in Swift that accepted the payload `{"bar": "baz"}`, the following
 * would occur:
 *
 * ```js
 * const json = await window.webkit.messageHandlers.foo.postMessage({ bar: "baz" });
 * const response = JSON.parse(json)
 * ```
 * @implements {MessagingTransport}
 */
export class WebkitMessagingTransport {
    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
        this.globals = captureGlobals();
        this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
    }

    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @internal
     */
    wkSend(handler, data = {}) {
        return this.globals.capturedWebkitHandlers[handler]?.(data);
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
        return this.globals.JSONparse(response || '{}');
    }

    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
        try {
            this.wkSend(msg.context, msg);
        } catch (_e) {
            // no-op
        }
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
                throw new Error(data.error.message);
            }
        }

        throw new Error('an unknown error occurred');
    }

    /**
     * When required (such as on macOS 10.x), capture the `postMessage` method on
     * each webkit messageHandler
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
                this.globals.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
                delete handlers[webkitMessageHandlerName].postMessage;
            }
        }
    }

    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
        // for now, bail if there's already a handler setup for this subscription
        if (msg.subscriptionName in this.globals.window) {
            throw new this.globals.Error(`A subscription with the name ${msg.subscriptionName} already exists`);
        }
        this.globals.ObjectDefineProperty(this.globals.window, msg.subscriptionName, {
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
            this.globals.ReflectDeleteProperty(this.globals.window, msg.subscriptionName);
        };
    }
}

/**
 * Use this configuration to create an instance of {@link Messaging} for WebKit platforms
 *
 * We support modern WebKit environments *and* macOS Catalina.
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

/**
 * This is the additional payload that gets appended to outgoing messages.
 * It's used in the Swift side to encrypt the response that comes back
 */
export class SecureMessagingParams {
    /**
     * @param {object} params
     * @param {string} params.methodName
     * @param {string} params.secret
     * @param {number[]} params.key
     * @param {number[]} params.iv
     */
    constructor(params) {
        /**
         * The method that's been appended to `window` to be called later
         */
        this.methodName = params.methodName;
        /**
         * The secret used to ensure message sender validity
         */
        this.secret = params.secret;
        /**
         * The CipherKey as number[]
         */
        this.key = params.key;
        /**
         * The Initial Vector as number[]
         */
        this.iv = params.iv;
    }
}

/**
 * Capture some globals used for messaging handling to prevent page
 * scripts from tampering with this
 */
function captureGlobals() {
    // Create base with null prototype
    const globals = {
        window,
        getRandomValues: window.crypto.getRandomValues.bind(window.crypto),
        TextEncoder,
        TextDecoder,
        Uint8Array,
        Uint16Array,
        Uint32Array,
        JSONstringify: window.JSON.stringify,
        JSONparse: window.JSON.parse,
        Arrayfrom: window.Array.from,
        Promise: window.Promise,
        Error: window.Error,
        ReflectDeleteProperty: window.Reflect.deleteProperty.bind(window.Reflect),
        ObjectDefineProperty: window.Object.defineProperty,
        addEventListener: window.addEventListener.bind(window),
        /** @type {Record<string, any>} */
        capturedWebkitHandlers: {},
    };
    if (isSecureContext) {
        // skip for HTTP content since window.crypto.subtle is unavailable
        globals.generateKey = window.crypto.subtle.generateKey.bind(window.crypto.subtle);
        globals.exportKey = window.crypto.subtle.exportKey.bind(window.crypto.subtle);
        globals.importKey = window.crypto.subtle.importKey.bind(window.crypto.subtle);
        globals.encrypt = window.crypto.subtle.encrypt.bind(window.crypto.subtle);
        globals.decrypt = window.crypto.subtle.decrypt.bind(window.crypto.subtle);
    }
    return globals;
}
