import { h } from 'preact';
import cn from 'classnames';
import { useGlobalDispatch, useGlobalState } from '../../global';
import styles from './ProgressIndicator.module.css';

/**
 * Dot-style progress indicator showing "X of Y".
 * When onboarding is resumed from the setup checklist, the dots become buttons for jumping between steps.
 *
 * @param {object} props
 * @param {number} props.current - Current step (1-based)
 * @param {number} props.total - Total number of progress steps
 */
export function ProgressIndicator({ current, total }) {
    const { resumed, order } = useGlobalState();
    const dispatch = useGlobalDispatch();
    // Matches calculateProgress: 'welcome' and 'getStarted' don't count
    const progressSteps = order.slice(2);

    return (
        <div class={styles.progress}>
            <div class={cn(styles.dots, { [styles.jumpable]: resumed })}>
                {Array.from({ length: total }, (_, i) => {
                    const step = i + 1;
                    const isActive = step === current;
                    const isComplete = step < current;
                    const dot = (
                        <span
                            class={cn(styles.dot, {
                                [styles.active]: isActive,
                                [styles.complete]: isComplete,
                                [styles.incomplete]: !isActive && !isComplete,
                            })}
                        />
                    );
                    if (!resumed) return <span key={i}>{dot}</span>;
                    return (
                        <button
                            key={i}
                            type="button"
                            class={styles.dotButton}
                            aria-label={`Go to step ${step} of ${total}`}
                            aria-current={isActive ? 'step' : undefined}
                            onClick={() => dispatch({ kind: 'jump-to-step', id: progressSteps[i] })}
                        >
                            {dot}
                        </button>
                    );
                })}
            </div>
            <span class={styles.text}>
                {current} of {total}
            </span>
        </div>
    );
}
