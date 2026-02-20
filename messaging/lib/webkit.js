/**
 *
 * A wrapper for messaging on WebKit platforms. It supports modern WebKit messageHandlers
 * along with encryption for older versions (like macOS Catalina)
 *
 * Note: If you wish to support Catalina then you'll need to implement the native
 * part of the message handling, see {@link WebkitMessagingTransport} for details.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, MissingHandler } from '../index.js';
import { isResponseFor, isSubscriptionEventFor } from '../schema.js';
import { ensureNavigatorDuckDuckGo } from '../../injected/src/navigator-global.js';
import {
    TextDecoder as _TextDecoder,
    Uint8Array as _Uint8Array,
    Uint32Array as _Uint32Array,
    JSONparse,
    Arrayfrom,
    Promise as _Promise,
    Error as _Error,
    ReflectDeleteProperty,
    objectDefineProperty,
    getRandomValues,
    generateKey,
    exportKey,
    importKey,
    decrypt,
} from '../../injected/src/captured-globals.js';

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
 *
 * @example
 * On macOS 10 however, the process is a little more involved. A method will be appended to `navigator.duckduckgo`
 * that allows the response to be delivered there instead. It's not exactly this, but you can visualize the flow
 * as being something along the lines of:
 *
 * ```js
 * // add the callback method to navigator.duckduckgo
 * navigator.duckduckgo["_0123456"] = (response) => {
 *    // decrypt `response` and deliver the result to the caller here
 *    // then remove the temporary method
 *    delete navigator.duckduckgo['_0123456']
 * };
 *
 * // send the data + `messageHanding` values
 * window.webkit.messageHandlers.foo.postMessage({
 *   bar: "baz",
 *   messagingHandling: {
 *     methodName: "_0123456",
 *     secret: "super-secret",
 *     key: [1, 2, 45, 2],
 *     iv: [34, 4, 43],
 *   }
 * });
 *
 * // later in swift, the following JavaScript snippet will be executed
 * (() => {
 *   navigator.duckduckgo['_0123456']({
 *     ciphertext: [12, 13, 4],
 *     tag: [3, 5, 67, 56]
 *   })
 * })()
 * ```
 * @implements {MessagingTransport}
 */
export class WebkitMessagingTransport {
    /** @type {Record<string, any>} */
    capturedWebkitHandlers = {};

    /**
     * @param {WebkitMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
        if (!this.config.hasModernWebkitAPI) {
            this.captureWebkitHandlers(this.config.webkitMessageHandlerNames);
        }
    }

    /**
     * Sends message to the webkit layer (fire and forget)
     * @param {String} handler
     * @param {*} data
     * @internal
     */
    wkSend(handler, data = {}) {
        if (!(handler in window.webkit.messageHandlers)) {
            throw new MissingHandler(`Missing webkit handler: '${handler}'`, handler);
        }
        if (!this.config.hasModernWebkitAPI) {
            const outgoing = {
                ...data,
                messageHandling: {
                    ...data.messageHandling,
                    secret: this.config.secret,
                },
            };
            if (!(handler in this.capturedWebkitHandlers)) {
                throw new MissingHandler(`cannot continue, method ${handler} not captured on macos < 11`, handler);
            } else {
                return this.capturedWebkitHandlers[handler](outgoing);
            }
        }
        return window.webkit.messageHandlers[handler].postMessage?.(data);
    }

    /**
     * Sends message to the webkit layer and waits for the specified response
     * @param {String} handler
     * @param {import('../index.js').RequestMessage} data
     * @returns {Promise<*>}
     * @internal
     */
    async wkSendAndWait(handler, data) {
        if (this.config.hasModernWebkitAPI) {
            const response = await this.wkSend(handler, data);
            return JSONparse(response || '{}');
        }

        try {
            const randMethodName = this.createRandMethodName();
            const key = await this.createRandKey();
            const iv = this.createRandIv();

            const { ciphertext, tag } = await new _Promise((/** @type {any} */ resolve) => {
                this.generateRandomMethod(randMethodName, resolve);

                // @ts-expect-error - this is a carve-out for catalina that will be removed soon
                data.messageHandling = new SecureMessagingParams({
                    methodName: randMethodName,
                    secret: this.config.secret,
                    key: Arrayfrom(key),
                    iv: Arrayfrom(iv),
                });
                this.wkSend(handler, data);
            });

            const cipher = new _Uint8Array([...ciphertext, ...tag]);
            const decrypted = await this.decryptResponse(
                /** @type {BufferSource} */ (/** @type {unknown} */ (cipher)),
                /** @type {BufferSource} */ (/** @type {unknown} */ (key)),
                iv,
            );
            return JSONparse(decrypted || '{}');
        } catch (e) {
            // re-throw when the error is just a 'MissingHandler'
            if (e instanceof MissingHandler) {
                throw e;
            } else {
                console.error('decryption failed', e);
                console.error(e);
                return { error: e };
            }
        }
    }

    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify(msg) {
        this.wkSend(msg.context, msg);
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
     * Generate a random method name and adds it to navigator.duckduckgo
     * The native layer will use this method to send the response
     * @param {string | number} randomMethodName
     * @param {Function} callback
     * @internal
     */
    generateRandomMethod(randomMethodName, callback) {
        const target = ensureNavigatorDuckDuckGo();
        objectDefineProperty(target, randomMethodName, {
            enumerable: false,
            // configurable, To allow for deletion later
            configurable: true,
            writable: false,
            /**
             * @param {any[]} args
             */
            value: (...args) => {
                callback(...args);
                ReflectDeleteProperty(target, randomMethodName);
            },
        });
    }

    /**
     * @internal
     * @return {string}
     */
    randomString() {
        return '' + getRandomValues(new _Uint32Array(1))[0];
    }

    /**
     * @internal
     * @return {string}
     */
    createRandMethodName() {
        return '_' + this.randomString();
    }

    /**
     * @type {{name: string, length: number}}
     * @internal
     */
    algoObj = {
        name: 'AES-GCM',
        length: 256,
    };

    /**
     * @returns {Promise<Uint8Array>}
     * @internal
     */
    async createRandKey() {
        const key = await generateKey(this.algoObj, true, ['encrypt', 'decrypt']);
        const exportedKey = await exportKey('raw', key);
        return new _Uint8Array(exportedKey);
    }

    /**
     * @returns {Uint8Array}
     * @internal
     */
    createRandIv() {
        return getRandomValues(new _Uint8Array(12));
    }

    /**
     * @param {BufferSource} ciphertext
     * @param {BufferSource} key
     * @param {Uint8Array} iv
     * @returns {Promise<string>}
     * @internal
     */
    async decryptResponse(ciphertext, key, iv) {
        const cryptoKey = await importKey('raw', key, 'AES-GCM', false, ['decrypt']);
        const algo = {
            name: 'AES-GCM',
            iv,
        };

        const decrypted = await decrypt(algo, cryptoKey, ciphertext);

        const dec = new _TextDecoder();
        return dec.decode(decrypted);
    }

    /**
     * When required (such as on macos 10.x), capture the `postMessage` method on
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
                this.capturedWebkitHandlers[webkitMessageHandlerName] = bound;
                delete handlers[webkitMessageHandlerName].postMessage;
            }
        }
    }

    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown) => void} callback
     */
    subscribe(msg, callback) {
        const target = ensureNavigatorDuckDuckGo();
        // for now, bail if there's already a handler setup for this subscription
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
     * @param {boolean} params.hasModernWebkitAPI
     * @param {string[]} params.webkitMessageHandlerNames
     * @param {string} params.secret
     * @internal
     */
    constructor(params) {
        /**
         * Whether or not the current WebKit Platform supports secure messaging
         * by default (eg: macOS 11+)
         */
        this.hasModernWebkitAPI = params.hasModernWebkitAPI;
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
         * A string provided by native platforms to be sent with future outgoing
         * messages.
         */
        this.secret = params.secret;
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
         * The method that's been appended to `navigator.duckduckgo` to be called later
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
