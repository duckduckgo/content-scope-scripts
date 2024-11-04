import {
    AndroidMessagingConfig,
    Messaging,
    MessagingContext,
    TestTransportConfig,
    WebkitMessagingConfig,
    WindowsMessagingConfig,
} from '@duckduckgo/messaging'

/**
 * @param {object} opts
 * @param {ImportMeta['env']} opts.env
 * @param {ImportMeta['injectName']} opts.injectName
 * @param {string} opts.pageName
 * @param {(() => TestTransportConfig|null) | null | undefined} [opts.mockTransport]
 * @internal
 */
export function createSpecialPageMessaging(opts) {
    const messageContext = new MessagingContext({
        context: 'specialPages',
        featureName: opts.pageName,
        env: opts.env,
    })
    try {
        if (opts.injectName === 'windows') {
            const opts = new WindowsMessagingConfig({
                methods: {
                    // @ts-expect-error - not in @types/chrome
                    postMessage: window.chrome.webview.postMessage,
                    // @ts-expect-error - not in @types/chrome
                    addEventListener: window.chrome.webview.addEventListener,
                    // @ts-expect-error - not in @types/chrome
                    removeEventListener: window.chrome.webview.removeEventListener,
                },
            })
            return new Messaging(messageContext, opts)
        } else if (opts.injectName === 'apple') {
            const opts = new WebkitMessagingConfig({
                hasModernWebkitAPI: true,
                secret: '',
                webkitMessageHandlerNames: ['specialPages'],
            })
            return new Messaging(messageContext, opts)
        } else if (opts.injectName === 'android') {
            const opts = new AndroidMessagingConfig({
                messageSecret: 'duckduckgo-android-messaging-secret',
                messageCallback: 'messageCallback',
                javascriptInterface: messageContext.context,
                target: globalThis,
                debug: true,
            })
            return new Messaging(messageContext, opts)
        }
    } catch (e) {
        console.error('could not access handlers for %s, falling back to mock interface', opts.injectName)
    }

    // this fallback allows for the 'integration' target to run without errors
    const fallback =
        opts.mockTransport?.() ||
        new TestTransportConfig({
            /**
             * @param {import('@duckduckgo/messaging').NotificationMessage} msg
             */
            notify(msg) {
                console.log(msg)
            },
            /**
             * @param {import('@duckduckgo/messaging').RequestMessage} msg
             */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            request: (msg) => {
                console.log(msg)
                if (msg.method === 'initialSetup') {
                    return Promise.resolve({
                        locale: 'en',
                        env: opts.env,
                    })
                }
                return Promise.resolve(null)
            },
            /**
             * @param {import('@duckduckgo/messaging').SubscriptionEvent} msg
             */
            subscribe(msg) {
                console.log(msg)
                return () => {
                    console.log('teardown')
                }
            },
        })

    return new Messaging(messageContext, fallback)
}
