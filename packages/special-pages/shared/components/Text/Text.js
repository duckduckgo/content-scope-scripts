import { h } from 'preact'
import classNames from 'classnames'
import styles from './Text.module.css'

/**
 * @param {object} props
 * @param {import('preact').JSX.ElementType} [props.as]
 * @param {Omit<keyof styles, "text">} [props.variant]
 * @param {string} [props.className]
 * @param {import("preact").ComponentChild} [props.children]
 */
export function Text ({ as: Comp = 'p', variant, className, children }) {
    return (
        <Comp className={classNames({ [styles[`${variant}`]]: variant }, className)}>
            {children}
        </Comp>
    )
}
