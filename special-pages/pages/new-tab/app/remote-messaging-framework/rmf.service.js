/**
 * @typedef {import("../../../../types/new-tab.js").RMFData} RMFData
 * @typedef {import("../../../../types/new-tab.js").StatsConfig} StatsConfig
 * @typedef {import("../../../../types/new-tab.js").RMFConfig} RMFConfig
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
        /** @type {Service<RMFConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('rmf_getConfig')
        })
    }

    /**
     * @returns {Promise<{data: RMFData; config: RMFConfig}>}
     * @internal
     */
    async getInitial () {
        const p1 = this.configService.fetchInitial()
        const p2 = this.dataService.fetchInitial()
        const [config, data] = await Promise.all([p1, p2])
        return { config, data }
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
     * @param {(evt: {data: RMFConfig, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onConfig (cb) {
        return this.configService.onData(cb)
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
