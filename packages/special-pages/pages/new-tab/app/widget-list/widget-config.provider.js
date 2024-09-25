import { createContext, h } from 'preact'
import { useCallback, useContext, useEffect, useState } from 'preact/hooks'

/**
 * @typedef {import('../../../../types/new-tab.js').WidgetConfig} WidgetConfig
 * @typedef {import('../../../../types/new-tab.js').WidgetList} WidgetList
 * @typedef {import("../../../../types/new-tab.js").WidgetConfigItem} WidgetConfigItem
 * @typedef {import("./widget-config.js").WidgetConfigAPI} WidgetConfigAPI
 */

export const WidgetConfigContext = createContext({
    /** @type {WidgetList} */
    widgets: [],

    /** @type {WidgetConfig} */
    widgetConfig: [],

    /** @type {(name:string) => void} */
    hide: () => {

    },

    /** @type {(name:string) => void} */
    show: () => {

    }
})

export const WidgetConfigDispatchContext = createContext({
    dispatch: null
})

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {WidgetConfig} props.widgetConfig - the initial config data
 * @param {WidgetList} props.widgets - the initial widget list
 * @param {WidgetConfigAPI} props.api - the stateful API manager
 */
export function WidgetConfigProvider (props) {
    const [data, setData] = useState(props.widgetConfig)

    useEffect(() => {
        const unsub = props.api.onUpdate((widgetConfig) => {
            setData(widgetConfig)
        })
        return () => unsub()
    }, [props.api])

    /**
     * @param {string} name
     */
    function hide (name) {
        console.log('will hide', name)
        props.api.hide(name)
    }

    /**
     * @param {string} name
     */
    function show (name) {
        console.log('will show', name)
        props.api.show(name)
    }

    return (
        <WidgetConfigContext.Provider value={{
            // this field is static for the lifespan of the page
            widgets: props.widgets,
            // this will be updated via subscriptions
            widgetConfig: data,
            hide,
            show
        }}>
            {props.children}
        </WidgetConfigContext.Provider>
    )
}

const WidgetVisibilityContext = createContext({
    visibility: /** @type {WidgetConfigItem['visibility']} */('visible'),
    id: /** @type {WidgetConfigItem['id']} */(''),
    toggle: () => {

    }
})

export function useVisibility () {
    return useContext(WidgetVisibilityContext)
}

/**
 * @param {object} props
 * @param {WidgetConfigItem['id']} props.id - the current id key used for storage
 * @param {WidgetConfigItem['visibility']} props.visibility - the current id key used for storage
 * @param {import("preact").ComponentChild} props.children
 */
export function WidgetVisibilityProvider (props) {
    const { widgetConfig, show, hide } = useContext(WidgetConfigContext)

    const toggle = useCallback(() => {
        const matching = widgetConfig.find(x => x.id === props.id)
        if (matching?.visibility === 'visible') {
            hide(props.id)
        } else {
            show(props.id)
        }
    }, [props.id, widgetConfig])

    return <WidgetVisibilityContext.Provider value={{
        visibility: props.visibility,
        id: props.id,
        toggle
    }}>{props.children}</WidgetVisibilityContext.Provider>
}
