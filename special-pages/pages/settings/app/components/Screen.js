import styles from './VirtualizedList.module.css';
import { h } from 'preact';
import { Elements } from '../elements/Elements.js';

/**
 * @import { Signal } from '@preact/signals';
 *
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.screenId
 * @param {import('../settings.service').ScreenDefinition} props.screenDefinition
 * @param {import('../settings.service').SettingsStructure["excludedElements"]} props.excludedElements
 */
export function ScreenContainer(props) {
    return (
        <div class={styles.container} data-testid="ScreenContainer" data-screen-id={props.screenId}>
            <Elements
                elements={props.screenDefinition.elements}
                excluded={props.excludedElements}
                debug={location.href.includes('debug')}
            />
        </div>
    );
}

export function Debug({ children, id }) {
    return (
        <div style={'position:relative'}>
            {children}
            <span
                class={styles.debug}
                onClick={(_) => {
                    navigator.clipboard.writeText(id);
                }}
            >
                {id}
            </span>
        </div>
    );
}
