import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { signal, useSignal, useSignalEffect } from '@preact/signals';
import { useQueryContext } from './QueryProvider.js';
import { eventToIntention } from '../../../../shared/handlers.js';
import { usePlatformName } from '../types.js';
import { useGlobalState } from './GlobalStateProvider.js';

/**
 * @typedef SelectionState
 * @property {import("@preact/signals").Signal<Set<number>>} selected
 */

/**
 * @typedef {(s: (d: Set<number>) => Set<number>) => void} UpdateSelected
 */

const SelectionContext = createContext(
    /** @type {SelectionState} */ ({
        selected: signal(/** @type {Set<number>} */ (new Set([]))),
    }),
);

/**
 * Provides a context for the selections
 *
 * @param {Object} props - The properties object for the SelectionProvider component.
 * @param {import("preact").ComponentChild} props.children - The child components that will consume the history service context.
 */
export function SelectionProvider({ children }) {
    const selected = useSignal(new Set(/** @type {number[]} */ ([])));
    /** @type {UpdateSelected} */
    const update = (fn) => {
        selected.value = fn(selected.value);
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
    const { results } = useGlobalState();

    useSignalEffect(() => {
        const unsubs = [
            // when anything about the query changes, reset selections
            // todo: this should not fire on the first value too
            query.subscribe((old) => {
                update((prev) => new Set([]));
            }),
            // todo: this should not fire on the first value too
            results.subscribe(() => {
                update((prev) => new Set([]));
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
 * @param {import("@preact/signals").Signal<Set<number>>} selected
 */
function useRowClick(update, selected) {
    const platformName = usePlatformName();

    const anchorIndex = useSignal(/** @type {null|number} */ (null));
    const lastShiftRange = useSignal({ start: /** @type {null|number} */ (null), end: /** @type {null|number} */ (null) });

    useSignalEffect(() => {
        function handler(/** @type {MouseEvent} */ event) {
            if (!(event.target instanceof Element)) return;
            const itemRow = /** @type {HTMLElement|null} */ (event.target.closest('[data-history-entry][data-index]'));
            const selection = toRowSelection(itemRow);
            if (!itemRow || !selection) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            const intention = eventToIntention(event, platformName);
            const { index } = selection;

            switch (intention) {
                case 'click': {
                    selected.value = new Set([index]);
                    anchorIndex.value = index;
                    lastShiftRange.value = { start: null, end: null };
                    break;
                }
                case 'ctrl+click': {
                    const newSelected = new Set(selected.value);
                    if (newSelected.has(index)) {
                        newSelected.delete(index);
                    } else {
                        newSelected.add(index);
                    }
                    selected.value = newSelected;
                    anchorIndex.value = index;
                    lastShiftRange.value = { start: null, end: null };
                    break;
                }
                case 'shift+click': {
                    const newSelected = new Set(selected.value);

                    // If there was a previous shift selection, remove it first
                    if (lastShiftRange.value.start !== null && lastShiftRange.value.end !== null) {
                        for (let i = lastShiftRange.value.start; i <= lastShiftRange.value.end; i++) {
                            newSelected.delete(i);
                        }
                    }

                    // Calculate new range bounds from the anchor point
                    const start = Math.min(anchorIndex.value ?? 0, index);
                    const end = Math.max(anchorIndex.value ?? 0, index);

                    // Add all items in new range to selection
                    for (let i = start; i <= end; i++) {
                        newSelected.add(i);
                    }

                    lastShiftRange.value = { start, end };
                    selected.value = newSelected;
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
