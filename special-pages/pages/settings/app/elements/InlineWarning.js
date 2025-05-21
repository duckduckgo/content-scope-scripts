import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';

/**
 * Props for the InlineWarning component
 * @typedef {Object} InlineWarningProps
 * @property {string} text - The warning text to display
 * @property {string} buttonText - The button text
 * @property {() => void} onClick - Click event handler for the button
 */

/**
 * A component that renders a warning message with an icon and action button
 * @param {InlineWarningProps} props - The component props
 */
export function InlineWarning({ text, buttonText, onClick }) {
    const { t } = useTranslation();
    return (
        <div class={styles.inlineWarning}>
            <span class={styles.warningIcon}>⚠️</span>
            <span class={styles.warningText}>{t(text)}</span>
            <button class={styles.warningButton} type="button" onClick={onClick}>
                {t(buttonText)}
            </button>
        </div>
    );
}
