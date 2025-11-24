import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { animateCount } from './animateCount.js';

/**
 * Custom hook to animate a count value with visibility-aware animation
 * @param {number} targetValue - The target value to animate to
 * @returns {number} The current animated value
 */
export function useAnimatedCount(targetValue) {
    // Initialize to 0 so first render triggers percentage-based animation from spec
    const [animatedValue, setAnimatedValue] = useState(0);

    // Track current animated value to enable smooth incremental updates
    // Initialize to 0 so first animation uses spec's percentage-based starting point
    const animatedValueRef = useRef(/** @type {number} */ (0));

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

    // Animate count when it changes and page is visible
    useEffect(() => {
        let cancelAnimation = () => {};

        // Start animation if page is currently visible
        if (document.visibilityState === 'visible') {
            cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, animatedValueRef.current);
        } else {
            // Page is hidden - set value immediately without animation
            setAnimatedValue(targetValue);
            animatedValueRef.current = targetValue;
        }

        // Listen for visibility changes to start/stop animation
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Page became visible - start animation from current displayed value
                cancelAnimation();
                cancelAnimation = animateCount(targetValue, updateAnimatedCount, undefined, animatedValueRef.current);
            } else {
                // Page became hidden - cancel animation and snap to final value
                cancelAnimation();
                setAnimatedValue(targetValue);
                animatedValueRef.current = targetValue;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup animation and event listener
        return () => {
            cancelAnimation();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [targetValue, updateAnimatedCount]);

    return animatedValue;
}
