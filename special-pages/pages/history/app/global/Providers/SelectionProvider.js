import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';
import { usePlatformName } from '../../types.js';
import { eventToIntention } from '../../utils.js';
import { useHistoryServiceDispatch, useResultsData } from './HistoryServiceProvider.js';

/**
 * @typedef {(s: (d: Set<number>) => Set<number>, reason: string) => void} UpdateSelected
 * @typedef {import("../../utils.js").Intention} Intention
 * @import { ReadonlySignal } from '@preact/signals'
 */

/**
 * @typedef {{kind: 'set-selections', value: Set<number>, reason: string}
 *   | {kind: 'reset'; reason: string}
 * } Action
 */
const SelectionDispatchContext = createContext(/** @type {(a: Action) => void} */ ((a) => {}));
const SelectionContext = createContext(/** @type {ReadonlySignal<Set<number>>} */ (signal(new Set([]))));

/**
 * Provides a context for the selections
 *
 * @param {Object} props - The properties object for the SelectionProvider component.
 * @param {import("preact").ComponentChild} props.children - The child components that will consume the history service context.
 */
export function SelectionProvider({ children }) {
    const selected = useSignal(new Set(/** @type {number[]} */ ([])));
    /**
     * Actions that override the selections come through here
     * @param {Action} action
     */
    function dispatch(action) {
        selected.value = (() => {
            switch (action.kind) {
                case 'set-selections': {
                    return action.value;
                }
                case 'reset': {
                    return new Set([]);
                }
                default:
                    return selected.value;
            }
        })();
    }
    const dispatcher = useCallback(dispatch, [selected]);
    return (
        <SelectionContext.Provider value={selected}>
            <SelectionDispatchContext.Provider value={dispatcher}>{children}</SelectionDispatchContext.Provider>
        </SelectionContext.Provider>
    );
}

// Hook for consuming the context
export function useSelected() {
    return useContext(SelectionContext);
}

export function useSelectionDispatch() {
    return useContext(SelectionDispatchContext);
}

/**
 * Handle onClick + keydown events to support most interactions with the list.
 * @param {import('preact/hooks').MutableRef<HTMLElement|null>} mainRef
 */
export function useRowInteractions(mainRef) {
    const platformName = usePlatformName();
    const dispatch = useSelectionDispatch();
    const historyDispatch = useHistoryServiceDispatch();
    const selected = useSelected();
    const anchorIndex = useSignal(/** @type {null|number} */ (null));
    const lastShiftRange = useSignal({ start: /** @type {null|number} */ (null), end: /** @type {null|number} */ (null) });
    const focusedIndex = useSignal(/** @type {null|number} */ (null));
    const results = useResultsData();

    /**
     * @param {Intention} intention
     * @param {{id: string; index: number}} selection
     */
    function handleClickIntentions(intention, selection) {
        const { index } = selection;
        switch (intention) {
            case 'click': {
                dispatch({ kind: 'set-selections', value: new Set([index]), reason: 'row clicked' });
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
                dispatch({ kind: 'set-selections', value: newSelected, reason: 'row ctrl+clicked' });
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
                dispatch({ kind: 'set-selections', value: newSelected, reason: 'row shift+clicked' });
                focusedIndex.value = index;
                break;
            }
        }
    }

    function handler(/** @type {MouseEvent} */ event) {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest('button')) return;
        if (event.target.closest('a')) return;
        const itemRow = /** @type {HTMLElement|null} */ (event.target.closest('[data-history-entry][data-index]'));
        const selection = toRowSelection(itemRow);
        if (!itemRow || !selection) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const intention = eventToIntention(event, platformName);
        handleClickIntentions(intention, selection);
    }

    /**
     * @param {Intention} intention
     * @return {boolean} true if we handled this event
     */
    function handleKeyIntention(intention) {
        // prettier-ignore
        const direction = intention === 'shift+up' || intention === 'up'
            ? -1
            : 1;

        if (focusedIndex.value === null) return false;
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
                dispatch({ kind: 'set-selections', value: newSelected, reason: 'shift+up or shift+down pressed' });

                if (anchorIndex.value === null) {
                    anchorIndex.value = newIndex;
                }
                break;
            }
            case 'up':
            case 'down': {
                dispatch({ kind: 'set-selections', value: new Set([newIndex]), reason: 'up or down pressed without modifier' });
                anchorIndex.value = newIndex;
                lastShiftRange.value = { start: null, end: null };
                break;
            }
            case 'delete': {
                if (selected.value.size === 0) break;
                historyDispatch({ kind: 'delete-entries-by-index', value: [...selected.value] });
                break;
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
                return true;
            }
        }

        return false;
    }
    /**
     * @param {Intention} intention
     * @param {KeyboardEvent} event
     */
    function handleGlobalKeyIntentions(intention, event) {
        if (event.target !== document.body) return false;
        switch (intention) {
            case 'escape': {
                dispatch({
                    kind: 'reset',
                    reason: 'escape key pressed',
                });
                return true;
            }
        }
        return false;
    }

    function keyHandler(/** @type {KeyboardEvent} */ event) {
        const intention = eventToIntention(event, platformName);
        if (intention === 'unknown') return;
        if (focusedIndex.value === null) return;
        let handled = false;

        /**
         * If the target is body OR within the main scroller, handle the events such as selections
         */
        if (
            event.target === document.body ||
            event.target === mainRef.current ||
            mainRef.current?.contains(/** @type {any} */ (event.target))
        ) {
            handled = handleKeyIntention(intention);
        }

        /**
         * If it wasn't handled, try global things like `escape`?
         */
        if (!handled) {
            handled = handleGlobalKeyIntentions(intention, event);
        }

        if (handled) event.preventDefault();
    }

    const onClick = useCallback(handler, [selected, anchorIndex, lastShiftRange, focusedIndex]);
    const onKeyDown = useCallback(keyHandler, [selected, anchorIndex, lastShiftRange, focusedIndex]);

    return { onClick, onKeyDown };
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
