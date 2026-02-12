import { h } from 'preact';
import cn from 'classnames';
import styles from './ProgressIndicator.module.css';

/**
 * Dot-style progress indicator showing "X of Y".
 *
 * @param {object} props
 * @param {number} props.current - Current step (1-based)
 * @param {number} props.total - Total number of progress steps
 */
export function ProgressIndicator({ current, total }) {
    return (
        <div class={styles.progress}>
            <div class={styles.dots}>
                {Array.from({ length: total }, (_, i) => {
                    const step = i + 1;
                    const isActive = step === current;
                    const isComplete = step < current;
                    return (
                        <span
                            key={i}
                            class={cn(styles.dot, {
                                [styles.active]: isActive,
                                [styles.complete]: isComplete,
                                [styles.incomplete]: !isActive && !isComplete,
                            })}
                        />
                    );
                })}
            </div>
            <span class={styles.text}>
                {current} of {total}
            </span>
        </div>
    );
}
