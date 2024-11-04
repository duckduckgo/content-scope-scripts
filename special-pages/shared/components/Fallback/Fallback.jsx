import { h } from 'preact'
import styles from './Fallback.module.css'

/**
 * @param {object} props
 * @param {boolean} props.showDetails
 */
export function Fallback({ showDetails }) {
    return (
        <div class={styles.fallback}>
            <div>
                <p>Something went wrong!</p>
                {showDetails && (
                    <p>
                        Please check logs for a message called <code>reportPageException</code>
                    </p>
                )}
            </div>
        </div>
    )
}
