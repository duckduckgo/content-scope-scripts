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
 * @param {'wide' | 'stretch'} [props.size] - 'wide' adds extra horizontal padding, 'stretch' fills available width
 * @param {string} [props.class] - Additional class for layout (flex, width, etc.)
 */
export function Button({ variant = 'primary', children, onClick, disabled, size, class: className }) {
    return (
        <button
            type="button"
            class={cn(styles.button, styles[variant], size && styles[size], className)}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
