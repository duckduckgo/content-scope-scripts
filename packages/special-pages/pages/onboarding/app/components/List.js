import { h } from 'preact'
import styles from './List.module.css'
import { useAutoAnimate } from '@formkit/auto-animate/preact'

/**
 * List component is used to display an item in a styled
 * @param {Object} props - The properties for the ListItem component.
 * @param {import("preact").ComponentChild} props.children - The text for the title
 */
export function List (props) {
    const [parent] = useAutoAnimate()
    return (
        <ul className={styles.list} ref={parent}>
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
