import { useEffect } from 'preact/hooks';
import { useSelected } from '../Providers/SelectionProvider.js';
import { useHistoryServiceDispatch, useResultsData } from '../Providers/HistoryServiceProvider.js';

/**
 * Support for context menu on entries. This needs to be aware of
 * selected regions so that it can either trigger a context menu
 * for a group, or a single item
 */
export function useContextMenuForEntries() {
    const selected = useSelected();
    const results = useResultsData();
    const dispatch = useHistoryServiceDispatch();

    useEffect(() => {
        function contextMenu(event) {
            const target = /** @type {HTMLElement|null} */ (event.target);
            if (!(target instanceof HTMLElement)) return;

            // only act on history entries
            const elem = target.closest('[data-history-entry]');
            if (!elem || !(elem instanceof HTMLElement)) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            const isSelected = elem.getAttribute('aria-selected') === 'true';
            if (isSelected) {
                const indexes = [...selected.value];
                const ids = [];
                for (let i = 0; i < indexes.length; i++) {
                    const current = results.value.items[indexes[i]];
                    if (!current) throw new Error('unreachable');
                    ids.push(current.id);
                }
                dispatch({ kind: 'show-entries-menu', ids, indexes });
            } else {
                const button = /** @type {HTMLButtonElement|null} */ (elem.querySelector('button[value]'));
                const id = button?.value || '';
                dispatch({ kind: 'show-entries-menu', ids: [id], indexes: [Number(elem.dataset.index)] });
            }
        }

        document.addEventListener('contextmenu', contextMenu);

        return () => {
            document.removeEventListener('contextmenu', contextMenu);
        };
    }, []);
}
