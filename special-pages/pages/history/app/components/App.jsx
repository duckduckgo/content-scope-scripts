import { h } from 'preact';
import styles from './App.module.css';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { Header } from './Header.js';
import { useSignal } from '@preact/signals';
import { Results } from './Results.js';

export function App() {
    const { isDarkMode } = useEnv();
    const results = useSignal({
        info: {
            finished: true,
            term: '',
        },
        value: [],
    });
    return (
        <div class={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
            <header class={styles.header}>
                <Header setResults={(next) => (results.value = next)} />
            </header>
            <aside class={styles.aside}>
                <h1 class={styles.pageTitle}>History</h1>
            </aside>
            <main class={styles.main}>
                <Results />
            </main>
        </div>
    );
}
