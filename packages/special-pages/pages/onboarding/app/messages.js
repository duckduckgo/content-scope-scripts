import {
    Messaging,
    MessagingContext,
    TestTransportConfig,
    WebkitMessagingConfig,
    WindowsMessagingConfig
} from '@duckduckgo/messaging'

/**
 * @typedef {Object} StepCompleteParams
 * Sent when a user has transitioned from a step to the next one
 * @property {import('./types').Step['id']} id - a unique identifier for each step
 *
 * @typedef {Object} InitResponse
 * @property {Record<string, any>} stepDefinitions
 * @property {ImportMeta['env']} [env] - optional override for the running override
 */

/**
 * This describes the messages that will be sent to the native layer,
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
     * Sends an initial message to the native layer. This is the opportunity for the native layer
     * to provide the initial state of the application or any configuration, for example:
     *
     * ```json
     * {
     *   "stepDefinitions": {
     *     "systemSettings": {
     *       "rows": ["dock", "import", "default-browser"]
     *     }
     *   }
     * }
     * ```
     *
     * In that example, the native layer is providing the list of rows that should be shown in the
     * systemSettings step, overriding the default list provided in `data.js`.
     *
     * @returns {Promise<InitResponse>}
     */
    async init () {
        return await this.messaging.request('init')
    }

    /**
     * Sends a notification to the native layer that the user has completed a step
     *
     * @param {StepCompleteParams} params
     */
    stepCompleted (params) {
        this.messaging.notify('stepCompleted', params)
    }

    /**
     * Sent when the user wants to enable or disable the bookmarks bar
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setBookmarksBar (params) {
        this.messaging.notify('setBookmarksBar', params)
    }

    /**
     * Sent when the user wants to enable or disable the session restore setting
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setSessionRestore (params) {
        this.messaging.notify('setSessionRestore', params)
    }

    /**
     * Sent when the user wants to enable or disable the home button
     * Note: Although the home button can placed in multiple places in the browser taskbar, this
     * application will only ever send enabled/disabled to the native layer
     *
     * @param {import('./types').BooleanSystemValue} params
     */
    setShowHomeButton (params) {
        this.messaging.notify('setShowHomeButton', params)
    }

    /**
     * Sent when the user wants to keep the application in the dock/taskbar.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<any>}
     */
    requestDockOptIn () {
        return this.messaging.request('requestDockOptIn')
    }

    /**
     * Sent when the user wants to import data. The UI will remain
     * in a loading state until the native layer sends a response.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<any>}
     */
    requestImport () {
        return this.messaging.request('requestImport')
    }

    /**
     * Sent when the user wants to set DuckDuckGo as their default browser. The UI will remain
     * in a loading state until the native layer sends a response.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<any>}
     */
    requestSetAsDefault () {
        return this.messaging.request('requestSetAsDefault')
    }

    /**
     * Sent when onboarding is complete and the user has chosen to go to settings
     */
    dismissToSettings () {
        this.messaging.notify('dismissToSettings')
    }

    /**
     * Sent when the "Start Browsing" button has been clicked.
     */
    dismissToAddressBar () {
        this.messaging.notify('dismissToAddressBar')
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {import('./types').ErrorBoundaryEvent["error"]} params
     */
    reportPageException (params) {
        this.messaging.notify('reportPageException', params)
    }

    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException (params) {
        this.messaging.notify('reportInitException', params)
    }
}

const fallback = new TestTransportConfig({
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
    try {
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
        }
    } catch (e) {
        console.error('could not access handlers for %s, falling back to mock interface', opts.injectName)
    }
    const messaging = new Messaging(messageContext, fallback)
    return new OnboardingMessages(messaging)
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
