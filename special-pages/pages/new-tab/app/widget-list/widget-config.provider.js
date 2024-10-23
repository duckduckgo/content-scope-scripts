import { createContext, h } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'

/**
 * @typedef {import('../../../../types/new-tab.js').WidgetConfigs} WidgetConfigs
 * @typedef {import('../../../../types/new-tab.js').Widgets} Widgets
 * @typedef {import("../../../../types/new-tab.js").WidgetConfigItem} WidgetConfigItem
 * @typedef {import("./widget-config.service.js").WidgetConfigService} WidgetConfigAPI
 */

export const WidgetConfigContext = createContext({
    /** @type {Widgets} */
    widgets: [],

    /** @type {WidgetConfigItem[]} */
    widgetConfigItems: [],

    /** @type {(id:string) => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggle: (_id) => {

    }
})

export const WidgetConfigDispatchContext = createContext({
    dispatch: null
})

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {WidgetConfigItem[]} props.widgetConfigs - the initial config data
 * @param {Widgets} props.widgets - the initial widget list
 * @param {WidgetConfigAPI} props.api - the stateful API manager
 */
export function WidgetConfigProvider (props) {
    const [data, setData] = useState(props.widgetConfigs)

    // todo: should we just useSyncExternalStore here?
    useEffect(() => {
        const unsub = props.api.onData((widgetConfig) => {
            setData(widgetConfig.data)
        })
        return () => unsub()
    }, [props.api])

    /**
     * @param {string} id
     */
    function toggle (id) {
        props.api.toggleVisibility(id)
    }

    return (
        <WidgetConfigContext.Provider value={{
            // this field is static for the lifespan of the page
            widgets: props.widgets,
            // this will be updated via subscriptions
            widgetConfigItems: data || [],
            toggle
        }}>
            {props.children}
        </WidgetConfigContext.Provider>
    )
}

const WidgetVisibilityContext = createContext({
    visibility: /** @type {WidgetConfigItem['visibility']} */('visible'),
    id: /** @type {WidgetConfigItem['id']} */(''),
    /** @type {(id: string) => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggle: (_id) => {}
})

export function useVisibility () {
    return useContext(WidgetVisibilityContext)
}

/**
 * This wraps each widget and gives
 * @param {object} props
 * @param {WidgetConfigItem['id']} props.id - the current id key used for storage
 * @param {WidgetConfigItem['visibility']} props.visibility - the current id key used for storage
 * @param {import("preact").ComponentChild} props.children
 */
export function WidgetVisibilityProvider (props) {
    const { toggle } = useContext(WidgetConfigContext)

    return <WidgetVisibilityContext.Provider value={{
        visibility: props.visibility,
        id: props.id,
        toggle
    }}>
        <div style={{ viewTransitionName: `widget-${props.id}` }}>
            {props.children}
        </div>
    </WidgetVisibilityContext.Provider>
}
