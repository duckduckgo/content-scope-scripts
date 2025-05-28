import { h } from 'preact';
import { useGlobalSettingsState } from '../global/Providers/SettingsServiceProvider.js';
import { useComputed } from '@preact/signals';
import styles from './Elements.module.css';

/**
 * @typedef {Object} SwitchDefinition
 * @property {string} valueId
 * @property {import("preact").ComponentChildren} [on]
 * @property {import("preact").ComponentChildren} [off]
 */

/**
 * A component that renders a checkbox with text and optional children
 * @param {SwitchDefinition} props - The component props
 */
export function Switch({ on, off, valueId }) {
    const state = useGlobalSettingsState();
    const computed = useComputed(() => state.value[valueId]);
    return <div class={styles.innerList}>{computed.value ? on : off}</div>;
}
