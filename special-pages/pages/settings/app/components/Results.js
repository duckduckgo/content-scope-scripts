import { h } from 'preact';
import styles from './VirtualizedList.module.css';
import { EmptyState } from './Empty.js';
import { useResultsData } from '../global/Providers/SettingsServiceProvider.js';

/**
 * @import { Signal } from '@preact/signals';
 */

/**
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.term
 */
export function ResultsContainer(props) {
    const results = useResultsData();
    // const dispatch = useSettingsServiceDispatch();

    return <Results results={results} term={props.term} />;
}

/**
 * @param {object} props
 * @param {Signal<import("../global/Providers/SettingsServiceProvider.js").Results>} props.results
 * @param {Signal<string>} props.term
 */
export function Results({ results, term }) {
    if (results.value.screens.length === 0) {
        return <EmptyState />;
    }

    return (
        <div class={styles.container}>
            <pre>
                <code>{JSON.stringify({ term: term.value }, null, 2)}</code>
            </pre>
            <pre>
                <code>{JSON.stringify(results.value, null, 2)}</code>
            </pre>
        </div>
    );

    // return (
    //     <ul class={styles.container}>
    //         <li>todo: list of results here</li>
    //     </ul>
    // );
}
