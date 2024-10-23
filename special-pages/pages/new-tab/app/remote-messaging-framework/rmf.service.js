/**
 * @typedef {import("../../../../types/new-tab.js").RMFData} RMFData
 * @typedef {import("../../../../types/new-tab.js").StatsConfig} StatsConfig
 */
import { Service } from '../service.js'

/**
 *
 */
export class RMFService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor (ntp) {
        this.ntp = ntp
        /** @type {Service<RMFData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('rmf_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('rmf_onDataUpdate', cb)
        })
    }

    /**
     * @returns {Promise<RMFData>}
     * @internal
     */
    async getInitial () {
        return await this.dataService.fetchInitial()
    }

    /**
     * @internal
     */
    destroy () {
        this.dataService.destroy()
    }

    /**
     * @param {(evt: {data: RMFData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData (cb) {
        return this.dataService.onData(cb)
    }

    /**
     * @param {(evt: {data: RMFData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    dismiss (cb) {
        // return this.ntp.messaging.notify('')
        console.log(cb)
    }

    toggleExpansion () { }
}
