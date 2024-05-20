export const DEFAULT_RETRY_CONFIG = {
    interval: { ms: 0 },
    maxAttempts: 1
}

/**
 * A generic retry mechanism for synchronous functions that return
 * a 'success' or 'error' response
 *
 * @template T
 * @template {{ success: T } | { error: { message: string } }} FnReturn
 * @param {() => FnReturn} fn
 * @param {AbortSignal} signal
 * @param {typeof DEFAULT_RETRY_CONFIG} [config]
 * @return {Promise<{ result: FnReturn | undefined, exceptions: string[] }>}
 */
export async function retry (fn, signal, config = DEFAULT_RETRY_CONFIG) {
    let lastResult
    let cancelled = false
    signal.addEventListener('abort', () => (cancelled = true))

    const exceptions = []
    for (let i = 0; i < config.maxAttempts; i++) {
        try {
            lastResult = fn()
        } catch (e) {
            exceptions.push(e.toString())
        }

        if (cancelled) break

        // stop when there's a good result to return
        // since fn() returns either { success: <value> } or { error: ... }
        if (lastResult && 'success' in lastResult) break

        // don't pause on the last item
        if (i === config.maxAttempts - 1) break

        await new Promise(resolve => setTimeout(resolve, config.interval.ms))
    }

    return { result: lastResult, exceptions }
}

function originAndPath () {
    const prev = new URL(window.location.href)
    prev.hash = ''
    prev.search = ''
    return prev.href
}

/**
 * @param {AbortSignal} signal
 * @return {Promise<null>}
 */
export function urlDidChange (signal) {
    return new Promise((resolve) => {
        const prev = originAndPath()
        let canceled = false
        function check () {
            if (canceled) {
                return resolve(null)
            }
            const url = originAndPath()
            if (url !== prev) {
                resolve(null)
            } else {
                requestAnimationFrame(check)
            }
        }
        signal.addEventListener('abort', () => {
            canceled = true
        })
        requestAnimationFrame(check)
    })
}

/**
 * @param {AbortSignal} signal
 * @return {Promise<null>}
 */
export function pageDidUnload (signal) {
    return new Promise((resolve) => {
        function handler () {
            resolve(null)
        }
        window.addEventListener('beforeunload', handler)
        signal.addEventListener('abort', () => {
            window.removeEventListener('beforeunload', handler)
        })
    })
}
