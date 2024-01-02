import { createContext, h } from 'preact'
import { useCallback, useContext, useEffect, useReducer } from 'preact/hooks'
import { HOME_BUTTON_POSITION, PAGE_IDS } from './types'

import { pageDefinitions } from './page-data'

/**
 * @typedef {import("./types.js").GlobalState} GlobalState
 * @typedef {import("./types.js").GlobalEvents} GlobalEvents
 */

export const GlobalContext = createContext(/** @type {GlobalState} */({}))
export const GlobalDispatch = createContext(/** @type {import("preact/hooks").Dispatch<GlobalEvents>} */({}))

/**
 * All application state is managed here.
 *
 * @param {GlobalState} state
 * @param {GlobalEvents} action
 * @return {GlobalState}
 */
export function reducer (state, action) {
    switch (state.status.kind) {
    case 'idle': {
        switch (action.kind) {
        case 'dismiss': {
            return { ...state, status: { kind: 'final', target: 'none' } }
        }
        case 'dismiss-to-settings': {
            return { ...state, status: { kind: 'final', target: 'settings' } }
        }
        case 'update-system-value': {
            return { ...state, status: { kind: 'executing', action } }
        }
        case 'error-boundary': {
            return { ...state, status: { kind: 'fatal', action } }
        }
        case 'next': {
            const currentPageIndex = state.order.indexOf(state.activePage)
            const nextPageIndex = currentPageIndex + 1
            if (nextPageIndex < state.order.length) {
                return {
                    ...state,
                    activePage: state.order[nextPageIndex],
                    step: pageDefinitions[state.order[nextPageIndex]]
                }
            }
            return state
        }
        default:
            throw new Error('unreachable')
        }
    }
    case 'executing': {
        switch (action.kind) {
        case 'exec-complete': {
            if (state.step.kind === 'settings') {
                // only advance to another row if we're updating the current item.
                // this allows us to toggle items on/off even when the row is no longer the active one
                const currentRow = state.step.rows[state.step.active]
                const shouldAdvance = currentRow === action.id
                return {
                    ...state,
                    status: { kind: 'idle' },
                    step: {
                        // bump the step (show the next row)
                        ...state.step,
                        active: shouldAdvance ? state.step.active + 1 : state.step.active
                    },
                    values: {
                        ...state.values,
                        // store the updated value in global state
                        [action.id]: action.payload
                    }
                }
            }
            throw new Error('unimplemented')
        }
        case 'exec-error': {
            return {
                ...state,
                status: { kind: 'idle', error: action.message }
            }
        }
        default: throw new Error('unhandled ' + action.kind)
        }
    }
    }
    return state
}

/**
 * Provides navigation functionality for the application.
 * @param {Object} props - The properties for the NavigationProvider component.
 * @param {import("preact").ComponentChild} props.children - The children components.
 * @param {import("./messages.js").OnboardingMessages} props.messaging - The messaging object used for communication.
 * @param {import('./types').Step['id']} [props.firstPage]
 */
export function GlobalProvider ({ children, messaging, firstPage = 'welcome' }) {
    const [state, dispatch] = useReducer(reducer, {
        status: { kind: 'idle' },
        order: PAGE_IDS,
        step: pageDefinitions[firstPage],
        activePage: firstPage,
        values: {}
    })

    // use this proxy to observe all incoming events
    const proxy = useCallback((msg) => {
        dispatch(msg)
    }, [state])

    // handle *fatal* state (from error boundary)
    useEffect(() => {
        if (state.status.kind !== 'fatal') return
        const { error } = state.status.action
        messaging.reportPageException(error)
    }, [state.status.kind, messaging])

    // handle *final* state
    useEffect(() => {
        if (state.status.kind !== 'final') return
        if (state.status.target === 'settings') {
            messaging.dismissToSettings()
        }
        if (state.status.target === 'none') {
            messaging.dismissToAddressBar()
        }
    }, [state.status.kind, messaging])

    // handle 'update-system-value' messages from the UI
    useEffect(() => {
        if (state.status.kind !== 'executing') return
        if (state.status.action.kind !== 'update-system-value') throw new Error('only update-system-value is currently supported')

        /** @type {import('./types').UpdateSystemValueEvent} */
        const action = state.status.action

        handleSystemSettingUpdate(action, messaging)
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((/** @type {import('./types').SystemValue} */payload) => {
                dispatch({
                    kind: 'exec-complete',
                    id: action.id,
                    payload
                })
            })
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch((e) => {
                const message = e?.message || 'unknown error'
                dispatch({ kind: 'exec-error', id: action.id, message })
            })
    }, [state.status.kind, messaging])

    return (
        <GlobalContext.Provider value={state}>
            <GlobalDispatch.Provider value={proxy}>
                {children}
            </GlobalDispatch.Provider>
        </GlobalContext.Provider>
    )
}

/**
 * @param {import('./types').UpdateSystemValueEvent} action
 * @param {import("./messages").OnboardingMessages} messaging
 */
async function handleSystemSettingUpdate (action, messaging) {
    const { id, payload } = action
    switch (id) {
    case 'bookmarks': {
        messaging.setBookmarksBar(payload)
        return payload
    }
    case 'session-restore': {
        messaging.setSessionRestore(payload)
        return payload
    }
    case 'home-shortcut': {
        if (payload.enabled) {
            if (!('value' in payload)) throw new Error('invariant, home-shortcut requires a string value when enabled')
            if (!HOME_BUTTON_POSITION.includes(/** @type {any} */(payload.value))) throw new Error('invalid value for HomeButtonPosition ' + payload.value)
            messaging.setShowHomeButton({
                value: /** @type {import('./types.js').HomeButtonPosition} */(payload.value)
            })
        } else {
            // no-op when skipped...
        }
        return payload
    }
    case 'dock': {
        // todo: question this logic.
        // if a users presses 'skip' and we remove from the dock, can it actually be un-done? (eg: placed back?)
        if (!payload.enabled) {
            messaging.requestRemoveFromDock()
            return payload
        }
        return { enabled: true }
    }
    case 'import': {
        if (payload.enabled) {
            await messaging.requestImport()
            // enabled means we've launched a native UI, not that imports actually occurred
            // todo: can we support both? if a user presses cancel, should we detect and allow them to try again?
            return { enabled: true }
        }
        break
    }
    case 'default-browser': {
        if (payload.enabled) {
            // enabled means we've launched a native UI, not that we actually agreed
            // todo: can we support both? if a user presses cancel, should we detect and allow them to try again?
            await messaging.requestSetAsDefault()
            return { enabled: true }
        }
        break
    }
    }
    // await new Promise(resolve => setTimeout(resolve, 300))
    if ('value' in payload) {
        return { enabled: payload.enabled, value: payload.value }
    }
    return { enabled: payload.enabled }
}

export function useGlobalState () {
    return useContext(GlobalContext)
}

export function useGlobalDispatch () {
    return useContext(GlobalDispatch)
}
