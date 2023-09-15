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
        this.config.sendMessage?.(JSON.stringify(msg), this.config.secret)
    }

    /**
     * @param {import('../index.js').RequestMessage} msg
     * @return {Promise<any>}
     */
    request (msg) {
        const prom = new Promise((resolve, reject) => {
            const unsub = this.config.subscribe(msg.id, handler)
            function handler (data) {
                if (isResponseFor(msg, data)) {
                    if (data.result) {
                        resolve(data.result || {})
                        return unsub()
                    } else {
                        // forward the error if one was given explicitly
                        if (data.error) {
                            reject(new Error(data.error.message))
                            return unsub()
                        }
                    }
                    unsub()
                    throw new Error('unreachable: must have `result` or `error` key by this point')
                }
            }
        })
        this.config.sendMessage?.(JSON.stringify(msg), this.config.secret)
        return prom
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
    /**
     * @type {(json: string, secret: string) => void}
     * @internal
     */
    sendMessage
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

        const {target, secret, messageCallback, javascriptInterface} = this;

        if (Object.prototype.hasOwnProperty.call(target, javascriptInterface)) {
            this.sendMessage = target[javascriptInterface].process.bind(target[javascriptInterface])
            delete target[javascriptInterface]
        } else {
            this.sendMessage = () => { console.error('Android messaging interface not available', javascriptInterface) }
        }

        /**
         * @type {(secret: string, response: string) => void}
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
     * @param {string} response
     * @internal
     */
    _dispatch (response) {
        if (!response) throw new globalThis.Error('missing response')
        const parsed = tryCatch(() => globalThis.JSON.parse(response)) || {}

        if ('id' in parsed) {
            if (this.listeners.has(parsed.id)) {
                tryCatch(() => this.listeners.get(parsed.id)?.(parsed))
            } else {
                console.log('no listeners for ', parsed)
            }
        }

        if ('subscriptionName' in parsed) {
            if (this.listeners.has(parsed.subscriptionName)) {
                tryCatch(() => this.listeners.get(parsed.subscriptionName)?.(parsed))
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
        console.error('error occurred in context: ', context, e)
    }
}
