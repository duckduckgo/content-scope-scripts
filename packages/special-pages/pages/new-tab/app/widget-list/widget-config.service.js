/**
 * @typedef {import("../../../../types/new-tab.js").WidgetConfigs} WidgetConfigs
 */
import { Service } from '../service.js'

/**
 * ## InitialSetup:
 *
 * - Data for widgets should be provided as part of the {@link "NewTab Messages".InitialSetupResponse `initialSetup`} response.
 * - The following keys should be added (also see the example below)
 *   - `widgets`: {@link "NewTab Messages".Widgets}
 *   - `widgetConfigs`: {@link "NewTab Messages".WidgetConfigs}
 *
 * ## Subscriptions:
 * - {@link "NewTab Messages".WidgetsOnConfigUpdatedSubscription `widgets_onConfigUpdated`}
 * - returns {@link "NewTab Messages".WidgetConfigs}.
 *
 *
 * ## Notifications:
 * - {@link "NewTab Messages".WidgetsOnConfigUpdatedSubscription `widgets_setConfig`}
 * - sends {@link "NewTab Messages".WidgetConfigs}
 *
 *   If the user toggles the visibility of a section in the frontend, then the entire structure is sent to the
 *   native side.
 *
 * ## Examples:
 * The following examples show the raw JSON payloads
 * <details open>
 * <summary>Show JSON examples 📝</summary>
 *
 * ```js
 * [[include:packages/special-pages/messages/new-tab/examples/widgets.js]]
 * ```
 * </details>
 */
export class WidgetConfigService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed
     * @param {WidgetConfigs} initialConfig
     * @internal
     */
    constructor (ntp, initialConfig) {
        /**
         * @type {Service<WidgetConfigs>}
         * @internal
         */
        this.service = new Service({
            subscribe: (cb) => ntp.messaging.subscribe('widgets_onConfigUpdated', cb),
            persist: (data) => ntp.messaging.notify('widgets_setConfig', data)
        }, initialConfig)
    }

    /**
     * @param {(evt: {data: WidgetConfigs, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData (cb) {
        return this.service.onData(cb)
    }

    /**
     * Set the visibility of a widget.
     *
     * Note: This will persist
     *
     * @param {string} id - the widget ID to toggle.
     * @internal
     */
    toggleVisibility (id) {
        this.service.update((old) => {
            return old.map(widgetConfigItem => {
                if (widgetConfigItem.id === id) {
                    const alt = widgetConfigItem.visibility === 'visible'
                        ? /** @type {const} */('hidden')
                        : /** @type {const} */('visible')
                    return { ...widgetConfigItem, visibility: alt }
                }
                return widgetConfigItem
            })
        })
    }
}
