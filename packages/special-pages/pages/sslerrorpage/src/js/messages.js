import { Messaging, MessagingContext, NotificationMessage, WebkitMessagingConfig } from '@duckduckgo/messaging'

export class SSLErrorPageMessages {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor (messaging) {
        /**
         * @internal
         */
        this.messaging = messaging
    }

    notify (message) {
        return this.messaging.notify(message)
    }
}

export function createSSLErrorMessaging () {
    const messageContext = new MessagingContext({
        context: 'specialPages',
        featureName: 'sslErrorPage',
        env: 'development'
    })
    const config = new WebkitMessagingConfig({
        hasModernWebkitAPI: true,
        secret: '',
        webkitMessageHandlerNames: ['specialPages']
    })
    const messaging = new Messaging(messageContext, config)
    return new SSLErrorPageMessages(messaging)
}
