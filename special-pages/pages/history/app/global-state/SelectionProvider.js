import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { signal, useSignal, useSignalEffect } from '@preact/signals';
import { useQueryContext } from './QueryProvider.js';
import { eventToIntention } from '../../../../shared/handlers.js';
import { usePlatformName } from '../types.js';
import { useGlobalState } from './GlobalStateProvider.js';

/**
 * @typedef SelectionState
 * @property {import("@preact/signals").Signal<number[]>} selected
 */

/**
 * @typedef {(s: (d: number[]) => number[]) => void} UpdateSelected
 */

const SelectionContext = createContext(
    /** @type {SelectionState} */ ({
        selected: signal(/** @type {number[]} */ ([])),
    }),
);

/**
 * Provides a context for the selections
 *
 * @param {Object} props - The properties object for the SelectionProvider component.
 * @param {import("preact").ComponentChild} props.children - The child components that will consume the history service context.
 */
export function SelectionProvider({ children }) {
    const selected = useSignal(/** @type {number[]} */ ([]));
    /** @type {UpdateSelected} */
    const update = (fn) => {
        selected.value = fn(selected.value);
        console.log(selected.value);
    };

    useResetOnQueryChange(update);
    useRowClick(update, selected);

    return <SelectionContext.Provider value={{ selected }}>{children}</SelectionContext.Provider>;
}

/**
 * @param {UpdateSelected} update
 */
function useResetOnQueryChange(update) {
    const query = useQueryContext();
    useSignalEffect(() => {
        const unsubs = [
            // when anything about the query changes, reset selections
            query.subscribe(() => {
                update((prev) => []);
            }),
        ];

        return () => {
            for (const unsub of unsubs) {
                unsub();
            }
        };
    });
}

/**
 * @param {UpdateSelected} update
 * @param {import("@preact/signals").Signal<number[]>} selected
 */
function useRowClick(update, selected) {
    const platformName = usePlatformName();
    const { results } = useGlobalState();
    const lastSelected = useSignal(/** @type {{index: number; id: string}|null} */ (null));
    useSignalEffect(() => {
        function handler(/** @type {MouseEvent} */ event) {
            if (!(event.target instanceof Element)) return;
            const itemRow = /** @type {HTMLElement|null} */ (event.target.closest('[data-history-entry][data-index]'));
            const selection = toRowSelection(itemRow);
            if (!itemRow || !selection) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            const intention = eventToIntention(event, platformName);
            const currentSelected = itemRow.getAttribute('aria-selected') === 'true';

            switch (intention) {
                case 'click': {
                    // MVP for getting the tests to pass. Next PRs will expand functionality
                    update((prev) => [selection.index]);
                    lastSelected.value = selection;
                    break;
                }
                case 'ctrl+click': {
                    update((prev) => {
                        const index = prev.indexOf(selection.index);
                        if (index > -1) {
                            const next = prev.slice();
                            next.splice(index, 1);
                            return next;
                        }
                        return prev.concat(selection.index);
                    });
                    if (!currentSelected) {
                        lastSelected.value = selection;
                    } else {
                        lastSelected.value = null;
                    }
                    break;
                }
                case 'shift+click': {
                    // todo
                    break;
                }
            }
        }
        document.addEventListener('click', handler);
        return () => {
            document.removeEventListener('click', handler);
        };
    });
}

// Hook for consuming the context
export function useSelected() {
    const context = useContext(SelectionContext);
    if (!context) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context.selected;
}

/**
 * @param {null|HTMLElement} elem
 * @returns {{id: string; index: number} | null}
 */
function toRowSelection(elem) {
    if (elem === null) return null;
    const { index, historyEntry } = elem.dataset;
    if (typeof historyEntry !== 'string') return null;
    if (typeof index !== 'string') return null;
    if (!index.trim().match(/^\d+$/)) return null;
    return { id: historyEntry, index: parseInt(index, 10) };
}
