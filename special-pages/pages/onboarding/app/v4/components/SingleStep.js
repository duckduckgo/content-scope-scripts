import { h } from 'preact';
import { Bubble } from './Bubble';
import { ProgressIndicator } from './ProgressIndicator';
import { useStepConfig } from '../hooks/useStepConfig';
import styles from './SingleStep.module.css';

/**
 * Main layout component for v4 steps.
 * Renders content (outside bubbles), top bubble, and optional bottom bubble.
 */
export function SingleStep() {
    const { content, topBubble, bottomBubble, showProgress, progress } = useStepConfig();

    return (
        <div class={styles.layout}>
            {content}

            {topBubble && (
                <Bubble>
                    {showProgress && <ProgressIndicator current={progress.current} total={progress.total} />}
                    {topBubble}
                </Bubble>
            )}

            {bottomBubble && <Bubble>{bottomBubble}</Bubble>}
        </div>
    );
}
