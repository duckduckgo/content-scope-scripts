import { h } from 'preact';
import styles from './Elements.module.css';
import { useTranslation } from '../types.js';

/**
 * Props for the PageTitle component
 * @typedef {Object} ScreenTitleDefinition
 * @property {string} title - The title text to display
 */

/**
 * A component that renders a page title
 * @param {ScreenTitleDefinition} props - The component props
 */
export function ScreenTitle({ title }) {
    const { t } = useTranslation();
    return <h1 class={styles.screenTitle}>{t(title)}</h1>;
}
