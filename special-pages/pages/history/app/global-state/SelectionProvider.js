import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { signal, useSignal, useSignalEffect } from '@preact/signals';

const SelectionContext = createContext({
    selected: signal(/** @type {string[]} */ ([])),
});

/**
 * Provides a context for the selections
 *
 * @param {Object} props - The properties object for the SelectionProvider component.
 * @param {import("preact").ComponentChild} props.children - The child components that will consume the history service context.
 */
export function SelectionProvider({ children }) {
    const selected = useSignal(/** @type {string[]} */ ([]));
    useSignalEffect(() => {
        function handler(/** @type {MouseEvent} */ event) {
            if (!(event.target instanceof Element)) return;
            const itemRow = /** @type {HTMLElement|null} */ (event.target.closest('[data-history-entry][data-index]'));
            const selection = toRowSelection(itemRow);
            if (selection) {
                console.log('SELECTION:', selection);
            }
        }
        document.addEventListener('click', handler);
    });
    return <SelectionContext.Provider value={{ selected }}>{children}</SelectionContext.Provider>;
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
