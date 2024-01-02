import {
    Messaging,
    MessagingContext,
    TestTransportConfig,
    WebkitMessagingConfig,
    WindowsMessagingConfig
} from '@duckduckgo/messaging'

/**
 * Notifications or requests that the
 */
export class OnboardingMessages {
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

    /**
     * @param {import('./types').BooleanSystemValue} params
     */
    setBookmarksBar (params) {
        this.messaging.notify('setBookmarksBar', params)
        return true
    }

    /**
     * @param {import('./types').BooleanSystemValue} params
     */
    setSessionRestore (params) {
        this.messaging.notify('setSessionRestore', params)
    }

    /**
     * @param {{value: import('./types').HomeButtonPosition}} params
     */
    setShowHomeButton (params) {
        this.messaging.notify('setShowHomeButton', params)
    }

    requestRemoveFromDock () {
        this.messaging.notify('requestRemoveFromDock')
    }

    /**
     * @returns {Promise<any>} Whether the import completed successfully
     */
    requestImport () {
        return this.messaging.request('requestImport')
    }

    /**
     * @returns {Promise<any>} Whether the browser was set as default
     */
    requestSetAsDefault () {
        return this.messaging.request('requestSetAsDefault')
    }

    /**
     * Dismisses onboarding and opens settings
     */
    dismissToSettings () {
        this.messaging.notify('dismissToSettings')
    }

    /**
     * Indicates the "Start Browsing" button has been clicked
     */
    dismissToAddressBar () {
        this.messaging.notify('dismissToAddressBar')
    }

    /**
     * @param {any} params
     */
    reportPageException (params) {
        this.messaging.notify('reportPageException', params)
    }

    /**
     * @param {any} params
     */
    reportInitException (params) {
        this.messaging.notify('reportInitException', params)
    }
}

/**
 * @param {object} opts
 * @param {ImportMeta['env']} opts.env
 * @param {ImportMeta['injectName']} opts.injectName
 * @internal
 */
export function createOnboardingMessaging (opts) {
    const messageContext = new MessagingContext({
        context: 'specialPages',
        featureName: 'onboarding',
        env: opts.env
    })
    if (opts.injectName === 'windows') {
        const opts = new WindowsMessagingConfig({
            methods: {
                // @ts-expect-error - not in @types/chrome
                postMessage: window.chrome.webview.postMessage,
                // @ts-expect-error - not in @types/chrome
                addEventListener: window.chrome.webview.addEventListener,
                // @ts-expect-error - not in @types/chrome
                removeEventListener: window.chrome.webview.removeEventListener
            }
        })
        const messaging = new Messaging(messageContext, opts)
        return new OnboardingMessages(messaging)
    } else if (opts.injectName === 'apple') {
        const opts = new WebkitMessagingConfig({
            hasModernWebkitAPI: true,
            secret: '',
            webkitMessageHandlerNames: ['specialPages']
        })
        const messaging = new Messaging(messageContext, opts)
        return new OnboardingMessages(messaging)
    } else if (opts.injectName === 'integration') {
        const config = new TestTransportConfig({
            /**
             * @param {import('@duckduckgo/messaging').NotificationMessage} msg
             */
            notify (msg) {
                console.log(msg)
            },
            /**
             * @param {import('@duckduckgo/messaging').RequestMessage} msg
             */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            request: (msg) => {
                console.log(msg)
                return Promise.resolve(null)
            },
            /**
             * @param {import('@duckduckgo/messaging').SubscriptionEvent} msg
             */
            subscribe (msg) {
                console.log(msg)
                return () => {
                    console.log('teardown')
                }
            }
        })
        const messaging = new Messaging(messageContext, config)
        return new OnboardingMessages(messaging)
    }
    throw new Error('unreachable - platform not supported')
}

/**
 * This will return either { value: awaited value },
 *                         { error: error message }
 *
 * It will execute the given function in uniform intervals
 * until either:
 *   1: the given function stops throwing errors
 *   2: the maxAttempts limit is reached
 *
 * This is useful for situations where you don't want to continue
 * until a result is found - normally to work around race-conditions
 *
 * @template {(...args: any[]) => any} FN
 * @param {FN} fn
 * @param {{maxAttempts?: number, intervalMs?: number}} params
 * @returns {Promise<{ value: Awaited<ReturnType<FN>>, attempt: number } | { error: string }>}
 * @internal
 */
export async function callWithRetry (fn, params = {}) {
    const { maxAttempts = 10, intervalMs = 300 } = params
    let attempt = 1

    while (attempt <= maxAttempts) {
        try {
            return { value: await fn(), attempt }
        } catch (error) {
            if (attempt === maxAttempts) {
                return { error: `Max attempts reached: ${error}` }
            }

            await new Promise((resolve) => setTimeout(resolve, intervalMs))
            attempt++
        }
    }

    return { error: 'Unreachable: value not retrieved' }
}
