import { h } from 'preact'
import styles from './DuckDuckGoLogo.module.css'

/**
 * Renders a header component.
 */
export function DuckDuckGoLogo () {
    return (
        <span className={styles.logo}>
            <span className="offscreen">DuckDuckGo</span>
        </span>
    )
}
