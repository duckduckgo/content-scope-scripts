/**
 * @typedef {import("../../types/new-tab.js").WidgetConfigs} WidgetConfigs
 * @typedef {WidgetConfigs[number]} WidgetConfigItem
 */
import { Service } from '../service.js';

/**
 * Widget types that support multiple instances
 */
export const MULTI_INSTANCE_WIDGETS = /** @type {const} */ (['weather', 'news', 'stock']);

/**
 * @param {string} id
 * @returns {id is typeof MULTI_INSTANCE_WIDGETS[number]}
 */
export function isMultiInstanceWidget(id) {
    return MULTI_INSTANCE_WIDGETS.includes(/** @type {any} */ (id));
}

/**
 * Get default config values for a widget type.
 * New instances start with null values to indicate unconfigured state.
 * @param {typeof MULTI_INSTANCE_WIDGETS[number]} widgetType
 * @returns {Partial<WidgetConfigItem>}
 */
function getDefaultConfigForWidget(widgetType) {
    switch (widgetType) {
        case 'weather':
            return { location: null, temperatureUnit: 'fahrenheit', expansion: 'expanded' };
        case 'news':
            return { query: null, expansion: 'expanded' };
        case 'stock':
            return { symbol: null, expansion: 'expanded' };
        default:
            return {};
    }
}

export class WidgetConfigService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed
     * @param {WidgetConfigs} initialConfig
     * @internal
     */
    constructor(ntp, initialConfig) {
        /**
         * @type {Service<WidgetConfigs>}
         * @internal
         */
        this.service = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('widgets_onConfigUpdated', cb),
                persist: (data) => ntp.messaging.notify('widgets_setConfig', data),
            },
            initialConfig,
        );
    }

    /**
     * @param {(evt: {data: WidgetConfigs, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.service.onData(cb);
    }

    /**
     * Set the visibility of a widget.
     *
     * Note: This will persist
     *
     * @param {string} id - the widget ID to toggle.
     * @param {string} [instanceId] - optional instance ID for multi-instance widgets
     * @internal
     */
    toggleVisibility(id, instanceId) {
        this.service.update((old) => {
            return old.map((widgetConfigItem) => {
                // For multi-instance widgets, match by instanceId
                if (instanceId && 'instanceId' in widgetConfigItem && widgetConfigItem.instanceId === instanceId) {
                    const alt =
                        widgetConfigItem.visibility === 'visible' ? /** @type {const} */ ('hidden') : /** @type {const} */ ('visible');
                    return { ...widgetConfigItem, visibility: alt };
                }
                // For non-multi-instance widgets, match by id
                if (!instanceId && widgetConfigItem.id === id) {
                    const alt =
                        widgetConfigItem.visibility === 'visible' ? /** @type {const} */ ('hidden') : /** @type {const} */ ('visible');
                    return { ...widgetConfigItem, visibility: alt };
                }
                return widgetConfigItem;
            });
        });
    }

    /**
     * Add a new instance of a multi-instance widget
     *
     * @param {typeof MULTI_INSTANCE_WIDGETS[number]} widgetType
     * @returns {string} The instanceId of the new widget
     * @internal
     */
    addInstance(widgetType) {
        const instanceId = crypto.randomUUID();
        const defaults = getDefaultConfigForWidget(widgetType);
        this.service.update((old) => [
            ...old,
            /** @type {WidgetConfigItem} */ ({
                id: widgetType,
                instanceId,
                visibility: /** @type {const} */ ('visible'),
                ...defaults,
            }),
        ]);
        return instanceId;
    }

    /**
     * Remove a widget instance by its instanceId
     *
     * @param {string} instanceId
     * @internal
     */
    removeInstance(instanceId) {
        this.service.update((old) => old.filter((config) => !('instanceId' in config) || config.instanceId !== instanceId));
    }

    /**
     * Update the configuration of a specific widget instance
     *
     * @param {string} instanceId
     * @param {Partial<WidgetConfigItem>} updates
     * @internal
     */
    updateInstanceConfig(instanceId, updates) {
        this.service.update((old) =>
            old.map((config) =>
                'instanceId' in config && config.instanceId === instanceId
                    ? /** @type {WidgetConfigItem} */ ({ ...config, ...updates })
                    : config,
            ),
        );
    }

    /**
     * Reorder widgets to a new order
     *
     * @param {WidgetConfigs} newOrder
     * @internal
     */
    reorderWidgets(newOrder) {
        this.service.update(() => newOrder);
    }

    /**
     * Get the configuration for a specific instance
     *
     * @param {string} instanceId
     * @returns {WidgetConfigItem | undefined}
     * @internal
     */
    getConfigForInstance(instanceId) {
        const data = this.service.data;
        if (!data) return undefined;
        return data.find((config) => 'instanceId' in config && config.instanceId === instanceId);
    }
}
