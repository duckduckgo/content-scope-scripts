import ContentFeature from '../content-feature'
import { Messaging } from '@duckduckgo/messaging'
import { matchHostname } from '../utils.js'

/**
 * Act as a proxy
 */
export default class MessageProxy extends ContentFeature {
    /**
     * @param {any} args
     */
    init (args) {
        const thisContext = this._createMessagingContext()

        for (const { origin, feature } of args.messageProxies) {
            if (!matchHostname(globalThis.location.hostname, origin)) {
                continue
            }
            const nextMessagingContext = { ...thisContext, featureName: feature }
            const messaging = new Messaging(nextMessagingContext, args.messagingConfig)
            this.initFeatureProxy(feature, messaging, origin)
        }
    }

    /**
     * @param {string} featureName
     * @param {Messaging} messaging
     * @param {string} allowedOrigin
     */
    initFeatureProxy (featureName, messaging, allowedOrigin) {
        const subscriptions = new Set([])

        /**
         * @param {{origin: string|null|undefined}} evt
         * @return {boolean}
         */
        const isAllowed = (evt) => {
            if (typeof evt.origin !== 'string') return false
            try {
                const url = new URL(evt.origin)
                return matchHostname(url.hostname, allowedOrigin)
            } catch (e) {
                return false
            }
        }

        // listen for incoming notifications + requests
        globalThis.addEventListener('message', (evt) => {
            if (!isAllowed(evt)) {
                if (this.isDebug) console.warn('ignoring unsupported origin')
                return
            }
            if (!evt.data || !('messageProxy' in evt.data)) {
                if (this.isDebug) console.warn('messageProxy absent from msg.data')
                return
            }

            const msg = evt.data.messageProxy

            if ('featureName' in msg && msg.featureName === featureName) {
                if (!('id' in msg)) {
                    this.forwardNotification(messaging, msg)
                } else {
                    this.forwardRequest(messaging, featureName, msg)
                }
            } else {
                console.log('feature proxy not supported on this origin')
            }
        })

        // listen for incoming subscriptions
        globalThis.addEventListener('message', (evt) => {
            if (!isAllowed(evt)) {
                if (this.isDebug) console.warn('ignoring unsupported origin')
                return
            }
            if (!evt.data || !('subscriptionProxy' in evt.data)) {
                if (this.isDebug) console.warn('subscriptionProxy absent from msg.data')
                return
            }

            this.forwardSubscription(messaging, evt.data.subscriptionProxy, featureName, subscriptions)
        })
    }

    /**
     * @param {Messaging} messaging
     * @param {import('@duckduckgo/messaging').NotificationMessage} msg
     */
    forwardNotification (messaging, msg) {
        messaging.notify(msg.method, msg.params)
    }

    /**
     * @param {Messaging} messaging
     * @param {import('@duckduckgo/messaging').RequestMessage} msg
     * @param {string} featureName
     */
    async forwardRequest (messaging, featureName, msg) {
        try {
            const clone = JSON.parse(JSON.stringify(msg))
            const result = await messaging.request(msg.method, msg.params)
            /** @type {import('@duckduckgo/messaging/lib/test-utils.mjs').MessageResponse} */
            const outgoing = {
                id: clone.id,
                context: clone.context,
                featureName,
                result,
                error: undefined
            }
            globalThis.postMessage({
                messageProxyResponse: outgoing
            })
        } catch (e) {
            /** @type {import('@duckduckgo/messaging/lib/test-utils.mjs').MessageResponse} */
            const next = {
                id: msg.id,
                context: msg.context,
                featureName,
                error: { message: e.message },
                result: undefined
            }
            globalThis.postMessage({
                messageProxyResponse: next
            })
        }
    }

    /**
     *
     * @param {Messaging} messaging
     * @param {import("@duckduckgo/messaging").Subscription} msg
     * @param {string} featureName
     * @param {Set<string>} subscriptions
     */
    forwardSubscription (messaging, msg, featureName, subscriptions) {
        if (subscriptions.has(msg.subscriptionName)) {
            return console.warn('not subscribing again', msg.subscriptionName)
        }
        subscriptions.add(msg.subscriptionName)

        messaging.subscribe(msg.subscriptionName, (evt) => {
            /** @type {import('@duckduckgo/messaging').SubscriptionEvent} */
            const response = {
                featureName,
                context: msg.context,
                params: evt || {},
                subscriptionName: msg.subscriptionName
            }
            globalThis.postMessage({
                messageProxyResponse: response
            })
        })
    }
}
