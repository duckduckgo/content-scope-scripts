import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { batch, signal, useSignal, useSignalEffect } from '@preact/signals';
import { generateHeights } from '../utils.js';

/**
 * @typedef {object} Results
 * @property {import('../../types/history.js').HistoryItem[]} items
 * @property {number[]} heights
 */
/**
 * @typedef {import('../../types/history.ts').Range} Range
 */

const GlobalState = createContext({
    ranges: signal(/** @type {import('../history.service.js').Range[]} */ ([])),
    term: signal(''),
    results: signal(/** @type {Results} */ ({})),
});

/**
 * Provides a global state context for the application.
 *
 * @param {Object} props
 * @param {import('../history.service.js').HistoryService} props.service - An instance of the history service to manage state updates.
 * @param {import('../history.service.js').ServiceData} props.initial - The initial state data for the history service.
 * @param {import('preact').ComponentChildren} props.children
 */
export function GlobalStateProvider({ service, initial, children }) {
    // NOTE: These states will get extracted out later, once I know all the use-cases
    const ranges = useSignal(initial.ranges.ranges);
    const term = useSignal('term' in initial.query.info.query ? initial.query.info.query.term : '');
    const results = useSignal({
        items: initial.query.results,
        heights: generateHeights(initial.query.results),
    });

    useSignalEffect(() => {
        const unsub = service.onResults((data) => {
            batch(() => {
                if ('term' in data.info.query && data.info.query.term !== null) {
                    term.value = data.info.query.term;
                }
                results.value = {
                    items: data.results,
                    heights: generateHeights(data.results),
                };
            });
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
        return term.subscribe(() => {
            document.querySelector('[data-main-scroller]')?.scrollTo(0, 0);
        });
    });

    return <GlobalState.Provider value={{ ranges, term, results }}>{children}</GlobalState.Provider>;
}

// Hook for consuming the context
export function useGlobalState() {
    const context = useContext(GlobalState);
    if (!context) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
}
