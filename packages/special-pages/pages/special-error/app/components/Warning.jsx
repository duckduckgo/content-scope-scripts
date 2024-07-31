import { h } from 'preact'
import styles from './Warning.module.css'

export function Warning() {
    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>
                <i className={styles.icon} aria-hidden="true" />
                {/* <img src="shieldIcon" alt="Warning" class="watermark" /> */}
                {/*header*/}
            </h1>
            <p className={styles.warningText}>{/*body*/}</p>
            <div className={styles.buttonContainer}>
                <button class="button advanced" id="advancedBtn">{/*advancedButton*/}</button>
                <button class="button leave-this-site" id="leaveThisSiteBtn">{/*leaveSiteButton*/}</button>
            </div>
        </div>
    )
}