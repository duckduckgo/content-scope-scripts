/**
 * @typedef {import("../../types/new-tab.js").StockData} StockData
 */
import { Service } from '../service.js';

export class StockService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        /** @type {Service<StockData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('stock_getData'),
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
}
