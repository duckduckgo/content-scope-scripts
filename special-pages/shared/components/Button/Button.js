import { h } from 'preact';
import classNames from 'classnames';
import styles from './Button.module.css';

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {'primary'|'standard'|'accent'|'accentBrand'|'ghost'} [props.variant]
 * @param {'button'|'submit'|'reset'} [props.type]
 * @param {import("preact").ComponentChild} props.children
 * @param {import("preact").JSX.MouseEventHandler<EventTarget>} [props.onClick]
 * @param {import('preact').ComponentProps<'button'>} [props.otherProps]
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
