import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { animateCount } from './animateCount.js';

/**
 * Custom hook to animate a count value with visibility-aware and viewport-aware animation
 * @param {number} targetValue - The target value to animate to
 * @param {import('preact').RefObject<HTMLElement>} [elementRef] - Optional ref to element for viewport detection
 * @returns {number} The current animated value
 */
export function useAnimatedCount(targetValue, elementRef) {
    // Initialize to 0 so first render triggers percentage-based animation from spec
    const [animatedValue, setAnimatedValue] = useState(0);

    // Track current animated value to enable smooth incremental updates
    // Initialize to 0 so first animation uses spec's percentage-based starting point
    const animatedValueRef = useRef(/** @type {number} */ (0));

    // Track whether element is in viewport
    const [isInViewport, setIsInViewport] = useState(false);

    // Track if we've animated at least once (to prevent re-animation on re-entry)
    const hasAnimatedRef = useRef(false);

    // Memoize the update callback to avoid recreating it on every render
    const updateAnimatedCount = useCallback(
        /** @type {import('./animateCount.js').AnimationUpdateCallback} */ (
            (value) => {
                animatedValueRef.current = value;
                setAnimatedValue(value);
            }
        ),
        [],
    );

    // Setup IntersectionObserver for viewport detection
    useEffect(() => {
        // If no elementRef provided, element is always considered "in viewport"
        if (!elementRef || !elementRef.current) {
            setIsInViewport(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsInViewport(entry.isIntersecting);
                });
            },
            {
                // Trigger when any part of the element is visible
                threshold: 0,
                // Optional: add some margin to trigger slightly before visible
                rootMargin: '0px',
            },
        );

        observer.observe(elementRef.current);

        return () => {
            observer.disconnect();
        };
    }, [elementRef]);

    // Animate count when it changes, page is visible, and element is in viewport
    useEffect(() => {
        let cancelAnimation = () => {};

        const shouldAnimate = document.visibilityState === 'visible' && isInViewport;

        if (shouldAnimate) {
            // Animate from current value to target
            cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, animatedValueRef.current);
            hasAnimatedRef.current = true;
        } else if (hasAnimatedRef.current) {
            // If we've already animated once and conditions aren't met, just snap to value
            // This handles the case where value changes while element is out of viewport
            setAnimatedValue(targetValue);
            animatedValueRef.current = targetValue;
        }
        // else: conditions not met and haven't animated yet, do nothing (wait for viewport entry)

        // Listen for visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isInViewport) {
                // Page became visible and element is in viewport - start animation
                cancelAnimation();
                cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, animatedValueRef.current);
                hasAnimatedRef.current = true;
            } else if (document.visibilityState === 'hidden') {
                // Page became hidden - cancel animation and snap to final value
                cancelAnimation();
                if (hasAnimatedRef.current) {
                    setAnimatedValue(targetValue);
                    animatedValueRef.current = targetValue;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup animation and event listener
        return () => {
            cancelAnimation();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [targetValue, updateAnimatedCount, isInViewport]);

    return animatedValue;
}
