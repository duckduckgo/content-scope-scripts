import styles from './VirtualizedList.module.css';
import { h } from 'preact';
import { Elements } from '../elements/Elements.js';
import { create as defaultBrowser } from '../screens/defaultBrowser/definitiion.js';
import { create as privateSearch } from '../screens/privateSearch/definitions.js';

/**
 * @import { Signal } from '@preact/signals';
 *
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.screenId
 */
export function ScreenContainer(props) {
    const elements = (() => {
        switch (props.screenId.value) {
            case 'privateSearch':
                return privateSearch();
            case 'defaultBrowser':
                return defaultBrowser();
            default: {
                console.warn('unknown screen');
                return [];
            }
        }
    })();
    return (
        <div className={styles.container}>
            <Elements elements={elements} />
        </div>
    );
}
