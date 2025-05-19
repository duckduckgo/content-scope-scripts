import { useSettings } from '../../types.js';
import { useComputed, useSignalEffect } from '@preact/signals';
import { useQueryContext, useQueryDispatch } from '../Providers/QueryProvider.js';
import { useNavContext } from '../Providers/NavProvider.js';
import { useEffect } from 'preact/hooks';

/**
 * Updates the URL with the latest search term (if present) and dispatches a custom event with the updated query parameters.
 * Debounces the updates based on the `settings.typingDebounce` value to avoid frequent URL state changes during typing.
 *
 * This hook uses a signal effect to listen for changes in the `derivedTerm` and updates the browser's URL accordingly, with debounce support.
 * It dispatches an `EVENT_SEARCH_COMMIT` event to notify other components or parts of the application about the updated search parameters.
 *
 */
export function useURLReflection() {
    const settings = useSettings();
    const query = useQueryContext();
    const dispatch = useQueryDispatch();
    const nav = useNavContext();
    const navId = useComputed(() => nav.value.id);

    useEffect(() => {
        return navId.subscribe((x) => {
            const url = new URL(window.location.href);
            url.pathname = x;
            url.searchParams.delete('search');
            window.history.replaceState(null, '', url.toString());
            dispatch({ kind: 'reset' });
        });
    }, [nav, navId]);

    useSignalEffect(() => {
        let timer;
        let count = 0;
        const unsubscribe = query.subscribe((nextValue) => {
            if (count === 0) return (count += 1);
            clearTimeout(timer);
            if (nextValue.term !== null) {
                const term = nextValue.term;
                timer = setTimeout(() => {
                    const url = new URL(window.location.href);

                    url.searchParams.set('search', term);

                    if (term.trim() === '') {
                        url.searchParams.delete('search');
                    }

                    window.history.replaceState(null, '', url.toString());
                }, settings.urlDebounce);
            }
            return null;
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    });
}
