/**
 * @typedef {(value: number) => void} AnimationUpdateCallback
 * @typedef {() => void} AnimationCompleteCallback
 * @typedef {() => void} CancelAnimationFunction
 */

/**
 * Animation configuration constants
 * @readonly
 * @enum {number}
 */
export const AnimationConstants = {
    DURATION: 500,
    MIN_THRESHOLD: 5,
    UPPER_THRESHOLD: 40,
    LOWER_START_PERCENTAGE: 0.75,
    UPPER_START_PERCENTAGE: 0.85,
    MAX_DISPLAY_COUNT: 9999,
};

/**
 * Animates a number count following the tracker count animation specification
 * @param {number} targetValue - The final value to animate to
 * @param {AnimationUpdateCallback} onUpdate - Callback called with the current value on each frame
 * @param {AnimationCompleteCallback} [onComplete] - Optional callback when animation completes
 * @param {number | null} [fromValue] - Starting value for animation. If null/0, uses spec's percentage-based start
 * @returns {CancelAnimationFunction} Cancel function to stop the animation
 */
export function animateCount(targetValue, onUpdate, onComplete, fromValue = null) {
    // Runtime validation following special-pages/pages/new-tab/src/index.js:reportPageException pattern
    if (typeof targetValue !== 'number' || !Number.isFinite(targetValue) || targetValue < 0) {
        console.warn('animateCount: invalid targetValue', targetValue);
        // Fail gracefully - just call update with 0
        onUpdate?.(0);
        onComplete?.();
        return () => {};
    }

    if (typeof onUpdate !== 'function') {
        console.warn('animateCount: onUpdate must be a function', typeof onUpdate);
        return () => {};
    }

    if (onComplete !== undefined && onComplete !== null && typeof onComplete !== 'function') {
        console.warn('animateCount: onComplete must be a function or nullish', typeof onComplete);
        onComplete = undefined; // Normalize to undefined
    }

    if (fromValue !== null && (typeof fromValue !== 'number' || !Number.isFinite(fromValue) || fromValue < 0)) {
        console.warn('animateCount: invalid fromValue, treating as null', fromValue);
        fromValue = null;
    }

    // Destructure constants once for cleaner code
    const {
        DURATION: ANIMATION_DURATION,
        MIN_THRESHOLD: MIN_ANIMATION_THRESHOLD,
        UPPER_THRESHOLD,
        LOWER_START_PERCENTAGE,
        UPPER_START_PERCENTAGE,
        MAX_DISPLAY_COUNT,
    } = AnimationConstants;

    // Cap the target value at 9999
    const cappedTarget = Math.min(targetValue, MAX_DISPLAY_COUNT);
    const isInitialDisplay = fromValue === null || fromValue === 0;

    // Determine start value
    let startValue;
    if (!isInitialDisplay) {
        // Incremental update: animate from current displayed value
        // fromValue is guaranteed to be a number here (not null) due to !isInitialDisplay check
        startValue = Math.min(/** @type {number} */ (fromValue), MAX_DISPLAY_COUNT);
    } else {
        // Initial display: follow spec's percentage-based logic
        // No animation for counts < 5 on initial display
        if (cappedTarget < MIN_ANIMATION_THRESHOLD) {
            onUpdate(cappedTarget);
            // Still apply 500ms delay before completing
            const timeoutId = /** @type {ReturnType<typeof setTimeout>} */ (
                setTimeout(() => {
                    onComplete?.();
                }, ANIMATION_DURATION)
            );
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

    // Pre-calculate values that remain constant throughout animation
    const startTime = performance.now();
    const animationRange = cappedTarget - startValue;
    const inverseDuration = 1 / ANIMATION_DURATION; // Multiplication is faster than division

    /** @type {number | undefined} */
    let rafId;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed * inverseDuration, 1); // Use pre-calculated inverse

        // Ease-in-out cubic: approximation of CSS cubic-bezier(0.42, 0.0, 0.58, 1.0)
        // Accelerates at start, decelerates at end with cubic curve
        // Optimized: use ** operator instead of Math.pow, and pre-calculate progress^2
        let eased;
        if (progress < 0.5) {
            const p2 = progress * progress;
            eased = 4 * p2 * progress;
        } else {
            const t = -2 * progress + 2;
            eased = 1 - (t * t * t) / 2;
        }

        const currentValue = Math.floor(startValue + animationRange * eased); // Use pre-calculated range
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
        if (rafId !== undefined) {
            cancelAnimationFrame(rafId);
        }
    };
}
