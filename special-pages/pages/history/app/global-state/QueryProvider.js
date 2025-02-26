import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useSettings } from '../types.js';
import { useHistoryServiceDispatch } from './HistoryServiceProvider.js';

/**
 * @typedef {import('../../types/history.js').Range} Range
 * @typedef {{
 *   term: string | null,
 *   range: Range | null,
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
            range: /** @type {import('../../types/history.ts').Range|null} */ (null),
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
 * @param {import('../../types/history.ts').QueryKind} [props.query=''] - The initial search term for the context.
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
                    return { term: null, domain: null, range: /** @type {Range} */ (action.value) };
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

/**
 * Setup the side effects that should occur when the query changes
 */
export function useQueryEvents() {
    const queryState = useQueryContext();
    const settings = useSettings();
    const derivedRange = useComputed(() => {
        return /** @type {Range|null} */ (queryState.value.range);
    });

    /**
     * Publish query changes to the URL
     */
    useURLReflection(queryState, settings);
    /**
     * Convert query changes into searches
     */
    useSearchCommit(queryState, settings);
    /**
     * Convert query changes into searches
     */
    useSearchCommitForRange(derivedRange);
}

/**
 * Synchronizes the `derivedRange` signal with the browser's URL and issues a
 * 'search-commit'. This allows any part of the application to change the range and
 * have it synchronised to the URL + trigger a search
 *
 * @param {import('@preact/signals').ReadonlySignal<null | Range>} derivedRange - A readonly signal representing the range value.
 */
function useSearchCommitForRange(derivedRange) {
    const dispatch = useHistoryServiceDispatch();
    useSignalEffect(() => {
        let timer;
        let counter = 0;
        const sub = derivedRange.subscribe((nextRange) => {
            if (counter === 0) {
                counter += 1;
                return;
            }
            const url = new URL(window.location.href);

            url.searchParams.delete('q');
            url.searchParams.delete('range');

            if (nextRange !== null) {
                url.searchParams.set('range', nextRange);
                window.history.replaceState(null, '', url.toString());
                dispatch({ kind: 'search-commit', params: new URLSearchParams(url.searchParams) });
            }
        });

        return () => {
            sub();
            clearTimeout(timer);
        };
    });
}

/**
 * Updates the URL with the latest search term (if present) and dispatches a custom event with the updated query parameters.
 * Debounces the updates based on the `settings.typingDebounce` value to avoid frequent URL state changes during typing.
 *
 * This hook uses a signal effect to listen for changes in the `derivedTerm` and updates the browser's URL accordingly, with debounce support.
 * It dispatches an `EVENT_SEARCH_COMMIT` event to notify other components or parts of the application about the updated search parameters.
 *
 * @param {import('@preact/signals').Signal<QueryState>} queryState - A signal of the current search term to watch for changes.
 * @param {import('../Settings.js').Settings} settings - The settings for the behavior, including the debounce duration.
 */
function useURLReflection(queryState, settings) {
    useSignalEffect(() => {
        let timer;
        let count = 0;
        const unsubscribe = queryState.subscribe((nextValue) => {
            if (count === 0) return (count += 1);
            clearTimeout(timer);
            if (nextValue.term !== null) {
                const term = nextValue.term;
                timer = setTimeout(() => {
                    const url = new URL(window.location.href);

                    url.searchParams.set('q', term);
                    url.searchParams.delete('range');
                    url.searchParams.delete('domain');

                    if (term.trim() === '') {
                        url.searchParams.delete('q');
                    }

                    window.history.replaceState(null, '', url.toString());
                }, settings.urlDebounce);
            }
            if (nextValue.domain !== null) {
                const url = new URL(window.location.href);
                url.searchParams.set('domain', nextValue.domain);
                url.searchParams.delete('q');
                url.searchParams.delete('range');

                window.history.replaceState(null, '', url.toString());
            }
            return null;
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    });
}

/**
 * Updates the URL with the latest search term (if present) and dispatches a custom search commit event.
 * Utilizes a debounce mechanism to ensure the URL updates are not performed too often during typing.
 *
 * Workflow:
 * - Listens for changes in the `derivedTerm` signal.
 * - For the first signal emission (`counter === 0`), skips processing to avoid triggering on initial load.
 * - Debounces subsequent changes using `settings.typingDebounce`.
 * - If a non-null value is provided, constructs query parameters with the new term and dispatches
 *   an `EVENT_SEARCH_COMMIT` event with the updated parameters.
 * - If the value is `null`, no action is taken.
 *
 * @param {import('@preact/signals').Signal<QueryState>} queryState - A signal of the current search term to watch for changes.
 * @param {import('../Settings.js').Settings} settings - The settings for debounce behavior and other configurations.
 */
function useSearchCommit(queryState, settings) {
    const dispatch = useHistoryServiceDispatch();
    useSignalEffect(() => {
        let timer;
        let count = 0;
        const unsubscribe = queryState.subscribe((next) => {
            if (count === 0) return (count += 1);
            clearTimeout(timer);
            if (next.term !== null) {
                const term = next.term;
                timer = setTimeout(() => {
                    const params = new URLSearchParams();
                    params.set('q', term);
                    dispatch({ kind: 'search-commit', params });
                }, settings.typingDebounce);
            }
            if (next.domain !== null) {
                const params = new URLSearchParams();
                params.set('domain', next.domain);
                dispatch({ kind: 'search-commit', params });
            }
            return null;
        });
        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    });
}
