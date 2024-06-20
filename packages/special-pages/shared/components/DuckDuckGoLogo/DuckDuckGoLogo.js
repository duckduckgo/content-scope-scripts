import { h } from 'preact'
import styles from './DuckDuckGoLogo.module.css'

/**
 * Renders a header component.
 */
export function DuckDuckGoLogo () {
    return (
        <header className={styles.header}>
            <span className="offscreen">DuckDuckGo</span>
        </header>
    )
}
