import ContentFeature from '../content-feature.js'
import { execute } from './broker-protection/execute.js'

/**
 * @typedef {import('../types/broker-protection.js').OnActionReceivedSubscription['params']} Params
 */

export default class BrokerProtection extends ContentFeature {
    init () {
        this.messaging.subscribe('onActionReceived', (/** @type {Params} */params) => {
            try {
                const action = params.state.action
                const data = params.state.data
                if (!action) {
                    return this.messaging.notify('actionError', { error: 'No action found.' })
                }
                const result = execute(action, data)
                this.messaging.notify('actionCompleted', { result })
            } catch (e) {
                console.log('unhandled exception: ', e)
                this.messaging.notify('actionError', { error: e.toString() })
            }
        })
    }
}
