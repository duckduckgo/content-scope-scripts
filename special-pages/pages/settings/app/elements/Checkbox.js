import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';

/**
 * Props for the Checkbox component
 * @typedef {Object} CheckboxProps
 * @property {string} text - The text to display next to checkbox
 * @property {boolean} checked - The checked state of checkbox
 * @property {(checked: boolean) => void} onChange - Change event handler
 * @property {import('preact').ComponentChildren} [children] - Optional children components
 */

/**
 * A component that renders a checkbox with text and optional children
 * @param {CheckboxProps} props - The component props
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
