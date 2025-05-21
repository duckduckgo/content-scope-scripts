import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';

/**
 * Props for the Text component
 * @typedef {Object} TextRowDefinition
 * @property {string} text - The content to display
 */

/**
 * A component that renders text with a specified CSS class
 * @param {TextRowDefinition & { id: string }} props - The component props
 */
export function TextRow({ text }) {
    const { t } = useTranslation();
    return <p class={styles.text}>{t(text)}</p>;
}
