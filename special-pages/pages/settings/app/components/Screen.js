import styles from './VirtualizedList.module.css';
import { h } from 'preact';

/**
 * @import { Signal } from '@preact/signals';
 *
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.screenId
 */
export function ScreenContainer(props) {
    return (
        <div className={styles.container}>
            <pre>
                <code>{JSON.stringify({ screenId: props.screenId.value }, null, 2)}</code>
            </pre>
        </div>
    );
}
