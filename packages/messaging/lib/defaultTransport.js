/**
 * @typedef {import('../index.js').Subscription} Subscription
 * @typedef {import('../index.js').MessagingContext} MessagingContext
 * @typedef {import('../index.js').RequestMessage} RequestMessage
 * @typedef {import('../index.js').NotificationMessage} NotificationMessage
 * @typedef {import('../index.js').MessagingTransport} MessagingTransport
 * @typedef {import('../index.js').MessageResponse} MessageResponse
 * @typedef {import('../index.js').SubscriptionEvent} SubscriptionEvent
 */

import { isResponseFor, isSubscriptionEventFor } from '../schema.js'

/**
 * @implements {MessagingTransport}
 */
export class DefaultTransport {
    /**
     * @param {object} params
     * @param {boolean} params.debug
     * @param {(dispatcher: (msg: MessageResponse | SubscriptionEvent) => void) => void} params.setupIncomingListener
     * @param {(msg: RequestMessage | NotificationMessage) => void} params.send
     * @param {(msg: Subscription) => void} params.setupSubscription
     */
    constructor (params) {
        this.debug = params.debug
        this._send = params.send
        this._setupIncomingListener = params.setupIncomingListener
        this._setupSubscription = params.setupSubscription

        /**
         * @type {Map<string, (msg: MessageResponse | SubscriptionEvent) => void>}
         * @internal
         */
        this.listeners = new globalThis.Map()

        /**
         * Setup the incoming listener
         * Note: This will cause side-effects
         */
        this._setupIncomingListener((payload) => this._dispatch(payload))
    }

    /**
     * The transport can call this to transmit a JSON payload along with a secret
     * to the native Android handler.
     *
     * Note: This can throw - it's up to the transport to handle the error.
     *
     * @type {(msg: RequestMessage | NotificationMessage) => void}
     * @throws
     * @internal
     */
    sendMessage (msg) {
        this._send(msg)
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
    _subscribe (id, callback) {
        this.listeners.set(id, callback)
        return () => {
            this.listeners.delete(id)
        }
    }

    /**
     * Accept incoming messages and try to deliver it to a registered listener.
     *
     * @param {MessageResponse | SubscriptionEvent} payload
     * @internal
     */
    _dispatch (payload) {
        // do nothing if the response is empty
        // this prevents the next `in` checks from throwing in test/debug scenarios
        if (!payload) return this._log('no response')

        // if the payload has an 'id' field, then it's a message response
        if ('id' in payload) {
            if (this.listeners.has(payload.id)) {
                this._tryCatch(() => this.listeners.get(payload.id)?.(payload))
            } else {
                this._log('no listeners for ', payload)
            }
        }

        // if the payload has an 'subscriptionName' field, then it's a push event
        if ('subscriptionName' in payload) {
            if (this.listeners.has(payload.subscriptionName)) {
                this._tryCatch(() => this.listeners.get(payload.subscriptionName)?.(payload))
            } else {
                this._log('no subscription listeners for ', payload)
            }
        }
    }

    /**
     *
     * @param {(...args: any[]) => any} fn
     * @param {string} [context]
     */
    _tryCatch (fn, context = 'none') {
        try {
            return fn()
        } catch (e) {
            if (this.debug) {
                console.error('ProxyMessagingConfig error:', context)
                console.error(e)
            }
        }
    }

    /**
     * @param {...any} args
     */
    _log (...args) {
        if (this.debug) {
            console.log('ProxyMessagingConfig', ...args)
        }
    }

    /**
     * @param {NotificationMessage} msg
     */
    notify (msg) {
        this._send(msg)
    }

    /**
     * @param {RequestMessage} msg
     * @return {Promise<any>}
     */
    request (msg) {
        return new Promise((resolve, reject) => {
            // subscribe early
            const unsub = this._subscribe(msg.id, handler)
            this._send(msg)

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
     * @param {Subscription} msg
     * @param {(value: unknown | undefined) => void} callback
     */
    subscribe (msg, callback) {
        this._setupSubscription(msg)
        const unsub = this._subscribe(msg.subscriptionName, (data) => {
            if (isSubscriptionEventFor(msg, data)) {
                callback(data.params || {})
            }
        })
        return () => {
            unsub()
        }
    }
}
