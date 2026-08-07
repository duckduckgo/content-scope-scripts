/**
 * What a variant's results mean: correct or not, different from what, and whether that
 * difference should fail the run.
 *
 * Extracted from `run.mjs` so it can be tested directly. It was the runner's least
 * observable logic and its most consequential - it decides the exit code - and while it
 * lived inside a module that parses `argv` and calls `process.exit()` at import time,
 * nothing could reach it.
 */

/**
 * @typedef {Record<string, boolean | 'error'>} DetectionResults
 */

/**
 * @typedef {object} ReferenceDelta
 * @property {string[]} introducedFP
 * @property {string[]} introducedFN
 * @property {string[]} fixedFP
 * @property {string[]} fixedFN
 */

/**
 * Split a variant's results into false positives and false negatives against the
 * fixture's labels, which are ground truth.
 *
 * @param {Record<string, boolean>} expected
 * @param {DetectionResults} actual
 * @returns {{ falsePositives: string[], falseNegatives: string[] }}
 */
export function classify(expected, actual) {
    /** @type {string[]} */
    const falsePositives = [];
    /** @type {string[]} */
    const falseNegatives = [];
    for (const key of Object.keys(expected)) {
        const got = actual[key];
        if (got === expected[key]) continue;
        // An error is neither, but it is certainly not correct - count it on the side that
        // reflects what the detector failed to do.
        if (expected[key]) falseNegatives.push(key);
        else falsePositives.push(key);
    }
    return { falsePositives, falseNegatives };
}

/**
 * What this variant changes relative to a comparison point.
 *
 * Distinguishes "this variant is wrong" from "this variant is wrong in a new way": if the
 * comparison point already misses a case, a variant that also misses it has introduced
 * nothing.
 *
 * @param {Record<string, boolean>} expected
 * @param {DetectionResults} comparison
 * @param {DetectionResults} actual
 * @returns {ReferenceDelta}
 */
export function deltaAgainst(expected, comparison, actual) {
    /** @type {ReferenceDelta} */
    const delta = { introducedFP: [], introducedFN: [], fixedFP: [], fixedFN: [] };

    for (const key of Object.keys(expected)) {
        const want = expected[key];
        const ref = comparison[key];
        const got = actual[key];
        if (ref === got) continue;

        if (ref === want) {
            if (want) delta.introducedFN.push(key);
            else delta.introducedFP.push(key);
        } else {
            if (want) delta.fixedFN.push(key);
            else delta.fixedFP.push(key);
        }
    }
    return delta;
}

/**
 * @typedef {object} Outcome
 * @property {string[]} falsePositives
 * @property {string[]} falseNegatives
 * @property {boolean} correct - Matches the fixture labels exactly
 * @property {ReferenceDelta | null} delta - Against the comparison point, if there is one
 * @property {boolean} unexpected - Drives the exit code
 * @property {boolean} preExisting - Incorrect, but the comparison point is incorrect the same way
 */

/**
 * Decide what a variant's results mean.
 *
 * The two axes differ in what a divergence signifies, so they differ here:
 *
 * - **algorithm**: the comparison point is the baseline *implementation*. A divergence the
 *   variant introduced is a regression and fails the run. A fixture the baseline also gets
 *   wrong is a pre-existing gap in the code under study - reported, but not attributed to
 *   an experiment that merely ran against it. This is what stops a spec that discovers a
 *   shipped bug from reading as though the experiment caused it.
 * - **config**: the comparison point is the reference *config*, and a divergence is the
 *   finding rather than a failure, so it fails only when undeclared.
 *
 * @param {object} args
 * @param {'algorithm' | 'config'} args.axis
 * @param {Record<string, boolean>} args.expected
 * @param {DetectionResults} args.actual
 * @param {DetectionResults | null} [args.comparison] - Baseline results (algorithm) or reference results (config)
 * @param {boolean} [args.expectDivergence] - Config axis only
 * @returns {Outcome}
 */
export function decideOutcome({ axis, expected, actual, comparison = null, expectDivergence = false }) {
    const { falsePositives, falseNegatives } = classify(expected, actual);
    const correct = falsePositives.length === 0 && falseNegatives.length === 0;
    const delta = comparison ? deltaAgainst(expected, comparison, actual) : null;

    if (axis === 'config') {
        return { falsePositives, falseNegatives, correct, delta, unexpected: !correct && !expectDivergence, preExisting: false };
    }

    // Without a baseline to compare against there is nothing to attribute a divergence to,
    // so fall back to the labels alone.
    if (!delta) {
        return { falsePositives, falseNegatives, correct, delta, unexpected: !correct, preExisting: false };
    }

    const introduced = delta.introducedFP.length > 0 || delta.introducedFN.length > 0;
    return {
        falsePositives,
        falseNegatives,
        correct,
        delta,
        unexpected: introduced,
        preExisting: !correct && !introduced,
    };
}
