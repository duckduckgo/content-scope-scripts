import ContentFeature from '../content-feature.js'
import { execute } from './broker-protection/execute.js'
import { retry } from '../timer-utils.js'

/**
 * @typedef {import("./broker-protection/types.js").ActionResponse} ActionResponse
 */

export default class BrokerProtection extends ContentFeature {
    init () {
        this.messaging.subscribe('onActionReceived', async (/** @type {any} */params) => {
            try {
                const action = params.state.action
                const data = params.state.data

                if (!action) {
                    return this.messaging.notify('actionError', { error: 'No action found.' })
                }

                /**
                 * Note: We're not currently guarding against concurrent actions here
                 * since the native side contains the scheduling logic to prevent it.
                 */
                let retryConfig = action.retry?.environment === 'web'
                    ? action.retry
                    : undefined

                if (action.actionType === 'extract') {
                    retryConfig = {
                        interval: { ms: 1000 },
                        maxAttempts: 30
                    }
                }

                const { result, exceptions } = await retry(() => execute(action, data), retryConfig)

                if (result) {
                    this.messaging.notify('actionCompleted', { result })
                } else {
                    this.messaging.notify('actionError', { error: 'No response found, exceptions: ' + exceptions.join(', ') })
                }
            } catch (e) {
                console.log('unhandled exception: ', e)
                this.messaging.notify('actionError', { error: e.toString() })
            }
        })
    }
}
