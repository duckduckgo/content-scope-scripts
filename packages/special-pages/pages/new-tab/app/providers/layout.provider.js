import { createContext, h } from 'preact'

export const LayoutContext = createContext({
    /** @type {import('../../../../types/new-tab').WidgetProperties[]} */
    widgets: []
})

export const LayoutDispatchContext = createContext({
    dispatch: null
})

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {import('../../../../types/new-tab').LayoutConfiguration} props.layout
 */
export function LayoutProvider (props) {
    return (
        <LayoutContext.Provider value={props.layout}>
            {props.children}
        </LayoutContext.Provider>
    )
}
