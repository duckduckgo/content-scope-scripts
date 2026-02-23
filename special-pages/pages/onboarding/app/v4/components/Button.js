import { h } from 'preact';
import { forwardRef } from 'preact/compat';
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
 */

/**
 * Reusable v4 button with primary (accent) and secondary (standard) variants.
 *
 * @type {import('preact').FunctionComponent<ButtonProps>}
 */
export const Button = forwardRef(
    (/** @type {ButtonProps} */ { variant = 'primary', children, onClick, disabled, size, class: className }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                class={cn(styles.button, styles[variant], size && styles[size], className)}
                onClick={onClick}
                disabled={disabled}
            >
                {children}
            </button>
        );
    },
);
