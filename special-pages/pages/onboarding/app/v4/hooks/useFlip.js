import { useRef, useEffect, useLayoutEffect } from 'preact/hooks';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';

/**
 * @typedef {object} FlipOptions
 * @property {number} [duration] - Animation duration in ms (default: 300)
 * @property {string} [easing] - CSS easing function (default: cubic-bezier(0.17, 0, 0.34, 1))
 */

/**
 * Automatically FLIP-animates an element when its position changes between renders.
 *
 * Measures position relative to `offsetParent` so that movement of ancestor
 * containers (e.g. a bubble whose height is transitioning) doesn't produce
 * false deltas.
 *
 * Skips measurement while a FLIP animation is in progress to avoid
 * re-renders from unrelated state changes cancelling the animation.
 *
 * @template {HTMLElement} [T=HTMLElement]
 * @param {FlipOptions} [options]
 * @returns {import('preact').RefObject<T>}
 */
export function useFlip(options = {}) {
    const ref = useRef(/** @type {T|null} */ (null));
    const previousPosition = useRef(/** @type {{x: number, y: number}|null} */ (null));
    const activeAnimation = useRef(/** @type {Animation|null} */ (null));
    const { isReducedMotion } = useEnv();
    const { duration = 300, easing = 'cubic-bezier(0.17, 0, 0.34, 1)' } = options;

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Don't interrupt an in-progress FLIP — re-renders from unrelated state
        // changes would cancel the animation and measure delta = 0.
        if (activeAnimation.current) return;

        const position = measureRelativePosition(element);

        if (previousPosition.current && !isReducedMotion) {
            const deltaX = previousPosition.current.x - position.x;
            const deltaY = previousPosition.current.y - position.y;

            if (deltaX || deltaY) {
                const animation = element.animate([{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'none' }], {
                    duration,
                    easing,
                });
                activeAnimation.current = animation;
                animation.onfinish = () => {
                    activeAnimation.current = null;
                    previousPosition.current = measureRelativePosition(element);
                };
            }
        }

        previousPosition.current = position;
    });

    // Cancel on unmount
    useEffect(() => () => activeAnimation.current?.cancel(), []);

    return ref;
}

/**
 * Measure an element's position relative to its offsetParent.
 * @param {HTMLElement} element
 * @returns {{x: number, y: number}}
 */
function measureRelativePosition(element) {
    const offsetParent = element.offsetParent;
    if (!offsetParent || offsetParent === document.body) {
        console.warn('useFlip: element has no positioned ancestor. Add position: relative to a parent element.');
    }

    const elementRect = element.getBoundingClientRect();
    const parentRect = offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };

    return {
        x: elementRect.left - parentRect.left,
        y: elementRect.top - parentRect.top,
    };
}
