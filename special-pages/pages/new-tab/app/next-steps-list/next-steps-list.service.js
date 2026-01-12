/**
 * @typedef {import("../../types/new-tab.js").NextStepsListData} NextStepsListData
 * @typedef {import("../../types/new-tab.js").NextStepsListConfig} NextStepsListConfig
 */
import { Service } from '../service.js';

export class NextStepsListService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;
        /** @type {Service<NextStepsListData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('nextStepsList_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('nextStepsList_onDataUpdate', cb),
        });

        /** @type {Service<NextStepsListConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('nextStepsList_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('nextStepsList_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('nextStepsList_setConfig', data),
        });
    }

    name() {
        return 'NextStepsListService';
    }

    /**
     * @returns {Promise<{data: NextStepsListData; config: NextStepsListConfig}>}
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
     * @param {(evt: {data: NextStepsListData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * @param {(evt: {data: NextStepsListConfig, source: 'manual' | 'subscription'}) => void} cb
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
     * Dismiss a particular card
     * @param {string} id
     */
    dismiss(id) {
        this.ntp.messaging.notify('nextStepsList_dismiss', { id });
    }

    /**
     * Perform a primary action on a card
     * @param {string} id
     */
    action(id) {
        this.ntp.messaging.notify('nextStepsList_action', { id });
    }
}
