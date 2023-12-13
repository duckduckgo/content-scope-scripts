import { DefaultTransport } from '@duckduckgo/messaging/lib/defaultTransport.js'

/**
 * @typedef {import('../index.js').Subscription} Subscription
 * @typedef {import('../index.js').MessagingContext} MessagingContext
 * @typedef {import('../index.js').RequestMessage} RequestMessage
 * @typedef {import('../index.js').NotificationMessage} NotificationMessage
 * @typedef {import('../index.js').MessagingTransport} MessagingTransport
 */

/**
 * An implementation of {@link MessagingTransport} that proxies through to
 * window.postMessage to scripts running in an isolated context
 *
 * @implements {MessagingTransport}
 */
export class ProxyMessagingTransport {
    /**
     * @param {ProxyMessagingConfig} config
     * @param {MessagingContext} messagingContext
     * @internal
     */
    constructor (config, messagingContext) {
        this.config = config
        this.messagingContext = messagingContext

        /**
         * Use the default transports, providing just the relevant side effects
         * @type {DefaultTransport}
         */
        this._transport = new DefaultTransport({
            debug: this.messagingContext.env === 'development',
            setupIncomingListener: (dispatch) => {
                globalThis.addEventListener('message', (evt) => {
                    if (evt.origin !== globalThis.location.origin) {
                        console.warn('ignoring non-matching origin')
                        return
                    }
                    if (!evt.data || !('messageProxyResponse' in evt.data)) {
                        return
                    }
                    dispatch(evt.data.messageProxyResponse)
                })
            },
            send: (msg) => {
                globalThis.postMessage({ messageProxy: msg }, globalThis.location.origin)
            },
            setupSubscription: (msg) => {
                globalThis.postMessage({ subscriptionProxy: msg }, globalThis.location.origin)
            }
        })
    }

    /**
     * @param {NotificationMessage} msg
     */
    notify (msg) {
        this._transport.notify(msg)
    }

    /**
     * @param {RequestMessage} msg
     * @return {Promise<any>}
     */
    request (msg) {
        return this._transport.request(msg)
    }

    /**
     * @param {Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe (msg, callback) {
        return this._transport.subscribe(msg, callback)
    }
}

/**
 * Proxy Config
 */
export class ProxyMessagingConfig {}
