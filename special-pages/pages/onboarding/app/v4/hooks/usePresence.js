import { useRef, useState, useLayoutEffect } from 'preact/hooks';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';

/**
 * @typedef {object} ExitConfig
 * @property {Keyframe[]} keyframes - WAAPI keyframes for the exit animation
 * @property {KeyframeAnimationOptions} [options] - WAAPI options (fill: 'forwards' is applied automatically)
 * @property {() => void} [onComplete] - Called when exit animation finishes (before mounted goes false)
 */

/**
 * Delays unmounting until an exit animation completes.
 *
 * When `show` goes from true → false:
 * 1. Measures the element's current rect.
 * 2. Fixes it in place with `position: absolute` relative to its `offsetParent`.
 * 3. Plays the exit animation.
 * 4. Calls `onComplete` and sets `mounted` to false when the animation finishes.
 *
 * When `show` goes from false → true (e.g. error recovery):
 * Cancels any active exit animation, resets inline styles, and sets `mounted` to true.
 *
 * Uses `useLayoutEffect` so the element is taken out of flow synchronously —
 * this is critical when sibling `useFlip` hooks need to measure the updated layout.
 *
 * @template {HTMLElement} [T=HTMLElement]
 * @param {boolean} show
 * @param {ExitConfig} exitConfig
 * @returns {[import('preact').RefObject<T>, boolean]}
 */
export function usePresence(show, exitConfig) {
    const ref = useRef(/** @type {T|null} */ (null));
    const [mounted, setMounted] = useState(show);
    const activeAnimation = useRef(/** @type {Animation|null} */ (null));
    const exitConfigRef = useRef(exitConfig);
    const { isReducedMotion } = useEnv();

    // Keep config ref fresh without adding it to the effect's dependency array
    exitConfigRef.current = exitConfig;

    useLayoutEffect(() => {
        if (show) {
            // Entering or re-entering — cancel any active exit and reset
            activeAnimation.current?.cancel();
            activeAnimation.current = null;

            const element = ref.current;
            if (element) {
                element.style.position = '';
                element.style.left = '';
                element.style.top = '';
                element.style.width = '';
                element.style.height = '';
            }

            setMounted(true);
            return;
        }

        // --- Exiting ---
        const element = ref.current;
        const config = exitConfigRef.current;

        if (!element) {
            config.onComplete?.();
            setMounted(false);
            return;
        }

        if (isReducedMotion) {
            config.onComplete?.();
            setMounted(false);
            return;
        }

        // Fix in place — take out of document flow so siblings reflow
        const rect = element.getBoundingClientRect();
        const offsetParent = element.offsetParent;

        if (!offsetParent || offsetParent === document.body) {
            console.warn('usePresence: element has no positioned ancestor. Add position: relative to a parent element.');
        }

        const parentRect = offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
        element.style.position = 'absolute';
        element.style.left = `${rect.left - parentRect.left}px`;
        element.style.top = `${rect.top - parentRect.top}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;

        // Play exit animation
        const animation = element.animate(config.keyframes, { fill: 'forwards', ...config.options });
        activeAnimation.current = animation;

        animation.onfinish = () => {
            activeAnimation.current = null;
            config.onComplete?.();
            setMounted(false);
        };

        return () => {
            animation.cancel();
            activeAnimation.current = null;
        };
    }, [show, isReducedMotion]);

    return [ref, mounted];
}
