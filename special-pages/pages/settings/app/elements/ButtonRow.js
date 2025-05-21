import { h } from 'preact';
import styles from './Elements.module.css';
import { useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import { useTranslation } from '../types.js';

/**
 * Props for the Text component
 * @typedef {Object} ButtonRowDefinition
 * @property {string} text
 */

/**
 * Props for the Text component
 * @typedef {Object} ButtonProps
 * @property {()=>void} onClick
 */

/**
 * A component that renders text with a specified CSS class
 * @param {ButtonRowDefinition & ButtonProps} props - The component props
 */
export function ButtonRow({ text, onClick }) {
    const { t } = useTranslation();
    return (
        <div>
            <button class={styles.text} onClick={onClick} type={'button'}>
                {t(text)}
            </button>
        </div>
    );
}

/**
 * @param {ButtonRowDefinition & { id: string }} props
 */
export function ButtonRowWithState(props) {
    const dispatch = useSettingsServiceDispatch();
    return <ButtonRow {...props} onClick={() => dispatch({ kind: 'button-press', id: props.id })} />;
}
