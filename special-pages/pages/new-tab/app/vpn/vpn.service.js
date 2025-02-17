/**
 * @typedef {import("../../types/new-tab.js").VPNWidgetData} Vpn
 * @typedef {import("../../types/new-tab.js").VPNConfig} VPNConfig
 */
import { Service } from '../service.js';

export class VpnService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        this.ntp = ntp;
        /** @type {Service<Vpn>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('vpn_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('vpn_onDataUpdate', cb),
        });

        /** @type {Service<VPNConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('vpn_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('vpn_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('vpn_setConfig', data),
        });
    }

    name() {
        return 'VpnService';
    }

    /**
     * @returns {Promise<{data: Vpn; config: VPNConfig}>}
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
     * @param {(evt: {data: Vpn, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }

    /**
     * @param {(evt: {data: VPNConfig, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onConfig(cb) {
        return this.configService.onData(cb);
    }

    /**
     * @internal
     */
    connect() {
        this.ntp.messaging.notify('vpn_connect');
        this.dataService.update((old) => {
            return {
                ...old,
                pending: 'connecting',
            };
        });
    }

    /**
     * @internal
     */
    disconnect() {
        this.ntp.messaging.notify('vpn_disconnect');
        this.dataService.update((old) => {
            return {
                ...old,
                pending: 'disconnecting',
            };
        });
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
