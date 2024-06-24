import { h } from 'preact'
import styles from './List.module.css'
import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { useEnv } from '../environment'

/**
 * List component is used to display an item in a styled
 * @param {Object} props - The properties for the ListItem component.
 * @param {import("preact").ComponentChild} props.children - The text for the title
 * @param {boolean} [props.animate=false] - Should immediate children be animated into place?
 */
export function List (props) {
    const { isReducedMotion } = useEnv()
    const [parent] = useAutoAnimate(isReducedMotion ? { duration: 0 } : undefined)
    return (
        <ul className={styles.list} ref={props.animate ? parent : null}>
            {props.children}
        </ul>
    )
}

/**
 * SummaryList component is used to display an item in a list.
 * @param {Object} props - The properties for the ListItem component.
 * @param {import("preact").ComponentChild} props.children - The text for the title
 */
export function SummaryList (props) {
    return (
        <ul className={styles.summaryList}>
            {props.children}
        </ul>
    )
}
