import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { Bubble } from './Bubble';
import { useStepConfig } from '../hooks/useStepConfig';
import { TypingEffectProvider, useTypingEffect } from './TypingEffectContext';
import styles from './SingleStep.module.css';

/** @type {string|null} */
const bubbleWidthOverride = new URLSearchParams(window.location.search).get('bubbleWidth');

/** @type {string|null} */
const bubbleFadeInDelayOverride = new URLSearchParams(window.location.search).get('bubbleFadeInDelay');

/**
 * Main layout component for v4 steps.
 * Steps with bubbles use absolute positioning; the layout measures bubble heights.
 * Steps without bubbles (e.g. welcome) render content directly.
 */
export function SingleStep() {
    return (
        <TypingEffectProvider>
            <SingleStepInner />
        </TypingEffectProvider>
    );
}

function SingleStepInner() {
    const { content, topBubble, bottomBubble, showProgress, progress, bubbleWidth, globalState, bounceKey, illustration, advance } =
        useStepConfig();
    const { isTyping, titleComplete } = useTypingEffect();

    const [topHeight, setTopHeight] = useState(0);
    const [bottomHeight, setBottomHeight] = useState(0);

    /** @type {Record<string, string>} */
    const layoutStyle = {
        '--bubble-top-height': `${topHeight}px`,
        '--bubble-bottom-height': `${bottomHeight}px`,
    };
    if (bubbleWidthOverride) {
        layoutStyle['--bubble-width'] = /^\d+$/.test(bubbleWidthOverride) ? `${bubbleWidthOverride}px` : bubbleWidthOverride;
    }

    // No bubbles — render content directly (e.g., welcome step has its own full-page layout)
    if (!topBubble && !bottomBubble) {
        return content || null;
    }

    const deferBottomBubble = !!topBubble && isTyping && !titleComplete;

    return (
        <div
            class={cn(styles.layout, {
                [styles.hasTop]: !!topBubble,
                [styles.hasBottom]: !!bottomBubble,
                [styles.narrow]: bubbleWidth === 'narrow',
            })}
            style={layoutStyle}
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
                fadeInMode={isTyping && topBubble ? 'skip' : 'normal'}
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
                fadeInMode={isTyping ? (topBubble ? (deferBottomBubble ? 'deferred' : 'normal') : 'skip') : 'normal'}
                fadeInDelay={
                    topBubble
                        ? isTyping
                            ? 0
                            : (() => {
                                  const defaultTopDelay = 400; // Default fade-in delay from CSS
                                  const defaultOffset = 250; // Default 250ms offset between top and bottom
                                  const offset = bubbleFadeInDelayOverride ? Number.parseInt(bubbleFadeInDelayOverride, 10) : defaultOffset;
                                  return defaultTopDelay + (Number.isNaN(offset) ? defaultOffset : offset);
                              })()
                        : undefined
                }
            >
                {bottomBubble?.content}
            </Bubble>

            {illustration?.foreground && <div class={styles.illustrationForeground}>{illustration.foreground}</div>}

            {content}
        </div>
    );
}
