import { h } from 'preact';
import { useRef, useLayoutEffect } from 'preact/hooks';
import cn from 'classnames';
import styles from './Bubble.module.css';

/**
 * @typedef {object} BubbleProps
 * @property {'bottom-left'} [tail] - Direction of the speech bubble tail
 * @property {{background?: import('preact').ComponentChild, foreground?: import('preact').ComponentChild}} [illustration] - Layered illustration slots
 * @property {(height: number) => void} [onHeight] - Callback reporting measured border height
 */

/**
 * Speech bubble container with optional tail/pointer and illustration layers.
 *
 * @param {BubbleProps & import('preact').JSX.HTMLAttributes<HTMLDivElement>} props
 */
export function Bubble({ children, tail, class: className, illustration, onHeight, ...props }) {
    const borderRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    useLayoutEffect(() => {
        const el = borderRef.current;
        if (!el || !onHeight) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.borderBoxSize.length) {
                    onHeight(entry.borderBoxSize[0].blockSize);
                }
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [onHeight]);

    return (
        <div class={cn(styles.container, className)} {...props}>
            {illustration?.background && <div class={styles.backgroundLayer}>{illustration.background}</div>}
            <div class={styles.border} ref={borderRef}>
                {children}
                {tail === 'bottom-left' && <BottomLeftTail />}
            </div>
            {illustration?.foreground && <div class={styles.foregroundLayer}>{illustration.foreground}</div>}
        </div>
    );
}

function BottomLeftTail() {
    return (
        <div class={styles.bottomLeftTail} aria-hidden="true">
            <svg width="50" height="34" viewBox="0 0 50 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M49.25 0.75V2.34766H48.7021C45.8666 2.34769 43.7612 3.6682 41.8477 5.68555C39.9707 7.66432 38.175 10.432 36.0186 13.4121C31.6717 19.4191 25.5656 26.7393 13.3682 32.1523C11.8561 32.8234 10.3789 32.4409 9.36523 31.4863C8.34348 30.5241 7.80054 28.9823 8.23926 27.3457C9.05445 24.3053 9.92429 20.9248 10.5938 17.9824C11.2559 15.0722 11.7439 12.5021 11.7568 11.1328C11.7813 8.55523 10.4106 6.3471 8.48633 4.80859C6.56458 3.27217 4.02869 2.34775 1.56152 2.34766H0.75V0.75H49.25Z"
                    style="fill: var(--bubble-bg, white)"
                    stroke="url(#bubbleTailGradient)"
                    stroke-width="1.5"
                    stroke-linecap="round"
                />
                <defs>
                    <linearGradient id="bubbleTailGradient" x1="25" y1="1.5979" x2="25" y2="1.66431" gradientUnits="userSpaceOnUse">
                        <stop style="stop-color: var(--bubble-bg, white)" />
                        <stop offset="1" style="stop-color: var(--bubble-border, #CBEAFF)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
