import { equal, ok, deepEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { animateCount } from '../utils/animateCount.js';

/**
 * Focused test suite for animateCount utility function
 * Tests core requirements against the tracker count animation specification
 */

/**
 * Helper to mock requestAnimationFrame (RAF) and performance.now for
 * controlled testing
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

    setup() {
        this.originalRAF = globalThis.requestAnimationFrame;
        this.originalCAF = globalThis.cancelAnimationFrame;
        this.originalPerf = performance.now;
        this.originalSetTimeout = globalThis.setTimeout;
        this.originalClearTimeout = globalThis.clearTimeout;

        globalThis.requestAnimationFrame = (callback) => {
            const id = this.nextFrameId++;
            this.frameCallbacks.push({ id, callback });
            return id;
        };

        globalThis.cancelAnimationFrame = (id) => {
            this.cancelledFrames.add(id);
        };

        // Use Object.defineProperty to override read-only performance.now in Node.js
        const mocker = this;
        Object.defineProperty(performance, 'now', {
            writable: true,
            configurable: true,
            value: function () {
                return mocker.currentTime;
            },
        });

        // @ts-expect-error - Mock implementation doesn't need full setTimeout signature
        globalThis.setTimeout = (callback, delay) => {
            const id = this.nextTimeoutId++;
            this.timeouts.push({ id, callback, triggerTime: this.currentTime + delay });
            return id;
        };

        globalThis.clearTimeout = (id) => {
            this.cancelledTimeouts.add(id);
        };
    }

    cleanup() {
        if (this.originalRAF !== null) {
            globalThis.requestAnimationFrame = this.originalRAF;
        }
        if (this.originalCAF !== null) {
            globalThis.cancelAnimationFrame = this.originalCAF;
        }
        if (this.originalPerf !== null) {
            // Restore performance.now using Object.defineProperty
            Object.defineProperty(performance, 'now', {
                writable: true,
                configurable: true,
                value: this.originalPerf,
            });
        }
        if (this.originalSetTimeout !== null) {
            globalThis.setTimeout = this.originalSetTimeout;
        }
        if (this.originalClearTimeout !== null) {
            globalThis.clearTimeout = this.originalClearTimeout;
        }

        this.frameCallbacks = [];
        this.cancelledFrames.clear();
        this.timeouts = [];
        this.cancelledTimeouts.clear();
        this.currentTime = 0;
        this.nextFrameId = 1;
        this.nextTimeoutId = 1;
    }

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

        // Process timeouts - optimized: single pass instead of two filter operations
        const readyTimeouts = [];
        const remainingTimeouts = [];
        for (const timeout of this.timeouts) {
            if (timeout.triggerTime <= this.currentTime) {
                readyTimeouts.push(timeout);
            } else {
                remainingTimeouts.push(timeout);
            }
        }
        this.timeouts = remainingTimeouts;

        readyTimeouts.forEach(({ id, callback }) => {
            if (!this.cancelledTimeouts.has(id)) {
                callback();
            }
        });
    }

    runToCompletion(duration = 500, steps = 10) {
        const stepSize = duration / steps;
        for (let i = 0; i <= steps; i++) {
            this.tick(stepSize);
        }
    }
}

test.describe('animateCount - Core Algorithm', () => {
    test('should respect threshold boundaries and percentage-based start values', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        // Test < 5 immediate display with 500ms delay
        const updates3 = [];
        let completed3 = false;
        animateCount(
            3,
            (v) => updates3.push(v),
            () => {
                completed3 = true;
            },
        );
        equal(updates3.length, 1);
        equal(updates3[0], 3);
        equal(completed3, false);
        mocker.tick(500);
        equal(completed3, true);

        // Test threshold boundaries: 4 immediate, 5 at 75%, 39 at 75%, 40 at 85%
        const updates4 = [];
        const updates5 = [];
        const updates39 = [];
        const updates40 = [];
        animateCount(4, (v) => updates4.push(v));
        animateCount(5, (v) => updates5.push(v));
        animateCount(39, (v) => updates39.push(v));
        animateCount(40, (v) => updates40.push(v));
        mocker.tick(1);
        equal(updates4[0], 4); // Immediate
        equal(updates5[0], 3); // Math.floor(5 * 0.75) = 3
        equal(updates39[0], 29); // Math.floor(39 * 0.75) = 29
        equal(updates40[0], 34); // Math.floor(40 * 0.85) = 34

        // Test capping at 9999
        const updatesCapped = [];
        animateCount(15000, (v) => updatesCapped.push(v));
        mocker.tick(1);
        equal(updatesCapped[0], 8499); // Math.floor(9999 * 0.85) = 8499
        mocker.runToCompletion(500, 10);
        equal(updatesCapped[updatesCapped.length - 1], 9999);
    });

    test('should handle incremental updates and edge cases', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        // Test incremental update from provided fromValue
        const updatesInitial = [];
        const updatesIncremental = [];
        animateCount(30, (v) => updatesInitial.push(v));
        animateCount(30, (v) => updatesIncremental.push(v), undefined, 25);
        mocker.tick(1);
        equal(updatesInitial[0], 22); // Math.floor(30 * 0.75) = 22
        equal(updatesIncremental[0], 25); // Uses provided fromValue

        // Test fromValue of 0 treated as initial display
        const updatesZero = [];
        animateCount(30, (v) => updatesZero.push(v), undefined, 0);
        mocker.tick(1);
        equal(updatesZero[0], 22); // Uses percentage-based start

        // Test immediate completion when fromValue equals target
        const updatesSame = [];
        let completedSame = false;
        animateCount(
            50,
            (v) => updatesSame.push(v),
            () => {
                completedSame = true;
            },
            50,
        );
        equal(updatesSame.length, 1);
        equal(updatesSame[0], 50);
        equal(completedSame, true);
    });

    test('should complete animation in 500ms with exact target value', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        let completed = false;

        animateCount(
            100,
            (value) => updates.push(value),
            () => {
                completed = true;
            },
        );

        // Not completed before 500ms
        mocker.tick(499);
        equal(completed, false);

        // Should be completed at 500ms with exact target
        mocker.tick(2);
        equal(completed, true);
        equal(updates[updates.length - 1], 100);
    });

    test('should support cancellation for both animation types', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        // Test cancellation of RAF-based animation
        const updatesRAF = [];
        let completedRAF = false;
        const cancelRAF = animateCount(
            100,
            (value) => updatesRAF.push(value),
            () => {
                completedRAF = true;
            },
        );
        mocker.tick(100);
        const updateCountBeforeCancel = updatesRAF.length;
        cancelRAF();
        mocker.tick(400);
        equal(updatesRAF.length, updateCountBeforeCancel);
        equal(completedRAF, false);

        // Test cancellation of timeout-based animation (< 5)
        let completedTimeout = false;
        const cancelTimeout = animateCount(
            3,
            () => {},
            () => {
                completedTimeout = true;
            },
        );
        cancelTimeout();
        mocker.tick(500);
        equal(completedTimeout, false);
    });

    test('should produce valid animation values (integers, monotonic, correct easing)', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        animateCount(100, (value) => updates.push(value));

        mocker.runToCompletion(500, 20);

        // All values should be integers
        updates.forEach((value) => {
            equal(value, Math.floor(value), `Value ${value} should be an integer`);
        });

        // Values should be monotonically increasing
        for (let i = 1; i < updates.length; i++) {
            ok(updates[i] >= updates[i - 1], `Value at ${i} should be >= previous value`);
        }

        // Should start and end correctly
        equal(updates[0], 85); // 85% of 100
        equal(updates[updates.length - 1], 100);
    });
});

test.describe('animateCount - Snapshot Tests', () => {
    /**
     * Expected snapshot of animation end state.
     * This snapshot captures the final values and key intermediate states
     * to ensure animation behavior remains consistent.
     *
     * To update this snapshot, run the test, capture the actual output,
     * and replace the expected values below.
     */
    const expectedSnapshot = {
        target: 1337,
        fromValue: null,
        finalValue: 1337,
        completed: true,
        totalUpdates: 31,
        firstValue: 1136,
        midValue: 1255,
    };

    test('should match snapshot of animation end state', (t) => {
        const mocker = new AnimationMocker();
        mocker.setup();
        t.after(() => mocker.cleanup());

        const updates = [];
        let completed = false;

        animateCount(
            1337,
            (value) => updates.push(value),
            () => {
                completed = true;
            },
            null,
        );

        // Run animation to completion
        mocker.runToCompletion(500, 30);

        // Capture end state
        const actual = {
            target: 1337,
            fromValue: null,
            finalValue: updates[updates.length - 1],
            completed,
            totalUpdates: updates.length,
            firstValue: updates[0],
            midValue: updates[Math.floor(updates.length / 2)],
        };

        // Compare actual results with expected snapshot
        deepEqual(actual, expectedSnapshot, 'Animation end state does not match snapshot');
    });
});
