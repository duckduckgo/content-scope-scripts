import { Service } from '../service.js';

/**
 * @typedef {import("../../types/new-tab.js").Tabs} Tabs
 */

export class TabsService {
    /** @type {Tabs} */
    static DEFAULT = {
        tabId: 'unknown',
        tabIds: ['unknown'],
    };
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {Tabs} tabs
     * @internal
     */
    constructor(ntp, tabs) {
        this.ntp = ntp;

        /** @type {Service<Tabs>} */
        this.tabsService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('tabs_onDataUpdate', cb),
            },
            tabs,
        );
    }

    name() {
        return 'TabsService';
    }

    /**
     * @param {(evt: {data: Tabs, source: import('../service.js').InvocationSource}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.tabsService.onData(cb);
    }

    /**
     * @internal
     */
    destroy() {
        this.tabsService.destroy();
    }

    /**
     * @returns {Tabs}
     */
    snapshot() {
        if (!this.tabsService.data) throw new Error('unreachable');
        return this.tabsService.data;
    }
}
