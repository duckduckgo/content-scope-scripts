/**
 * `outcome.mjs` decides the benchmark runner's exit code, which makes it the harness logic
 * most worth pinning: a wrong answer here either fails a good experiment or passes a
 * regression, and neither is visible in the output.
 *
 * The cases below are the ones that motivated splitting "incorrect" from "incorrect in a
 * way this variant introduced". An innerText comparison spec exited 1 while reporting three
 * fixtures the shipped baseline also fails - the experiment had found a pre-existing gap in
 * `matching.js` and was being blamed for it.
 */
import { classify, deltaAgainst, decideOutcome } from '../../scripts/detector-bench/core/outcome.mjs';

describe('detector-bench outcome', () => {
    describe('classify', () => {
        it('reports nothing for results that match the labels', () => {
            const { falsePositives, falseNegatives } = classify({ a: true, b: false }, { a: true, b: false });
            expect(falsePositives).toEqual([]);
            expect(falseNegatives).toEqual([]);
        });

        it('separates a missed match from a spurious one', () => {
            const { falsePositives, falseNegatives } = classify({ missed: true, spurious: false }, { missed: false, spurious: true });
            expect(falseNegatives).toEqual(['missed']);
            expect(falsePositives).toEqual(['spurious']);
        });

        it('counts a thrown detector on the side of what it failed to do', () => {
            // 'error' is neither true nor false, but it is certainly not correct. A detector
            // that throws on a page it should have matched has failed to match it.
            expect(classify({ a: true }, { a: 'error' }).falseNegatives).toEqual(['a']);
            expect(classify({ a: false }, { a: 'error' }).falsePositives).toEqual(['a']);
        });

        it('ignores keys the fixture does not label', () => {
            const { falsePositives, falseNegatives } = classify({ a: true }, { a: true, unlabelled: true });
            expect(falsePositives).toEqual([]);
            expect(falseNegatives).toEqual([]);
        });
    });

    describe('deltaAgainst', () => {
        it('reports nothing when the variant agrees with the comparison point', () => {
            const delta = deltaAgainst({ a: true }, { a: false }, { a: false });
            expect(delta).toEqual({ introducedFP: [], introducedFN: [], fixedFP: [], fixedFN: [] });
        });

        it('calls it introduced when the comparison point was right', () => {
            const delta = deltaAgainst({ hit: true, miss: false }, { hit: true, miss: false }, { hit: false, miss: true });
            expect(delta.introducedFN).toEqual(['hit']);
            expect(delta.introducedFP).toEqual(['miss']);
        });

        it('calls it fixed when the comparison point was wrong', () => {
            const delta = deltaAgainst({ hit: true, miss: false }, { hit: false, miss: true }, { hit: true, miss: false });
            expect(delta.fixedFN).toEqual(['hit']);
            expect(delta.fixedFP).toEqual(['miss']);
        });
    });

    describe('decideOutcome on the algorithm axis', () => {
        const expected = { adwall: true };

        it('fails the run when the baseline is right and the variant is not', () => {
            const outcome = decideOutcome({
                axis: 'algorithm',
                expected,
                actual: { adwall: false },
                comparison: { adwall: true },
            });
            expect(outcome.correct).toBeFalse();
            expect(outcome.unexpected).toBeTrue();
            expect(outcome.preExisting).toBeFalse();
        });

        it('passes the run when the baseline is wrong the same way', () => {
            // The case that was being misreported. Both implementations miss this fixture,
            // so the variant introduced nothing and there is nothing to attribute to it.
            const outcome = decideOutcome({
                axis: 'algorithm',
                expected,
                actual: { adwall: false },
                comparison: { adwall: false },
            });
            expect(outcome.correct).toBeFalse();
            expect(outcome.unexpected).toBeFalse();
            expect(outcome.preExisting).toBeTrue();
        });

        it('passes the run and records a fix when the variant is right and the baseline is not', () => {
            const outcome = decideOutcome({
                axis: 'algorithm',
                expected,
                actual: { adwall: true },
                comparison: { adwall: false },
            });
            expect(outcome.correct).toBeTrue();
            expect(outcome.unexpected).toBeFalse();
            expect(outcome.delta?.fixedFN).toEqual(['adwall']);
        });

        it('falls back to the labels when there is no baseline to compare against', () => {
            // Nothing to attribute a divergence to, so the labels are all there is.
            const outcome = decideOutcome({ axis: 'algorithm', expected, actual: { adwall: false }, comparison: null });
            expect(outcome.unexpected).toBeTrue();
            expect(outcome.delta).toBeNull();
        });

        it('ignores expectDivergence, which the algorithm axis has no way to declare', () => {
            const outcome = decideOutcome({
                axis: 'algorithm',
                expected,
                actual: { adwall: false },
                comparison: { adwall: true },
                expectDivergence: true,
            });
            expect(outcome.unexpected).toBeTrue();
        });
    });

    describe('decideOutcome on the config axis', () => {
        const expected = { adwall: true };
        const actual = { adwall: false };

        it('fails an undeclared divergence', () => {
            const outcome = decideOutcome({ axis: 'config', expected, actual, comparison: { adwall: true } });
            expect(outcome.unexpected).toBeTrue();
        });

        it('accepts a divergence the spec declared', () => {
            // On this axis a behaviour change is the finding rather than a failure, so long
            // as it was a decision rather than a surprise.
            const outcome = decideOutcome({
                axis: 'config',
                expected,
                actual,
                comparison: { adwall: true },
                expectDivergence: true,
            });
            expect(outcome.correct).toBeFalse();
            expect(outcome.unexpected).toBeFalse();
            expect(outcome.preExisting).toBeFalse();
        });

        it('still fails when the reference is wrong too, unlike the algorithm axis', () => {
            // Deliberately different: a config spec varies one implementation's settings, so
            // "the reference is also wrong" says the setting is not what is at fault - but it
            // is still an undeclared divergence from the config that ships.
            const outcome = decideOutcome({ axis: 'config', expected, actual, comparison: { adwall: false } });
            expect(outcome.unexpected).toBeTrue();
            expect(outcome.preExisting).toBeFalse();
        });
    });
});
