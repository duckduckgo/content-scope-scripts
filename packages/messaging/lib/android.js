/**
 * @description
 *
 * A wrapper for messaging on Android.
 *
 * You must share a {@link AndroidMessagingConfig} instance between features
 *
 * @example
 *
 * ```javascript
 * [[include:packages/messaging/lib/examples/windows.example.js]]```
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport, MessageResponse, SubscriptionEvent } from '../index.js'
import { isResponseFor, isSubscriptionEventFor } from '../schema.js'

/**
 * An implementation of {@link MessagingTransport} for Android
 *
 * All messages go through `window.chrome.webview` APIs
 *
 * @implements {MessagingTransport}
 */
export class AndroidMessagingTransport {
    /**
     * @param {AndroidMessagingConfig} config
     * @param {import('../index.js').MessagingContext} messagingContext
     * @internal
     */
    constructor (config, messagingContext) {
        this.messagingContext = messagingContext
        this.config = config
    }

    /**
     * @param {import('../index.js').NotificationMessage} msg
     */
    notify (msg) {
        try {
            this.config.sendMessageThrows?.(JSON.stringify(msg))
        } catch (e) {
            console.error('.notify failed', e)
        }
    }

    /**
     * @param {import('../index.js').RequestMessage} msg
     * @return {Promise<any>}
     */
    request (msg) {
        return new Promise((resolve, reject) => {
            // subscribe early
            const unsub = this.config.subscribe(msg.id, handler)

            try {
                this.config.sendMessageThrows?.(JSON.stringify(msg))
            } catch (e) {
                unsub()
                reject(new Error('request failed to send: ' + e.message || 'unknown error'))
            }

            function handler (data) {
                if (isResponseFor(msg, data)) {
                    // success case, forward .result only
                    if (data.result) {
                        resolve(data.result || {})
                        return unsub()
                    }

                    // error case, forward the error as a regular promise rejection
                    if (data.error) {
                        reject(new Error(data.error.message))
                        return unsub()
                    }

                    // getting here is undefined behavior
                    unsub()
                    throw new Error('unreachable: must have `result` or `error` key by this point')
                }
            }
        })
    }

    /**
     * @param {import('../index.js').Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe (msg, callback) {
        const unsub = this.config.subscribe(msg.subscriptionName, (data) => {
            if (isSubscriptionEventFor(msg, data)) {
                callback(data.params || {})
            }
        })
        return () => {
            unsub()
        }
    }
}

/**
 * Android shared messaging configuration. This class should be constructed once and then shared
 * between features (because of the way it modifies globals).
 *
 * For example, if Android is injecting a JavaScript module like C-S-S which contains multiple 'sub-features', then
 * this class would be instantiated once and then shared between all sub-features.
 *
 * The following example shows all the fields that are required to be passed in:
 *
 * ```js
 * const config = new AndroidMessagingConfig({
 *     // a value that native has injected into the script
 *     secret: 'abc',
 *
 *     // the name of the window method that android will deliver responses through
 *     messageCallback: 'callback_123',
 *
 *     // the `@JavascriptInterface` name from native that will be used to receive messages
 *     javascriptInterface: "ContentScopeScripts",
 *
 *     // the global object where methods will be registered
 *     target: globalThis
 * });
 * ```
 * Once an instance of {@link AndroidMessagingConfig} is created, you can then use it to construct
 * many instances of {@link Messaging} (one per feature). See `examples/android.example.js` for an example.
 *
 *
 * ## Native integration
 *
 * Assuming you have the following:
 *  - a `@JavascriptInterface` named `"ContentScopeScripts"`
 *  - a sub-feature called `"featureA"`
 *  - and a method on `"featureA"` called `"helloWorld"`
 *
 * Then delivering a {@link NotificationMessage} to it, would be roughly this in JavaScript (remember `params` is optional though)
 *
 * ```
 * const secret = "abc";
 * const json = JSON.stringify({
 *     context: "ContentScopeScripts",
 *     featureName: "featureA",
 *     method: "helloWorld",
 *     params: { "foo": "bar" }
 * });
 * window.ContentScopeScripts.process(json, secret)
 * ```
 * When you receive the JSON payload (note that it will be a string), you'll need to deserialize/verify it according to {@link "Messaging Implementation Guide"}
 *
 *
 * ## Responding to a {@link RequestMessage}, or pushing a {@link SubscriptionEvent}
 *
 * If you receive a {@link RequestMessage}, you'll need to deliver a {@link MessageResponse}.
 * Similarly, if you want to push new data, you need to deliver a {@link SubscriptionEvent}. In both
 * cases you'll do this through a global `window` method. Given the snippet below, this is how it would relate
 * to the {@link AndroidMessagingConfig}:
 *
 * - `$messageCallback` matches {@link AndroidMessagingConfig.messageCallback}
 * - `$secret` matches {@link AndroidMessagingConfig.secret}
 * - `$message` is JSON string that represents one of {@link MessageResponse} or {@link SubscriptionEvent}
 *
 * ```kotlin
 * object ReplyHandler {
 *     fun constructReply(message: String, messageCallback: String, messageSecret: String): String {
 *         return """
 *             (function() {
 *                 window['$messageCallback']('$secret', $message);
 *             })();
 *         """.trimIndent()
 *     }
 * }
 * ```
 */
export class AndroidMessagingConfig {
    /** @type {(json: string, secret: string) => void} */
    _capturedHandler
    /**
     * @param {object} params
     * @param {Record<string, any>} params.target
     * @param {string} params.secret - a secret to ensure that messages are only
     * processed by the correct handler
     * @param {string} params.javascriptInterface - the name of the javascript interface
     * registered on the native side
     * @param {string} params.messageCallback - the name of the callback that the native
     * side will use to send messages back to the javascript side
     */
    constructor (params) {
        this.target = params.target
        this.javascriptInterface = params.javascriptInterface
        this.secret = params.secret
        this.messageCallback = params.messageCallback
        /**
         * @type {Map<string, (msg: MessageResponse | SubscriptionEvent) => void>}
         * @internal
         */
        this.listeners = new globalThis.Map()

        const { target, secret, messageCallback, javascriptInterface } = this

        if (Object.prototype.hasOwnProperty.call(target, javascriptInterface)) {
            this._capturedHandler = target[javascriptInterface].process.bind(target[javascriptInterface])
            delete target[javascriptInterface]
        } else {
            this._capturedHandler = () => { console.error('Android messaging interface not available', javascriptInterface) }
        }

        /**
         * @type {(secret: string, response: MessageResponse | SubscriptionEvent) => void}
         */
        const responseHandler = (providedSecret, response) => {
            if (providedSecret === secret) {
                this._dispatch(response)
            }
        }

        Object.defineProperty(target, messageCallback, {
            value: responseHandler
        })
    }

    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(json: string) => void}
     * @throws
     * @internal
     */
    sendMessageThrows (json) {
        this._capturedHandler(json, this.secret)
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
    subscribe (id, callback) {
        this.listeners.set(id, callback)
        return () => {
            this.listeners.delete(id)
        }
    }

    /**
     * @param {MessageResponse | SubscriptionEvent} response
     * @internal
     */
    _dispatch (response) {
        if (!response) throw new globalThis.Error('missing response')

        if ('id' in response) {
            if (this.listeners.has(response.id)) {
                tryCatch(() => this.listeners.get(response.id)?.(response))
            } else {
                console.log('no listeners for ', response)
            }
        }

        if ('subscriptionName' in response) {
            if (this.listeners.has(response.subscriptionName)) {
                tryCatch(() => this.listeners.get(response.subscriptionName)?.(response))
            } else {
                console.log('no subscription listeners for ', response)
            }
        }
    }
}

/**
 *
 * @param {(...args: any[]) => any} fn
 * @param {string} [context]
 */
function tryCatch (fn, context = 'none') {
    try {
        return fn()
    } catch (e) {
        console.error('Android Messaging error occurred:', context)
        console.error(e)
    }
}
