/**
 * @typedef {import("../../types/new-tab.js").StockData} StockData
 */
import { Service } from '../service.js';

export class StockService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {string[]} symbols - Stock ticker symbols
     * @internal
     */
    constructor(ntp, symbols) {
        this.ntp = ntp;
        this.symbols = symbols;
        /** @type {Service<StockData[]>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('stock_getData', { symbols }),
        });
    }

    name() {
        return 'StockService';
    }

    /**
     * @returns {Promise<{data: StockData[]}>}
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
}
