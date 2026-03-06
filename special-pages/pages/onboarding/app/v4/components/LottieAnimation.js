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
 * @param {() => void} [props.onComplete] - Called when the animation finishes (if not looping)
 * @param {string} [props.label] - Accessible label for the animation
 * @param {string} [props.class] - CSS class name for the container
 */
export function LottieAnimation({ src, darkSrc, width, height, loop = false, onComplete, label, class: className }) {
    const ref = useRef(/** @type {HTMLDivElement | null} */ (null));
    const frameRef = useRef(/** @type {number} */ (0));
    const { isReducedMotion, isDarkMode } = useEnv();
    const resolvedSrc = darkSrc && isDarkMode ? darkSrc : src;

    useEffect(() => {
        if (!ref.current) return;

        const startFrame = frameRef.current;

        /** @type {import('lottie-web').AnimationItem | null} */
        const animation = lottie.loadAnimation({
            container: ref.current,
            renderer: 'svg',
            loop,
            autoplay: !isReducedMotion && startFrame === 0,
            path: resolvedSrc,
        });

        animation.addEventListener('DOMLoaded', () => {
            const lastFrame = animation.totalFrames - 1;
            if (isReducedMotion) {
                animation.goToAndStop(lastFrame, true);
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
            animation.destroy();
        };
    }, [resolvedSrc, loop, onComplete, isReducedMotion]);

    return (
        <div
            ref={ref}
            class={className}
            role={label ? 'img' : 'presentation'}
            aria-label={label}
            aria-hidden={label ? undefined : 'true'}
            style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
        />
    );
}
