/**
 * @typedef {import("../../types/new-tab.js").NewsData} NewsData
 */
import { Service } from '../service.js';

export class NewsService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {string} query - Query/topic for news data
     * @internal
     */
    constructor(ntp, query) {
        this.ntp = ntp;
        this.query = query;
        /** @type {Service<NewsData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('news_getData', { query }),
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
}
