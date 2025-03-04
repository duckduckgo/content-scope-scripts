import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';

/**
 * @typedef {import('../../../types/history.ts').Range} Range
 * @typedef {import('../../../types/history.ts').RangeId} RangeId
 * @typedef {{
 *   term: string | null,
 *   range: RangeId | null,
 *   domain: string | null,
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
            range: /** @type {RangeId|null} */ (null),
            domain: /** @type {string|null} */ (null),
        })
    ),
);

const QueryDispatch = createContext(
    /** @type {(a: Action) => void} */ (
        (action) => {
            throw new Error('missing QueryDispatch');
        }
    ),
);

/**
 * A provider for the global state related to the current query. It provides read-only access
 *
 * @param {Object} props - The props object for the component.
 * @param {import('preact').ComponentChild} props.children - The child components wrapped within the provider.
 * @param {import('../../../types/history.ts').QueryKind} [props.query=''] - The initial search term for the context.
 */
export function QueryProvider({ children, query = { term: '' } }) {
    const initial = {
        term: 'term' in query ? query.term : null,
        range: 'range' in query ? query.range : null,
        domain: 'domain' in query ? query.domain : null,
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
                    return { term: '', domain: null, range: null };
                }
                case 'search-by-domain': {
                    return { term: null, domain: action.value, range: null };
                }
                case 'search-by-range': {
                    return { term: null, domain: null, range: /** @type {RangeId} */ (action.value) };
                }
                case 'search-by-term': {
                    return { term: action.value, domain: null, range: null };
                }
                default:
                    return { term: '', domain: null, range: null };
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
