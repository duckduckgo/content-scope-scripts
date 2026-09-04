/**
 * `report.mjs` is the whole product of a benchmark run: everything else exists to produce
 * these tables. A formatting bug here does not crash anything, it just quietly tells someone
 * the wrong thing about which implementation is faster.
 */
import {
    summarise,
    formatMs,
    formatBytes,
    formatChars,
    table,
    relativeSpeed,
    formatFixture,
    formatSummary,
    formatAccuracy,
    compareToStored,
} from '../../scripts/detector-bench/core/report.mjs';

/**
 * @param {object} [overrides]
 * @returns {any}
 */
function variant(overrides = {}) {
    return {
        name: 'v',
        baseline: false,
        median: 1,
        p95: 2,
        expected: {},
        actual: {},
        falsePositives: [],
        falseNegatives: [],
        correct: true,
        unexpected: false,
        ...overrides,
    };
}

/**
 * @param {any[]} variants
 * @param {object} [overrides]
 * @returns {any}
 */
function report(variants, overrides = {}) {
    return {
        fixture: 'article',
        facts: { elements: 10, textNodes: 4, chars: 100 },
        variants,
        ...overrides,
    };
}

describe('detector-bench report', () => {
    describe('summarise', () => {
        it('takes the median rather than the mean, so one GC pause does not move it', () => {
            // The 500 is the pause. A mean would report 100.6.
            expect(summarise([1, 1, 1, 1, 500]).median).toBe(1);
        });

        it('reports p95 so the size of the tail is visible', () => {
            const samples = Array.from({ length: 100 }, (_, i) => i + 1);
            expect(summarise(samples).median).toBe(50);
            expect(summarise(samples).p95).toBe(95);
        });

        it('handles a single sample and no samples at all', () => {
            expect(summarise([7])).toEqual({ median: 7, p95: 7 });
            expect(summarise([])).toEqual({ median: 0, p95: 0 });
        });
    });

    describe('formatMs', () => {
        it('drops precision as the magnitude rises, so columns stay readable', () => {
            // These benchmarks span five orders of magnitude; a fixed precision is unreadable
            // at one end or useless at the other.
            expect(formatMs(0.000123)).toBe('0.00012 ms');
            expect(formatMs(0.05)).toBe('0.050 ms');
            expect(formatMs(1.5)).toBe('1.50 ms');
            expect(formatMs(184.55)).toBe('184.6 ms');
        });

        it('switches format exactly at its boundaries', () => {
            expect(formatMs(0.01)).toBe('0.010 ms');
            expect(formatMs(0.009999)).toBe('0.01000 ms');
            expect(formatMs(1)).toBe('1.00 ms');
            expect(formatMs(100)).toBe('100.0 ms');
        });
    });

    describe('formatBytes', () => {
        it('scales by unit', () => {
            expect(formatBytes(512)).toBe('512 B');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
        });

        it('keeps the sign, because a sweep can end with less heap than it started', () => {
            expect(formatBytes(-2048)).toBe('-2 KB');
            expect(formatBytes(0)).toBe('0 B');
        });
    });

    describe('formatChars', () => {
        it('abbreviates at thousands and millions', () => {
            expect(formatChars(999)).toBe('999');
            expect(formatChars(1000)).toBe('1k');
            expect(formatChars(41000)).toBe('41k');
            expect(formatChars(8_390_000)).toBe('8.39M');
        });
    });

    describe('table', () => {
        it('left-aligns the first column and right-aligns the rest', () => {
            const rendered = table([
                ['variant', 'median'],
                ['a-long-name', '1 ms'],
                ['b', '10 ms'],
            ]);
            const lines = rendered.split('\n');
            expect(lines[0]).toBe('  variant      median');
            expect(lines[1]).toBe('  -----------  ------');
            expect(lines[2]).toBe('  a-long-name    1 ms');
            expect(lines[3]).toBe('  b             10 ms');
        });

        it('returns nothing for no rows', () => {
            expect(table([])).toBe('');
        });
    });

    describe('relativeSpeed', () => {
        const baseline = variant({ name: 'base', baseline: true, median: 10 });

        it('reports faster and slower against the baseline median', () => {
            expect(relativeSpeed(variant({ median: 5 }), baseline)).toBe('2.0x faster');
            expect(relativeSpeed(variant({ median: 20 }), baseline)).toBe('2.0x slower');
        });

        it('has nothing to say about the baseline itself, or without one', () => {
            expect(relativeSpeed(baseline, baseline)).toBe('-');
            expect(relativeSpeed(variant({ median: 5 }), undefined)).toBe('-');
        });

        it('declines to divide by an unmeasured median', () => {
            // --check-only leaves medians at zero, and "Infinityx faster" is not a result.
            expect(relativeSpeed(variant({ median: 0 }), baseline)).toBe('-');
            expect(relativeSpeed(variant({ median: 5 }), variant({ median: 0 }))).toBe('-');
        });
    });

    describe('formatFixture', () => {
        it('omits timing columns under check-only, rather than printing zeroes', () => {
            // A column of 0.00 ms reads as a result. An absent column reads as an absence.
            const rendered = formatFixture(report([variant({ baseline: true })]), 'algorithm', { timed: false });
            expect(rendered).not.toContain('median');
            expect(rendered).not.toContain('p95');
            expect(rendered).not.toContain('vs baseline');
            // Behaviour is still compared, though: that is what --check-only is for.
            expect(rendered).toContain('behaviour');
            expect(rendered).toContain('result');
        });

        it('shows peak buffer and retained only when a variant reports them', () => {
            const without = formatFixture(report([variant({ baseline: true })]), 'algorithm');
            expect(without).not.toContain('peak buffer');
            expect(without).not.toContain('retained');

            const with_ = formatFixture(report([variant({ baseline: true, peakChars: 41000, heapBytes: 2048 })]), 'algorithm');
            expect(with_).toContain('peak buffer');
            expect(with_).toContain('41k chars');
            expect(with_).toContain('retained');
            expect(with_).toContain('2 KB');
        });

        it('reports rendered size in the shape line when the fact is present', () => {
            // The memory columns are blind to a single large string, so this is the figure that
            // speaks to what a materialising strategy has to hold.
            const rendered = formatFixture(
                report([variant({ baseline: true })], { facts: { elements: 10, textNodes: 4, chars: 100, renderedChars: 8_390_000 } }),
                'algorithm',
            );
            expect(rendered).toContain('8.39M rendered');
        });

        it('reports the layout invalidation ratio when one was measured', () => {
            const rendered = formatFixture(
                report([variant({ baseline: true })], { layoutCheck: { clean: 0.001, dirty: 0.05, ratio: 50 } }),
                'algorithm',
            );
            expect(rendered).toContain('layout invalidation: 50.0x');
        });

        it('distinguishes a pre-existing failure from one the variant introduced', () => {
            const rendered = formatFixture(
                report([
                    variant({ name: 'base', baseline: true, correct: false, preExisting: true }),
                    variant({
                        name: 'introduced',
                        correct: false,
                        unexpected: true,
                        vsReference: { introducedFP: ['d'], introducedFN: [], fixedFP: [], fixedFN: [] },
                    }),
                ]),
                'algorithm',
            );
            expect(rendered).toContain('PRE-EXISTING');
            expect(rendered).toContain('CORRECTNESS FAIL');
            expect(rendered).toContain('+1 FP');
        });

        it('gives the algorithm axis a behaviour column against the baseline', () => {
            const rendered = formatFixture(
                report([
                    variant({ name: 'base', baseline: true }),
                    variant({ name: 'other', vsReference: { introducedFP: [], introducedFN: [], fixedFP: [], fixedFN: [] } }),
                ]),
                'algorithm',
            );
            expect(rendered).toContain('behaviour');
            expect(rendered).toContain('same behaviour');
            // The timing column keeps the `vs baseline` name, so the two are not confusable.
            expect(rendered).toContain('vs baseline');
        });

        it('gives the config axis a reference column and no result column', () => {
            const rendered = formatFixture(
                report([
                    variant({ name: 'ref', reference: true }),
                    variant({ name: 'other', vsReference: { introducedFP: [], introducedFN: ['d'], fixedFP: [], fixedFN: [] } }),
                ]),
                'config',
            );
            expect(rendered).toContain('vs reference');
            expect(rendered).toContain('+1 FN');
        });
    });

    describe('formatAccuracy', () => {
        /**
         * A variant with a given tally against a fixture labelling `n` detectors.
         *
         * @param {string} name
         * @param {number} labels
         * @param {string[]} [fp]
         * @param {string[]} [fn]
         * @returns {any}
         */
        function scored(name, labels, fp = [], fn = []) {
            /** @type {Record<string, boolean>} */
            const expected = {};
            for (let i = 0; i < labels; i++) expected[`g.d${i}`] = true;
            return variant({ name, expected, falsePositives: fp, falseNegatives: fn, correct: fp.length + fn.length === 0 });
        }

        it('scores a variant that gets everything right at 100%', () => {
            const out = formatAccuracy([report([scored('xpath', 2)]), report([scored('xpath', 3)])]);
            expect(out).toContain('100%');
            expect(out).toContain('5/5');
        });

        it('counts false positives and negatives separately, and against the total', () => {
            const out = formatAccuracy([report([scored('body-only', 10, ['g.d0'], ['g.d1', 'g.d2'])])]);
            // 10 labels, 3 wrong.
            expect(out).toContain('7/10');
            expect(out).toContain('70%');
        });

        it('sums a variant across fixtures rather than reporting the last one', () => {
            const out = formatAccuracy([report([scored('v', 2)], { fixture: 'a' }), report([scored('v', 2, ['g.d0'])], { fixture: 'b' })]);
            expect(out).toContain('3/4');
        });

        it("excludes fixtures marked purpose 'timing'", () => {
            // Their only label is "no match" on a large generated page, which every variant
            // satisfies for free. Counting them would drag every score towards 100% and make
            // the figure differ between a full run and --check-only.
            const out = formatAccuracy([
                report([scored('v', 1, ['g.d0'])], { fixture: 'small', purpose: 'both' }),
                report([scored('v', 99)], { fixture: 'huge-clean', purpose: 'timing' }),
            ]);
            expect(out).toContain('0/1');
            expect(out).toContain('Scored over 1 labelled fixture(s)');
        });

        it('returns nothing when every fixture was timing-only', () => {
            expect(formatAccuracy([report([scored('v', 1)], { purpose: 'timing' })])).toBe('');
        });

        it('keeps engines apart, since each measured its own page', () => {
            const out = formatAccuracy([
                report([scored('v', 2)], { engine: 'chromium' }),
                report([scored('v', 2, ['g.d0'])], { engine: 'firefox' }),
            ]);
            expect(out).toContain('chromium');
            expect(out).toContain('firefox');
            expect(out).toContain('2/2');
            expect(out).toContain('1/2');
        });

        it('omits the engine column entirely for a single-engine run', () => {
            expect(formatAccuracy([report([scored('v', 1)])])).not.toContain('engine');
        });

        it('warns that a faster variant with a lower score is not a win', () => {
            expect(formatAccuracy([report([scored('v', 1)])])).toContain('not a win');
        });
    });

    describe('formatSummary', () => {
        it('reports a clean run plainly', () => {
            expect(formatSummary([report([variant({ baseline: true })])], 'algorithm')).toContain(
                'All variants produced the expected detection results',
            );
        });

        it('separates pre-existing failures from introduced ones, and does not conflate them', () => {
            const summary = formatSummary(
                [
                    report([
                        variant({
                            name: 'base',
                            baseline: true,
                            correct: false,
                            preExisting: true,
                            expected: { d: true },
                            falseNegatives: ['d'],
                        }),
                        variant({ name: 'bad', correct: false, unexpected: true, expected: { d: true }, falseNegatives: ['d'] }),
                    ]),
                ],
                'algorithm',
            );
            expect(summary).toContain('1 pre-existing failure(s)');
            expect(summary).toContain('base: +FN d');
            expect(summary).toContain('1 UNEXPECTED behaviour change(s)');
            expect(summary).toContain('bad: +FN d');
            // The rewritten wording: the old text called any change a regression outright.
            expect(summary).toContain('a case the baseline implementation gets right and this variant does not');
        });

        it('credits a variant that fixes what the baseline gets wrong', () => {
            const summary = formatSummary(
                [report([variant({ name: 'better', vsReference: { introducedFP: [], introducedFN: [], fixedFP: [], fixedFN: ['d'] } })])],
                'algorithm',
            );
            expect(summary).toContain('1 case(s) a variant gets right where the baseline does not');
            expect(summary).toContain('better: -FN d');
        });

        it('passes a run whose only failures are pre-existing', () => {
            // The exit-code decision lives in outcome.mjs, but the summary must not describe
            // such a run as though something regressed.
            const summary = formatSummary(
                [
                    report([
                        variant({
                            name: 'base',
                            baseline: true,
                            correct: false,
                            preExisting: true,
                            expected: { d: true },
                            falseNegatives: ['d'],
                        }),
                    ]),
                ],
                'algorithm',
            );
            expect(summary).toContain('No behaviour changes introduced by any variant');
            expect(summary).not.toContain('UNEXPECTED');
        });

        it('lists declared divergences separately from failures', () => {
            const summary = formatSummary(
                [
                    report([
                        variant({ name: 'loose', correct: false, expectDivergence: true, expected: { d: false }, falsePositives: ['d'] }),
                    ]),
                ],
                'config',
            );
            expect(summary).toContain('1 expected divergence(s), declared via expectDivergence');
            expect(summary).toContain('These are the trade-offs the spec is measuring');
        });

        it('prefixes the engine when there is more than one', () => {
            const summary = formatSummary(
                [
                    report([variant({ name: 'v', correct: false, unexpected: true, expected: { d: true }, falseNegatives: ['d'] })], {
                        engine: 'webkit',
                    }),
                ],
                'algorithm',
            );
            expect(summary).toContain('webkit / article / v');
        });
    });

    describe('compareToStored', () => {
        const current = [report([variant({ name: 'v', median: 12 })], { engine: 'chromium' })];

        it('reports a median that moved beyond the threshold, in both directions', () => {
            const slower = compareToStored(
                current,
                { reports: [report([variant({ name: 'v', median: 10 })], { engine: 'chromium' })] },
                10,
            );
            expect(slower).toContain('20% slower');

            const faster = compareToStored(
                current,
                { reports: [report([variant({ name: 'v', median: 24 })], { engine: 'chromium' })] },
                10,
            );
            expect(faster).toContain('50% faster');
        });

        it('stays quiet within the threshold, because a few percent is expected variation', () => {
            const same = compareToStored(
                current,
                { reports: [report([variant({ name: 'v', median: 12.5 })], { engine: 'chromium' })] },
                10,
            );
            expect(same).toContain('No median moved by more than 10%');
        });

        it('says so when nothing lines up, rather than reporting no change', () => {
            // Comparing against a different spec's output would otherwise look like a pass.
            const nothing = compareToStored(
                current,
                { reports: [report([variant({ name: 'other' })], { engine: 'chromium', fixture: 'different' })] },
                10,
            );
            expect(nothing).toContain('Nothing in common with the stored run');
        });

        it('tolerates a stored run with no reports at all', () => {
            expect(compareToStored(current, /** @type {any} */ ({}), 10)).toContain('Nothing in common with the stored run');
        });

        it('does not compare against an unmeasured stored median', () => {
            const zero = compareToStored(current, { reports: [report([variant({ name: 'v', median: 0 })], { engine: 'chromium' })] }, 10);
            expect(zero).toContain('Nothing in common with the stored run');
        });
    });
});
