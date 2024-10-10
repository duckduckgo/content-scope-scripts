import { Service } from '../service.js'

/**
 * @typedef {import("../../../../types/new-tab.js").FavoritesData} FavoritesData
 * @typedef {import("../../../../types/new-tab.js").Favorite} Favorite
 * @typedef {import("../../../../types/new-tab.js").FavoritesConfig} FavoritesConfig
 */

/**
 * Public API for the Favorites Widget.
 */
export class FavoritesService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     */
    constructor (ntp) {
        /** @type {Service<FavoritesData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('favorites_getData'),
            persist: (data) => ntp.messaging.notify('favorites_setOrder', data),
            subscribe: (cb) => ntp.messaging.subscribe('favorites_onDataUpdate', cb)
        })

        /** @type {Service<FavoritesConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('favorites_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('favorites_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('favorites_setConfig', data)
        })
    }

    /**
     * @returns {Promise<{data: FavoritesData; config: FavoritesConfig}>}
     */
    async getInitial () {
        const p1 = this.configService.fetchInitial()
        const p2 = this.dataService.fetchInitial()
        const [config, data] = await Promise.all([p1, p2])
        return { config, data }
    }

    destroy () {
        this.configService.destroy()
        this.dataService.destroy()
    }

    /**
     * @param {(evt: {data: FavoritesData, source: 'manual' | 'subscription'}) => void} cb
     */
    onData (cb) {
        return this.dataService.onData(cb)
    }

    /**
     * @param {(evt: {data: FavoritesConfig, source: 'manual' | 'subscription'}) => void} cb
     */
    onConfig (cb) {
        return this.configService.onData(cb)
    }

    /**
     * Update the in-memory data immediate and persist.
     * Any state changes will be broadcast to consumers synchronously
     */
    toggleExpansion () {
        this.configService.update(old => {
            if (old.expansion === 'expanded') {
                return { expansion: /** @type {const} */('collapsed') }
            } else {
                return { expansion: /** @type {const} */('expanded') }
            }
        })
    }

    /**
     * @param {FavoritesData} data
     */
    setFavoritesOrder (data) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.dataService.update((_old) => {
            return data
        })
    }
}
