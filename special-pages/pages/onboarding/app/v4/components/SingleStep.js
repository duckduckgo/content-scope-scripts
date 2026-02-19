import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { Bubble } from './Bubble';
import { ProgressIndicator } from './ProgressIndicator';
import { useStepConfig } from '../hooks/useStepConfig';
import styles from './SingleStep.module.css';

const NARROW_WIDTH = 349;
const WIDE_WIDTH = 493;
const GAP = 8;

/**
 * Main layout component for v4 steps.
 * Steps with bubbles use absolute positioning; the layout measures bubble heights.
 * Steps without bubbles (e.g. welcome) render content directly.
 */
export function SingleStep() {
    const { content, topBubble, bottomBubble, showProgress, progress, bubbleWidth, introAnimation, globalState } = useStepConfig();

    const [topHeight, setTopHeight] = useState(0);
    const [bottomHeight, setBottomHeight] = useState(0);

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

            <Bubble
                class={cn(styles.bubble, introAnimation && styles.bubbleIntro)}
                style={{
                    top: 0,
                    width,
                    height: topHeight,
                    visibility: topBubble ? 'visible' : 'hidden',
                }}
                tail={topBubble?.tail}
                illustration={topBubble?.illustration}
                onHeight={(h) => setTopHeight(h)}
                bounceKey={`${globalState.activeStep}-${globalState.activeRow}`}
                bounceDelay={300} // 9f from t=0 (7f after size start at 2f)
                contentFadeName={topBubble ? 'bubble-content-top' : undefined}
            >
                {topBubble?.content}
            </Bubble>

            <Bubble
                class={cn(styles.bubble, introAnimation && !topBubble && styles.bubbleIntro)}
                style={{
                    top: topBubble ? topHeight + GAP : 0,
                    width,
                    height: bottomHeight,
                    visibility: bottomBubble ? 'visible' : 'hidden',
                }}
                tail={bottomBubble?.tail}
                illustration={bottomBubble?.illustration}
                onHeight={(h) => setBottomHeight(h)}
                bounceKey={`${globalState.activeStep}-${globalState.activeRow}`}
                bounceDelay={167} // 5f from t=0 (3f after size start at 2f)
                contentFadeName={bottomBubble ? 'bubble-content-bottom' : undefined}
            >
                {bottomBubble?.content}
            </Bubble>

            {content}
        </div>
    );
}
