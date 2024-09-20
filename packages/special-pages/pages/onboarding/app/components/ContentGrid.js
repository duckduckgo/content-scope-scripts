import { h } from 'preact'
import { SingleLineProgress } from './Progress'

import styles from './ContentGrid.module.css'

/**
 * @param {object} props
 * @param {number} [props.currentProgress]
 * @param {number} [props.totalProgress]
 * @param {h.JSX.Element|null} [props.dismissButton=null]
 * @param {h.JSX.Element|null} [props.acceptButton=null]
 * @param {import("preact").ComponentChild} props.children
 */
export function ContentGrid ({ currentProgress, totalProgress, dismissButton = null, acceptButton = null, children }) {
    return (
        <div className={styles.container} >
            <div className={styles.content}>
                {children}
            </div>
            <div className={styles.progress}>
                {currentProgress && totalProgress && <SingleLineProgress current={currentProgress} total={totalProgress} />}
            </div>

            <div className={styles.spacer}></div>

            <div className={styles.skip}>
                {dismissButton}
            </div>

            <div className={styles.accept}>
                {acceptButton}
            </div>
        </div>
    )
}
