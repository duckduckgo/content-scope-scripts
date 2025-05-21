import { h } from 'preact';
import styles from './Elements.module.css';

/**
 * Props for the PageTitle component
 * @typedef {Object} PageTitleProps
 * @property {string} title - The title text to display
 */

/**
 * A component that renders a page title
 * @param {PageTitleProps} props - The component props
 */
export function ScreenTitle({ title }) {
    return <h1 class={styles.screenTitle}>{title}</h1>;
}
