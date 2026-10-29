/**
 * The assertion layer: a set of ground-truth cases, and the join that turns them into
 * fixtures for a particular detector.
 *
 * The seam being tested is the one that lets one assertion set score any detector. Before
 * it existed, the cases were reachable only through a module that hardcoded
 * `adwalls.generic_en`, so a second detector could not be scored against them without
 * copying the set - and a copied set drifts.
 *
 * What is not tested here is whether the cases are *right*; that is a claim about the DOM,
 * and it is checked against real browsers by `npm run bench-drift-guard` and by the specs
 * themselves.
 */
import { fixturesFor } from '../../scripts/detector-bench/assertions/to-fixtures.mjs';
import { CASES, DISCRIMINATING_CASES } from '../../scripts/detector-bench/assertions/rendered-text.mjs';
import { DETECTOR_KEY, caseFixtures } from '../../scripts/detector-bench/detectors/adwall.mjs';

/** A tiny stand-in set, so these tests do not depend on the real cases staying as they are. */
const SAMPLE = {
    hit: { html: '<p>match me</p>', expected: true, why: 'a positive' },
    miss: { html: '<p>nothing</p>', expected: false, why: 'a negative' },
};

describe('detector-bench assertions', () => {
    describe('fixturesFor', () => {
        it('labels fixtures with whichever detector key it was given', () => {
            // The property the whole split exists for: the same cases, two detectors.
            const one = fixturesFor('adwalls.generic_en', SAMPLE);
            const two = fixturesFor('paywalls.generic_en', SAMPLE);

            expect(one.caseFixture('hit').expect).toEqual({ 'adwalls.generic_en': true });
            expect(two.caseFixture('hit').expect).toEqual({ 'paywalls.generic_en': true });
        });

        it('carries each case answer through as the expected result', () => {
            const { caseFixture } = fixturesFor('g.d', SAMPLE);
            expect(caseFixture('hit').expect['g.d']).toBe(true);
            expect(caseFixture('miss').expect['g.d']).toBe(false);
        });

        it('builds a minimal html fixture per case', () => {
            const { caseFixture } = fixturesFor('g.d', SAMPLE);
            const fixture = caseFixture('hit');
            expect(fixture.name).toBe('hit');
            expect(fixture.html).toBe('<p>match me</p>');
            expect(fixture.generate).toBeUndefined();
        });

        it('returns every case by default, and a named subset on request', () => {
            const { caseFixtures } = fixturesFor('g.d', SAMPLE);
            expect(caseFixtures().map((f) => f.name)).toEqual(['hit', 'miss']);
            expect(caseFixtures(['miss']).map((f) => f.name)).toEqual(['miss']);
        });

        it('throws on an unknown case name, listing the ones it knows', () => {
            // A typo would otherwise produce a fixture with `html: undefined`, which runs
            // against an empty page and reports a plausible-looking false negative.
            const { caseFixture } = fixturesFor('g.d', SAMPLE);
            expect(() => caseFixture('nope')).toThrowError(/Unknown case "nope".*hit, miss/);
        });

        describe('caseOnPage', () => {
            it('appends the case markup to the generator params', () => {
                const { caseOnPage } = fixturesFor('g.d', SAMPLE);
                const generate = () => {};
                const fixture = caseOnPage('hit', { generate, params: { rows: 20 } });

                expect(fixture.name).toBe('hit-on-page');
                expect(fixture.generate).toBe(generate);
                // `rows` preserved and `append` added: the page shape is shared with the
                // non-matching fixture, so a timing difference reflects the match.
                expect(fixture.params).toEqual({ rows: 20, append: '<p>match me</p>' });
            });

            it('keeps the case answer rather than assuming a match', () => {
                const { caseOnPage } = fixturesFor('g.d', SAMPLE);
                expect(caseOnPage('miss', { generate: () => {} }).expect['g.d']).toBe(false);
            });

            it('throws on an unknown case name', () => {
                const { caseOnPage } = fixturesFor('g.d', SAMPLE);
                expect(() => caseOnPage('nope', { generate: () => {} })).toThrowError(/Unknown case "nope"/);
            });
        });

        describe('at', () => {
            it('labels an arbitrary fixture, for pages that are not assertion cases', () => {
                const { at } = fixturesFor('g.d', SAMPLE);
                const generate = () => {};
                expect(at('article-clean', { generate, params: { rows: 2000 } }, false)).toEqual({
                    generate,
                    params: { rows: 2000 },
                    name: 'article-clean',
                    expect: { 'g.d': false },
                });
            });
        });
    });

    describe('the rendered-text set', () => {
        it('gives every case a body fragment, an answer and a reason', () => {
            // `why` is not decoration. The set grew because approaches kept differing on
            // cases nobody had written down, and a case with no stated reason is one the
            // next person will delete as redundant.
            for (const [name, entry] of Object.entries(CASES)) {
                expect(typeof entry.html).toBe('string', `${name} html`);
                expect(entry.html.length).toBeGreaterThan(0, `${name} html`);
                expect(typeof entry.expected).toBe('boolean', `${name} expected`);
                expect(typeof entry.why).toBe('string', `${name} why`);
                expect(entry.why.length).toBeGreaterThan(0, `${name} why`);
            }
        });

        it('holds both positive and negative cases', () => {
            // A set that was all one way would be satisfied by a detector that always
            // answers that way, and would score it 100%.
            const answers = Object.values(CASES).map((entry) => entry.expected);
            expect(answers).toContain(true);
            expect(answers).toContain(false);
        });

        it('names only cases that exist as discriminating', () => {
            for (const name of DISCRIMINATING_CASES) {
                expect(Object.keys(CASES)).toContain(name);
            }
        });
    });

    describe('the adwall preset', () => {
        it('binds the rendered-text set to the shipped detector key', () => {
            const fixtures = caseFixtures();
            expect(fixtures.length).toBe(Object.keys(CASES).length);
            for (const fixture of fixtures) {
                expect(Object.keys(fixture.expect)).toEqual([DETECTOR_KEY]);
            }
        });
    });
});
