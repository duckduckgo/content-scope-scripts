import { h } from 'preact';
import { Bubble } from './Bubble';
import { ProgressIndicator } from './ProgressIndicator';
import { useStepConfig } from '../hooks/useStepConfig';
import styles from './SingleStep.module.css';

/**
 * Main layout component for v4 steps.
 * Steps with bubbles get the bubble layout (padding, max-width).
 * Steps without bubbles (e.g. welcome) render content directly.
 */
export function SingleStep() {
    const { content, topBubble, bottomBubble, showProgress, progress, topBubbleTail, globalState } = useStepConfig();
    const isGetStarted = globalState.activeStep === 'getStarted';

    // No bubbles — render content directly (e.g., welcome step has its own full-page layout)
    if (!topBubble && !bottomBubble) {
        return content || null;
    }

    return (
        <div class={styles.layout}>
            <div class={isGetStarted ? styles.bubbleColumn : styles.bubbleColumnWide}>
                {topBubble && (
                    <Bubble tail={topBubbleTail} class={isGetStarted ? styles.bubbleGetStartedIntro : undefined}>
                        {showProgress && (
                            <div class={styles.progressBadge}>
                                <ProgressIndicator current={progress.current} total={progress.total} />
                            </div>
                        )}
                        {topBubble}
                    </Bubble>
                )}

                {bottomBubble && <Bubble>{bottomBubble}</Bubble>}

                {content}
            </div>
        </div>
    );
}
