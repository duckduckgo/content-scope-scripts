import { h } from 'preact';
import styles from './ProgressIndicator.module.css';

/**
 * Dot-style progress indicator showing "X of Y".
 * Will be styled later with filled/empty dots.
 *
 * @param {object} props
 * @param {number} props.current - Current step (1-based)
 * @param {number} props.total - Total number of progress steps
 */
export function ProgressIndicator({ current, total }) {
    return (
        <div class={styles.progress}>
            {Array.from({ length: total }, (_, i) => (
                <span key={i} data-filled={i < current ? 'true' : 'false'}>
                    {'\u2022'}
                </span>
            ))}
            <span>
                {' '}
                {current} of {total}
            </span>
        </div>
    );
}
