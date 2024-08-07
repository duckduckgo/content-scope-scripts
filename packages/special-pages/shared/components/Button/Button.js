import { h } from 'preact'
import classNames from 'classnames'
import styles from './Button.module.css'

/**
 * @param {object} props
 * @param {'default'|'clear'|'ghost'} [props.variant] // More platforms to be supported in the future
 * @param {string} [props.className]
 * @param {import("preact").ComponentChild} props.children
 * @param {import("preact").JSX.MouseEventHandler<EventTarget>} [props.onClick]
 * @param {import('preact').ComponentProps<'button'>} [props.otherProps]
 */
export function Button ({ variant = 'default', className, children, onClick }) {
    return (
        <button
            className={classNames(styles.button, styles[variant], className)}
            onClick={
                /**
                 * @param {import("preact").JSX.TargetedMouseEvent<EventTarget>} event
                 */
                (event) => {
                    if (onClick) {
                        onClick(event)
                    }
                }}
        >
            {children}
        </button>
    )
}
