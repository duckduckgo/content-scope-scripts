import { h } from 'preact';
import styles from './App.module.css';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { Header } from './Header.js';
import { batch, useSignal, useSignalEffect } from '@preact/signals';
import { Results } from './Results.js';
import { useRef } from 'preact/hooks';
import { useHistory } from '../HistoryProvider.js';
import { generateHeights } from '../utils.js';
import { Sidebar } from './Sidebar.js';

/**
 * @typedef {object} Results
 * @property {import('../../types/history').HistoryItem[]} items
 * @property {number[]} heights
 */

export function App() {
    const { isDarkMode } = useEnv();
    const containerRef = useRef(/** @type {HTMLElement|null} */ (null));
    const { initial, service } = useHistory();

    const results = useSignal({
        items: initial.query.results,
        heights: generateHeights(initial.query.results),
    });

    const term = useSignal('term' in initial.query.info.query ? initial.query.info.query.term : '');

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
        return () => {
            unsub();
        };
    });

    useSignalEffect(() => {
        term.subscribe((t) => {
            containerRef.current?.scrollTo(0, 0);
        });
    });

    return (
        <div class={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
            <header class={styles.header}>
                <Header />
            </header>
            <aside class={styles.aside}>
                <Sidebar ranges={initial.ranges.ranges} />
            </aside>
            <main class={styles.main} ref={containerRef} data-main-scroller data-term={term}>
                <Results results={results} />
            </main>
        </div>
    );
}
