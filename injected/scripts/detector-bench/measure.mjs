/**
 * The sampling core: turn a set of subjects into comparable timings.
 *
 * Used from two places, which is why it is a module of its own. The DOM path bundles it
 * into the page and calls it there; a string-level subject calls it directly in Node.
 * Both then get the same batch sizing, the same round-robin ordering and the same
 * statistics, so a result from one is read the same way as a result from the other.
 *
 * Two measures keep the numbers honest, and both matter more than they look:
 *
 * - Each sample times a *batch* of sweeps, sized so the batch lasts at least
 *   `minBatchMs`. Without this, work below the clock's resolution measures as zero or as
 *   noise. Batches are sized per subject, because a selector check can be tens of
 *   thousands of times faster than an XPath one and both need to land above the clock.
 * - Samples are collected round-robin across subjects rather than all-of-one and then
 *   the next, so CPU frequency drift and thermal throttling hit every subject equally
 *   instead of penalising whichever ran last.
 *
 * Round-robin ordering has a cost that `prepare` exists to pay: subjects share whatever
 * state the environment holds, so one subject can leave the next in a different starting
 * position than it would have chosen. `prepare` runs outside the clock, immediately before
 * a batch, and is where a subject re-establishes what it assumes.
 */

/**
 * @typedef {object} Subject
 * @property {string} name
 * @property {() => number} sweep - Must return a value, so the engine cannot eliminate it as dead code
 * @property {() => void} [prepare] - Establishes a precondition before a batch is timed, and is not itself timed
 */

/**
 * @typedef {object} SampleResult
 * @property {Record<string, number[]>} samples - Per-sweep milliseconds, per subject
 * @property {Record<string, number>} batches - Sweeps per timed batch, per subject
 * @property {number} sink - Accumulated sweep results, returned so the caller can keep them live
 */

/** Ceiling on batch growth, so a subject that is somehow free cannot loop forever. */
const MAX_BATCH = 8192;

/**
 * @param {object} args
 * @param {Subject[]} args.subjects
 * @param {number} args.iterations
 * @param {number} args.warmup
 * @param {number} args.minBatchMs
 * @param {() => number} [args.now]
 * @returns {SampleResult}
 */
export function sample({ subjects, iterations, warmup, minBatchMs, now }) {
    const clock = now ?? (() => performance.now());
    let sink = 0;

    // Warm every subject before measuring any of them, so JIT state is comparable.
    if (warmup > 0) {
        for (const subject of subjects) {
            subject.prepare?.();
            for (let i = 0; i < warmup; i++) sink += subject.sweep();
        }
    }

    /** @type {Record<string, number>} */
    const batches = {};
    for (const subject of subjects) {
        let batch = 1;
        for (;;) {
            subject.prepare?.();
            const start = clock();
            for (let i = 0; i < batch; i++) sink += subject.sweep();
            if (clock() - start >= minBatchMs || batch >= MAX_BATCH) break;
            batch *= 2;
        }
        batches[subject.name] = batch;
    }

    /** @type {Record<string, number[]>} */
    const samples = {};
    for (const subject of subjects) samples[subject.name] = [];

    for (let round = 0; round < iterations; round++) {
        for (const subject of subjects) {
            const batch = batches[subject.name];
            subject.prepare?.();
            const start = clock();
            for (let i = 0; i < batch; i++) sink += subject.sweep();
            samples[subject.name].push((clock() - start) / batch);
        }
    }

    return { samples, batches, sink };
}
