import styles from './Progress.module.css'
import { h } from 'preact'
import cn from 'classnames'

/**
 * Renders a progress component indicating the current progress
 *
 * @param {Object} props - The props object
 * @param {number} props.total - The total value of the progress
 * @param {number} props.current - The current value of the progress
 * @param {'default' | 'single-line'} [props.variant="default"] - Style variant
 */
export function Progress ({ total, current, variant='default' }) {
    const classes = cn({
        [styles.progressContainer]: true,
        [styles.singleLine]: variant === 'single-line'
    })

    return (
        <div className={classes}>
            <div className={styles.count}>
                {current} / {total}
            </div>
            <progress className={styles.progress} max={total} value={current}>
                (Page {current} of circa {total})
            </progress>
        </div>
    )
}
