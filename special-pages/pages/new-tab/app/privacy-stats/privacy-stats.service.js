/**
 * @typedef {import("../../types/new-tab.js").PrivacyStatsData} PrivacyStatsData
 * @typedef {import("../../types/new-tab.js").StatsConfig} StatsConfig
 */
import { Service } from '../service.js';

export class PrivacyStatsService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;
        /** @type {Service<PrivacyStatsData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('stats_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('stats_onDataUpdate', cb),
        });

        /** @type {Service<StatsConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('stats_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('stats_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('stats_setConfig', data),
        });
    }

    name() {
        return 'PrivacyStatsService';
    }

    /**
     * @returns {Promise<{data: PrivacyStatsData; config: StatsConfig}>}
     * @internal
     */
    async getInitial() {
        const p1 = this.configService.fetchInitial();
        const p2 = this.dataService.fetchInitial();
        const [config, data] = await Promise.all([p1, p2]);
        return { config, data };
    }

    /**
     * @internal
     */
    destroy() {
        this.configService.destroy();
        this.dataService.destroy();
    }

    /**
     * @param {(evt: {data: PrivacyStatsData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * @param {(evt: {data: StatsConfig, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onConfig(cb) {
        return this.configService.onData(cb);
    }

    /**
     * Update the in-memory data immediate and persist.
     * Any state changes will be broadcast to consumers synchronously
     * @internal
     */
    toggleExpansion() {
        this.configService.update((old) => {
            if (old.expansion === 'expanded') {
                return { ...old, expansion: /** @type {const} */ ('collapsed') };
            } else {
                return { ...old, expansion: /** @type {const} */ ('expanded') };
            }
        });
    }

    /**
     *
     */
    openHistory() {
        this.ntp.messaging.notify('stats_openHistory', {});
    }

    /**
     *
     */
    dismiss() {
        this.configService.updateWith(
            (old) => {
                return { ...old, onboarding: null };
            },
            (_) => {
                this.ntp.messaging.notify('stats_dismissHistoryMsg', {});
            },
        );
    }
}
