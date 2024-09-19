import { h, createContext } from 'preact'
import { useCallback, useState } from 'preact/hooks'

/**
 * A custom hook for abstracting how/where any UI settings are saved
 * @param {import('../../../../types/new-tab.js').WidgetProperties['visibility']} initial - the localStorage key used
 * @returns {{
 *    visibility: import('../../../../types/new-tab.js').WidgetProperties['visibility'],
 *    toggle: () => any
 * }}
 */
export function useStorageValue (initial) {
    // initial state is just whatever is given
    const [visibility, setState] = useState(initial)

    // expose a toggle function that calls our internal api
    const toggle = useCallback(() => {
        // setState(() => localStorageAPI.toggle(key))
        throw new Error('todo - implement toggle')
    }, [])

    return {
        visibility,
        toggle
    }
}

export const VisibilityContext = createContext({
    /** @type {import('../../../../types/new-tab.js').LayoutVisibility} */
    visibility: 'visible',
    /** @type {() => any} */
    toggle: () => {
        throw new Error('todo: VisibilityContext.toggle')
    }
})

/**
 * @param {object} props
 * @param {import('../../../../types/new-tab.js').WidgetProperties} props.state - the key used for storage
 * @param {import("preact").ComponentChild} props.children
 */
export function VisibilityProvider (props) {
    const storage = useStorageValue(props.state.visibility)
    return <VisibilityContext.Provider value={storage}>{props.children}</VisibilityContext.Provider>
}
