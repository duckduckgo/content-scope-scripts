import ContentFeature from '../content-feature.js'
import { execute } from './broker-protection/execute.js'

export default class BrokerProtection extends ContentFeature {
    init () {
        this.messaging.subscribe('onActionReceived', (/** @type {any} */params) => {
            try {
                const action = params.state.action
                const data = params.state.data
                const { interval: { ms = 1000 } = {}, maxAttempts = 5 } = action.retry || {}

                if (!action) {
                    return this.messaging.notify('actionError', { error: 'No action found.' })
                }

                retry(() => execute(action, data), ms, maxAttempts)
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .then(result => {
                        this.messaging.notify('actionCompleted', { result })
                    })
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .catch(error => {
                        console.log('unhandled exception: ', error)
                        this.messaging.notify('actionError', { error: error.toString() })
                    })
            } catch (e) {
                console.log('unhandled exception: ', e)
                this.messaging.notify('actionError', { error: e.toString() })
            }
        })
    }
}

async function retry (fn, interval, maxAttempts) {
    let lastResult
    for (let i = 0; i < maxAttempts; i++) {
        try {
            /** @type {import("./broker-protection/types.js").ActionResponse} */
            lastResult = fn()
            if (lastResult.success || i === maxAttempts - 1) return lastResult
        } catch (e) {
            console.log('CAUGHT', e)
        }
        await new Promise(resolve => setTimeout(resolve, interval))
    }
}
