/**
 * @typedef {import("../../../../types/new-tab.js").PrivacyStatsData} PrivacyStatsData
 * @typedef {import("../../../../types/new-tab.js").StatsConfig} StatsConfig
 */
import { Service } from '../service.js'

/**
 * ## Requests:
 * - {@link "NewTab Messages".StatsGetDataRequest `stats_getData`}
 *   - Used to fetch the initial data (during the first render)
 *   - returns {@link "NewTab Messages".PrivacyStatsData}
 *
 * - {@link "NewTab Messages".StatsGetDataRequest `stats_getConfig`}
 *   - Used to fetch the initial config data (eg: expanded vs collapsed)
 *   - returns {@link "NewTab Messages".StatsConfig}
 *
 * ## Subscriptions:
 * - {@link "NewTab Messages".StatsOnDataUpdateSubscription `stats_onDataUpdate`}.
 *   - The tracker/company data used in the feed.
 *   - returns {@link "NewTab Messages".PrivacyStatsData}
 * - {@link "NewTab Messages".StatsOnDataUpdateSubscription `stats_onConfigUpdate`}.
 *   - The widget config
 *   - returns {@link "NewTab Messages".StatsConfig}
 *
 * ## Notifications:
 * - {@link "NewTab Messages".StatsSetConfigNotification `stats_setConfig`}
 *   - Sent when the user toggles the expansion of the stats
 *   - sends {@link "NewTab Messages".StatsConfig}
 *
 * ## Examples:
 * The following examples show the data types in JSON format
 * <details open>
 * <summary>Show JSON examples 📝</summary>
 *
 * ```js
 * [[include:special-pages/messages/new-tab/examples/stats.js]]
 * ```
 * </details>
 */
export class PrivacyStatsService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor (ntp) {
        /** @type {Service<PrivacyStatsData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('stats_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('stats_onDataUpdate', cb)
        })

        /** @type {Service<StatsConfig>} */
        this.configService = new Service({
            initial: () => ntp.messaging.request('stats_getConfig'),
            subscribe: (cb) => ntp.messaging.subscribe('stats_onConfigUpdate', cb),
            persist: (data) => ntp.messaging.notify('stats_setConfig', data)
        })
    }

    /**
     * @returns {Promise<{data: PrivacyStatsData; config: StatsConfig}>}
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
     * @param {(evt: {data: PrivacyStatsData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData (cb) {
        return this.dataService.onData(cb)
    }

    /**
     * @param {(evt: {data: StatsConfig, source: 'manual' | 'subscription'}) => void} cb
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
                return { expansion: /** @type {const} */('collapsed') }
            } else {
                return { expansion: /** @type {const} */('expanded') }
            }
        })
    }
}
