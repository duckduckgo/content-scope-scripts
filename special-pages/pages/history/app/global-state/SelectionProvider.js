import { createContext, h } from 'preact';
import { useContext } from 'preact/hooks';
import { signal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useQueryContext } from './QueryProvider.js';
import { usePlatformName } from '../types.js';
import { useGlobalState } from './GlobalStateProvider.js';

/**
 * @typedef SelectionState
 * @property {import("@preact/signals").Signal<Set<number>>} selected
 */

/**
 * @typedef {(s: (d: Set<number>) => Set<number>, reason: string) => void} UpdateSelected
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
    const update = (fn, reason) => {
        console.log('[❌] clearing selections because', reason);
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
    const length = useComputed(() => results.value.items.length);

    useSignalEffect(() => {
        let prevLength = 0;
        const unsubs = [
            // when anything about the query changes, reset selections
            // todo: this should not fire on the first value too
            query.subscribe((old) => {
                update((prev) => new Set([]), 'query changed');
            }),
            // todo: this should not fire on the first value too
            length.subscribe((newLength) => {
                if (newLength < prevLength) {
                    update((prev) => new Set([]), `items length shrank from ${prevLength} to ${newLength}`);
                }
                prevLength = newLength;
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
    const focusedIndex = useSignal(/** @type {null|number} */ (null));
    const { results } = useGlobalState();

    useSignalEffect(() => {
        /**
         * @param {Intention} intention
         * @param {{id: string; index: number}} selection
         */
        function handleClickIntentions(intention, selection) {
            const { index } = selection;
            switch (intention) {
                case 'click': {
                    selected.value = new Set([index]);
                    anchorIndex.value = index;
                    lastShiftRange.value = { start: null, end: null };
                    focusedIndex.value = index;
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
                    focusedIndex.value = index;
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
                    focusedIndex.value = index;
                    break;
                }
            }
        }

        /**
         * @param {Intention} intention
         */
        function handleKeyIntention(intention) {
            // prettier-ignore
            const direction = intention === 'shift+up' || intention === 'up'
                ? -1
                : 1;

            if (focusedIndex.value === null) return console.error('unreachable');
            const newIndex = Math.max(0, Math.min(results.value.items.length - 1, focusedIndex.value + direction));

            switch (intention) {
                case 'shift+down':
                case 'shift+up': {
                    // Handle shift+arrow selection
                    const newSelected = new Set(selected.value);

                    // Remove previous shift range
                    if (lastShiftRange.value.start !== null && lastShiftRange.value.end !== null) {
                        for (let i = lastShiftRange.value.start; i <= lastShiftRange.value.end; i++) {
                            newSelected.delete(i);
                        }
                    }

                    // Calculate new range
                    const start = Math.min(anchorIndex.value ?? newIndex, newIndex);
                    const end = Math.max(anchorIndex.value ?? newIndex, newIndex);

                    // Add new range
                    for (let i = start; i <= end; i++) {
                        newSelected.add(i);
                    }

                    lastShiftRange.value = { start, end };
                    selected.value = newSelected;

                    if (anchorIndex.value === null) {
                        anchorIndex.value = newIndex;
                    }
                    break;
                }
                case 'up':
                case 'down': {
                    selected.value = new Set([newIndex]);
                    anchorIndex.value = newIndex;
                    lastShiftRange.value = { start: null, end: null };
                }
            }

            switch (intention) {
                case 'shift+down':
                case 'shift+up':
                case 'up':
                case 'down': {
                    focusedIndex.value = newIndex;
                    const match = document.querySelector(`[aria-selected][data-index="${newIndex}"]`);
                    match?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                }
            }
        }
        function handler(/** @type {MouseEvent} */ event) {
            const main = document.querySelector('main');
            if (!(event.target instanceof Element)) return;
            if (!main?.contains(event.target)) return;
            const itemRow = /** @type {HTMLElement|null} */ (event.target.closest('[data-history-entry][data-index]'));
            const selection = toRowSelection(itemRow);
            if (!itemRow || !selection) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const intention = eventToIntention(event, platformName);
            handleClickIntentions(intention, selection);
        }
        function keyHandler(/** @type {KeyboardEvent} */ event) {
            const main = document.querySelector('main');
            if (!(event.target instanceof Element)) return;
            const intention = eventToIntention(event, platformName);
            if (!main?.contains(event.target)) return;
            if (intention === 'unknown') return;
            if (focusedIndex.value === null) return console.log('ignoring keys - nothing was selected');
            event.preventDefault();
            handleKeyIntention(intention);
        }
        document.addEventListener('click', handler);
        document.addEventListener('keydown', keyHandler);

        return () => {
            document.removeEventListener('click', handler);
            document.removeEventListener('keydown', keyHandler);
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

/**
 * @typedef {'ctrl+click' | 'shift+click' | 'click' | 'escape' | 'delete' | 'shift+up' | 'shift+down' | 'up' | 'down' | 'unknown'} Intention
 */

/**
 * @param {MouseEvent|KeyboardEvent} event
 * @param {ImportMeta['platform']} platformName
 * @return {Intention}
 */
export function eventToIntention(event, platformName) {
    if (event instanceof MouseEvent) {
        const isControlClick = platformName === 'macos' ? event.metaKey : event.ctrlKey;
        if (isControlClick) {
            return 'ctrl+click';
        } else if (event.shiftKey) {
            return 'shift+click';
        }
        return 'click';
    } else if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') {
            return 'escape';
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            return 'delete';
        } else if (event.key === 'ArrowUp' && event.shiftKey) {
            return 'shift+up';
        } else if (event.key === 'ArrowDown' && event.shiftKey) {
            return 'shift+down';
        } else if (event.key === 'ArrowUp') {
            return 'up';
        } else if (event.key === 'ArrowDown') {
            return 'down';
        }
    }
    return 'unknown';
}
