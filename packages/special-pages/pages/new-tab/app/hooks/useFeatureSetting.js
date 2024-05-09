import { h, createContext } from 'preact'
import { useCallback, useState } from 'preact/hooks'
const STATE_HIDING = 'hiding'
const STATE_SHOWING = 'showing'
const DEFAULT = STATE_SHOWING

/**
 * Adding our own wrapper around localStorage access here to prevent too much
 * coupling to any SERP implementations.
 *
 * Please see https://app.asana.com/0/69071770703008/1203911786029263/f
 */
const localStorageAPI = {
    current (key, defaultValue = DEFAULT) {
        try {
            const value = localStorage.getItem(key)
            const parsed = value && JSON.parse(value)
            if (parsed === true) {
                return STATE_HIDING
            }
            return defaultValue
        } catch (e) {
            console.warn('could not access persisted state', e.message)
            return defaultValue
        }
    },
    toggle (key, defaultValue = DEFAULT) {
        const next = this.current(key) === STATE_SHOWING ? STATE_HIDING : STATE_SHOWING
        try {
            localStorageAPI.setValue(key, next)
            return next
        } catch (e) {
            console.warn('could not switch state values', e.message)
            return defaultValue
        }
    },
    setValue (key, value) {
        try {
            if (value === DEFAULT) {
                localStorage.removeItem(key)
            }
            if (value === STATE_HIDING) {
                localStorage.setItem(key, JSON.stringify(true))
            }
        } catch (e) {
            console.warn('could not set value', key, value)
        }
    }
}

/**
 * A custom hook for abstracting how/where any UI settings are saved
 * @param {string} key - the localStorage key used
 * @param {string} [initial] - the optional state to begin
 * @returns {{
 *    state: 'hiding' | 'showing',
 *    toggle: () => any
 * }}
 */
export function useStorageValue (key, initial = DEFAULT) {
    // if the initial state is 'hiding' - we need to store it
    if (initial !== DEFAULT) {
        localStorageAPI.setValue(key, initial)
    }

    // initial state is just whatever is in localStorage, or the default
    const [state, setState] = useState(() => localStorageAPI.current(key))

    // expose a toggle function that calls our internal api
    const toggle = useCallback(() => {
        setState(() => localStorageAPI.toggle(key))
    }, [key])

    if (state !== 'hiding' && state !== 'showing') throw new Error('useStorageValue is missing')

    return {
        state,
        toggle
    }
}

export const VisibilityContext = createContext({
    /** @type {'hiding' | 'showing'} */
    state: 'hiding',
    /** @type {() => any} */
    toggle: () => {
        throw new Error('todo: VisibilityContext.toggle')
    }
})

/**
 * @param {object} props
 * @param {string} props.storageKey - the key used for storage
 * @param {import("preact").ComponentChild} props.children
 */
export function VisibilityProvider (props) {
    const storage = useStorageValue(props.storageKey)
    return <VisibilityContext.Provider value={storage}>{props.children}</VisibilityContext.Provider>
}
