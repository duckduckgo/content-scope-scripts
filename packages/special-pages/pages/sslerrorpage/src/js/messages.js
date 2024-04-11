export class SSLErrorPageMessages {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor (messaging) {
        /**
         * @internal
         * @private
         */
        this.messaging = messaging
    }

    visitSite () {
        return this.messaging.notify('visitSite')
    }

    leaveSite () {
        return this.messaging.notify('leaveSite')
    }
}

/**
 * @returns {Promise<Omit<SSLErrorPageMessages, 'messaging'>>}
 */
export async function createSSLErrorMessaging () {
    try {
        const { Messaging, MessagingContext, WebkitMessagingConfig } = await import('@duckduckgo/messaging')
        const messageContext = new MessagingContext({
            context: 'specialPages',
            featureName: 'sslErrorPage',
            env: import.meta.env
        })
        const config = new WebkitMessagingConfig({
            hasModernWebkitAPI: true,
            secret: '',
            webkitMessageHandlerNames: ['specialPages']
        })
        const messaging = new Messaging(messageContext, config)
        return new SSLErrorPageMessages(messaging)
    } catch (e) {
        console.warn('missing messaging. all messages will be logged')
        return {
            leaveSite: () => console.trace('leaveSite'),
            visitSite: () => console.trace('visitSite')
        }
    }
}
