/**
 * @typedef {import("../../types/new-tab.js").NewsData} NewsData
 */
import { Service } from '../service.js';

export class NewsService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        /** @type {Service<NewsData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('news_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('news_onDataUpdate', cb),
        });
    }

    name() {
        return 'NewsService';
    }

    /**
     * @returns {Promise<{data: NewsData}>}
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
     * @param {(evt: {data: NewsData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }
}
