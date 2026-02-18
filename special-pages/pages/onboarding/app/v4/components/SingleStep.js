import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { Bubble } from './Bubble';
import { ProgressIndicator } from './ProgressIndicator';
import { useStepConfig } from '../hooks/useStepConfig';
import styles from './SingleStep.module.css';

const NARROW_WIDTH = 493;
const WIDE_WIDTH = 493;
const GAP = 8;

/**
 * Main layout component for v4 steps.
 * Steps with bubbles use absolute positioning; the layout measures bubble heights.
 * Steps without bubbles (e.g. welcome) render content directly.
 */
export function SingleStep() {
    const { content, topBubble, bottomBubble, showProgress, progress, bubbleWidth, introAnimation } = useStepConfig();

    const [topHeight, setTopHeight] = useState(0);
    const [, setBottomHeight] = useState(0);

    // No bubbles — render content directly (e.g., welcome step has its own full-page layout)
    if (!topBubble && !bottomBubble) {
        return content || null;
    }

    const width = bubbleWidth === 'narrow' ? NARROW_WIDTH : WIDE_WIDTH;

    return (
        <div class={styles.layout} style={{ width }}>
            {showProgress && (
                <div class={styles.progressBadge}>
                    <ProgressIndicator current={progress.current} total={progress.total} />
                </div>
            )}

            {topBubble && (
                <Bubble
                    class={cn(styles.topBubble, introAnimation && styles.bubbleIntro)}
                    style={{ width, top: 0 }}
                    tail={topBubble.tail}
                    illustration={topBubble.illustration}
                    onHeight={(h) => setTopHeight(h)}
                >
                    {topBubble.content}
                </Bubble>
            )}

            {bottomBubble && (
                <Bubble
                    class={cn(styles.bottomBubble, introAnimation && !topBubble && styles.bubbleIntro)}
                    style={{ width, top: topBubble ? topHeight + GAP : 0 }}
                    illustration={bottomBubble.illustration}
                    onHeight={(h) => setBottomHeight(h)}
                >
                    {bottomBubble.content}
                </Bubble>
            )}

            {content}
        </div>
    );
}
