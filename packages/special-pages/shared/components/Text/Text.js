import { h } from 'preact'
import classNames from 'classnames'
import styles from './Text.module.css'

/**
 * @param {object} props
 * @param {import('preact').JSX.ElementType} [props.as]
 * @param {Omit<keyof styles, "text">} [props.variant]
 * @param {string} [props.className]
 * @param {import("preact").ComponentChild} [props.children]
 * @param {import("preact").JSX.MouseEventHandler<EventTarget>} [props.onClick]
 */
export function Text ({ as: Comp = 'p', variant, className, children, onClick }) {
    return (
        <Comp className={classNames({ [styles[`${variant}`]]: variant }, className)}
            onClick={
                /**
                 * @param {import("preact").JSX.TargetedMouseEvent<EventTarget>} event
                 */
                (event) => {
                    if (onClick) {
                        onClick(event)
                    }
                }}>
            {children}
        </Comp>
    )
}
