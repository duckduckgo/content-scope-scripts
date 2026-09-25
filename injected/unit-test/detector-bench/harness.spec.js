/**
 * The harness functions that run inside the page. Playwright serialises them, so they close
 * over nothing and take everything as arguments - which also makes them callable against a
 * jsdom document with a stubbed variant registry.
 *
 * What is deliberately *not* covered here: anything about layout. jsdom has no layout engine,
 * so `dirtyLayout` and `measureLayoutInvalidation` would pass vacuously - a test asserting
 * that invalidation works, in an environment where nothing can be invalidated, is worse than
 * no test at all. Those live in the browser layer (`integration-test/detector-bench.spec.js`).
 *
 * Real matching against `matching.js` is also not covered here; that is what
 * `unit-test/web-detection.js` and `npm run bench-drift-guard` are for. These tests are about
 * the harness's own bookkeeping.
 */
import { JSDOM } from 'jsdom';
import { collectFacts, collectResults, singleSweep } from '../../scripts/detector-bench/core/harness.mjs';

/**
 * Install a jsdom document as the globals the harness functions expect, and return a
 * teardown. The harness reads `window` and `document` from global scope because in the page
 * they are ambient.
 *
 * @param {string} body
 * @returns {{ window: any, document: Document, restore: () => void }}
 */
function withDocument(body) {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${body}</body></html>`);
    const previous = { window: globalThis.window, document: globalThis.document, NodeFilter: globalThis.NodeFilter };

    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.NodeFilter = dom.window.NodeFilter;

    return {
        window: dom.window,
        document: dom.window.document,
        restore() {
            globalThis.window = previous.window;
            globalThis.document = previous.document;
            globalThis.NodeFilter = previous.NodeFilter;
        },
    };
}

/**
 * A stand-in for a bundled variant. `parseDetectors` and `evaluateMatch` are the only two
 * functions the harness needs from a variant bundle.
 *
 * @param {object} options
 * @param {(match: any) => boolean} [options.evaluateMatch]
 * @param {number} [options.peakChars] - Reported via the window hook, as the instrumented variants do
 * @returns {any}
 */
function stubVariant({ evaluateMatch = () => true, peakChars } = {}) {
    return {
        parseDetectors: (detectors) => detectors,
        evaluateMatch(match) {
            if (peakChars !== undefined) {
                /** @type {any} */ (globalThis.window).__benchPeakChars = peakChars;
            }
            return evaluateMatch(match);
        },
    };
}

describe('detector-bench harness', () => {
    /** @type {{ window: any, document: Document, restore: () => void } | null} */
    let env = null;

    afterEach(() => {
        env?.restore();
        env = null;
    });

    describe('collectFacts', () => {
        it('counts elements, text nodes and characters', () => {
            env = withDocument('<p>hello</p><div><span>ab</span></div>');
            const facts = collectFacts();
            // Elements are counted document-wide, so html, head and body are included: the p,
            // div and span plus those three. Text nodes and characters are body-subtree only,
            // because that is what the TreeWalker is rooted at. The three-element offset is
            // constant and irrelevant at the sizes these fixtures run at - a run reporting
            // "180,003 elements" generated 180,000 - but it is the reason the numbers are not
            // exactly what a fixture generator asked for.
            expect(facts.elements).toBe(3 + 3);
            expect(facts.textNodes).toBe(2);
            expect(facts.chars).toBe('hello'.length + 'ab'.length);
        });

        it('counts text inside script and style, which the XPath predicate later excludes', () => {
            // collectFacts describes the DOM as generated, not as any detector selects it. A
            // script-heavy fixture exists precisely because `chars` and selected characters
            // differ, so conflating them here would hide the thing being measured.
            env = withDocument('<p>hi</p><script>var x = 1;</script>');
            const facts = collectFacts();
            expect(facts.textNodes).toBe(2);
            expect(facts.chars).toBe('hi'.length + 'var x = 1;'.length);
        });

        it('reports an empty document as empty rather than throwing', () => {
            env = withDocument('');
            // Only the structural html/head/body; no content of any kind.
            expect(collectFacts()).toEqual(jasmine.objectContaining({ elements: 3, textNodes: 0, chars: 0 }));
        });

        it('reports renderedChars as zero where there is no layout engine', () => {
            // jsdom implements no `innerText`, so this degrades to 0 rather than failing. The
            // real value is asserted in the browser layer; what matters here is that a missing
            // `innerText` does not take the whole facts pass down with it.
            env = withDocument('<p>hello</p>');
            expect(collectFacts().renderedChars).toBe(0);
        });
    });

    describe('collectResults', () => {
        it('keys results by group.detector', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant({ evaluateMatch: () => true }) };

            const { results, detectorKeys } = collectResults({
                variantNames: ['v'],
                detectorsByVariant: { v: { adwalls: { generic_en: { match: {} }, generic_de: { match: {} } } } },
            });
            expect(results.v).toEqual({ 'adwalls.generic_en': true, 'adwalls.generic_de': true });
            expect(detectorKeys.v).toEqual(['adwalls.generic_en', 'adwalls.generic_de']);
        });

        it("records a detector that throws as 'error' rather than losing the run", () => {
            // One malformed detector config should cost that detector's result, not the whole
            // fixture. `classify` then counts it against whatever the fixture expected.
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = {
                v: stubVariant({
                    evaluateMatch: (match) => {
                        if (match.bad) throw new Error('nope');
                        return true;
                    },
                }),
            };

            const { results } = collectResults({
                variantNames: ['v'],
                detectorsByVariant: { v: { g: { good: { match: {} }, bad: { match: { bad: true } } } } },
            });
            expect(results.v).toEqual({ 'g.good': true, 'g.bad': 'error' });
        });

        it('reports peakChars as null for a variant that does not report one', () => {
            // Zero would be indistinguishable from "measured, and it was zero", which cannot
            // happen for any sweep that touches text.
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { plain: stubVariant(), instrumented: stubVariant({ peakChars: 4096 }) };

            const { peakChars } = collectResults({
                variantNames: ['plain', 'instrumented'],
                detectorsByVariant: { plain: { g: { d: { match: {} } } }, instrumented: { g: { d: { match: {} } } } },
            });
            expect(peakChars.plain).toBeNull();
            expect(peakChars.instrumented).toBe(4096);
        });

        it('resets the peak between variants, so one does not inherit another', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { first: stubVariant({ peakChars: 9999 }), second: stubVariant() };

            const { peakChars } = collectResults({
                variantNames: ['first', 'second'],
                detectorsByVariant: { first: { g: { d: { match: {} } } }, second: { g: { d: { match: {} } } } },
            });
            expect(peakChars.first).toBe(9999);
            expect(peakChars.second).toBeNull();
        });

        it('throws when a config parses to zero detectors', () => {
            // Otherwise the variant reports no results, every fixture agrees with it trivially,
            // and the run passes while measuring nothing at all.
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant() };

            expect(() => collectResults({ variantNames: ['v'], detectorsByVariant: { v: {} } })).toThrowError(
                /Variant "v" parsed to zero detectors/,
            );
            expect(() => collectResults({ variantNames: ['v'], detectorsByVariant: { v: { emptyGroup: {} } } })).toThrowError(
                /parsed to zero detectors/,
            );
        });

        it('invalidates layout for a dirty variant, so its result is checked in the state it is timed in', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant() };
            const dirtyLayout = jasmine.createSpy('dirtyLayout');
            env.window.__benchLayout = { dirtyLayout };

            collectResults({
                variantNames: ['v'],
                detectorsByVariant: { v: { g: { d: { match: {} } } } },
                layoutByVariant: { v: 'dirty' },
            });
            expect(dirtyLayout).toHaveBeenCalled();
        });

        it('does not touch layout for a warm variant', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant() };
            const dirtyLayout = jasmine.createSpy('dirtyLayout');
            env.window.__benchLayout = { dirtyLayout };

            collectResults({
                variantNames: ['v'],
                detectorsByVariant: { v: { g: { d: { match: {} } } } },
                layoutByVariant: { v: 'warm' },
            });
            expect(dirtyLayout).not.toHaveBeenCalled();
        });

        it('evaluates every variant against the same document', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = {
                yes: stubVariant({ evaluateMatch: () => true }),
                no: stubVariant({ evaluateMatch: () => false }),
            };

            const { results } = collectResults({
                variantNames: ['yes', 'no'],
                detectorsByVariant: { yes: { g: { d: { match: {} } } }, no: { g: { d: { match: {} } } } },
            });
            expect(results.yes).toEqual({ 'g.d': true });
            expect(results.no).toEqual({ 'g.d': false });
        });
    });

    describe('singleSweep', () => {
        it('accumulates into the sink, so the engine cannot eliminate the sweep', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant({ evaluateMatch: () => true }) };

            const returned = singleSweep({ variantName: 'v', detectors: { g: { a: { match: {} }, b: { match: {} } } } });
            expect(returned).toBeGreaterThan(0);
            expect(env.window.__benchSink).toBe(returned);
        });

        it('adds to an existing sink rather than replacing it', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant() };
            env.window.__benchSink = 100;

            const returned = singleSweep({ variantName: 'v', detectors: { g: { a: { match: {} } } } });
            expect(env.window.__benchSink).toBe(100 + returned);
        });

        it('invalidates layout when asked to sweep dirty', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant() };
            const dirtyLayout = jasmine.createSpy('dirtyLayout');
            env.window.__benchLayout = { dirtyLayout };

            singleSweep({ variantName: 'v', detectors: { g: { a: { match: {} } } }, layout: 'dirty' });
            expect(dirtyLayout).toHaveBeenCalledTimes(1);
        });

        it('defaults to warm, so a caller that omits layout takes no layout cost', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = { v: stubVariant() };
            const dirtyLayout = jasmine.createSpy('dirtyLayout');
            env.window.__benchLayout = { dirtyLayout };

            singleSweep({ variantName: 'v', detectors: { g: { a: { match: {} } } } });
            expect(dirtyLayout).not.toHaveBeenCalled();
        });

        it('counts a throwing detector rather than propagating it', () => {
            env = withDocument('<p>hi</p>');
            env.window.__benchVariants = {
                v: stubVariant({
                    evaluateMatch: () => {
                        throw new Error('nope');
                    },
                }),
            };
            expect(() => singleSweep({ variantName: 'v', detectors: { g: { a: { match: {} } } } })).not.toThrow();
        });
    });
});
