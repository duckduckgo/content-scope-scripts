import { h } from 'preact'
import cn from 'classnames'

import styles from './Panel.module.css'

/**
 * @param {object} props
 * @param {boolean} [props.boxed=true] - Wrap panel in a styled box
 * @param {import("preact").ComponentChild} props.children
 */
export function Panel ({ boxed, children }) {
    return (
        <div className={cn(styles.panel, { [styles.boxed]: boxed })}>
            {children}
        </div>
    )
}
