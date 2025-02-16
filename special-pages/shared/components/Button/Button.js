import { h } from 'preact';
import classNames from 'classnames';
import styles from './Button.module.css';

/**
 * @typedef {object} ButtonProps
 * @property {string} [className]
 * @property {'primary'|'standard'|'accent'|'accentBrand'|'ghost'} [variant]
 * @property {'button'|'submit'|'reset'} [type]
 * @property {import("preact").ComponentChild} children
 * @property {import("preact").JSX.MouseEventHandler<EventTarget>} [onClick]
 * @property {import('preact').ComponentProps<'button'>} [otherProps]
 */

/**
 *
 * @param {ButtonProps} props
 */
export function Button({ variant, className, children, onClick, type = 'button' }) {
    return (
        <button
            className={classNames(styles.button, { [styles[`${variant}`]]: !!variant }, className)}
            type={type}
            onClick={
                /**
                 * @param {import("preact").JSX.TargetedMouseEvent<EventTarget>} event
                 */
                (event) => {
                    if (onClick) {
                        onClick(event);
                    }
                }
            }
        >
            {children}
        </button>
    );
}
