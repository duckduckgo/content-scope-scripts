import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { Bubble } from './Bubble';
import { useStepConfig } from '../hooks/useStepConfig';
import { useTypingEffect } from '../../shared/components/SettingsProvider';
import { useGlobalState } from '../../global';
import styles from './SingleStep.module.css';

/** @type {string|null} */
const bubbleWidthOverride = new URLSearchParams(window.location.search).get('bubbleWidth');

/** Bottom bubble fade-in delay when staggered after the top bubble (overridable via ?bubbleFadeInDelay). */
const staggeredBottomDelay = (() => {
    const override = new URLSearchParams(window.location.search).get('bubbleFadeInDelay');
    const offset = override ? Number.parseInt(override, 10) : 250;
    return 400 + (Number.isNaN(offset) ? 250 : offset);
})();

/**
 * Main layout component for v4 steps.
 * Steps with bubbles use absolute positioning; the layout measures bubble heights.
 * Steps without bubbles (e.g. welcome) render content directly.
 */
export function SingleStep() {
    const { content, topBubble, bottomBubble, showProgress, progress, bubbleWidth, globalState, bounceKey, illustration, advance } =
        useStepConfig();
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible } = useGlobalState();

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

    let topFadeInMode = /** @type {'normal'|'skip'|'deferred'} */ ('normal');
    let bottomFadeInMode = /** @type {'normal'|'skip'|'deferred'} */ ('normal');
    let bottomFadeInDelay = /** @type {number|undefined} */ (topBubble ? staggeredBottomDelay : undefined);

    if (hasTypingEffect) {
        if (topBubble) {
            topFadeInMode = 'skip';
            bottomFadeInMode = activeStepVisible ? 'normal' : 'deferred';
            bottomFadeInDelay = 0;
        } else {
            bottomFadeInMode = 'skip';
        }
    }

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
                fadeInMode={topFadeInMode}
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
                fadeInMode={bottomFadeInMode}
                fadeInDelay={bottomFadeInDelay}
            >
                {bottomBubble?.content}
            </Bubble>

            {illustration?.foreground && <div class={styles.illustrationForeground}>{illustration.foreground}</div>}

            {content}
        </div>
    );
}
