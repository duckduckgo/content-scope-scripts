import { createContext, h } from 'preact';
import { useContext } from 'preact/hooks';
import { signal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { usePlatformName, useSettings } from '../types.js';
import { toRange } from '../history.service.js';
import { EVENT_SEARCH_COMMIT } from '../constants.js';

/**
 * @typedef {import('../../types/history.js').Range} Range
 * @typedef {{
 *   term: string | null,
 *   range: Range | null,
 *   domain: string | null,
 * }} QueryState
 */

const QueryContext = createContext(
    signal(
        /** @type {QueryState} */ ({
            term: /** @type {string|null} */ (null),
            range: /** @type {import('../../types/history.ts').Range|null} */ (null),
            domain: /** @type {string|null} */ (null),
        }),
    ),
);

/**
 * A custom hook to access the SearchContext.
 */
export function useQueryContext() {
    return useContext(QueryContext);
}

/**
 * A provider component that sets up the search context for its children. Allows access to and updates of the search term within the context.
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
    const searchState = useSignal(initial);
    const derivedTerm = useComputed(() => searchState.value.term);
    const derivedRange = useComputed(() => {
        return /** @type {Range|null} */ (searchState.value.range);
    });
    const settings = useSettings();
    const platformName = usePlatformName();

    useClickHandlerForFilters(searchState);
    useInputHandler(searchState);
    useSearchShortcut(platformName);
    useFormSubmit();
    useURLReflection(derivedTerm, settings);
    useSearchCommitForRange(derivedRange);

    return <QueryContext.Provider value={searchState}>{children}</QueryContext.Provider>;
}

/**
 * Synchronizes the `derivedRange` signal with the browser's URL and dispatches
 * a custom `EVENT_SEARCH_COMMIT` event when the range changes.
 *
 * This effect updates the URL's search parameters to add or remove the `range` query parameter
 * based on the value of `derivedRange`. It handles the subscription to `derivedRange` and ensures
 * the URL reflects the latest state of the signal. Only subsequent changes (after the first signal
 * value) are processed to avoid re-initialization effects.
 *
 * @param {import('@preact/signals').ReadonlySignal<null | Range>} derivedRange - A readonly signal representing the range value.
 */
function useSearchCommitForRange(derivedRange) {
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
                window.dispatchEvent(new CustomEvent(EVENT_SEARCH_COMMIT, { detail: { params: new URLSearchParams(url.searchParams) } }));
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
 * @param {import('@preact/signals').Signal<null|string>} derivedTerm - A signal of the current search term to watch for changes.
 * @param {import('../Settings.js').Settings} settings - The settings for the behavior, including the debounce duration.
 */
function useURLReflection(derivedTerm, settings) {
    useSignalEffect(() => {
        let timer;
        let counter = 0;
        const unsubscribe = derivedTerm.subscribe((nextValue) => {
            if (counter === 0) {
                counter += 1;
                return;
            }
            clearTimeout(timer);
            timer = setTimeout(() => {
                const url = new URL(window.location.href);

                url.searchParams.delete('q');
                url.searchParams.delete('range');

                if (nextValue) {
                    url.searchParams.set('q', nextValue);
                    window.history.replaceState(null, '', url.toString());
                } else if (nextValue === '') {
                    window.history.replaceState(null, '', url.toString());
                }
                if (nextValue === null) {
                    /** no-op */
                } else {
                    window.dispatchEvent(
                        new CustomEvent(EVENT_SEARCH_COMMIT, { detail: { params: new URLSearchParams(url.searchParams) } }),
                    );
                }
            }, settings.typingDebounce);
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    });
}

/**
 * Handles the `submit` event on the document and prevents the default form submission behavior.
 *
 * This effect is used to intercept form submissions and extract the form data
 * for further processing or integration into the application's query state management.
 *
 * Currently, this functionality is not fully implemented. The intercepted form data
 * will need to be used to trigger or re-issue a search, but the specifics of that behavior
 * remain a TODO.
 */
function useFormSubmit() {
    useSignalEffect(() => {
        const submitHandler = (e) => {
            e.preventDefault();
            if (!e.target || !(e.target instanceof HTMLFormElement)) return;
            const formData = new FormData(e.target);
            console.log('todo: re-issue search here?', [formData.get('q')?.toString()]);
        };

        document.addEventListener('submit', submitHandler);
        return () => {
            document.removeEventListener('submit', submitHandler);
        };
    });
}

/**
 * Monitors clicks on filter links (`a[data-filter]`) and updates the `queryState` signal
 * with the appropriate range filter value extracted from the link's `data-filter` attribute.
 *
 * If a filter with `data-filter="all"` is clicked, it resets the `queryState` to its default values.
 * Otherwise, it updates the `range` field in `queryState` with the parsed value from the clicked filter.
 *
 * The click event is prevented to avoid default link navigation behavior.
 *
 * Cleans up the event listener when the effect is disposed.
 *
 * @param {import('@preact/signals').Signal<QueryState>} queryState - A signal representing the query state to update.
 */
function useClickHandlerForFilters(queryState) {
    useSignalEffect(() => {
        function clickHandler(e) {
            if (!(e.target instanceof HTMLElement)) return;
            const anchor = /** @type {HTMLAnchorElement|null} */ (e.target.closest('a[data-filter]'));
            if (anchor) {
                e.preventDefault();
                const range = toRange(anchor.dataset.filter);
                // todo: where should this rule live?
                if (range === 'all') {
                    queryState.value = {
                        term: '',
                        domain: null,
                        range: null,
                    };
                } else if (range) {
                    queryState.value = {
                        term: null,
                        domain: null,
                        range,
                    };
                }
            }
        }
        document.addEventListener('click', clickHandler);
        return () => {
            document.removeEventListener('click', clickHandler);
        };
    });
}

/**
 * Handles the `input` event on the document.
 *
 * When user input is detected on an `HTMLInputElement` within an `HTMLFormElement`,
 * it retrieves the form's data and updates the `queryState` signal with the new query term.
 *
 * This function modifies the `queryState` by setting the `term` to the value of the `q` field
 * from the form. The `range` and `domain` values are cleared (set to `null`).
 *
 * If the `q` field is missing in the form, a log message will indicate it as such.
 *
 * Resources are properly cleaned up when the effect is disposed (removes event listener).
 *
 * @param {import('@preact/signals').Signal<QueryState>} queryState - A signal representing the query state.
 */
function useInputHandler(queryState) {
    useSignalEffect(() => {
        function handler(e) {
            if (e.target instanceof HTMLInputElement && e.target.form instanceof HTMLFormElement) {
                const data = new FormData(e.target.form);
                const q = data.get('q')?.toString();
                if (q === undefined) return console.log('missing q field');
                queryState.value = {
                    term: q,
                    range: null,
                    domain: null,
                };
            }
        }
        document.addEventListener('input', handler);
        return () => {
            document.removeEventListener('input', handler);
        };
    });
}

/**
 * Listens for keyboard shortcuts to focus the search input.
 *
 * Handles platform-specific shortcuts for MacOS (Cmd+F) and Windows (Ctrl+F).
 * If the shortcut is triggered, it will prevent the default action and focus
 * on the first `input[type="search"]` element in the DOM, if available.
 *
 * @param {'macos' | 'windows'} platformName - Defines the current platform to handle the appropriate shortcut.
 */
function useSearchShortcut(platformName) {
    useSignalEffect(() => {
        const keydown = (e) => {
            const isMacOS = platformName === 'macos';
            const isFindShortcutMacOS = isMacOS && e.metaKey && e.key === 'f';
            const isFindShortcutWindows = !isMacOS && e.ctrlKey && e.key === 'f';

            if (isFindShortcutMacOS || isFindShortcutWindows) {
                e.preventDefault();
                const searchInput = /** @type {HTMLInputElement|null} */ (document.querySelector(`input[type="search"]`));
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };
        document.addEventListener('keydown', keydown);
        return () => {
            document.removeEventListener('keydown', keydown);
        };
    });
}
