import { h } from 'preact'
import classNames from 'classnames'
import styles from './Card.module.css'

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 * @param {string} props.className
 */
export function Card({ children, className }) {
    return (
        <section className={classNames(styles.card, className)} tabindex={0}>
            {children}
        </section>
    )
}