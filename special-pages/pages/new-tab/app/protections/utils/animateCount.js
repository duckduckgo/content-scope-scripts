/**
 * Animates a number count following the tracker count animation specification
 * @param {number} targetValue - The final value to animate to
 * @param {(value: number) => void} onUpdate - Callback called with the current value on each frame
 * @param {() => void} [onComplete] - Optional callback when animation completes
 * @param {number | null} [fromValue] - Starting value for animation. If null/0, uses spec's percentage-based start
 * @returns {() => void} Cancel function to stop the animation
 */
export function animateCount(targetValue, onUpdate, onComplete, fromValue = null) {
    const ANIMATION_DURATION = 500; // ms
    const MIN_ANIMATION_THRESHOLD = 5;
    const UPPER_THRESHOLD = 40;
    const LOWER_START_PERCENTAGE = 0.75;
    const UPPER_START_PERCENTAGE = 0.85;
    const MAX_DISPLAY_COUNT = 9999;

    // Cap the target value at 9999
    const cappedTarget = Math.min(targetValue, MAX_DISPLAY_COUNT);
    const isInitialDisplay = fromValue === null || fromValue === 0;

    // Determine start value
    let startValue;
    if (!isInitialDisplay) {
        // Incremental update: animate from current displayed value
        startValue = Math.min(fromValue, MAX_DISPLAY_COUNT);
    } else {
        // Initial display: follow spec's percentage-based logic
        // No animation for counts < 5 on initial display
        if (cappedTarget < MIN_ANIMATION_THRESHOLD) {
            onUpdate(cappedTarget);
            // Still apply 500ms delay before completing
            const timeoutId = setTimeout(() => {
                onComplete?.();
            }, ANIMATION_DURATION);
            return () => clearTimeout(timeoutId);
        }

        // Determine start percentage based on count
        const startPercentage = cappedTarget >= UPPER_THRESHOLD ? UPPER_START_PERCENTAGE : LOWER_START_PERCENTAGE;
        startValue = Math.floor(cappedTarget * startPercentage);
    }

    // If start and target are the same, no animation needed
    if (startValue === cappedTarget) {
        onUpdate(cappedTarget);
        onComplete?.();
        return () => {};
    }

    const startTime = performance.now();
    let rafId;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        // Ease-in-out cubic: approximation of CSS cubic-bezier(0.42, 0.0, 0.58, 1.0)
        // Accelerates at start, decelerates at end with cubic curve
        const eased =
            progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentValue = Math.floor(startValue + (cappedTarget - startValue) * eased);
        onUpdate(currentValue);

        if (progress < 1) {
            rafId = requestAnimationFrame(update);
        } else {
            onUpdate(cappedTarget); // Ensure we end exactly at target
            onComplete?.();
        }
    }

    rafId = requestAnimationFrame(update);

    // Return cancel function
    return () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
    };
}
