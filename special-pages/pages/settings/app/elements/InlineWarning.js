import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';
import { useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';

/**
 * Props for the InlineWarning component
 * @typedef {Object} InlineWarningDefinition
 * @property {string} text - The warning text to display
 * @property {string} buttonText - The button text
 */

/**
 * Props for the InlineWarning component
 * @typedef {Object} InlineWarningProps
 * @property {() => void} onClick - Click event handler for the button
 */

/**
 * A component that renders a warning message with an icon and action button
 * @param {InlineWarningDefinition & InlineWarningProps} props - The component props
 */
export function InlineWarning({ text, buttonText, onClick }) {
    const { t } = useTranslation();
    return (
        <div class={styles.inlineWarning}>
            <img class={styles.warningIcon} src="/icons/Exclamation-16.svg" />
            <span class={styles.warningText}>{t(text)}</span>
            <button class={styles.warningButton} type="button" onClick={onClick}>
                {t(buttonText)}
            </button>
        </div>
    );
}

/**
 * @param {InlineWarningDefinition & { id: string }} props
 */
export function InlineWarningWithState(props) {
    const dispatch = useSettingsServiceDispatch();
    return <InlineWarning {...props} onClick={() => dispatch({ kind: 'button-press', id: props.id })} />;
}
