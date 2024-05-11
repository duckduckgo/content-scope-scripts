import {
    Messaging,
    MessagingContext,
    TestTransportConfig,
    WebkitMessagingConfig,
    WindowsMessagingConfig
} from '@duckduckgo/messaging'

/**
 * This data structure is sent to enable user settings to be updated
 *
 * ```js
 * [[include:packages/special-pages/pages/duckplayer/src/js/messages.example.js]]```
 */
export class UserValues {
    /**
     * @param {object} params
     * @param {{enabled: {}} | {disabled: {}} | {alwaysAsk: {}}} params.privatePlayerMode
     * @param {boolean} params.overlayInteracted
     */
    constructor (params) {
        /**
         * 'enabled' means 'always play in duck player'
         * 'disabled' means 'never play in duck player'
         * 'alwaysAsk' means 'show overlay prompts for using duck player'
         * @type {{enabled: {}}|{disabled: {}}|{alwaysAsk: {}}}
         */
        this.privatePlayerMode = params.privatePlayerMode
        /**
         * `true` when the user has asked to remember a previous choice
         *
         * `false` if they have never used the checkbox
         * @type {boolean}
         */
        this.overlayInteracted = params.overlayInteracted
    }
}

/**
 * @param {object} opts
 * @param {ImportMeta['env']} opts.env
 * @param {ImportMeta['injectName']} opts.injectName
 */
export function createDuckPlayerPageMessaging (opts) {
    const messageContext = new MessagingContext({
        context: 'specialPages',
        featureName: 'duckPlayerPage',
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
        return new Messaging(messageContext, opts)
    } else if (opts.injectName === 'apple') {
        const opts = new WebkitMessagingConfig({
            hasModernWebkitAPI: true,
            secret: '',
            webkitMessageHandlerNames: ['specialPages']
        })
        return new Messaging(messageContext, opts)
    } else if (opts.injectName === 'integration') {
        const config = new TestTransportConfig({
            notify (msg) {
                console.log(msg)
            },
            request: (msg) => {
                console.log(msg)
                if (msg.method === 'getUserValues') {
                    return Promise.resolve(new UserValues({
                        overlayInteracted: false,
                        privatePlayerMode: { alwaysAsk: {} }
                    }))
                }
                return Promise.resolve(null)
            },
            subscribe (msg) {
                console.log(msg)
                return () => {
                    console.log('teardown')
                }
            }
        })
        return new Messaging(messageContext, config)
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
