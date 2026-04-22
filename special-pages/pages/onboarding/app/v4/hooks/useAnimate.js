import { useRef, useEffect, useCallback } from 'preact/hooks';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';

/** @typedef {(keyframes: Keyframe[], options?: KeyframeAnimationOptions) => Promise<void>} AnimateFn */

/**
 * Low-level imperative animation hook. Returns a ref and an `animate` function
 * that plays a WAAPI animation on the ref'd element.
 *
 * - Cancels any in-progress animation before starting a new one.
 * - No-ops when `isReducedMotion` is true (resolves immediately).
 * - Cancels on unmount.
 *
 * @template {Element} [T=Element]
 * @returns {[import('preact').RefObject<T>, (keyframes: Keyframe[], options?: KeyframeAnimationOptions) => Promise<void>]}
 */
export function useAnimate() {
    const ref = useRef(/** @type {T|null} */ (null));
    const activeAnimation = useRef(/** @type {Animation|null} */ (null));
    const { isReducedMotion } = useEnv();

    const animate = useCallback(
        async (/** @type {Keyframe[]} */ keyframes, /** @type {KeyframeAnimationOptions} */ options) => {
            activeAnimation.current?.cancel();

            if (!ref.current || isReducedMotion) return;

            const animation = ref.current.animate(keyframes, options);
            activeAnimation.current = animation;

            try {
                await animation.finished;
                if (activeAnimation.current === animation) activeAnimation.current = null;
            } catch {
                // Swallow AbortError from .cancel()
            }
        },
        [isReducedMotion],
    );

    // Cancel on unmount
    useEffect(() => () => activeAnimation.current?.cancel(), []);

    return [ref, animate];
}
