/**
 * A run where a variant introduces a divergence the baseline does not have. Must exit 1.
 *
 * The counterpart to `pre-existing.mjs`: relaxing the algorithm axis so a shared failure
 * passes must not also let a genuine regression through.
 */

/** One detector, whose key is `tests.paywall`. The config is unused by these variants. */
const DETECTORS = { tests: { paywall: { match: { text: { pattern: 'paywall', xpath: '//body//text()' } } } } };

export default {
    kind: 'algorithm',
    iterations: 3,
    warmup: 1,

    detectors: DETECTORS,

    implementations: [
        { name: 'correct', source: 'module', path: './case-insensitive.js', baseline: true },
        { name: 'over-eager', source: 'module', path: './always-match.js' },
    ],

    fixtures: [
        // The baseline is right about this and `over-eager` is not, so the false positive is
        // introduced rather than inherited.
        {
            name: 'clean',
            html: '<p>an ordinary article</p>',
            expect: { 'tests.paywall': false },
        },
    ],
};
