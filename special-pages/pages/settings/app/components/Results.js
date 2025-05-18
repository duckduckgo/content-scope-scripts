import { h } from 'preact';
import styles from './VirtualizedList.module.css';
import { EmptyState } from './Empty.js';
import { useResultsData } from '../global/Providers/SettingsServiceProvider.js';

/**
 * Access global state and render the results
 */
export function ResultsContainer() {
    const results = useResultsData();
    // const dispatch = useSettingsServiceDispatch();

    return <Results results={results} />;
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import("../global/Providers/SettingsServiceProvider.js").Results>} props.results
 */
export function Results({ results }) {
    if (results.value.screens.length === 0) {
        return <EmptyState />;
    }

    return (
        <div class={styles.container}>
            <pre>
                <code>${JSON.stringify(results.value, null, 2)}</code>
            </pre>
        </div>
    );

    // return (
    //     <ul class={styles.container}>
    //         <li>todo: list of results here</li>
    //     </ul>
    // );
}
