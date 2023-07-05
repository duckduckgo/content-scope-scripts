import {
    Messaging,
    MessagingContext,
    TestTransportConfig,
    WebkitMessagingConfig,
    WindowsMessagingConfig
} from '@duckduckgo/messaging'

/**
 * @param {object} opts
 * @param {ImportMeta['env']} opts.env
 * @param {ImportMeta['injectName']} opts.injectName
 * @param {string} opts.featureName
 * @param {() => import("../../messaging/index.js").MessagingTransport} [opts.mockImpl]
 */
export function createSpecialPagesMessaging (opts) {
    const messageContext = new MessagingContext({
        context: 'specialPages',
        featureName: opts.featureName,
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
    } else if (opts.injectName === 'integration' && opts.mockImpl) {
        const config = new TestTransportConfig(opts.mockImpl())
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
