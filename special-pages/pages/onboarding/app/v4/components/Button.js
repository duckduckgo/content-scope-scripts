import { h } from 'preact';
import cn from 'classnames';
import styles from './Button.module.css';

/**
 * @typedef {object} ButtonProps
 * @property {'primary' | 'secondary'} [variant]
 * @property {import("preact").ComponentChild} children
 * @property {() => void} [onClick]
 * @property {boolean} [disabled]
 * @property {'wide' | 'stretch'} [size] - 'wide' adds extra horizontal padding, 'stretch' fills available width
 * @property {string} [class] - Additional class for layout (flex, width, etc.)
 * @property {import("preact").Ref<HTMLButtonElement>} [buttonRef] - Use buttonRef instead of ref to avoid needing preact/compat's forwardRef
 */

/**
 * Reusable v4 button with primary (accent) and secondary (standard) variants.
 *
 * @param {ButtonProps} props
 */
export function Button({ variant = 'primary', children, onClick, disabled, size, class: className, buttonRef }) {
    return (
        <button
            ref={buttonRef}
            type="button"
            class={cn(styles.button, styles[variant], size && styles[size], className)}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
