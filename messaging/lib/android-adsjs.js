/**
 *
 * A wrapper for messaging on Android using addWebMessageListener API.
 *
 * This transport uses the Android WebView addWebMessageListener API for communication
 * between JavaScript and native Android code.
 *
 */
import { isResponseFor, isSubscriptionEventFor, RequestMessage } from '../schema.js';
import { isBeingFramed } from '../../injected/src/utils.js';

/**
 * @typedef {import('../core.js').MessagingTransport} MessagingTransport
 * @typedef {import('../core.js').MessagingContext} MessagingContext
 * @typedef {import('../schema.js').Subscription} Subscription
 * @typedef {import('../schema.js').NotificationMessage} NotificationMessage
 * @typedef {import('../schema.js').MessageResponse} MessageResponse
 * @typedef {import('../schema.js').SubscriptionEvent} SubscriptionEvent
 */

/**
 * An implementation of {@link MessagingTransport} for Android using addWebMessageListener
 *
 * All messages go through the Android WebView addWebMessageListener API
 *
 * @implements {MessagingTransport}
 */
export class AndroidAdsjsMessagingTransport {
    /**
     * @param {AndroidAdsjsMessagingConfig} config
     * @param {MessagingContext} messagingContext
     * @internal
     */
    constructor(config, messagingContext) {
        this.messagingContext = messagingContext;
        this.config = config;
    }

    /**
     * @param {NotificationMessage} msg
     */
    notify(msg) {
        try {
            this.config.sendMessageThrows?.(msg);
        } catch (e) {
            console.error('.notify failed', e);
        }
    }

    /**
     * @param {RequestMessage} msg
     * @return {Promise<any>}
     */
    request(msg) {
        return new Promise((resolve, reject) => {
            // subscribe early
            const unsub = this.config.subscribe(msg.id, handler);

            try {
                this.config.sendMessageThrows?.(msg);
            } catch (e) {
                unsub();
                reject(new Error('request failed to send: ' + e.message || 'unknown error'));
            }

            function handler(data) {
                if (isResponseFor(msg, data)) {
                    // success case, forward .result only
                    if (data.result) {
                        resolve(data.result || {});
                        return unsub();
                    }

                    // error case, forward the error as a regular promise rejection
                    if (data.error) {
                        reject(new Error(data.error.message));
                        return unsub();
                    }

                    // getting here is undefined behavior
                    unsub();
                    throw new Error('unreachable: must have `result` or `error` key by this point');
                }
            }
        });
    }

    /**
     * @param {Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe(msg, callback) {
        const unsub = this.config.subscribe(msg.subscriptionName, (data) => {
            if (isSubscriptionEventFor(msg, data)) {
                callback(data.params || {});
            }
        });
        return () => {
            unsub();
        };
    }
}

/**
 * Android shared messaging configuration for addWebMessageListener API.
 * This class should be constructed once and then shared between features.
 *
 * The following example shows all the fields that are required to be passed in:
 *
 * ```js
 * const config = new AndroidAdsjsMessagingConfig({
 *     // a value that native has injected into the script
 *     messageSecret: 'abc',
 *
 *     // the object name that will be used for addWebMessageListener
 *     objectName: "androidAdsjs",
 *
 *     // the global object where methods will be registered
 *     target: globalThis
 * });
 * ```
 *
 * ## Native integration
 *
 * The native Android code should use addWebMessageListener to listen for messages:
 *
 * ```java
 * WebViewCompat.addWebMessageListener(
 *     webView,
 *     "androidAdsjs",
 *     Set.of("*"),
 *     new WebMessageListener() {
 *         @Override
 *         public void onPostMessage(WebView view, WebMessageCompat message, Uri sourceOrigin, boolean isMainFrame, JavaScriptReplyProxy replyProxy) {
 *             // Handle the message here
 *             String data = message.getData();
 *             // Process the message and send response via replyProxy.postMessage()
 *         }
 *     }
 * );
 * ```
 *
 * The JavaScript side uses postMessage() to send messages, which the native side receives
 * through the WebMessageListener. Responses from the native side are delivered through
 * addEventListener on the captured handler.
 */
export class AndroidAdsjsMessagingConfig {
    /** @type {{
     * postMessage: (message: string) => void,
     * addEventListener: (type: string, listener: (event: MessageEvent) => void) => void,
     * } | null} */
    _capturedHandler;

    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {boolean} params.debug
     * @param {string} params.objectName - the object name for addWebMessageListener
     */
    constructor(params) {
        this.target = params.target;
        this.debug = params.debug;
        this.objectName = params.objectName;

        /**
         * @type {Map<string, (msg: MessageResponse | SubscriptionEvent) => void>}
         * @internal
         */
        this.listeners = new globalThis.Map();

        /**
         * Capture the global handler and remove it from the global object.
         */
        this._captureGlobalHandler();

        /**
         * Set up event listener for incoming messages.
         */
        this._setupEventListener();
    }

    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler via postMessage.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: object) => void}
     * @throws
     * @internal
     */
    sendMessageThrows(message) {
        if (!this.objectName) {
            throw new Error('Object name not set for WebMessageListener');
        }

        // Use postMessage to send to the native side
        // The native Android code will have set up addWebMessageListener to receive this
        if (this._capturedHandler && this._capturedHandler.postMessage) {
            this._capturedHandler.postMessage(JSON.stringify(message));
        } else {
            throw new Error('postMessage not available');
        }
    }

    /**
     * A subscription on Android is just a named listener. All messages from
     * android -> are delivered through a single function, and this mapping is used
     * to route the messages to the correct listener.
     *
     * Note: Use this to implement request->response by unsubscribing after the first
     * response.
     *
     * @param {string} id
     * @param {(msg: MessageResponse | SubscriptionEvent) => void} callback
     * @returns {() => void}
     * @internal
     */
    subscribe(id, callback) {
        this.listeners.set(id, callback);
        return () => {
            this.listeners.delete(id);
        };
    }

    /**
     * Accept incoming messages and try to deliver it to a registered listener.
     *
     * This code is defensive to prevent any single handler from affecting another if
     * it throws (producer interference).
     *
     * @param {MessageResponse | SubscriptionEvent} payload
     * @internal
     */
    _dispatch(payload) {
        // do nothing if the response is empty
        // this prevents the next `in` checks from throwing in test/debug scenarios
        if (!payload) return this._log('no response');

        // if the payload has an 'id' field, then it's a message response
        if ('id' in payload) {
            if (this.listeners.has(payload.id)) {
                this._tryCatch(() => this.listeners.get(payload.id)?.(payload));
            } else {
                this._log('no listeners for ', payload);
            }
        }

        // if the payload has an 'subscriptionName' field, then it's a push event
        if ('subscriptionName' in payload) {
            if (this.listeners.has(payload.subscriptionName)) {
                this._tryCatch(() => this.listeners.get(payload.subscriptionName)?.(payload));
            } else {
                this._log('no subscription listeners for ', payload);
            }
        }
    }

    /**
     *
     * @param {(...args: any[]) => any} fn
     * @param {string} [context]
     */
    _tryCatch(fn, context = 'none') {
        try {
            return fn();
        } catch (e) {
            if (this.debug) {
                console.error('AndroidAdsjsMessagingConfig error:', context);
                console.error(e);
            }
        }
    }

    /**
     * @param {...any} args
     */
    _log(...args) {
        if (this.debug) {
            console.log('AndroidAdsjsMessagingConfig', ...args);
        }
    }

    /**
     * Capture the global handler and remove it from the global object.
     */
    _captureGlobalHandler() {
        const { target, objectName } = this;

        if (Object.prototype.hasOwnProperty.call(target, objectName)) {
            this._capturedHandler = target[objectName];
            delete target[objectName];
        } else {
            this._capturedHandler = null;
            this._log('Android adsjs messaging interface not available', objectName);
        }
    }

    /**
     * Set up event listener for incoming messages from the captured handler.
     */
    _setupEventListener() {
        if (!this._capturedHandler || !this._capturedHandler.addEventListener) {
            this._log('No event listener support available');
            return;
        }

        this._capturedHandler.addEventListener('message', (event) => {
            try {
                const data = /** @type {MessageEvent} */ (event).data;
                if (typeof data === 'string') {
                    const parsedData = JSON.parse(data);

                    // Dispatch the message
                    this._dispatch(parsedData);
                }
            } catch (e) {
                this._log('Error processing incoming message:', e);
            }
        });
    }

    /**
     * Send an initial ping message to the platform to establish communication.
     * This is a fire-and-forget notification that signals the JavaScript side is ready.
     * Only sends in top context (not in frames) and if the messaging interface is available.
     *
     * @param {MessagingContext} messagingContext
     * @returns {boolean} true if ping was sent, false if in frame or interface not ready
     */
    sendInitialPing(messagingContext) {
        // Only send ping in top context, not in frames
        if (isBeingFramed()) {
            this._log('Skipping initial ping - running in frame context');
            return false;
        }

        try {
            const message = new RequestMessage({
                id: 'initialPing',
                context: messagingContext.context,
                featureName: 'messaging',
                method: 'initialPing',
            });
            this.sendMessageThrows(message);
            this._log('Initial ping sent successfully');
            return true;
        } catch (e) {
            this._log('Failed to send initial ping:', e);
            return false;
        }
    }

    /**
     * @param {MessagingContext} messagingContext
     * @returns {MessagingTransport}
     * @internal
     */
    createTransport(messagingContext) {
        return new AndroidAdsjsMessagingTransport(this, messagingContext);
    }
}
