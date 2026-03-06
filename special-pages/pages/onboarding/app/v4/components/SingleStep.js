import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { Bubble } from './Bubble';
import { useStepConfig } from '../hooks/useStepConfig';
import styles from './SingleStep.module.css';

/**
 * Main layout component for v4 steps.
 * Steps with bubbles use absolute positioning; the layout measures bubble heights.
 * Steps without bubbles (e.g. welcome) render content directly.
 */
export function SingleStep() {
    const { content, topBubble, bottomBubble, showProgress, progress, bubbleWidth, globalState, bounceKey, illustration, advance } =
        useStepConfig();

    const [topHeight, setTopHeight] = useState(0);
    const [bottomHeight, setBottomHeight] = useState(0);

    // No bubbles — render content directly (e.g., welcome step has its own full-page layout)
    if (!topBubble && !bottomBubble) {
        return content || null;
    }

    return (
        <div
            class={cn(styles.layout, {
                [styles.hasTop]: !!topBubble,
                [styles.hasBottom]: !!bottomBubble,
                [styles.narrow]: bubbleWidth === 'narrow',
            })}
            style={{
                '--bubble-top-height': `${topHeight}px`,
                '--bubble-bottom-height': `${bottomHeight}px`,
            }}
        >
            <Bubble
                class={styles.topBubble}
                tail={topBubble?.tail}
                onHeight={setTopHeight}
                bounceKey={bounceKey || globalState.activeStep}
                bounceDelay={300} // 9f from t=0 (7f after size start at 2f)
                exiting={globalState.exiting}
                onExitComplete={topBubble ? advance : undefined}
                progress={showProgress && topBubble ? progress : undefined}
            >
                {topBubble?.content}
            </Bubble>

            {illustration?.background && <div class={styles.illustrationBackground}>{illustration.background}</div>}

            <Bubble
                class={styles.bottomBubble}
                tail={bottomBubble?.tail}
                onHeight={setBottomHeight}
                bounceKey={bounceKey || globalState.activeStep}
                bounceDelay={167} // 5f from t=0 (3f after size start at 2f)
                exiting={globalState.exiting}
                onExitComplete={topBubble ? undefined : advance}
                progress={showProgress && !topBubble ? progress : undefined}
            >
                {bottomBubble?.content}
            </Bubble>

            {illustration?.foreground && <div class={styles.illustrationForeground}>{illustration.foreground}</div>}

            {content}
        </div>
    );
}
