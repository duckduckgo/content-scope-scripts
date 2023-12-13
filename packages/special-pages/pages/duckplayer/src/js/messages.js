import {
    Messaging,
    MessagingContext, ProxyMessagingConfig
} from '@duckduckgo/messaging'

/**
 * Notifications or requests that the Duck Player Page will
 * send to the native side
 */
export class DuckPlayerPageMessages {
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
     * This is sent when the user wants to set Duck Player as the default.
     *
     * @param {UserValues} userValues
     */
    setUserValues (userValues) {
        return this.messaging.request('setUserValues', userValues)
    }

    /**
     * This is sent when the user wants to set Duck Player as the default.
     * @return {Promise<UserValues>}
     */
    getUserValues () {
        return this.messaging.request('getUserValues')
    }

    /**
     * This is a subscription that we set up when the page loads.
     * We use this value to show/hide the checkboxes.
     *
     * **Integration NOTE**: Native platforms should always send this at least once on initial page load.
     *
     * - See {@link Messaging.SubscriptionEvent} for details on each value of this message
     * - See {@link UserValues} for details on the `params`
     *
     * ```json
     * // the payload that we receive should look like this
     * {
     *   "context": "specialPages",
     *   "featureName": "duckPlayerPage",
     *   "subscriptionName": "onUserValuesChanged",
     *   "params": {
     *     "overlayInteracted": false,
     *     "privatePlayerMode": {
     *       "enabled": {}
     *     }
     *   }
     * }
     * ```
     *
     * @param {(value: UserValues) => void} cb
     */
    onUserValuesChanged (cb) {
        return this.messaging.subscribe('onUserValuesChanged', cb)
    }
}

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
    const context = new MessagingContext({
        context: 'pageWorldMessageProxy',
        featureName: 'duckPlayerPage',
        env: opts.env
    })
    const config = new ProxyMessagingConfig()
    const messaging = new Messaging(context, config)
    return new DuckPlayerPageMessages(messaging)
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
