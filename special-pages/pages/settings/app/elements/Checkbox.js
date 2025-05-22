import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';
import { useGlobalSettingsState, useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider';
import { useComputed } from '@preact/signals';

/**
 * @typedef {Object} CheckboxDefinition
 * @property {string} text - The text to display next to checkbox
 * @property {import("preact").ComponentChildren} [children] - optional children
 */

/**
 * Props for the Checkbox component
 * @import { Signal } from '@preact/signals';
 * @typedef {Object} CheckboxProps
 * @property {Signal<boolean>} checked - The checked state of checkbox
 * @property {(checked: boolean) => void} onChange - Change event handler
 * @property {import('preact').ComponentChildren} [children] - Optional children components
 */

/**
 * A component that renders a checkbox with text and optional children
 * @param {CheckboxProps & CheckboxDefinition} props - The component props
 */
export function Checkbox({ text, checked, onChange, children }) {
    const { t } = useTranslation();
    return (
        <div class={styles.checkboxContainer}>
            <label class={styles.checkboxRow}>
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} class={styles.checkbox} />
                <span class={styles.checkboxText}>{t(text)}</span>
            </label>
            {children && <div class={styles.checkboxChildren}>{children}</div>}
        </div>
    );
}

/**
 * @param {CheckboxDefinition & { id: string }} props - The component props
 */
export function CheckboxWithState({ id, ...rest }) {
    const results = useGlobalSettingsState();
    const dispatch = useSettingsServiceDispatch();
    const globalValue = useComputed(() => results.value[id]);
    return <Checkbox {...rest} checked={globalValue} onChange={(value) => dispatch({ kind: 'value-change', id, value })} />;
}
