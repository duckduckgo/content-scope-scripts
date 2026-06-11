/**
 * @typedef {import("../../types/new-tab.js").SubscriptionWinBackBannerData} SubscriptionWinBackBannerData
 */
import { Service } from '../service.js';

export class SubscriptionWinBackBannerService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;
        /** @type {Service<SubscriptionWinBackBannerData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('winBackOffer_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('winBackOffer_onDataUpdate', cb),
        });
    }

    name() {
        return 'SubscriptionWinBackBannerService';
    }

    /**
     * @returns {Promise<SubscriptionWinBackBannerData>}
     * @internal
     */
    async getInitial() {
        return await this.dataService.fetchInitial();
    }

    /**
     * @internal
     */
    destroy() {
        this.dataService.destroy();
    }

    /**
     * @param {(evt: {data: SubscriptionWinBackBannerData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * @param {string} id
     * @internal
     */
    dismiss(id) {
        return this.ntp.messaging.notify('winBackOffer_dismiss', { id });
    }

    /**
     * @param {string} id
     */
    action(id) {
        this.ntp.messaging.notify('winBackOffer_action', { id });
    }
}
