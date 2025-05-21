import { h } from 'preact';
import styles from './Elements.module.css';

/**
 * Props for the Text component
 * @typedef {Object} TextProps
 * @property {import('preact').ComponentChildren} children - The content to display
 */

/**
 * A component that renders text with a specified CSS class
 * @param {TextProps} props - The component props
 */
export function TextRow({ children }) {
    return <p class={styles.text}>{children}</p>;
}
