import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';

/**
 * @import {SettingsQuerySource, } from "../../settings.service.js"
 */

/**
 * @typedef {{
 *   term: string | null,
 *   source: SettingsQuerySource,
 * }} QueryState - this is the value the entire application can read/observe
 */

/**
 * @typedef {{kind: 'reset'}
 *  | { kind: 'search-by-term', value: string }
 *  | { kind: 'search-by-domain', value: string }
 *  | { kind: 'search-by-range', value: string }} Action
 */

const QueryContext = createContext(
    /** @type {import('@preact/signals').ReadonlySignal<QueryState>} */ (
        signal({
            term: /** @type {string|null} */ (null),
            source: /** @type {SettingsQuerySource} */ ('initial'),
        })
    ),
);

const QueryDispatch = createContext(
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
 * @param {import('../../settings.service.js').SettingsQuery} [props.query] - The initial search term for the context.
 */
export function QueryProvider({ children, query = { term: '', source: 'initial' } }) {
    const initial = {
        term: query.term,
        source: /** @type {SettingsQuerySource} */ ('initial'),
    };
    const queryState = useSignal(initial);

    /**
     * All actions that can alter the query state come through here
     * @param {Action} action
     */
    function dispatch(action) {
        queryState.value = (() => {
            switch (action.kind) {
                case 'reset': {
                    return { term: '', source: /** @type {const} */ ('auto') };
                }
                case 'search-by-term': {
                    return { term: action.value, source: /** @type {const} */ ('user') };
                }
                default:
                    return { term: '', source: /** @type {const} */ ('auto') };
            }
        })();
    }

    const dispatcher = useCallback(dispatch, [queryState]);

    return (
        <QueryContext.Provider value={queryState}>
            <QueryDispatch.Provider value={dispatcher}>{children}</QueryDispatch.Provider>
        </QueryContext.Provider>
    );
}

/**
 * A custom hook to access the SearchContext.
 */
export function useQueryContext() {
    return useContext(QueryContext);
}

/**
 * A custom hook to access the SearchContext.
 */
export function useQueryDispatch() {
    return useContext(QueryDispatch);
}
