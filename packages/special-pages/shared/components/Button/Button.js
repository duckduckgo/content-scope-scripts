import { h } from 'preact'
import classNames from 'classnames'
import styles from './Button.module.css'

/**
 * @param {object} props
 * @param {'standard'|'accent'} [props.style] - button style (macOS-specific)
 * @param {'primary'|'ghost'} [props.type] - button type (iOS-specific)
 * @param {string} [props.className]
 * @param {import("preact").ComponentChild} props.children
 * @param {import("preact").JSX.MouseEventHandler<EventTarget>} [props.onClick]
 * @param {import('preact').ComponentProps<'button'>} [props.otherProps]
 */
export function Button ({ style: buttonStyle, type: buttonType , className, children, onClick }) {
    return (
        <button
            className={classNames(styles.button, { [styles[`${buttonStyle}`]]: buttonStyle, [styles[`${buttonType}`]]: buttonType }, className)}
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
