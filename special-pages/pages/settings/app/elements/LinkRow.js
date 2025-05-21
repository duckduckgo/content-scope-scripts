import { h } from 'preact';
import styles from './Elements.module.css';

/**
 * Props for the LinkRow component
 * @typedef {Object} LinkProps
 * @property {import('preact').ComponentChildren} children - The content to display
 * @property {h.JSX.HTMLAttributes<HTMLAnchorElement>} [anchorAttrs] - HTML anchor attributes to pass through
 */

/**
 * A component that renders text with a specified CSS class
 * @param {LinkProps} props - The component props
 */
export function LinkRow({ children, anchorAttrs }) {
    return (
        <p class={styles.text}>
            <a class={styles.link} {...anchorAttrs}>
                {children}
            </a>
        </p>
    );
}
