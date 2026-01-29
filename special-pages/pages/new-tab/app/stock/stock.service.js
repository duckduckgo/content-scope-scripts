/**
 * @typedef {import("../../types/new-tab.js").StockData} StockData
 */
import { Service } from '../service.js';

export class StockService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {string} [instanceId] - Optional instance ID for multi-instance support
     * @internal
     */
    constructor(ntp, instanceId) {
        this.ntp = ntp;
        this.instanceId = instanceId;
        /** @type {Service<StockData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('stock_getData', instanceId ? { instanceId } : {}),
            subscribe: (cb) => ntp.messaging.subscribe('stock_onDataUpdate', cb),
        });
    }

    name() {
        return 'StockService';
    }

    /**
     * @returns {Promise<{data: StockData}>}
     * @internal
     */
    async getInitial() {
        const data = await this.dataService.fetchInitial();
        return { data };
    }

    /**
     * @internal
     */
    destroy() {
        this.dataService.destroy();
    }

    /**
     * @param {(evt: {data: StockData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * Open the set symbol dialog for this widget instance
     * @internal
     */
    openSetSymbolDialog() {
        if (this.instanceId) {
            this.ntp.messaging.notify('stock_openSetSymbolDialog', { instanceId: this.instanceId });
        }
    }
}
