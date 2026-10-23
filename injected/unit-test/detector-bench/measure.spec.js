/**
 * `measure.mjs` decides how long each subject is run for and in what order, which is what
 * makes its numbers comparable at all. It takes an injectable clock, so all of this is
 * deterministic - none of these tests measure real time.
 */
import { sample } from '../../scripts/detector-bench/core/measure.mjs';

/**
 * A clock that advances by a fixed amount on every read, so batch sizing is predictable.
 *
 * @param {number} perRead
 * @returns {() => number}
 */
function steppingClock(perRead) {
    let t = 0;
    return () => {
        const value = t;
        t += perRead;
        return value;
    };
}

/**
 * @param {string} name
 * @param {string[]} [log] - Records call order across subjects
 * @returns {any}
 */
function subject(name, log) {
    return {
        name,
        calls: 0,
        prepares: 0,
        sweep() {
            this.calls++;
            log?.push(name);
            return 1;
        },
    };
}

describe('detector-bench measure', () => {
    describe('batch sizing', () => {
        it('doubles the batch until a batch takes at least minBatchMs', () => {
            // Each timed region reads the clock twice, so a 1ms step means every batch measures
            // 1ms regardless of size: sizing stops as soon as minBatchMs is satisfied.
            const { batches } = sample({
                subjects: [subject('a')],
                iterations: 1,
                warmup: 0,
                minBatchMs: 1,
                now: steppingClock(1),
            });
            expect(batches.a).toBe(1);
        });

        it('keeps doubling while batches measure shorter than minBatchMs', () => {
            // A clock that never advances enough forces the doubling to run to its cap.
            const { batches } = sample({
                subjects: [subject('a')],
                iterations: 1,
                warmup: 0,
                minBatchMs: 10,
                now: steppingClock(1),
            });
            // 1, 2, 4 ... up to MAX_BATCH, all measuring 1ms against a 10ms floor.
            expect(batches.a).toBe(8192);
        });

        it('caps the batch, so an immeasurably fast subject cannot run forever', () => {
            const { batches } = sample({
                subjects: [subject('a')],
                iterations: 1,
                warmup: 0,
                minBatchMs: Infinity,
                now: () => 0,
            });
            expect(batches.a).toBe(8192);
        });

        it('sizes each subject independently', () => {
            // Subjects differ in cost by orders of magnitude, so one shared batch size would
            // either under-measure the fast one or waste minutes on the slow one.
            const clock = steppingClock(1);
            const { batches } = sample({
                subjects: [subject('a'), subject('b')],
                iterations: 1,
                warmup: 0,
                minBatchMs: 1,
                now: clock,
            });
            expect(Object.keys(batches).sort()).toEqual(['a', 'b']);
        });
    });

    describe('sampling', () => {
        it('divides each sample by the batch size, so samples are per-sweep', () => {
            // Batch of 1 and a 5ms step: the sample is the batch duration over the batch size.
            const { samples } = sample({
                subjects: [subject('a')],
                iterations: 3,
                warmup: 0,
                minBatchMs: 1,
                now: steppingClock(5),
            });
            expect(samples.a.length).toBe(3);
            for (const value of samples.a) expect(value).toBe(5);
        });

        it('collects one sample per subject per round, round-robin', () => {
            // Round-robin so CPU frequency drift and thermal throttling hit every subject
            // equally, instead of penalising whichever happened to run last.
            /** @type {string[]} */
            const log = [];
            const a = subject('a', log);
            const b = subject('b', log);
            const c = subject('c', log);
            sample({ subjects: [a, b, c], iterations: 3, warmup: 0, minBatchMs: 1, now: steppingClock(1) });

            // Drop the sizing phase and inspect only the sampling rounds.
            const sampling = log.slice(-9);
            expect(sampling).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c']);
        });

        it('produces the requested number of samples for every subject', () => {
            const { samples } = sample({
                subjects: [subject('a'), subject('b')],
                iterations: 7,
                warmup: 0,
                minBatchMs: 1,
                now: steppingClock(1),
            });
            expect(samples.a.length).toBe(7);
            expect(samples.b.length).toBe(7);
        });
    });

    describe('warmup', () => {
        it('warms every subject before measuring any of them, so JIT state is comparable', () => {
            /** @type {string[]} */
            const log = [];
            const a = subject('a', log);
            const b = subject('b', log);
            sample({ subjects: [a, b], iterations: 1, warmup: 2, minBatchMs: 1, now: steppingClock(1) });
            // Warmup runs a-a then b-b, before anything is sized or sampled.
            expect(log.slice(0, 4)).toEqual(['a', 'a', 'b', 'b']);
        });

        it('does not record warmup sweeps as samples', () => {
            const { samples } = sample({
                subjects: [subject('a')],
                iterations: 2,
                warmup: 5,
                minBatchMs: 1,
                now: steppingClock(1),
            });
            expect(samples.a.length).toBe(2);
        });

        it('runs no warmup when asked for none', () => {
            /** @type {string[]} */
            const log = [];
            sample({ subjects: [subject('a', log)], iterations: 1, warmup: 0, minBatchMs: 1, now: steppingClock(1) });
            // Sizing (1) plus one sample (1). Nothing before them.
            expect(log.length).toBe(2);
        });
    });

    describe('prepare', () => {
        it('runs before warmup, before sizing and before every sampled batch', () => {
            // `prepare` establishes a precondition that a previously-sampled subject may have
            // destroyed - clean layout, in the harness's case. Round-robin ordering is exactly
            // what makes it necessary, so it has to run before each batch and not just once.
            /** @type {string[]} */
            const log = [];
            const s = {
                name: 'a',
                prepare() {
                    log.push('prepare');
                },
                sweep() {
                    log.push('sweep');
                    return 1;
                },
            };
            sample({ subjects: [s], iterations: 2, warmup: 1, minBatchMs: 1, now: steppingClock(1) });

            expect(log).toEqual([
                'prepare', // warmup
                'sweep',
                'prepare', // batch sizing
                'sweep',
                'prepare', // sample 1
                'sweep',
                'prepare', // sample 2
                'sweep',
            ]);
        });

        it('is not timed, because it is a precondition rather than part of the subject', () => {
            // The clock must not be read between prepare and the start of the timed region.
            /** @type {string[]} */
            const events = [];
            const clock = () => {
                events.push('clock');
                return 0;
            };
            const s = {
                name: 'a',
                prepare() {
                    events.push('prepare');
                },
                sweep() {
                    events.push('sweep');
                    return 1;
                },
            };
            sample({ subjects: [s], iterations: 1, warmup: 0, minBatchMs: Infinity, now: clock });

            // Every prepare is immediately followed by a clock read that opens the timed region,
            // never preceded by one that would have already started it.
            const firstPrepare = events.indexOf('prepare');
            expect(events[firstPrepare + 1]).toBe('clock');
        });

        it('is optional', () => {
            expect(() =>
                sample({ subjects: [subject('a')], iterations: 1, warmup: 1, minBatchMs: 1, now: steppingClock(1) }),
            ).not.toThrow();
        });
    });

    it('returns an accumulated sink, so the engine cannot eliminate the sweeps as dead code', () => {
        const { sink } = sample({ subjects: [subject('a')], iterations: 3, warmup: 1, minBatchMs: 1, now: steppingClock(1) });
        expect(sink).toBeGreaterThan(0);
    });
});
