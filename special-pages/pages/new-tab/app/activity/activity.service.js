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
        this.ntp = ntp;
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

        /** @type {EventTarget|null} */
        this.burns = new EventTarget();
        this.burnUnsub = this.ntp.messaging.subscribe('activity_onBurnComplete', () => {
            this.burns?.dispatchEvent(new CustomEvent('activity_onBurnComplete'));
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
        this.burnUnsub();
        this.burns = null;
    }

    /**
     * @param {(evt: {data: ActivityData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    triggerDataFetch() {
        return this.dataService.triggerFetch();
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
    /**
     * @param {string} url
     */
    addFavorite(url) {
        this.dataService.update((old) => {
            return {
                ...old,
                activity: old.activity.map((item) => {
                    if (item.url === url) return { ...item, favorite: true };
                    return item;
                }),
            };
        });
        this.ntp.messaging.notify('activity_addFavorite', { url });
    }
    /**
     * @param {string} url
     */
    removeFavorite(url) {
        this.dataService.update((old) => {
            return {
                ...old,
                activity: old.activity.map((item) => {
                    if (item.url === url) return { ...item, favorite: false };
                    return item;
                }),
            };
        });
        this.ntp.messaging.notify('activity_removeFavorite', { url });
    }
    /**
     * @param {string} url
     * @return {Promise<import('../../types/new-tab.js').ConfirmBurnResponse>}
     */
    confirmBurn(url) {
        return this.ntp.messaging.request('activity_confirmBurn', { url });
    }
    /**
     * @param {string} url
     */
    remove(url) {
        this.dataService.update((old) => {
            return {
                ...old,
                activity: old.activity.filter((item) => {
                    return item.url !== url;
                }),
            };
        });
        this.ntp.messaging.notify('activity_removeItem', { url });
    }
    /**
     * @param {string} url
     * @param {import('../../types/new-tab.js').OpenTarget} target
     */
    openUrl(url, target) {
        this.ntp.messaging.notify('activity_open', { url, target });
    }

    onBurnComplete(cb) {
        if (!this.burns) throw new Error('unreachable');
        this.burns.addEventListener('activity_onBurnComplete', cb);
        return () => {
            if (!this.burns) throw new Error('unreachable');
            this.burns.removeEventListener('activity_onBurnComplete', cb);
        };
    }

    enableBroadcast() {
        this.dataService.enableBroadcast();
        this.dataService.flush();
    }
    disableBroadcast() {
        this.dataService.disableBroadcast();
    }
}
