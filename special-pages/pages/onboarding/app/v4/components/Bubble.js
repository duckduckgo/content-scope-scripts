import { h } from 'preact';
import { useRef, useLayoutEffect, useEffect } from 'preact/hooks';
import cn from 'classnames';
import styles from './Bubble.module.css';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';

/**
 * @typedef {object} BubbleProps
 * @property {'bottom-left'} [tail] - Direction of the speech bubble tail
 * @property {{background?: import('preact').ComponentChild, foreground?: import('preact').ComponentChild}} [illustration] - Layered illustration slots
 * @property {(height: number) => void} [onHeight] - Callback reporting measured border height
 * @property {string} [animationKey] - When this value changes, the bubble plays a scale-bounce animation
 * @property {number} [animationDelay] - When this value changes, the bubble plays a scale-bounce animation
 */

/**
 * Speech bubble with size and bounce animation support.
 *
 * Three nested layers because `.bubble` receives an explicit height from
 * SingleStep that transitions via CSS — so we need a way to both clip
 * content during the transition and measure what the height *should* be:
 *
 * ```
 * .bubble      — the visible frame (border, radius, shadow). Has explicit
 *                width+height set by SingleStep. Scale-bounce target.
 * .container   — overflow: hidden. Clips children to the bubble's current
 *                (possibly mid-transition) dimensions.
 * content div  — flows naturally so ResizeObserver can measure the content's
 *                intrinsic height and report it up via onHeight.
 * ```
 *
 * @see https://www.youtube.com/watch?v=5NzPd-xW4YY
 *
 * @param {BubbleProps & import('preact').JSX.HTMLAttributes<HTMLDivElement>} props
 */
export function Bubble({ children, tail, class: className, illustration, onHeight, animationKey, animationDelay, ...props }) {
    const bubbleRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const contentRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const prevAnimationKey = useRef(/** @type {string|undefined} */ (undefined));
    const { isReducedMotion } = useEnv();

    useLayoutEffect(() => {
        const bubble = bubbleRef.current;
        const container = containerRef.current;
        const content = contentRef.current;
        if (!bubble || !container || !content || !onHeight) return;

        const observer = new ResizeObserver(() => {
            const height = measureBubbleHeight(bubble, container, content);
            onHeight(height);
        });
        observer.observe(content);
        return () => observer.disconnect();
    }, [onHeight]);

    // Scale bounce on animationKey change
    useEffect(() => {
        const bubble = bubbleRef.current;
        const didAnimationKeyChange = prevAnimationKey.current !== undefined && prevAnimationKey.current !== animationKey;

        prevAnimationKey.current = animationKey;

        if (!bubble || !didAnimationKeyChange || isReducedMotion) return;

        const animation = bubble.animate(
            [
                { scale: 1, easing: 'cubic-bezier(0.17, 0, 0.83, 1)' },
                { scale: 1.07, offset: 0.5, easing: 'cubic-bezier(0.17, 0, 0.83, 1)' },
                { scale: 1 },
            ],
            {
                duration: 467, // 14 frames at 30fps
                delay: animationDelay,
            },
        );

        return () => {
            animation.cancel();
        };
    }, [animationKey, isReducedMotion]);

    return (
        <div ref={bubbleRef} class={cn(styles.bubble, className)} {...props}>
            {illustration?.background && <div class={styles.background}>{illustration.background}</div>}
            <div ref={containerRef} class={styles.container}>
                <div ref={contentRef}>{children}</div>
            </div>
            {tail === 'bottom-left' && <BottomLeftTail />}
            {illustration?.foreground && <div class={styles.foreground}>{illustration.foreground}</div>}
        </div>
    );
}

/**
 * Measure the total border-box height the bubble needs for its content.
 * @param {HTMLElement} bubble
 * @param {HTMLElement} container
 * @param {HTMLElement} content
 * @returns {number}
 */
function measureBubbleHeight(bubble, container, content) {
    const bubbleStyle = getComputedStyle(bubble);
    const containerStyle = getComputedStyle(container);
    return (
        parseFloat(bubbleStyle.borderTopWidth) +
        parseFloat(bubbleStyle.borderBottomWidth) +
        parseFloat(containerStyle.paddingTop) +
        parseFloat(containerStyle.paddingBottom) +
        content.offsetHeight
    );
}

function BottomLeftTail() {
    return (
        <div class={styles.bottomLeftTail} aria-hidden="true">
            <svg width="50" height="34" viewBox="0 0 50 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M49.25 0.75V2.34766H48.7021C45.8666 2.34769 43.7612 3.6682 41.8477 5.68555C39.9707 7.66432 38.175 10.432 36.0186 13.4121C31.6717 19.4191 25.5656 26.7393 13.3682 32.1523C11.8561 32.8234 10.3789 32.4409 9.36523 31.4863C8.34348 30.5241 7.80054 28.9823 8.23926 27.3457C9.05445 24.3053 9.92429 20.9248 10.5938 17.9824C11.2559 15.0722 11.7439 12.5021 11.7568 11.1328C11.7813 8.55523 10.4106 6.3471 8.48633 4.80859C6.56458 3.27217 4.02869 2.34775 1.56152 2.34766H0.75V0.75H49.25Z"
                    style="fill: var(--bubble-bg)"
                    stroke="url(#bubbleTailGradient)"
                    stroke-width="1.5"
                    stroke-linecap="round"
                />
                <defs>
                    <linearGradient id="bubbleTailGradient" x1="25" y1="1.5979" x2="25" y2="1.66431" gradientUnits="userSpaceOnUse">
                        <stop style="stop-color: var(--bubble-bg)" />
                        <stop offset="1" style="stop-color: var(--bubble-border)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
