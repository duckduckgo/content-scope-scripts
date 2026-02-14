import { h } from 'preact';
import cn from 'classnames';
import styles from './Button.module.css';

/**
 * Reusable v4 button with primary (accent) and secondary (standard) variants.
 *
 * @param {object} props
 * @param {'primary' | 'secondary'} [props.variant='primary']
 * @param {import("preact").ComponentChild} props.children
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 * @param {string} [props.class] - Additional class for layout (flex, width, etc.)
 */
export function Button({ variant = 'primary', children, onClick, disabled, class: className }) {
    return (
        <button type="button" class={cn(styles.button, styles[variant], className)} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}
