import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';

/**
 * @import {SettingsQuerySource, } from "../../settings.service.js"
 */

/**
 * @typedef {{
 *   pathname: string,
 * }} NavState - this is the value the entire application can read/observe
 */

/**
 * @typedef {{ kind: 'nav', value: string }} Action
 */

const NavContext = createContext(
    /** @type {import('@preact/signals').ReadonlySignal<NavState>} */ (
        signal({
            pathname: /** @type {string} */ ('/'),
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
 * @param {string} props.pathname - The initial search term for the context.
 */
export function NavProvider({ children, pathname }) {
    /** @type {NavState} */
    const initial = {
        pathname,
    };
    const navState = useSignal(initial);

    /**
     * All actions that can alter the query state come through here
     * @param {Action} action
     */
    function dispatch(action) {
        navState.value = (() => {
            switch (action.kind) {
                case 'nav': {
                    return { pathname: action.value };
                }
                default:
                    return navState.value;
            }
        })();
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
