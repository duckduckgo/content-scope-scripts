import { h } from 'preact';
import styles from './Elements.module.css';

/**
 * Props for the Text component
 * @typedef {Object} ButtonProps
 * @property {import('preact').ComponentChildren} children - The content to display
 * @property {h.JSX.HTMLAttributes<HTMLButtonElement>} [buttonAttrs] - HTML button attributes
 */

/**
 * A component that renders text with a specified CSS class
 * @param {ButtonProps} props - The component props
 */
export function Button({ children, buttonAttrs }) {
    return (
        <button class={styles.text} {...buttonAttrs}>
            {children}
        </button>
    );
}
