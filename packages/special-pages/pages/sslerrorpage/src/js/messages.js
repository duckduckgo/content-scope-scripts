import { TestTransportConfig } from '@duckduckgo/messaging'

/**
 * @param {object} opts
 * @param {ImportMeta['env']} opts.env
 * @param {ImportMeta['injectName']} opts.injectName
 */
export async function createSSLErrorMessaging (opts) {
    const { Messaging, MessagingContext, WebkitMessagingConfig } = await import('@duckduckgo/messaging')
    const messageContext = new MessagingContext({
        context: 'specialPages',
        featureName: 'sslErrorPage',
        env: opts.env
    })
    if (opts.injectName === 'integration') {
        const config = new TestTransportConfig({
            notify (msg) {
                console.log(msg)
            },
            request: () => {
                return Promise.resolve(null)
            },
            subscribe () {
                return () => {}
            }
        })
        return new Messaging(messageContext, config)
    }

    // default is apple
    const config = new WebkitMessagingConfig({
        hasModernWebkitAPI: true,
        secret: '',
        webkitMessageHandlerNames: ['specialPages']
    })
    return new Messaging(messageContext, config)
}
