import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { animateCount } from './animateCount.js';

/**
 * Custom hook to animate a count value with visibility-aware and
 * viewport-aware animation
 *
 * IMPORTANT: In webview contexts (especially macOS), the NTP webview stays
 * alive and processes updates in the background even when not visible. This
 * hook tracks the "last seen" value when the element becomes invisible and
 * animates from that value to the new target when it becomes visible again.
 *
 * Detection methods (in order of reliability):
 * 1. Native visibility notification via messaging (e.g., 'ntp_becameVisible'
 *    subscription) - MOST RELIABLE (Not yet implemented - see @todo below)
 * 2. IntersectionObserver (element enters/exits webview viewport) - CURRENTLY USED
 * 3. document.visibilityState (page visibility API) - CURRENTLY USED (may not
 *    work if webview stays alive)
 *
 * @param {number} targetValue - The target value to animate to
 * @param {import('preact').RefObject<HTMLElement>} [elementRef] - Optional ref
 * to element for viewport detection
 * @returns {number} The current animated value
 *
 * @todo IDEAL SOLUTION: Native code should send a message (e.g.,
 * 'ntp_becameVisible') when the NTP webview becomes visible to the user. This
 * would be more reliable than JavaScript-only detection. We could subscribe to
 * this message and trigger animation when received.
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

    // Track the last value that was displayed when the page was visible
    // This allows us to animate from the last seen value when returning to NTP
    const lastSeenValueRef = useRef(/** @type {number | null} */ (null));

    // Track whether we were visible the last time we checked
    // Used to detect transitions from hidden -> visible
    const wasVisibleRef = useRef(false);

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

    // Track previous viewport state for IntersectionObserver callback
    const wasInViewportRef = useRef(false);

    // Setup IntersectionObserver for viewport detection
    useEffect(() => {
        // If no elementRef provided, element is always considered "in viewport"
        if (!elementRef || !elementRef.current) {
            setIsInViewport(true);
            wasInViewportRef.current = true;

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const wasInViewport = wasInViewportRef.current;
                    const isNowInViewport = entry.isIntersecting;

                    // When element exits viewport, save current displayed value as "last seen"
                    // This is the value the user last saw, and we'll animate from this when returning
                    if (wasInViewport && !isNowInViewport) {
                        // Save the value that was displayed when element became invisible
                        // This handles the case where user navigates away while NTP is visible
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

        observer.observe(elementRef.current);

        return () => {
            observer.disconnect();
        };
    }, [elementRef]);

    // Animate count when it changes, page is visible, and element is in viewport
    useEffect(() => {
        let cancelAnimation = () => {};

        const isCurrentlyVisible = document.visibilityState === 'visible' && isInViewport;
        const wasVisible = wasVisibleRef.current;
        const becameVisible = isCurrentlyVisible && !wasVisible;
        // We're returning to NTP if we became visible AND we have a last seen value
        // This means the element was visible before, became invisible, and is now visible again
        const isReturningToNTP = becameVisible && lastSeenValueRef.current !== null;

        // Update visibility tracking
        wasVisibleRef.current = isCurrentlyVisible;

        if (isCurrentlyVisible) {
            // Determine starting value for animation
            let startValue = animatedValueRef.current;

            // If we're returning to NTP and the target value has changed, animate from last seen value
            if (isReturningToNTP && lastSeenValueRef.current !== null && lastSeenValueRef.current !== targetValue) {
                startValue = lastSeenValueRef.current;
                // Reset animation state to allow re-animation
                hasAnimatedRef.current = false;
            }

            // Animate from start value to target
            cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, startValue);
            hasAnimatedRef.current = true;

            // After animation starts, update last seen to target (will be updated as animation progresses)
            // This ensures next time we hide, we save the correct final value
        } else {
            // Page is not visible
            if (wasVisible) {
                // We just became hidden - save the current displayed value as last seen
                // This is the value the user last saw, and we'll animate from this when returning
                lastSeenValueRef.current = animatedValueRef.current;
            }

            if (hasAnimatedRef.current) {
                // If we've already animated once and conditions aren't met, just snap to value
                // This handles the case where value changes while element is out of viewport
                setAnimatedValue(targetValue);
                animatedValueRef.current = targetValue;
            }
            // else: conditions not met and haven't animated yet, do nothing (wait for viewport entry)
        }

        // Listen for visibility changes
        const handleVisibilityChange = () => {
            const isNowVisible = document.visibilityState === 'visible' && isInViewport;
            const wasVisibleBefore = wasVisibleRef.current;
            const becameVisibleNow = isNowVisible && !wasVisibleBefore;
            const isReturningToNTPNow = becameVisibleNow && lastSeenValueRef.current !== null;

            wasVisibleRef.current = isNowVisible;

            if (isNowVisible) {
                // Determine starting value
                let startValue = animatedValueRef.current;

                // If returning to NTP and value changed, animate from last seen
                if (isReturningToNTPNow && lastSeenValueRef.current !== null && lastSeenValueRef.current !== targetValue) {
                    startValue = lastSeenValueRef.current;
                    hasAnimatedRef.current = false;
                }

                // Page became visible and element is in viewport - start animation
                cancelAnimation();
                cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, startValue);
                hasAnimatedRef.current = true;
            } else if (document.visibilityState === 'hidden') {
                // Page became hidden - save current value and cancel animation
                cancelAnimation();
                if (hasAnimatedRef.current) {
                    lastSeenValueRef.current = animatedValueRef.current;
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
