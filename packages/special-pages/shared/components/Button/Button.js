import { h } from 'preact'
import classNames from 'classnames';
import styles from './Button.module.css'

/**
 * @param {object} props
 * @param {'apple'} [props.platform] // More platforms to be supported in the future
 * @param {import("preact").ComponentChild} props.children
 */
export function Button({ platform = 'apple', children }) {
    return (
        <button className={classNames(styles.button, styles[platform])}>
            {children}
        </button>
    )
}