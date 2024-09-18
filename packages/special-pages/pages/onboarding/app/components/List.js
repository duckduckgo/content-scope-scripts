import { h } from 'preact'
import cn from 'classnames'
import styles from './List.module.css'
import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'

/**
 * List component is used to display an item in a styled
 * @param {Object} props - The properties for the List component.
 * @param {import("preact").ComponentChild} props.children - List children
 * @param {boolean} [props.animate=false] - Should immediate children be animated into place?
 */
export function List ({ animate = false, children }) {
    const { isReducedMotion } = useEnv()
    const [parent] = useAutoAnimate(isReducedMotion ? { duration: 0 } : undefined)

    return (
        <ul className={styles.list} ref={animate ? parent : null}>
            {children}
        </ul>
    )
}

/**
 * Plain list component is used to display an item in a list with minimal styling
 * @param {Object} props - The properties for the PlainList component.
 * @param {'default'|'bordered'} [props.variant='default'] - Whether to show a border between list items
 * @param {import("preact").ComponentChild} props.children - List children
 */
export function PlainList ({ children, variant }) {
    const classes = cn({
        [styles.plainList]: true,
        [styles.borderedList]: variant === 'bordered'
    })

    return (
        <ul className={classes}>
            {children}
        </ul>
    )
}

/**
 * SummaryList component is used to display an item in a list.
 * @param {Object} props - The properties for the SymmaryList component.
 * @param {import("preact").ComponentChild} props.children - List children
 */
export function SummaryList (props) {
    return (
        <ul className={styles.summaryList}>
            {props.children}
        </ul>
    )
}
