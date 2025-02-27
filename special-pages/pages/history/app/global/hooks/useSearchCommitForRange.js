import { useHistoryServiceDispatch } from '../Providers/HistoryServiceProvider.js';
import { useComputed, useSignalEffect } from '@preact/signals';
import { useQueryContext } from '../Providers/QueryProvider.js';

/**
 * Synchronizes the `derivedRange` signal with the browser's URL and issues a
 * 'search-commit'. This allows any part of the application to change the range and
 * have it synchronised to the URL + trigger a search
 */
export function useSearchCommitForRange() {
    const dispatch = useHistoryServiceDispatch();
    const query = useQueryContext();
    const derivedRange = useComputed(() => {
        return query.value.range;
    });

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
