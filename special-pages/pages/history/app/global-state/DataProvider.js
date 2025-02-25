import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { signal, useSignal, useSignalEffect } from '@preact/signals';
import { generateHeights } from '../utils.js';
import { useQueryContext } from './QueryProvider.js';

/**
 * @typedef {object} Results
 * @property {import('../../types/history.js').HistoryItem[]} items
 * @property {number[]} heights
 */
/**
 * @typedef {import('../../types/history.ts').Range} Range
 */

const DataState = createContext({
    ranges: signal(/** @type {import('../history.service.js').Range[]} */ ([])),
    results: signal(/** @type {Results} */ ({})),
});

/**
 * Provides a global state context for the application data.
 *
 * @param {Object} props
 * @param {import('../history.service.js').HistoryService} props.service - An instance of the history service to manage state updates.
 * @param {import('../history.service.js').InitialServiceData} props.initial - The initial state data for the history service.
 * @param {import('preact').ComponentChildren} props.children
 */
export function DataProvider({ service, initial, children }) {
    // NOTE: These states will get extracted out later, once I know all the use-cases
    const ranges = useSignal(initial.ranges.ranges);
    const query = useQueryContext();
    const results = useSignal({
        items: initial.query.results,
        heights: generateHeights(initial.query.results),
    });

    useSignalEffect(() => {
        const unsub = service.onResults((data) => {
            results.value = {
                items: data.results,
                heights: generateHeights(data.results),
            };
        });

        // Subscribe to changes in the 'ranges' data and reflect the updates into the UI
        const unsubRanges = service.onRanges((data) => {
            ranges.value = data.ranges;
        });
        return () => {
            unsub();
            unsubRanges();
        };
    });

    useSignalEffect(() => {
        return query.subscribe(() => {
            // whenever the query changes, scroll the main container back to the top
            document.querySelector('[data-main-scroller]')?.scrollTo(0, 0);
        });
    });

    return <DataState.Provider value={{ ranges, results }}>{children}</DataState.Provider>;
}

// Hook for consuming the context
export function useData() {
    const context = useContext(DataState);
    if (!context) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
}
