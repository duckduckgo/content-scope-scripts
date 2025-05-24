import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';

/**
 * @import {SettingsQuerySource, } from "../../settings.service.js"
 */

/**
 * @typedef {{
 *   id: string,
 *   term: null,
 * } | {
 *   id: null,
 *   term: string,
 * }} NavState - this is the value the entire application can read/observe
 */

/**
 * @typedef {{ kind: 'nav', id: string }
 * | {kind:"search"; term: string}
 * } Action
 */

const NavContext = createContext(
    /** @type {import('@preact/signals').ReadonlySignal<NavState>} */ (
        signal({
            id: 'unknown',
            term: null,
        })
    ),
);

const NavDispatch = createContext(
    /** @type {(a: Action) => void} */ (
        (_) => {
            throw new Error('missing QueryDispatch');
        }
    ),
);

/**
 * A provider for the global state related to the current query. It provides read-only access
 *
 * @param {Object} props - The props object for the component.
 * @param {import('preact').ComponentChild} props.children - The child components wrapped within the provider.
 * @param {NavState} props.initial - The initial search term for the context.
 */
export function NavProvider({ children, initial }) {
    const navState = useSignal(initial);

    /**
     * All actions that can alter the query state come through here
     * @param {Action} action
     */
    function dispatch(action) {
        const nextState = (() => {
            switch (action.kind) {
                case 'nav': {
                    return {
                        id: action.id,
                        term: null,
                    };
                }
                case 'search': {
                    return {
                        id: null,
                        term: action.term,
                    };
                }
                default:
                    console.warn('NavProvider did not handle', action);
                    return navState.value;
            }
        })();
        // console.log('next nav state', nextState);
        navState.value = nextState;
    }

    const dispatcher = useCallback(dispatch, [navState]);

    return (
        <NavContext.Provider value={navState}>
            <NavDispatch.Provider value={dispatcher}>{children}</NavDispatch.Provider>
        </NavContext.Provider>
    );
}

/**
 * A custom hook to access the SearchContext.
 */
export function useNavContext() {
    return useContext(NavContext);
}

/**
 * A custom hook to access the SearchContext.
 */
export function useNavDispatch() {
    return useContext(NavDispatch);
}

/**
 * @param {string} pathname
 * @param {string[]} screens
 * @param {URLSearchParams} params
 * @return {{id: null, term: string} | {id: string; term: null}}
 */
export function pathnameToState(pathname, params, screens) {
    const match = screens.find((screen) => pathname.startsWith(`/${screen}`));
    const term = params.get('search') || ''.trim();
    if (term.length > 0) return { term, id: null };
    if (match) return { id: match, term: null };
    return { id: screens[0], term: null };
}
