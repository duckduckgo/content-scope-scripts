import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Bubble } from './Bubble';
import { useStepConfig } from '../hooks/useStepConfig';
import { useGlobalDispatch } from '../../global';
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
    const { content, topBubble, bottomBubble, showProgress, progress, bubbleWidth, globalState, bounceKey, illustration } = useStepConfig();
    const dispatch = useGlobalDispatch();
    const handleExitComplete = () => dispatch({ kind: 'advance' });

    const [topHeight, setTopHeight] = useState(0);
    const [bottomHeight, setBottomHeight] = useState(0);

    // No bubbles — render content directly (e.g., welcome step has its own full-page layout)
    if (!topBubble && !bottomBubble) {
        return content || null;
    }

    const width = bubbleWidth === 'narrow' ? NARROW_WIDTH : WIDE_WIDTH;

    // When the top bubble is hidden (no topBubble), mirror the bottom bubble's
    // height so it's pre-sized for a smooth "split" transition when it appears.
    const effectiveTopHeight = topBubble ? topHeight : bottomHeight;

    return (
        <div class={styles.layout} style={{ width }}>
            <Bubble
                class={styles.bubble}
                style={{
                    top: 0,
                    width,
                    height: effectiveTopHeight,
                    visibility: topBubble ? 'visible' : 'hidden',
                }}
                tail={topBubble?.tail}
                onHeight={setTopHeight}
                bounceKey={bounceKey || globalState.activeStep}
                bounceDelay={300} // 9f from t=0 (7f after size start at 2f)
                exiting={globalState.exiting}
                contentWidth={width}
                onExitComplete={topBubble ? handleExitComplete : undefined}
                progress={showProgress && topBubble ? progress : undefined}
            >
                {topBubble?.content}
            </Bubble>

            {illustration?.background && (
                <div class={styles.illustrationBackground} style={{ top: topBubble ? effectiveTopHeight + GAP : 0 }}>
                    {illustration.background}
                </div>
            )}

            <Bubble
                class={styles.bubble}
                style={{
                    top: topBubble ? effectiveTopHeight + GAP : 0,
                    width,
                    height: bottomHeight,
                    visibility: bottomBubble ? 'visible' : 'hidden',
                }}
                tail={bottomBubble?.tail}
                contentWidth={width}
                onHeight={setBottomHeight}
                bounceKey={bounceKey || globalState.activeStep}
                bounceDelay={167} // 5f from t=0 (3f after size start at 2f)
                exiting={globalState.exiting}
                onExitComplete={topBubble ? undefined : handleExitComplete}
                progress={showProgress && !topBubble ? progress : undefined}
            >
                {bottomBubble?.content}
            </Bubble>

            {illustration?.foreground && (
                <div class={styles.illustrationForeground} style={{ top: topBubble ? effectiveTopHeight + GAP : 0 }}>
                    {illustration.foreground}
                </div>
            )}

            {content}
        </div>
    );
}
