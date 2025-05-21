import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';

/**
 * @import {SettingsQuerySource, } from "../../settings.service.js"
 */

/**
 * @typedef {{
 *   id: string | 'unknown',
 * }} NavState - this is the value the entire application can read/observe
 */

/**
 * @typedef {{ kind: 'nav', id: string }} Action
 */

const NavContext = createContext(
    /** @type {import('@preact/signals').ReadonlySignal<NavState>} */ (
        signal({
            id: 'unknown',
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
 * @param {string} props.initialId - The initial search term for the context.
 */
export function NavProvider({ children, initialId }) {
    /** @type {NavState} */
    const initial = {
        id: initialId,
    };
    const navState = useSignal(initial);

    /**
     * All actions that can alter the query state come through here
     * @param {Action} action
     */
    function dispatch(action) {
        const nextState = (() => {
            switch (action.kind) {
                case 'nav': {
                    return { id: action.id };
                }
                default:
                    return navState.value;
            }
        })();
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
 * @return {string}
 */
export function pathnameToId(pathname, screens) {
    const match = screens.find((screen) => pathname.startsWith(`/${screen}`));
    if (match) return match;
    return screens[0];
}
