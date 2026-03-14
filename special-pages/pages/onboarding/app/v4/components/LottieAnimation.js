import { h } from 'preact';
import lottie from 'lottie-web';
import { useEffect, useRef } from 'preact/hooks';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';

/**
 * Renders a Lottie animation from a JSON file path.
 *
 * @param {object} props
 * @param {string} props.src - Path to the Lottie JSON file (relative to public/)
 * @param {string} [props.darkSrc] - Dark mode path to the Lottie JSON file (relative to public/)
 * @param {number} [props.width] - Width in pixels
 * @param {number} [props.height] - Height in pixels
 * @param {boolean} [props.loop] - Whether to loop the animation
 * @param {boolean} [props.autoplay] - Whether to auto-play when loaded (default true)
 * @param {() => void} [props.onComplete] - Called when the animation finishes (if not looping)
 * @param {string} [props.label] - Accessible label for the animation
 * @param {import('preact').RefObject<import('lottie-web').AnimationItem | null>} [props.animationRef] - Ref to the underlying lottie AnimationItem
 * @param {string} [props.class] - CSS class name for the container
 */
export function LottieAnimation({
    src,
    darkSrc,
    width,
    height,
    loop = false,
    autoplay = true,
    onComplete,
    label,
    class: className,
    animationRef,
}) {
    const { isReducedMotion, isDarkMode } = useEnv();
    const resolvedSrc = darkSrc && isDarkMode ? darkSrc : src;

    const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));

    // Keep track of frame between unmount and re-mount so that animation starts where it left off
    // e.g. when user switches between light and dark mode.
    const frameRef = useRef(/** @type {number} */ (0));

    useEffect(() => {
        if (!containerRef.current) return;

        const startFrame = frameRef.current;

        const animation = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop,
            autoplay: autoplay && !isReducedMotion && startFrame === 0,
            path: resolvedSrc,
        });

        if (animationRef) {
            animationRef.current = animation;
        }

        animation.addEventListener('DOMLoaded', () => {
            const lastFrame = animation.totalFrames - 1;
            if (isReducedMotion) {
                animation.goToAndStop(lastFrame, true);
            } else if (!autoplay) {
                animation.goToAndStop(0, true);
            } else if (startFrame > 0) {
                const frame = Math.min(startFrame, lastFrame);
                animation.goToAndPlay(frame, true);
            }
        });

        if (onComplete && !loop) {
            animation.addEventListener('complete', onComplete);
        }

        return () => {
            frameRef.current = animation.currentFrame;
            if (animationRef) animationRef.current = null;
            animation.destroy();
        };
    }, [resolvedSrc, loop, onComplete, isReducedMotion]);

    return (
        <div
            ref={containerRef}
            class={className}
            role={label ? 'img' : 'presentation'}
            aria-label={label}
            aria-hidden={label ? undefined : 'true'}
            style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
        />
    );
}
