import { createContext, h } from 'preact';
import { useContext } from 'preact/hooks';
import { effect, signal, useComputed, useSignal } from '@preact/signals';

/**
 * @typedef {import('../../types/new-tab.js').WidgetConfigs} WidgetConfigs
 * @typedef {import('../../types/new-tab.js').Widgets} Widgets
 * @typedef {WidgetConfigs[number]} WidgetConfigItem
 * @typedef {import("./widget-config.service.js").WidgetConfigService} WidgetConfigAPI
 * @typedef {'weather' | 'news' | 'stock'} MultiInstanceWidgetType
 */

export const WidgetConfigContext = createContext({
    /** @type {Widgets} */
    widgets: [],

    /** @type {Record<string, {factory: (instanceId?: string) => import("preact").ComponentChild}>} */
    entryPoints: {},

    /**
     * A snapshot of the widget config as received at page load. Use this when you
     * don't need up-to-date values.
     * @type {WidgetConfigItem[]}
     */
    widgetConfigItems: [],
    /**
     * The live version of the data in 'widgetConfigItems' above. This represents the very
     * latest updates and can be subscribed to for reactive updates
     * @type {import("@preact/signals").Signal<WidgetConfigItem[]>}
     */
    currentValues: signal([]),

    /** @type {(id: string, instanceId?: string) => void} */
    toggle: (_id, _instanceId) => {},

    /** @type {(widgetType: MultiInstanceWidgetType) => string} */
    addInstance: (_widgetType) => '',

    /** @type {(instanceId: string) => void} */
    removeInstance: (_instanceId) => {},

    /** @type {(newOrder: WidgetConfigs) => void} */
    reorderWidgets: (_newOrder) => {},

    /** @type {(instanceId: string) => WidgetConfigItem | undefined} */
    getConfigForInstance: (_instanceId) => undefined,
});

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {WidgetConfigItem[]} props.widgetConfigs - the initial config data
 * @param {Record<string, {factory: (instanceId?: string) => import("preact").ComponentChild}>} props.entryPoints
 * @param {Widgets} props.widgets - the initial widget list
 * @param {WidgetConfigAPI} props.api - the stateful API manager
 */
export function WidgetConfigProvider(props) {
    const currentValues = useSignal(props.widgetConfigs);

    effect(() => {
        const unsub = props.api.onData((widgetConfig) => {
            currentValues.value = widgetConfig.data;
        });
        return () => unsub();
    });

    /**
     * @param {string} id
     * @param {string} [instanceId]
     */
    function toggle(id, instanceId) {
        props.api.toggleVisibility(id, instanceId);
    }

    /**
     * @param {MultiInstanceWidgetType} widgetType
     * @returns {string}
     */
    function addInstance(widgetType) {
        return props.api.addInstance(widgetType);
    }

    /**
     * @param {string} instanceId
     */
    function removeInstance(instanceId) {
        props.api.removeInstance(instanceId);
    }

    /**
     * @param {WidgetConfigs} newOrder
     */
    function reorderWidgets(newOrder) {
        props.api.reorderWidgets(newOrder);
    }

    /**
     * @param {string} instanceId
     * @returns {WidgetConfigItem | undefined}
     */
    function getConfigForInstance(instanceId) {
        return props.api.getConfigForInstance(instanceId);
    }

    return (
        <WidgetConfigContext.Provider
            value={{
                // this field is static for the lifespan of the page
                widgets: props.widgets,
                entryPoints: props.entryPoints,
                widgetConfigItems: props.widgetConfigs,
                currentValues,
                toggle,
                addInstance,
                removeInstance,
                reorderWidgets,
                getConfigForInstance,
            }}
        >
            {props.children}
        </WidgetConfigContext.Provider>
    );
}

const WidgetVisibilityContext = createContext({
    id: /** @type {WidgetConfigItem['id']} */ (''),
    /** @type {string | undefined} */
    instanceId: undefined,
    /** @type {(id: string, instanceId?: string) => void} */
    toggle: (_id, _instanceId) => {},
    /** @type {number} */
    index: -1,
    visibility: signal(/** @type {WidgetConfigItem['visibility']} */ ('visible')),
});

export function useVisibility() {
    return useContext(WidgetVisibilityContext);
}

/**
 * This wraps each widget and gives
 * @param {object} props
 * @param {WidgetConfigItem['id']} props.id - the current id key used for storage
 * @param {string} [props.instanceId] - the instance ID for multi-instance widgets
 * @param {number} props.index - the current id key used for storage
 * @param {import("preact").ComponentChild} props.children
 */
export function WidgetVisibilityProvider(props) {
    const { toggle, currentValues } = useContext(WidgetConfigContext);
    const visibility = useComputed(() => {
        let matchingConfig;
        if (props.instanceId) {
            // For multi-instance widgets, find by instanceId
            matchingConfig = currentValues.value.find((x) => 'instanceId' in x && x.instanceId === props.instanceId);
        } else {
            // For non-multi-instance widgets, find by id
            matchingConfig = currentValues.value.find((x) => x.id === props.id);
        }
        if (!matchingConfig)
            throw new Error('unreachable. Must find widget config via id: ' + props.id + ', instanceId: ' + props.instanceId);
        return matchingConfig.visibility;
    });

    return (
        <WidgetVisibilityContext.Provider
            value={{
                visibility,
                id: props.id,
                instanceId: props.instanceId,
                toggle,
                index: props.index,
            }}
        >
            {props.children}
        </WidgetVisibilityContext.Provider>
    );
}
