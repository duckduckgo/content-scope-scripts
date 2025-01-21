/**
 * @typedef {import("../../types/new-tab.js").ActivityData} ActivityData
 * @typedef {import("../../types/new-tab.js").ActivityConfig} ActivityConfig
 */
import { Service } from '../service.js';

export class ActivityService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        /** @type {Service<ActivityData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('activity_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('activity_onDataUpdate', cb),
        });

        /** @type {Service<ActivityConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('activity_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('activity_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('activity_setConfig', data),
        });
    }

    name() {
        return 'ActivityService';
    }

    /**
     * @returns {Promise<{data: ActivityData; config: ActivityConfig}>}
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
     * @param {(evt: {data: ActivityData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * @param {(evt: {data: ActivityConfig, source: 'manual' | 'subscription'}) => void} cb
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
