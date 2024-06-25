import { h } from 'preact'
import classNames from 'classnames';
import styles from './Button.module.css'

/**
 * @param {object} props
 * @param {'apple'} [props.platform] // More platforms to be supported in the future
 * @param {import("preact").ComponentChild} props.children
 * @param {import("preact").JSX.MouseEventHandler<EventTarget>} props.onClick
 * @param {import('preact').ComponentProps<'button'>} [props.otherProps]
 */
export function Button({ platform = 'apple', children, onClick }) {
    return (
        <button
            className={classNames(styles.button, styles[platform])}
            onClick={
                /**
                 * @param {import("preact").JSX.TargetedMouseEvent<EventTarget>} event
                 */
                (event) => {
                    if (onClick) {
                    onClick(event);
                    }
                }}
        >
            {children}
        </button>
    )
}