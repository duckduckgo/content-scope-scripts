import { h } from 'preact';
import styles from './NewBadge.module.css';

/**
 * Badge component that displays text in a yellow rounded rectangle.
 *
 * @param {object} props
 * @param {string} props.text - The text to display in the badge
 * @param {import('preact').ComponentProps<'span'>} [props.rest] - Additional HTML attributes
 */
export function NewBadge({ text, ...rest }) {
    return (
        <span class={styles.badge} {...rest}>
            {text}
        </span>
    );
}
