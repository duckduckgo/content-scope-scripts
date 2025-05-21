import styles from './Elements.module.css';
import { h } from 'preact';
import { useTranslation } from '../types.js';

/**
 * Props for the SectionTitle component
 * @typedef {Object} SectionTitleProps
 * @property {string} title - The title text to display
 */

/**
 * A component that renders a section title
 * @param {SectionTitleProps} props - The component props
 */
export function SectionTitle({ title }) {
    const { t } = useTranslation();
    return <h2 class={styles.sectionTitle}>{t(title)}</h2>;
}
