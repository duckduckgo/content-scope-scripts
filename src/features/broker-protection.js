import ContentFeature from '../content-feature.js'
import { execute } from './broker-protection/execute.js'
import { retry } from '../timer-utils.js'

/**
 * @typedef {import("./broker-protection/types.js").ActionResponse} ActionResponse
 */

export default class BrokerProtection extends ContentFeature {
    init () {
        this.messaging.subscribe('onActionReceived', (/** @type {any} */params) => {
            try {
                const action = params.state.action
                const data = params.state.data

                if (!action) {
                    return this.messaging.notify('actionError', { error: 'No action found.' })
                }

                // Choose retry logic if it exists on the action
                const retryConfig = action.retry?.environment === 'web'
                    ? action.retry
                    : undefined

                retry(() => execute(action, data), retryConfig)
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .then(({ result, exceptions }) => {
                        if (result) {
                            this.messaging.notify('actionCompleted', { result })
                        } else {
                            this.messaging.notify('actionError', { error: 'No response found, exceptions: ' + exceptions.join(', ') })
                        }
                    })
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .catch(error => {
                        if (this.isDebug) {
                            console.error('unhandled exception: ', error)
                        }
                        this.messaging.notify('actionError', { error: error.toString() })
                    })
            } catch (e) {
                console.log('unhandled exception: ', e)
                this.messaging.notify('actionError', { error: e.toString() })
            }
        })
    }
}
