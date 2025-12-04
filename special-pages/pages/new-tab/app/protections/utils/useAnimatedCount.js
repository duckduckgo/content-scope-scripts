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

    // Track the last value that was displayed when element exited viewport
    const lastSeenValueRef = useRef(/** @type {number | null} */ (null));
    const wasInViewportRef = useRef(false);

    // Track if observer has been set up to avoid duplicate setup
    const observerSetupRef = useRef(false);
    // Store observer instance for cleanup
    const observerRef = useRef(/** @type {IntersectionObserver | null} */ (null));

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

    // Helper function to create and set up IntersectionObserver
    const setupIntersectionObserver = useCallback(
        (element) => {
            // Prevent duplicate setup
            if (observerSetupRef.current || observerRef.current) {
                return;
            }

            observerSetupRef.current = true;
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const wasInViewport = wasInViewportRef.current;
                        const isNowInViewport = entry.isIntersecting;

                        // When element exits viewport, save current displayed value
                        if (wasInViewport && !isNowInViewport) {
                            lastSeenValueRef.current = animatedValueRef.current;
                        }

                        wasInViewportRef.current = isNowInViewport;
                        setIsInViewport(isNowInViewport);
                    });
                },
                {
                    // Trigger when any part of the element is visible
                    threshold: 0,
                    // Optional: add some margin to trigger slightly before visible
                    rootMargin: '0px',
                },
            );

            observerRef.current.observe(element);
        },
        [],
    );

    // Setup IntersectionObserver for viewport detection
    // Effect runs once on mount and checks elementRef.current
    // Since refs are assigned synchronously during commit, elementRef.current should be available
    // But we handle the edge case where it might not be yet using a microtask
    // Note: elementRef is not in dependencies because ref objects maintain stable identity
    useEffect(() => {
        // If no elementRef provided, element is always considered "in viewport"
        if (!elementRef) {
            setIsInViewport(true);
            return;
        }

        // Check if element is available immediately
        const element = elementRef.current;
        let cancelled = false;

        if (element) {
            // Element is available, set up observer immediately
            setupIntersectionObserver(element);
        } else {
            // If element not available, use a microtask to check again
            // This handles edge cases where ref assignment is delayed
            Promise.resolve().then(() => {
                // Check if effect was cleaned up before microtask executed
                if (cancelled) {
                    return;
                }

                const delayedElement = elementRef.current;
                if (delayedElement) {
                    setupIntersectionObserver(delayedElement);
                }
            });
        }

        return () => {
            cancelled = true;
            observerSetupRef.current = false;
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array: run once on mount. elementRef is stable, setupIntersectionObserver is memoized

    // Animate count when it changes, page is visible, and element is in viewport
    useEffect(() => {
        let cancelAnimation = () => {};

        const shouldAnimate = document.visibilityState === 'visible' && isInViewport;

        if (shouldAnimate) {
            // Determine starting value for animation
            let startValue = animatedValueRef.current;

            // If we have a last seen value, animate from that
            if (lastSeenValueRef.current !== null && lastSeenValueRef.current !== targetValue) {
                startValue = lastSeenValueRef.current;
                lastSeenValueRef.current = null; // Clear after use
            }

            // Animate from start value to target
            cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, startValue);
            hasAnimatedRef.current = true;
        } else if (hasAnimatedRef.current) {
            // If we've already animated once and conditions aren't met, just snap to value
            // This handles the case where value changes while element is out of viewport
            setAnimatedValue(targetValue);
            animatedValueRef.current = targetValue;
            // Clear lastSeenValueRef since we've updated to the new target
            // This prevents stale values from causing backward jumps on re-entry
            lastSeenValueRef.current = null;
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
                    // Clear lastSeenValueRef since we've updated to the current target
                    lastSeenValueRef.current = null;
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
