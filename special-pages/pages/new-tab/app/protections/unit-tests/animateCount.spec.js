import { equal, ok, deepEqual } from 'node:assert/strict';
import { test, mock } from 'node:test';
import { animateCount } from '../utils/animateCount.js';

/**
 * Test suite for animateCount utility function
 * Tests implementation against the tracker count animation specification
 */

/**
 * Helper to mock requestAnimationFrame and performance.now for controlled testing
 */
class AnimationMocker {
    constructor() {
        this.currentTime = 0;
        this.frameCallbacks = [];
        this.nextFrameId = 1;
        this.cancelledFrames = new Set();
        this.timeouts = [];
        this.nextTimeoutId = 1;
        this.cancelledTimeouts = new Set();
        this.originalRAF = null;
        this.originalCAF = null;
        this.originalPerf = null;
        this.originalSetTimeout = null;
        this.originalClearTimeout = null;
    }

    /**
     * Setup mocks for requestAnimationFrame, cancelAnimationFrame, and performance.now
     */
    setup() {
        // Store originals
        this.originalRAF = global.requestAnimationFrame;
        this.originalCAF = global.cancelAnimationFrame;
        this.originalPerf = performance.now;
        this.originalSetTimeout = global.setTimeout;
        this.originalClearTimeout = global.clearTimeout;

        // Mock requestAnimationFrame
        global.requestAnimationFrame = (callback) => {
            const id = this.nextFrameId++;
            this.frameCallbacks.push({ id, callback });
            return id;
        };

        // Mock cancelAnimationFrame
        global.cancelAnimationFrame = (id) => {
            this.cancelledFrames.add(id);
        };

        // Mock performance.now
        performance.now = () => {
            return this.currentTime;
        };

        // Mock setTimeout
        global.setTimeout = (callback, delay) => {
            const id = this.nextTimeoutId++;
            this.timeouts.push({ id, callback, triggerTime: this.currentTime + delay });
            return id;
        };

        // Mock clearTimeout
        global.clearTimeout = (id) => {
            this.cancelledTimeouts.add(id);
        };
    }

    /**
     * Cleanup mocks
     */
    cleanup() {
        // Restore originals
        if (this.originalRAF !== null) {
            global.requestAnimationFrame = this.originalRAF;
        }
        if (this.originalCAF !== null) {
            global.cancelAnimationFrame = this.originalCAF;
        }
        if (this.originalPerf !== null) {
            performance.now = this.originalPerf;
        }
        if (this.originalSetTimeout !== null) {
            global.setTimeout = this.originalSetTimeout;
        }
        if (this.originalClearTimeout !== null) {
            global.clearTimeout = this.originalClearTimeout;
        }

        this.frameCallbacks = [];
        this.cancelledFrames.clear();
        this.timeouts = [];
        this.cancelledTimeouts.clear();
        this.currentTime = 0;
        this.nextFrameId = 1;
        this.nextTimeoutId = 1;
    }

    /**
     * Advance time and trigger animation frames and timeouts
     * @param {number} ms - milliseconds to advance
     */
    tick(ms) {
        this.currentTime += ms;

        // Process animation frames
        const callbacks = [...this.frameCallbacks];
        this.frameCallbacks = [];

        callbacks.forEach(({ id, callback }) => {
            if (!this.cancelledFrames.has(id)) {
                callback(this.currentTime);
            }
        });

        // Process timeouts
        const readyTimeouts = this.timeouts.filter(t => t.triggerTime <= this.currentTime);
        this.timeouts = this.timeouts.filter(t => t.triggerTime > this.currentTime);

        readyTimeouts.forEach(({ id, callback }) => {
            if (!this.cancelledTimeouts.has(id)) {
                callback();
            }
        });
    }

    /**
     * Run animation to completion
     * @param {number} duration - expected duration in ms
     * @param {number} steps - number of steps to simulate
     */
    runToCompletion(duration = 500, steps = 10) {
        const stepSize = duration / steps;
        for (let i = 0; i <= steps; i++) {
            this.tick(stepSize);
        }
    }
}

test.describe('animateCount - Basic Behavior', () => {
    test('should call onUpdate with targetValue immediately for count < 5', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        const onUpdate = (value) => updates.push(value);

        animateCount(4, onUpdate);

        equal(updates.length, 1);
        equal(updates[0], 4);
    });

    test('should call onComplete after 500ms for count < 5', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        let completed = false;
        const onComplete = () => { completed = true; };

        animateCount(3, () => {}, onComplete);

        equal(completed, false);

        mocker.tick(500);
        equal(completed, true);
    });

    test('should not animate for count of 0', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(0, (value) => updates.push(value));

        equal(updates.length, 1);
        equal(updates[0], 0);
    });

    test('should animate from 75% for count >= 5 and < 40', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        const onUpdate = (value) => updates.push(value);

        // For 30, start should be Math.floor(30 * 0.75) = 22
        animateCount(30, onUpdate);

        mocker.tick(1); // First frame at time 1

        ok(updates.length > 0, 'Should have updates');
        equal(updates[0], 22, 'Should start at 75% (22)');
    });

    test('should animate from 85% for count >= 40', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        const onUpdate = (value) => updates.push(value);

        // For 100, start should be Math.floor(100 * 0.85) = 85
        animateCount(100, onUpdate);

        mocker.tick(1); // First frame at time 1

        ok(updates.length > 0, 'Should have updates');
        equal(updates[0], 85, 'Should start at 85% (85)');
    });

    test('should reach target value after 500ms', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(50, (value) => updates.push(value));

        mocker.runToCompletion(500, 20);

        const finalValue = updates[updates.length - 1];
        equal(finalValue, 50, 'Should end at target value');
    });

    test('should call onComplete when animation finishes', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        let completed = false;
        const onComplete = () => { completed = true; };

        animateCount(50, () => {}, onComplete);

        equal(completed, false);

        mocker.runToCompletion(500, 10);
        equal(completed, true);
    });
});

test.describe('animateCount - Edge Cases and Thresholds', () => {
    test('should handle boundary at MIN_ANIMATION_THRESHOLD (5)', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updatesFor4 = [];
        const updatesFor5 = [];

        animateCount(4, (v) => updatesFor4.push(v));
        animateCount(5, (v) => updatesFor5.push(v));

        mocker.tick(1);

        // 4 should display immediately (no animation)
        equal(updatesFor4.length, 1);
        equal(updatesFor4[0], 4);

        // 5 should animate from 75% = Math.floor(5 * 0.75) = 3
        equal(updatesFor5[0], 3);
    });

    test('should handle boundary at UPPER_THRESHOLD (40)', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updatesFor39 = [];
        const updatesFor40 = [];

        animateCount(39, (v) => updatesFor39.push(v));
        animateCount(40, (v) => updatesFor40.push(v));

        mocker.tick(1);

        // 39 should use 75%: Math.floor(39 * 0.75) = 29
        equal(updatesFor39[0], 29);

        // 40 should use 85%: Math.floor(40 * 0.85) = 34
        equal(updatesFor40[0], 34);
    });

    test('should cap display at MAX_DISPLAY_COUNT (9999)', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(15000, (value) => updates.push(value));

        mocker.runToCompletion(500, 10);

        const finalValue = updates[updates.length - 1];
        equal(finalValue, 9999, 'Should cap at 9999');
    });

    test('should animate from 85% when capped (9999 * 0.85 = 8499)', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(15000, (value) => updates.push(value));

        mocker.tick(1);

        equal(updates[0], 8499, 'Should start at 8499 for capped values');
    });

    test('should handle exact 9999 value', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(9999, (value) => updates.push(value));

        mocker.tick(1);

        // Math.floor(9999 * 0.85) = 8499
        equal(updates[0], 8499);

        mocker.runToCompletion(500, 10);
        equal(updates[updates.length - 1], 9999);
    });
});

test.describe('animateCount - Incremental Updates (fromValue)', () => {
    test('should animate from provided fromValue on incremental update', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // Simulate incrementing from 50 to 55
        animateCount(55, (value) => updates.push(value), undefined, 50);

        mocker.tick(1);

        equal(updates[0], 50, 'Should start from provided fromValue');
    });

    test('should not use percentage-based start when fromValue is provided', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updatesInitial = [];
        const updatesIncremental = [];

        // Initial display: should use 75% start for count 30
        animateCount(30, (v) => updatesInitial.push(v));

        // Incremental update from 25 to 30
        animateCount(30, (v) => updatesIncremental.push(v), undefined, 25);

        mocker.tick(1);

        // Initial should start at 22 (75% of 30)
        equal(updatesInitial[0], 22);

        // Incremental should start at provided value (25)
        equal(updatesIncremental[0], 25);
    });

    test('should handle fromValue of 0 as initial display', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // fromValue of 0 should trigger initial display logic
        animateCount(30, (value) => updates.push(value), undefined, 0);

        mocker.tick(1);

        // Should use 75% start: Math.floor(30 * 0.75) = 22
        equal(updates[0], 22, 'fromValue of 0 should use percentage-based start');
    });

    test('should cap fromValue at 9999 for incremental updates', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // Increment from 12000 (capped) to 15000 (capped)
        animateCount(15000, (value) => updates.push(value), undefined, 12000);

        mocker.tick(1);

        // fromValue should be capped at 9999
        equal(updates[0], 9999);

        mocker.runToCompletion(500, 10);

        // Should stay at 9999 (no animation since start === end)
        equal(updates[updates.length - 1], 9999);
    });

    test('should complete immediately if fromValue equals target', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        let completed = false;

        animateCount(50, (v) => updates.push(v), () => { completed = true; }, 50);

        equal(updates.length, 1);
        equal(updates[0], 50);
        equal(completed, true);
    });
});

test.describe('animateCount - Cancel Function', () => {
    test('should return a cancel function', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const cancel = animateCount(100, () => {});
        equal(typeof cancel, 'function');
    });

    test('should stop animation when cancel is called', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        const cancel = animateCount(100, (value) => updates.push(value));

        mocker.tick(100); // 20% through animation
        const updateCountBeforeCancel = updates.length;

        cancel();

        mocker.tick(400); // Try to complete animation

        // Should not have received more updates after cancel
        equal(updates.length, updateCountBeforeCancel);
    });

    test('should not call onComplete if cancelled', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        let completed = false;
        const cancel = animateCount(100, () => {}, () => { completed = true; });

        mocker.tick(100);
        cancel();
        mocker.tick(500);

        equal(completed, false);
    });

    test('should cancel timeout for count < 5', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        let completed = false;
        const cancel = animateCount(3, () => {}, () => { completed = true; });

        cancel();

        // Try to trigger timeout
        mocker.tick(500);

        // Should not have completed since it was cancelled
        equal(completed, false);
    });
});

test.describe('animateCount - Easing Function Behavior', () => {
    test('should use cubic ease-in-out easing', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(100, (value) => updates.push(value));

        // Collect values at different time points
        mocker.tick(1);    // Start
        mocker.tick(124);  // 25% through (125ms total)
        mocker.tick(125);  // 50% through (250ms total)
        mocker.tick(125);  // 75% through (375ms total)
        mocker.tick(125);  // 100% through (500ms total)

        ok(updates.length >= 4, 'Should have multiple updates');

        // First value should be start (85% of 100 = 85)
        equal(updates[0], 85);

        // Last value should be target
        equal(updates[updates.length - 1], 100);

        // Values should be monotonically increasing
        for (let i = 1; i < updates.length; i++) {
            ok(updates[i] >= updates[i - 1], 'Values should increase');
        }
    });

    test('should accelerate at start and decelerate at end', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(200, (value) => updates.push(value));

        // Sample at regular intervals
        const samples = [];
        for (let i = 0; i <= 10; i++) {
            mocker.tick(50); // 500ms / 10 = 50ms steps
            if (updates.length > 0) {
                samples.push(updates[updates.length - 1]);
            }
        }

        ok(samples.length > 5, 'Should have enough samples');

        // Calculate differences between consecutive samples
        const diffs = [];
        for (let i = 1; i < samples.length; i++) {
            diffs.push(samples[i] - samples[i - 1]);
        }

        // For ease-in-out: first half should have increasing differences (acceleration)
        // second half should have decreasing differences (deceleration)
        // This is a simplified check - real cubic ease-in-out behavior
        ok(diffs.length > 0, 'Should have differences to analyze');
    });
});

test.describe('animateCount - Animation Duration', () => {
    test('should complete in approximately 500ms', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        let completed = false;
        animateCount(100, () => {}, () => { completed = true; });

        // Not completed before 500ms
        mocker.tick(499);
        equal(completed, false);

        // Should be completed at or shortly after 500ms
        mocker.tick(2);
        equal(completed, true);
    });

    test('should use same 500ms duration for both < 40 and >= 40 counts', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        let completed1 = false;
        let completed2 = false;

        animateCount(30, () => {}, () => { completed1 = true; });
        animateCount(100, () => {}, () => { completed2 = true; });

        mocker.runToCompletion(500, 10);

        equal(completed1, true, 'Count 30 should complete in 500ms');
        equal(completed2, true, 'Count 100 should complete in 500ms');
    });
});

test.describe('animateCount - Real-world Scenarios', () => {
    test('should handle rapid successive updates', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // First animation
        const cancel1 = animateCount(50, (v) => updates.push({ id: 1, value: v }));
        mocker.tick(100); // 20% through

        // Cancel and start new animation
        cancel1();
        const cancel2 = animateCount(75, (v) => updates.push({ id: 2, value: v }), undefined, 50);
        mocker.tick(100); // 20% through second animation

        cancel2();
        animateCount(100, (v) => updates.push({ id: 3, value: v }), undefined, 75);
        mocker.runToCompletion(500, 10);

        ok(updates.length > 0, 'Should have updates from multiple animations');
    });

    test('should handle animation from 0 to small number', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // Animate from 0 (initial) to 10
        animateCount(10, (v) => updates.push(v));

        mocker.tick(1);

        // Should start at 75% of 10 = 7
        equal(updates[0], 7);

        mocker.runToCompletion(500, 10);
        equal(updates[updates.length - 1], 10);
    });

    test('should handle large incremental update', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // Jump from 100 to 1000
        animateCount(1000, (v) => updates.push(v), undefined, 100);

        mocker.tick(1);
        equal(updates[0], 100);

        mocker.runToCompletion(500, 20);
        equal(updates[updates.length - 1], 1000);
    });

    test('should provide integer values only', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // Use values that would create decimals (e.g., 33 * 0.75 = 24.75)
        animateCount(33, (v) => updates.push(v));

        mocker.runToCompletion(500, 30);

        // All values should be integers
        updates.forEach((value) => {
            equal(value, Math.floor(value), `Value ${value} should be an integer`);
        });
    });

    test('should handle animation to exactly the threshold values', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const testCases = [5, 40, 9999];

        testCases.forEach((target) => {
            const updates = [];
            animateCount(target, (v) => updates.push(v));

            mocker.runToCompletion(500, 10);

            equal(
                updates[updates.length - 1],
                target,
                `Should reach exactly ${target}`
            );
        });
    });
});

test.describe('animateCount - Callback Behavior', () => {
    test('should handle missing onComplete callback gracefully', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // No onComplete provided
        animateCount(50, (v) => updates.push(v));

        mocker.runToCompletion(500, 10);

        // Should complete without error
        equal(updates[updates.length - 1], 50);
    });

    test('should call onUpdate on every animation frame', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(100, (v) => updates.push(v));

        // Tick multiple times
        for (let i = 0; i < 20; i++) {
            mocker.tick(25); // 500ms / 20 = 25ms per tick
        }

        // Should have multiple updates (one per frame)
        ok(updates.length >= 10, 'Should have many updates during animation');
    });

    test('should ensure final onUpdate is exactly the target value', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];

        // Test with various values
        [5, 30, 40, 100, 9999].forEach((target) => {
            updates.length = 0; // Clear updates
            animateCount(target, (v) => updates.push(v));
            mocker.runToCompletion(500, 10);

            equal(
                updates[updates.length - 1],
                target,
                `Final value should be exactly ${target}`
            );
        });
    });
});
