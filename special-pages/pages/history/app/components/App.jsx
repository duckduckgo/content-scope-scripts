import { h } from 'preact';
import styles from './App.module.css';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { Header } from './Header.js';
import { Results } from './Results.js';
import { useRef } from 'preact/hooks';
import { Sidebar } from './Sidebar.js';
import { useGlobalState } from '../global-state/GlobalStateProvider.js';
import { useSelectionEvents, useSelected } from '../global-state/SelectionProvider.js';
import { useGlobalHandlers } from '../global-state/HistoryServiceProvider.js';

export function App() {
    const { isDarkMode } = useEnv();
    const containerRef = useRef(/** @type {HTMLElement|null} */ (null));
    const { ranges, term, results } = useGlobalState();
    const selected = useSelected();

    useGlobalHandlers();
    useSelectionEvents(containerRef);

    return (
        <div class={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
            <header class={styles.header}>
                <Header />
            </header>
            <aside class={styles.aside}>
                <Sidebar ranges={ranges} />
            </aside>
            <main class={styles.main} ref={containerRef} data-main-scroller data-term={term}>
                <Results results={results} selected={selected} />
            </main>
        </div>
    );
}
