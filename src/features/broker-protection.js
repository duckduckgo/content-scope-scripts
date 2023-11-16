import ContentFeature from '../content-feature.js'
import { execute } from './broker-protection/actions.js'

export default class BrokerProtection extends ContentFeature {
    init () {
        this.messaging.subscribe('onActionReceived', async (/** @type {any} */params) => {
            const action = params.state.action
            const data = params.state.data

            if (action) {
                try {
                    const result = await execute(action, data)
                    this.messaging.notify('actionCompleted', { result })
                } catch (e) {
                    console.log('unhandled exception: ', e)
                    this.messaging.notify('actionError', { error: e.toString() })
                }
            } else {
                this.messaging.notify('actionError', { error: 'No action found.' })
            }
        })
    }
}
