import styles from './VirtualizedList.module.css';
import { h } from 'preact';
import { Elements } from '../elements/Elements.js';

/**
 * @import { Signal } from '@preact/signals';
 *
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.screenId
 * @param {import('../elements/Elements.js').ScreenDefinition} props.screenDefinition
 */
export function ScreenContainer(props) {
    return (
        <div class={styles.container} data-testid="ScreenContainer" data-screen-id={props.screenId}>
            <Elements elements={props.screenDefinition.elements} />
        </div>
    );
}
