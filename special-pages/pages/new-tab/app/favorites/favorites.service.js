import { Service } from '../service.js'

/**
 * @typedef {import("../../../../types/new-tab.js").FavoritesData} FavoritesData
 * @typedef {import("../../../../types/new-tab.js").Favorite} Favorite
 * @typedef {import("../../../../types/new-tab.js").FavoritesConfig} FavoritesConfig
 */

/**
 * Public API for the Favorites Widget.
 *
 * ## Requests:
 * - {@link "NewTab Messages".FavoritesGetDataRequest `favorites_getData`}
 *   - Used to fetch the initial data (during the first render)
 *   - returns {@link "NewTab Messages".FavoritesData}
 * - {@link "NewTab Messages".FavoritesGetDataRequest `favorites_getConfig`}
 *   - Used to fetch the initial data (during the first render)
 *   - returns {@link "NewTab Messages".FavoritesConfig}
 *
 *
 * ## Subscriptions:
 * - {@link "NewTab Messages".FavoritesOnDataUpdateSubscription `favorites_onDataUpdate`}.
 *   - The tracker/company data used in the feed.
 *   - returns {@link "NewTab Messages".FavoritesData}
 * - {@link "NewTab Messages".FavoritesOnConfigUpdateSubscription `favorites_onConfigUpdate`}.
 *   - The widget config
 *   - returns {@link "NewTab Messages".FavoritesConfig}
 *
 *
 * ## Notifications:
 * - {@link "NewTab Messages".FavoritesSetConfigNotification `favorites_setConfig`}
 *   - Sent when the user toggles the expansion of the favorites
 *   - Sends {@link "NewTab Messages".FavoritesConfig}
 *   - Example payload:
 *     ```json
 *     {
 *       "expansion": "collapsed"
 *     }
 *     ```
 * - {@link "NewTab Messages".FavoritesMoveNotification `favorites_move`}
 *   - Sends {@link "NewTab Messages".FavoritesMoveAction}
 *   - When you receive this message, apply the following
 *     - Search your collection to find the object with the given `id`.
 *     - Remove that object from its current position.
 *     - Insert it into the new position specified by `targetIndex`.
 *   - Example payload:
 *     ```json
 *     {
 *        "id": "abc",
 *        "targetIndex": 1
 *     }
 *     ```
 * - {@link "NewTab Messages".FavoritesOpenContextMenuNotification `favorites_openContextMenu`}
 *   - Sends {@link "NewTab Messages".FavoritesOpenContextMenuAction}
 *   - When you receive this message, show the context menu for the entity
 *  - Example payload:
 *     ```json
 *     {
 *        "id": "abc",
 *     }
 *     ```
 */
export class FavoritesService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor (ntp) {
        this.ntp = ntp

        /** @type {Service<FavoritesData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('favorites_getData'),
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
     * @internal
     */
    async getInitial () {
        const p1 = this.configService.fetchInitial()
        const p2 = this.dataService.fetchInitial()
        const [config, data] = await Promise.all([p1, p2])
        return { config, data }
    }

    /**
     * @internal
     */
    destroy () {
        this.configService.destroy()
        this.dataService.destroy()
    }

    /**
     * @param {(evt: {data: FavoritesData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData (cb) {
        return this.dataService.onData(cb)
    }

    /**
     * @param {(evt: {data: FavoritesConfig, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onConfig (cb) {
        return this.configService.onData(cb)
    }

    /**
     * Update the in-memory data immediate and persist.
     * Any state changes will be broadcast to consumers synchronously
     * @internal
     */
    toggleExpansion () {
        this.configService.update(old => {
            if (old.expansion === 'expanded') {
                return { ...old, expansion: /** @type {const} */('collapsed') }
            } else {
                return { ...old, expansion: /** @type {const} */('expanded') }
            }
        })
    }

    /**
     * @param {FavoritesData} data
     * @param {string} id - entity id to move
     * @param {number} targetIndex - target index
     * @internal
     */
    setFavoritesOrder (data, id, targetIndex) {
        // update in memory instantly - this will broadcast changes to all listeners
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.dataService.update((_old) => {
            return data
        })

        // then let the native side know about it
        this.ntp.messaging.notify('favorites_move', {
            id,
            targetIndex
        })
    }

    /**
     * @param {string} id - entity id
     * @internal
     */
    openContextMenu (id) {
        // let the native side know too
        this.ntp.messaging.notify('favorites_openContextMenu', { id })
    }

    /**
     * @internal
     */
    add () {
        this.ntp.messaging.notify('favorites_add')
    }
}
