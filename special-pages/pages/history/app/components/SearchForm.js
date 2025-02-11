import styles from './Header.module.css';
import { createContext, h } from 'preact';
import { useSettings, useTypedTranslation } from '../types.js';
import { signal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useContext } from 'preact/hooks';
import { toRange } from '../history.service.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<string|null>} props.term
 */
export function SearchForm({ term }) {
    const { t } = useTypedTranslation();
    // const onInput = (event) => (term.value = event.currentTarget.value);
    return (
        <form role="search">
            <label>
                <span class="sr-only">{t('search_your_history')}</span>
                <input type="search" placeholder={t('search')} class={styles.searchInput} name="q" value={term.value || ''} />
            </label>
        </form>
    );
}

const SearchContext = createContext(
    signal({
        term: /** @type {string|null} */ (null),
        range: /** @type {import('../../types/history.js').Range|null} */ (null),
        domain: /** @type {string|null} */ (null),
    }),
);

/**
 * A custom hook to access the SearchContext.
 */
export function useSearchContext() {
    return useContext(SearchContext);
}

/**
 * A provider component that sets up the search context for its children. Allows access to and updates of the search term within the context.
 *
 * @param {Object} props - The props object for the component.
 * @param {import("preact").ComponentChild} props.children - The child components wrapped within the provider.
 * @param {import('../../types/history.js').QueryKind} [props.query=''] - The initial search term for the context.
 */
export function SearchProvider({ children, query = { term: '' } }) {
    const initial = {
        term: 'term' in query ? query.term : null,
        range: 'range' in query ? query.range : null,
        domain: 'domain' in query ? query.domain : null,
    };
    const searchState = useSignal(initial);
    const derivedTerm = useComputed(() => searchState.value.term);
    const derivedRange = useComputed(() => searchState.value.range);
    const settings = useSettings();
    // todo: domain search
    // const derivedDomain = useComputed(() => searchState.value.domain);
    useSignalEffect(() => {
        const controller = new AbortController();

        // @ts-expect-error - later
        window._accept = (v) => {
            searchState.value = { ...searchState.value, term: v };
        };

        document.addEventListener(
            'submit',
            (e) => {
                e.preventDefault();
                console.log('re-issue search plz', [searchState.value.term]);
            },
            { signal: controller.signal },
        );

        document.addEventListener(
            'input',
            (e) => {
                if (e.target instanceof HTMLInputElement && e.target.form instanceof HTMLFormElement) {
                    const data = new FormData(e.target.form);
                    const q = data.get('q')?.toString();
                    if (q === undefined) return console.log('missing q field');
                    searchState.value = {
                        term: q,
                        range: null,
                        domain: null,
                    };
                }
            },
            { signal: controller.signal },
        );

        document.addEventListener('click', (e) => {
            if (!(e.target instanceof HTMLElement)) return;
            const anchor = /** @type {HTMLAnchorElement|null} */ (e.target.closest('a[data-filter]'));
            if (anchor) {
                e.preventDefault();
                const range = toRange(anchor.dataset.filter);
                // todo: where should this rule live?
                if (range === 'all') {
                    searchState.value = {
                        term: '',
                        domain: null,
                        range: null,
                    };
                } else if (range) {
                    searchState.value = {
                        term: null,
                        domain: null,
                        range,
                    };
                }
            }
        });

        return () => {
            controller.abort();
        };
    });

    useSignalEffect(() => {
        let timer;
        let counter = 0;
        const sub = derivedTerm.subscribe((nextValue) => {
            if (counter === 0) {
                counter += 1;
                return;
            }
            clearTimeout(timer);
            timer = setTimeout(() => {
                console.log('next VALUE', [nextValue]);
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
                    // console.log('will dispatch it', url.searchParams.get('q'));
                    window.dispatchEvent(new CustomEvent('search-commit', { detail: { params: new URLSearchParams(url.searchParams) } }));
                }
            }, settings.typingDebounce);
        });

        return () => {
            sub();
            clearTimeout(timer);
        };
    });

    useSignalEffect(() => {
        let timer;
        let counter = 0;
        const sub = derivedRange.subscribe((nextRange) => {
            if (counter === 0) {
                counter += 1;
                return;
            }
            // window.dispatchEvent(new CustomEvent('search-commit', { detail: { params: new URLSearchParams(url.searchParams) } }));
            const url = new URL(window.location.href);

            url.searchParams.delete('q');
            url.searchParams.delete('range');

            if (nextRange !== null) {
                url.searchParams.set('range', nextRange);
                window.history.replaceState(null, '', url.toString());
                window.dispatchEvent(new CustomEvent('search-commit', { detail: { params: new URLSearchParams(url.searchParams) } }));
            }
        });

        return () => {
            sub();
            clearTimeout(timer);
        };
    });

    return <SearchContext.Provider value={searchState}>{children}</SearchContext.Provider>;
}
