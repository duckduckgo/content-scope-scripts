/**
 * @typedef {import("../../types/new-tab.js").PrivacyProData} PrivacyProData
 * @typedef {import("../../types/new-tab.js").PrivacyProConfig} PrivacyProConfig
 */
import { Service } from '../service.js';

export class PrivacyProService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        /** @type {Service<PrivacyProData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('privacyPro_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('privacyPro_onDataUpdate', cb),
        });

        /** @type {Service<PrivacyProConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('privacyPro_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('privacyPro_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('privacyPro_setConfig', data),
        });
    }

    name() {
        return 'PrivacyProService';
    }

    /**
     * @returns {Promise<{data: PrivacyProData; config: PrivacyProConfig}>}
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
     * @param {(evt: {data: PrivacyProData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * @param {(evt: {data: PrivacyProConfig, source: 'manual' | 'subscription'}) => void} cb
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
}
