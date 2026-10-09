/**
 * A run whose only failures are ones the baseline shares. Must exit 0.
 *
 * Before the introduced-versus-pre-existing change this exited 1: the algorithm axis set
 * `unexpected: !correct`, so a fixture the shipped baseline also fails was attributed to
 * whichever experiment happened to run against it.
 *
 * Also carries a `purpose: 'timing'` fixture, so `--check-only` can be seen skipping it.
 */

/** One detector, whose key is `tests.paywall`. The config is unused by these variants. */
const DETECTORS = { tests: { paywall: { match: { text: { pattern: 'paywall', xpath: '//body//text()' } } } } };

export default {
    kind: 'algorithm',
    iterations: 3,
    warmup: 1,

    detectors: DETECTORS,

    implementations: [
        { name: 'strict', source: 'module', path: './strict-case.js', baseline: true },
        { name: 'strict-rendered', source: 'module', path: './strict-case-rendered.js' },
        { name: 'insensitive', source: 'module', path: './case-insensitive.js' },
    ],

    fixtures: [
        // Lower-case, so both strict implementations miss it and the insensitive one fixes it.
        {
            name: 'lowercase-payload',
            html: '<p>you have hit a paywall</p>',
            expect: { 'tests.paywall': true },
        },
        // No payload: every implementation should agree there is nothing here.
        {
            name: 'clean',
            html: '<p>an ordinary article</p>',
            expect: { 'tests.paywall': false },
        },
        // Skipped by --check-only. Small, because this fixture exists to be counted rather
        // than to be slow.
        {
            name: 'timing-only',
            html: '<p>an ordinary article</p>',
            purpose: 'timing',
            expect: { 'tests.paywall': false },
        },
    ],
};
