import { JSDOM } from 'jsdom';
import { compileDetector, parseDetectors } from '../src/features/web-detection/parse.js';
import { EvaluationContext, evaluateMatchNode, evaluatePayload } from '../src/features/web-detection/expressions.js';
import { NativeReader } from '../src/features/web-detection/predicates.js';
import { ConfigParseError } from '../src/features/web-detection/core.js';
import WebDetection from '../src/features/web-detection.js';

/**
 * @typedef {object} RunOptions
 * @property {string} [head] - markup for `<head>`
 * @property {(window: any) => void} [install] - runs before the reader captures native getters, so what it defines is native
 * @property {(window: any) => void} [afterCapture] - runs after the capture, as a page script would
 */

/**
 * Compile and run a detector against a JSDOM page, reading through that window's globals.
 *
 * @param {string} body - markup for `<body>`
 * @param {any} detector
 * @param {RunOptions} [options]
 * @returns {{ detected: true | false | 'error' | 'aborted', abortKind?: string, data?: Record<string, unknown>, ctx: EvaluationContext, error?: unknown }}
 */
function run(body, detector, options = {}) {
    const dom = new JSDOM(`<!DOCTYPE html><html><head>${options.head ?? ''}</head><body>${body}</body></html>`);
    const window = dom.window;
    options.install?.(window);
    const originalDocument = globalThis.document;
    globalThis.document = window.document;
    try {
        const compiled = compileDetector(detector, window);
        const reader = new NativeReader(window, compiled.names);
        options.afterCapture?.(window);
        const ctx = new EvaluationContext(reader);
        /** @type {{ detected: true | false | 'aborted', abortKind?: string }} */
        let result;
        try {
            result = evaluateMatchNode(compiled.match, ctx);
        } catch (error) {
            return { detected: 'error', ctx, error };
        }
        const data = result.detected === true && compiled.fireEventData ? evaluatePayload(compiled.fireEventData, ctx) : undefined;
        return { ...result, data, ctx };
    } finally {
        globalThis.document = originalDocument;
    }
}

/**
 * @param {string} body
 * @param {unknown} match
 * @param {RunOptions} [options]
 */
function match(body, match, options) {
    return run(body, { match }, options).detected;
}

/**
 * A detector that always matches and sends one payload field `x`.
 *
 * @param {unknown} value
 * @param {object} [extra] - `when` and `buckets`
 * @param {unknown} [matchCondition]
 */
function withPayload(value, extra = {}, matchCondition = true) {
    return { match: matchCondition, actions: { fireEvent: { type: 't', data: { x: { value, ...extra } } } } };
}

/**
 * @param {string} body
 * @param {unknown} value
 * @param {object} [extra]
 * @param {RunOptions} [options]
 */
function payload(body, value, extra, options) {
    return run(body, withPayload(value, extra), options).data;
}

/**
 * @param {unknown} detector
 * @param {RegExp | string} [message]
 */
function expectParseError(detector, message) {
    expect(() => compileDetector(/** @type {any} */ (detector), {})).toThrowMatching(
        (e) =>
            e instanceof ConfigParseError &&
            (!message || (typeof message === 'string' ? e.message.includes(message) : message.test(e.message))),
    );
}

/**
 * JSDOM loads no images. These getters derive image state from attributes, installed before the
 * capture so the reader takes them as the browser's own: `data-complete`, `data-width`, and
 * `data-throw` making `naturalWidth` throw.
 *
 * @param {any} window
 */
function imageState(window) {
    const proto = window.HTMLImageElement.prototype;
    const counts = { complete: 0 };
    Object.defineProperty(proto, 'complete', {
        configurable: true,
        get() {
            counts.complete++;
            return this.hasAttribute('data-complete');
        },
    });
    Object.defineProperty(proto, 'naturalWidth', {
        configurable: true,
        get() {
            if (this.hasAttribute('data-throw')) throw new Error('refused');
            return Number(this.getAttribute('data-width') ?? 0);
        },
    });
    Object.defineProperty(proto, 'currentSrc', {
        configurable: true,
        get() {
            return this.getAttribute('src') ?? '';
        },
    });
    window.__imageReads = counts;
}

/**
 * A performance timeline holding `entries`. Each entry's keys are fields with a native getter;
 * `missing` names fields the engine lacks, with no getter at all.
 *
 * @param {Array<Record<string, unknown>>} entries
 * @param {{ missing?: string[] }} [options]
 * @returns {(window: any) => void}
 */
function timeline(entries, { missing = [] } = {}) {
    return (window) => {
        /** @type {WeakMap<object, Record<string, unknown>>} */
        const fields = new WeakMap();
        function FakePerformanceEntry() {}
        const names = new Set(['name', 'entryType', 'startTime', 'duration', ...entries.flatMap((entry) => Object.keys(entry))]);
        for (const name of names) {
            if (missing.includes(name)) continue;
            Object.defineProperty(FakePerformanceEntry.prototype, name, {
                get() {
                    return fields.get(this)?.[name];
                },
            });
        }
        window.FakePerformanceEntry = FakePerformanceEntry;
        const objects = entries.map((entry) => {
            const object = Object.create(FakePerformanceEntry.prototype);
            fields.set(object, entry);
            return object;
        });
        Object.defineProperty(window.Performance.prototype, 'getEntriesByType', {
            configurable: true,
            writable: true,
            value: (/** @type {string} */ type) => objects.filter((o) => fields.get(o)?.entryType === type),
        });
        Object.defineProperty(window.Performance.prototype, 'getEntriesByName', {
            configurable: true,
            writable: true,
            value: (/** @type {string} */ name, /** @type {string} */ type) =>
                objects.filter((o) => fields.get(o)?.name === name && (type === undefined || fields.get(o)?.entryType === type)),
        });
    };
}

/**
 * `document.fonts` holding font faces with these statuses.
 *
 * @param {string[]} statuses
 * @returns {(window: any) => void}
 */
function fonts(statuses) {
    return (window) => {
        /** @type {WeakMap<object, string>} */
        const status = new WeakMap();
        function FakeFontFace() {}
        Object.defineProperty(FakeFontFace.prototype, 'status', {
            get() {
                return status.get(this);
            },
        });
        const faces = statuses.map((s) => {
            const face = Object.create(FakeFontFace.prototype);
            status.set(face, s);
            return face;
        });
        function FakeFontFaceSet() {}
        FakeFontFaceSet.prototype[Symbol.iterator] = function () {
            return faces.values();
        };
        window.FakeFontFace = FakeFontFace;
        window.FakeFontFaceSet = FakeFontFaceSet;
        const set = Object.create(FakeFontFaceSet.prototype);
        Object.defineProperty(window.Document.prototype, 'fonts', {
            configurable: true,
            get() {
                return set;
            },
        });
    };
}

const IMG = (/** @type {string} */ attrs = '') => `<img src="a.png" ${attrs}>`;
const BROKEN = { selector: 'img', where: { complete: true, naturalWidth: 0, 'currentSrc.length': { gt: 0 } } };
const RENDERED = '//body//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';

describe('WebDetection expressions', () => {
    describe('iterators', () => {
        it('text in boolean position agrees with a count of at least one', () => {
            for (const html of ['<p>foo</p>', '<p>bar</p>', '<p>foo foo</p>']) {
                const asBoolean = match(html, { text: { pattern: 'foo' } });
                const asCount = match(html, { count: { text: { pattern: 'foo' } }, is: { gte: 1 } });
                expect(asBoolean).toBe(asCount);
            }
        });

        it('element in boolean position agrees with a count of at least one', () => {
            for (const html of ['<p class="a"></p>', '<p></p>']) {
                expect(match(html, { element: { selector: '.a' } })).toBe(
                    match(html, { count: { element: { selector: '.a' } }, is: { gte: 1 } }),
                );
            }
        });

        it('counts non-overlapping matches across selectors and XPath expressions', () => {
            const result = run('<h1>error</h1><p>error and error</p>', {
                match: { count: { text: { selector: 'h1', xpath: '//p//text()', pattern: 'error' } }, as: 'n', is: { lt: 100 } },
            });
            expect(result.ctx.measured.n).toBe(3);
        });

        it('counts a match straddling an XPath chunk boundary once', () => {
            const filler = 'x '.repeat(20);
            // Many short nodes so chunks flush mid-phrase
            const html = `<p>${filler}</p><p>page</p><p> not </p><p>found</p><p>${filler}</p><p>page not found</p>`;
            for (const chunkSize of [0, 8, 16, 1024]) {
                const result = run(html, {
                    match: {
                        count: { text: { xpath: '//p/text()', pattern: 'page not found', xpathConfig: { chunkSize, chunkTail: 32 } } },
                        as: 'n',
                        is: { lt: 100 },
                    },
                });
                expect(result.ctx.measured.n).withContext(`chunkSize ${chunkSize}`).toBe(2);
            }
        });

        it('matches across a chunk boundary in boolean position as before', () => {
            const html = `<p>${'x '.repeat(50)}</p><p>adblocker </p><p>detected</p>`;
            expect(
                match(html, {
                    text: { xpath: '//p/text()', pattern: 'adblocker detected', xpathConfig: { chunkSize: 16, chunkTail: 32 } },
                }),
            ).toBe(true);
        });
    });

    describe('types', () => {
        it('rejects each expression in a position whose type config shows is wrong', () => {
            expectParseError({ match: { element: { selector: 'img', field: 'naturalWidth' } } }, 'does not fill boolean');
            expectParseError({ match: { api: { path: 'document.fonts', where: { status: 'error' } } } }, 'does not fill boolean');
            expectParseError({ match: { count: { element: { selector: 'img' } } } }, 'numbers become booleans only through `is`');
            expectParseError({ match: { first: 5, is: 1 } }, 'does not fill list');
            expectParseError({ match: { count: { count: { element: { selector: 'img' } } }, is: 1 } }, 'does not fill list');
            expectParseError({ match: 5 }, 'does not fill boolean');
            expectParseError({ match: { sum: [true], is: 1 } }, 'does not fill number');
            expectParseError({ match: { count: { if: { test: true, then: 1, else: 2 } }, is: 1 } }, "'if' does not fill list");
        });

        it('takes an api value of the type its position expects, checked as it is read', () => {
            const hidden = (/** @type {boolean} */ value) => (/** @type {any} */ w) =>
                Object.defineProperty(w.Document.prototype, 'hidden', { configurable: true, get: () => value });
            expect(match('', { api: { path: 'document.hidden' } }, { install: hidden(true) })).toBe(true);
            expect(match('', { api: { path: 'document.hidden' } }, { install: hidden(false) })).toBe(false);
            expect(match('', { api: { path: 'document.title' } })).toBe('error');
            expect(match('', { any: { api: { path: 'document.hidden' } } }, { install: hidden(true) })).toBe(true);
            expect(match('', { api: { path: 'document.fonts', field: 'status' } }, { install: fonts(['loaded']) })).toBe('error');
        });

        it('rejects `is` outside boolean position, and several expression keys beside it', () => {
            expectParseError(
                { match: { sum: [{ count: { element: { selector: 'img' } }, is: { gt: 1 } }], is: 1 } },
                '`is` gives a boolean',
            );
            expectParseError({ match: { text: { pattern: 'a' }, element: { selector: 'p' }, is: true } }, 'several expression keys');
            expectParseError(withPayload({ count: { element: { selector: 'img' } }, is: { gt: 1 } }), '`is` gives a boolean');
        });

        it('rejects unknown keys and reserved keys', () => {
            expectParseError({ match: { pageFeature: 'x' } }, "unknown expression key 'pageFeature'");
            expectParseError({ match: { element: { selector: 'img', foo: 1 } } }, "unknown key 'foo'");
            expectParseError({ match: { api: { path: 'document.title', allowGetter: true }, is: '' } }, "unknown key 'allowGetter'");
            expectParseError({ match: { count: { element: { selector: 'img' } }, aggregate: 'max', is: 1 } }, "'aggregate' is reserved");
            expectParseError(
                { match: { count: { element: { selector: 'img' } }, catch: { missing: 0 }, is: 1 } },
                "unknown failure kind 'missing'",
            );
            expectParseError({ match: { if: { test: true, then: 1 }, is: 1 } }, "'if' needs 'else'");
            expectParseError({ match: { if: { test: true, then: 1, else: 2, other: 3 }, is: 1 } }, "unknown key 'other'");
        });

        it('reads one named source as a boolean in match and as a list in a payload', () => {
            const detector = {
                match: { element: { selector: 'img' }, as: 'images' },
                actions: { fireEvent: { type: 't', data: { images: { value: { count: { ref: 'images' } } } } } },
            };
            expect(run(IMG() + IMG(), detector).data).toEqual({ images: 2 });
        });

        it('reads text matches and elements through list operators', () => {
            const html = '<p>Page not found</p><p>Error 404</p>';
            expect(match(html, { first: { text: { pattern: ['not found', 'error'] } }, is: 'not found' })).toBe(true);
            expect(match(html, { last: { text: { pattern: ['not found', 'error'] } }, is: 'Error' })).toBe(true);
            expect(match('<p>one match</p>', { only: { text: { pattern: 'match' } }, is: 'match' })).toBe(true);
            expect(match('<p>match match</p>', { only: { text: { pattern: 'match' } }, is: 'match' })).toBe('error');
            expect(match('<p id="a"></p>', { only: { element: { selector: 'p' } }, is: { tagName: 'P', id: 'a' } })).toBe(true);
            expect(payload('<p>x</p>', { only: { text: { pattern: 'x' } } })).toEqual({ x: 'x' });
            expect(payload('<p>x</p>', { only: { element: { selector: 'p' } } })).toEqual({});
        });

        it('reads an element source under any as a boolean', () => {
            expect(match('<p></p>', { any: [{ element: { selector: 'p' } }, false] })).toBe(true);
            expect(match('', { all: { element: { selector: 'p' } } })).toBe(false);
        });

        it('takes booleans, arrays and multi-key objects in value position', () => {
            expect(payload('<p>a</p>', { all: [{ text: { pattern: 'a' } }], as: 'hasA' })).toEqual({ x: true });
            expect(payload('<p>a</p>', [{ text: { pattern: 'b' } }])).toEqual({ x: false });
            expect(payload('<p class="c">a</p>', { text: { pattern: 'a' }, element: { selector: '.c' } })).toEqual({ x: true });
            expect(payload('', false)).toEqual({ x: false });
        });

        it('takes boolean literals and an empty object in boolean position', () => {
            expect(match('', true)).toBe(true);
            expect(match('', false)).toBe(false);
            expect(match('', {})).toBe(true);
            expect(match('', [])).toBe(false);
        });

        it('names the AND of a multi-key object', () => {
            const result = run('<p class="a">foo</p>', { match: { text: { pattern: 'foo' }, element: { selector: '.a' }, as: 'both' } });
            expect(result.detected).toBe(true);
            expect(result.ctx.measured.both).toBe(true);
        });

        it('ANDs `any` with a source key in one object', () => {
            expect(match('<p class="a">foo</p>', { any: [{ text: { pattern: 'foo' } }], element: { selector: '.a' } })).toBe(true);
            expect(match('<p>foo</p>', { any: [{ text: { pattern: 'foo' } }], element: { selector: '.a' } })).toBe(false);
        });

        it('rejects legacy operator blocks inside a source outside boolean position', () => {
            expectParseError({ match: { count: { text: { any: [{ pattern: 'a' }] } }, is: 1 } }, 'take boolean position');
        });
    });

    describe('unwrapping', () => {
        const widths = (/** @type {number[]} */ list) => list.map((w) => IMG(`data-width="${w}"`)).join('');
        const width = { element: { selector: 'img', field: 'naturalWidth' } };

        it('gives a selected list’s one item in number position, and errors over none or several', () => {
            const read = { sub: [width, 1], is: 4 };
            expect(match(widths([5]), read, { install: imageState })).toBe(true);
            expect(match('', read, { install: imageState })).toBe('error');
            expect(match(widths([5, 5]), read, { install: imageState })).toBe('error');
        });

        it('gives the one item to a predicate that compares, and the list as an array to one that does not', () => {
            expect(match(widths([5]), { ...width, is: { gt: 4 } }, { install: imageState })).toBe(true);
            expect(match(widths([5]), { ...width, is: 5 }, { install: imageState })).toBe(true);
            expect(match(widths([5, 6]), { ...width, is: { gt: 4 } }, { install: imageState })).toBe('error');
            expect(match(widths([5, 6]), { ...width, is: { length: 2 } }, { install: imageState })).toBe(true);
            expect(match(widths([5, 6]), { ...width, is: { type: 'array' } }, { install: imageState })).toBe(true);
            expect(match('', { ...width, is: {} }, { install: imageState })).toBe(true);
        });

        it('keeps element and text in boolean position as presence', () => {
            expect(match(IMG() + IMG(), { element: { selector: 'img' } })).toBe(true);
            expect(match('<p>a a</p>', { text: { pattern: 'a' } })).toBe(true);
        });

        it('does not unwrap an iterable an api reads', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 5 }]);
            const entries = { api: { path: 'performance.getEntriesByType', args: ['navigation'] } };
            expect(match('', { ...entries, is: { length: 1 } }, { install })).toBe(true);
            expect(match('', { ...entries, is: { lt: 1 } }, { install })).toBe('error');
        });

        it('sends a selected list bucketed, each bucket unwrapping it, and errors on one unbucketed', () => {
            const buckets = { small: { lt: 10 }, large: { gte: 10 } };
            expect(run(widths([5]), withPayload(width, { buckets }), { install: imageState }).data).toEqual({ x: 'small' });
            expect(run(widths([5]), withPayload(width, { buckets: { two: { length: 2 } } }), { install: imageState }).data).toEqual({});
            expect(run(widths([5]), withPayload(width), { install: imageState }).data).toEqual({
                _errors: [{ type: 'payloadEval', payloadKey: 'x' }],
            });
            expect(run(widths([5, 6]), withPayload(width, { buckets }), { install: imageState }).data).toEqual({
                _errors: [{ type: 'payloadEval', payloadKey: 'x' }],
            });
        });
    });

    describe('names and refs', () => {
        it('rejects a duplicate name, an unresolved ref and a cycle', () => {
            expectParseError(
                {
                    match: {
                        all: [
                            { element: { selector: 'a' }, as: 'x' },
                            { element: { selector: 'b' }, as: 'x' },
                        ],
                    },
                },
                "duplicate name 'x'",
            );
            expectParseError({ match: { ref: 'nope' } }, "unresolved ref 'nope'");
            expectParseError(
                {
                    match: { sum: [{ ref: 'b' }], as: 'a', is: 1 },
                    actions: { fireEvent: { type: 't', data: { b: { value: { sum: [{ ref: 'a' }], as: 'b' } } } } },
                },
                'cycle',
            );
            expectParseError(
                { match: { count: { element: { selector: 'img' } }, as: 'a', catch: { absent: { ref: 'a' } }, is: 1 } },
                'cycle',
            );
        });

        it('computes a ref whose target short-circuiting skipped', () => {
            const result = run('<p>foo</p>' + IMG(), {
                match: { any: [{ text: { pattern: 'foo' } }, { count: { element: { selector: 'img' } }, as: 'images', is: { gt: 0 } }] },
                actions: { fireEvent: { type: 't', data: { images: { value: { ref: 'images' } } } } },
            });
            expect(result.data).toEqual({ images: 1 });
        });

        it('reads the value a name holds, not the boolean `is` gives', () => {
            const html = IMG() + IMG() + IMG();
            expect(
                match(html, {
                    all: [
                        { count: { element: { selector: 'img' } }, as: 'images', is: { gte: 1 } },
                        { ref: 'images', is: 3 },
                    ],
                }),
            ).toBe(true);
        });
    });

    describe('values', () => {
        it('divides by 0 as JS does', () => {
            expect(payload('', { div: [1, 0] }, { when: { finite: false, gt: 0 } })).toEqual({});
            expect(run('', withPayload({ div: [1, 0] })).ctx.memo.size).toBeGreaterThan(0);
            const result = run('', {
                match: {
                    all: [
                        { div: [1, 0], as: 'pos', is: { finite: false, gt: 0 } },
                        { div: [-1, 0], as: 'neg', is: { lt: 0 } },
                        { div: [0, 0], as: 'nan', is: { nan: true } },
                    ],
                },
            });
            expect(result.detected).toBe(true);
            expect(result.ctx.measured.pos).toBe(Infinity);
            expect(result.ctx.measured.neg).toBe(-Infinity);
            expect(result.ctx.measured.nan).toBeNaN();
        });

        it('carries NaN through each operator', () => {
            for (const op of ['sum', 'mul', 'min', 'max', 'sub', 'div']) {
                expect(match('', { [op]: [{ div: [0, 0] }, 2], is: { nan: true } }))
                    .withContext(op)
                    .toBe(true);
            }
        });

        it('compares NaN as within no bound, so `none` over a comparison on NaN holds', () => {
            expect(match('', { div: [0, 0], is: { lt: 5 } })).toBe(false);
            expect(match('', { div: [0, 0], is: { gte: 5 } })).toBe(false);
            expect(match('', { none: { div: [0, 0], is: { lt: 5 } } })).toBe(true);
        });

        it('computes negation through sub', () => {
            expect(match('', { sub: [0, 3], is: -3 })).toBe(true);
        });
    });

    describe('failures and catch', () => {
        it('aborts on a failure in boolean position', () => {
            const result = run('', { match: { count: { api: { path: 'document.fonts' } }, is: { gt: 0 } } });
            expect(result.detected).toBe('aborted');
            expect(result.abortKind).toBe('absent');
        });

        it('takes the handler for a listed kind, not measured', () => {
            const detector = {
                match: {
                    count: { api: { path: 'document.fonts', where: { status: 'error' } } },
                    as: 'failedFontFaces',
                    catch: { absent: 0 },
                    is: { lt: 3 },
                },
                actions: { fireEvent: { type: 't', data: { failedFontFaces: { value: { ref: 'failedFontFaces' } } } } },
            };
            const result = run('', detector);
            expect(result.detected).toBe(true);
            expect(result.data).toEqual({});
            expect(result.ctx.handled).toEqual([jasmine.objectContaining({ kind: 'absent', as: 'failedFontFaces' })]);
            // On an engine with document.fonts the value is measured
            expect(run('', detector, { install: fonts(['loaded', 'error']) }).data).toEqual({ failedFontFaces: 1 });
        });

        it('passes an unlisted kind up', () => {
            const result = run(
                IMG('data-complete data-throw'),
                {
                    match: {
                        count: { element: { selector: 'img', where: { naturalWidth: 0 } } },
                        catch: { absent: 0 },
                        is: { gt: 0 },
                    },
                },
                { install: imageState },
            );
            expect(result.detected).toBe('aborted');
            expect(result.abortKind).toBe('denied');
        });

        it('evaluates a handler only when it handles a kind', () => {
            const result = run('', {
                match: {
                    count: { element: { selector: 'img' } },
                    catch: { absent: { count: { api: { path: 'missingApi' } } } },
                    is: 0,
                },
            });
            expect(result.detected).toBe(true);
            expect(result.ctx.handled).toEqual([]);
        });

        it('passes up a failing handler’s own kind, and handles it with its own catch', () => {
            const failing = {
                count: { api: { path: 'document.fonts' } },
                catch: { absent: { count: { api: { path: 'otherMissing' } } } },
                is: 0,
            };
            expect(run('', { match: failing }).abortKind).toBe('absent');
            const chained = {
                count: { api: { path: 'document.fonts' } },
                catch: { absent: { count: { api: { path: 'otherMissing' } }, catch: { absent: 7 } } },
                is: 7,
            };
            expect(match('', chained)).toBe(true);
        });

        it('handles the test’s failures with a catch on an all around it', () => {
            const detector = {
                match: {
                    all: {
                        count: { api: { path: 'document.fonts', where: { status: 'error' } } },
                        as: 'failedFontFaces',
                        is: { lt: 3 },
                    },
                    catch: { absent: false },
                },
            };
            expect(match('', detector.match)).toBe(false);
        });

        it('reads `exists` and `type` on a failed value, as a measured reading', () => {
            expect(
                match('', {
                    count: { api: { path: 'document.fonts', where: { status: 'error' } } },
                    is: { exists: true, gt: 0 },
                }),
            ).toBe(false);
            expect(match('', { count: { api: { path: 'document.fonts' } }, is: { exists: false } })).toBe(true);
            expect(match('', { count: { api: { path: 'document.fonts' } }, is: { type: 'undefined' } })).toBe(true);
            expect(match('', { count: { api: { path: 'document.fonts' } }, catch: { absent: 0 }, is: { gt: 0 } })).toBe(false);
        });

        it('lets a handled failure under `none` decide the leaf, and a failure under `none` abort', () => {
            expect(
                match('', {
                    none: {
                        count: { api: { path: 'document.fonts', where: { status: 'error' } } },
                        catch: { absent: 0 },
                        is: { gt: 0 },
                    },
                }),
            ).toBe(true);
            expect(
                match('', {
                    none: { count: { api: { path: 'document.fonts', where: { status: 'error' } } }, is: { gt: 0 } },
                }),
            ).toBe('aborted');
        });

        it('stops at the first failure, so key order decides between a match and an abort', () => {
            const failing = { count: { api: { path: 'document.fonts' } }, is: { gt: 0 } };
            expect(match('<p>foo</p>', { any: [{ text: { pattern: 'foo' } }, failing] })).toBe(true);
            expect(match('<p>foo</p>', { any: [failing, { text: { pattern: 'foo' } }] })).toBe('aborted');
        });
    });

    describe('if', () => {
        const brokenRatio = {
            if: {
                test: { count: { element: { selector: 'img' } }, as: 'images', is: { gt: 0 } },
                then: { div: [{ count: { element: BROKEN } }, { ref: 'images' }] },
                else: 0,
            },
            as: 'brokenRatio',
        };

        it('takes the branch the test chooses, measured', () => {
            const none = run('<p></p>', withPayload({ ref: 'brokenRatio' }, {}, { all: [{ ...brokenRatio, is: { gte: 0 } }] }), {
                install: imageState,
            });
            expect(none.data).toEqual({ x: 0 });
            const half = run(
                IMG('data-complete') + IMG('data-complete data-width="5"'),
                withPayload({ ref: 'brokenRatio' }, {}, { all: [{ ...brokenRatio, is: { gte: 0 } }] }),
                {
                    install: imageState,
                },
            );
            expect(half.data).toEqual({ x: 0.5 });
        });

        it('does not evaluate the other branch', () => {
            const result = run('', {
                match: { if: { test: true, then: 1, else: { count: { api: { path: 'document.fonts' } } } }, is: 1 },
            });
            expect(result.detected).toBe(true);
        });

        it('omits a payload reading the branch not taken', () => {
            const detector = {
                match: {
                    if: { test: false, then: { sum: [1], as: 'thenValue' }, else: { sum: [2], as: 'elseValue' } },
                    as: 'chosen',
                    is: {},
                },
                actions: {
                    fireEvent: {
                        type: 't',
                        data: { a: { value: { ref: 'thenValue' } }, b: { value: { ref: 'elseValue' } }, c: { value: { ref: 'chosen' } } },
                    },
                },
            };
            expect(run('', detector).data).toEqual({ b: 2, c: 2 });
        });

        it('rejects a ref in match into a branch from outside it', () => {
            expectParseError(
                {
                    match: {
                        all: [
                            { if: { test: true, then: { sum: [1], as: 'inner' }, else: 0 }, is: {} },
                            { ref: 'inner', is: 1 },
                        ],
                    },
                },
                "reads into an 'if' branch",
            );
        });

        it('passes up a failure in test', () => {
            expect(
                match('', {
                    if: { test: { count: { api: { path: 'document.fonts' } }, is: { gt: 0 } }, then: 1, else: 2 },
                    is: {},
                }),
            ).toBe('aborted');
        });

        it('is not measured when the test or the branch takes a handler’s value', () => {
            const viaTest = run(
                '',
                withPayload({
                    if: {
                        test: { count: { api: { path: 'document.fonts' } }, catch: { absent: 0 }, is: 0 },
                        then: 1,
                        else: 2,
                    },
                }),
            );
            expect(viaTest.data).toEqual({});
            const viaBranch = run(
                '',
                withPayload({
                    if: {
                        test: true,
                        then: { count: { api: { path: 'document.fonts' } }, catch: { absent: 0 } },
                        else: 2,
                    },
                }),
            );
            expect(viaBranch.data).toEqual({});
        });
    });

    describe('operators', () => {
        it('errors on only, first, last, min and max over no items', () => {
            for (const op of ['only', 'first', 'last', 'min', 'max']) {
                const result = run('', {
                    match: { [op]: { element: { selector: 'img', field: 'naturalWidth' } }, is: {} },
                });
                expect(result.detected).withContext(op).toBe('error');
            }
            expect(match('', { sum: { element: { selector: 'img', field: 'naturalWidth' } }, is: 0 })).toBe(true);
            expect(match('', { mul: { element: { selector: 'img', field: 'naturalWidth' } }, is: 1 })).toBe(true);
        });

        it('mixes lists of values with numbers', () => {
            const html = IMG('data-width="3"') + IMG('data-width="9"');
            expect(match(html, { max: [{ element: { selector: 'img', field: 'naturalWidth' } }, 4], is: 9 }, { install: imageState })).toBe(
                true,
            );
            expect(
                match(html, { max: [{ element: { selector: 'img', field: 'naturalWidth' } }, 100], is: 100 }, { install: imageState }),
            ).toBe(true);
            expect(
                match(html, { sum: [{ element: { selector: 'img', field: 'naturalWidth' } }, 1], is: 13 }, { install: imageState }),
            ).toBe(true);
        });

        it('reads the one item with only, and errors over none or several', () => {
            const read = { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: { gte: 0 } };
            expect(match(IMG(), read, { install: imageState })).toBe(true);
            expect(match('', read, { install: imageState })).toBe('error');
            expect(match(IMG() + IMG(), read, { install: imageState })).toBe('error');
        });

        it('takes first and last in document order', () => {
            const html = IMG('data-width="1"') + IMG('data-width="2"') + IMG('data-width="3"');
            expect(match(html, { first: { element: { selector: 'img', field: 'naturalWidth' } }, is: 1 }, { install: imageState })).toBe(
                true,
            );
            expect(match(html, { last: { element: { selector: 'img', field: 'naturalWidth' } }, is: 3 }, { install: imageState })).toBe(
                true,
            );
        });

        it('takes first and last in timeline order', () => {
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: 5 },
                { name: 'b', entryType: 'resource', duration: 7 },
            ]);
            const path = { path: 'performance.getEntriesByType', args: ['resource'], field: 'duration' };
            expect(match('', { first: { api: path }, is: 5 }, { install })).toBe(true);
            expect(match('', { last: { api: path }, is: 7 }, { install })).toBe(true);
        });

        it('errors on a value of the wrong type', () => {
            expect(match('<p>x</p>', { sum: [{ element: { selector: 'p', field: 'tagName' } }], is: 1 })).toBe('error');
            expect(match('<p>x</p>', { only: { element: { selector: 'p', field: 'tagName' } }, is: { gt: 1 } })).toBe('error');
            expect(match('<p>x</p>', { all: { element: { selector: 'p', field: 'tagName' } } })).toBe('error');
            expect(match('', { count: { api: { path: 'document.title' } }, is: 0 })).toBe('error');
            expect(match('', { sub: [{ api: { path: 'document.styleSheets' } }, 1], is: 0 })).toBe('error');
            expect(match('', { sum: { api: { path: 'document.styleSheets' } }, is: 0 })).toBe(true);
        });

        it('takes all, any and none over a list of booleans', () => {
            const html = IMG('data-complete') + IMG();
            expect(match(html, { all: { element: { selector: 'img', field: 'complete' } } }, { install: imageState })).toBe(false);
            expect(match(html, { any: { element: { selector: 'img', field: 'complete' } } }, { install: imageState })).toBe(true);
            expect(match(IMG(), { none: { element: { selector: 'img', field: 'complete' } } }, { install: imageState })).toBe(true);
        });
    });

    describe('early exit', () => {
        it('gives a count cut short at its bound the results a full count gives', () => {
            const html = Array.from({ length: 7 }, () => IMG('data-complete')).join('');
            const detector = {
                match: { count: { element: { selector: 'img', where: { complete: true } } }, as: 'n', is: { gte: 1 } },
                actions: {
                    fireEvent: {
                        type: 't',
                        data: { n: { value: { ref: 'n' }, buckets: { 1: 1, '2-4': { gte: 2, lt: 5 }, '5+': { gte: 5 } } } },
                    },
                },
            };
            const result = run(html, detector, { install: imageState });
            expect(result.data).toEqual({ n: '5+' });
            expect(result.ctx.measured.n).toBe(5);
        });

        it('does not reach a where failure past the bound', () => {
            const html = IMG('data-width="1"') + IMG('data-width="1"') + IMG('data-throw');
            const where = { naturalWidth: { gt: 0 } };
            expect(match(html, { count: { element: { selector: 'img', where } }, is: { gte: 2 } }, { install: imageState })).toBe(true);
            expect(match(html, { count: { element: { selector: 'img', where } }, is: { gte: 3 } }, { install: imageState })).toBe(
                'aborted',
            );
        });

        it('runs a count with an unbucketed payload to the end', () => {
            const html = Array.from({ length: 7 }, () => IMG()).join('');
            const detector = {
                match: { count: { element: { selector: 'img' } }, as: 'n', is: { gte: 1 } },
                actions: { fireEvent: { type: 't', data: { n: { value: { ref: 'n' } } } } },
            };
            expect(run(html, detector).data).toEqual({ n: 7 });
        });

        it('pulls each item once for a boolean then a count over one named source', () => {
            /** @type {any} */
            let window;
            const result = run(
                IMG('data-complete') + IMG('data-complete') + IMG(),
                {
                    match: {
                        all: [
                            { element: { selector: 'img', where: { complete: true } }, as: 'images' },
                            { count: { ref: 'images' }, as: 'n', is: { lt: 100 } },
                        ],
                    },
                },
                {
                    install: (w) => {
                        imageState(w);
                        window = w;
                    },
                },
            );
            expect(result.detected).toBe(true);
            expect(result.ctx.measured.n).toBe(2);
            expect(window.__imageReads.complete).toBe(3);
        });
    });

    describe('payloads', () => {
        it('names the first bucket that holds, in key order', () => {
            expect(payload('', 3, { buckets: { low: { lt: 5 }, any: {} } })).toEqual({ x: 'low' });
            expect(payload('', 3, { buckets: { any: {}, low: { lt: 5 } } })).toEqual({ x: 'any' });
        });

        it('omits a value in no bucket, or one whose bucket fails', () => {
            expect(payload('', 30, { buckets: { low: { lt: 5 } } })).toEqual({});
            expect(payload('', { count: { api: { path: 'document.fonts' } } }, { buckets: { any: {} } })).toEqual({});
        });

        it('omits the key when `when` does not hold or fails', () => {
            expect(payload('', 3, { when: { gt: 5 } })).toEqual({});
            expect(payload('', 3, { when: { gt: 1 } })).toEqual({ x: 3 });
            expect(payload('', 3, { when: { gt: { count: { api: { path: 'document.fonts' } } } } })).toEqual({});
        });

        it('buckets a string by length', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'navigate' }]);
            const value = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'type' } } };
            expect(payload('', value, { buckets: { short: { length: { lt: 3 } }, long: { length: { gte: 3 } } } }, { install })).toEqual({
                x: 'long',
            });
        });

        it('sends an unbucketed string, boolean and null as-is', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload', nothing: null, flag: true }]);
            const read = (/** @type {string} */ field) => ({
                only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field } },
            });
            expect(payload('', read('type'), {}, { install })).toEqual({ x: 'reload' });
            expect(payload('', read('nothing'), {}, { install })).toEqual({ x: null });
            expect(payload('', read('flag'), {}, { install })).toEqual({ x: true });
        });

        it('omits an object, NaN and Infinity unbucketed', () => {
            expect(payload('<p></p>', { only: { element: { selector: 'p', field: 'style' } } })).toEqual({});
            expect(payload('', { div: [0, 0] })).toEqual({});
            expect(payload('', { div: [1, 0] })).toEqual({});
        });

        it('records errored keys in `_errors`, sorted by key', () => {
            const detector = {
                match: true,
                actions: {
                    fireEvent: {
                        type: 't',
                        data: {
                            zeta: { value: { first: { element: { selector: 'img', field: 'naturalWidth' } } } },
                            alpha: {
                                value: 'x'.length === 1 ? 1 : 0,
                                when: { gt: { first: { element: { selector: 'img', field: 'naturalWidth' } } } },
                            },
                            ok: { value: 1 },
                            beta: { value: 1, buckets: { a: { field: 'nope', is: { gt: 1 } } } },
                        },
                    },
                },
            };
            const data = run('<p></p>', detector).data;
            expect(data).toEqual({
                ok: 1,
                _errors: [
                    { type: 'payloadEval', payloadKey: 'alpha' },
                    { type: 'payloadEval', payloadKey: 'zeta' },
                ],
            });
        });

        it('sends no `_errors` when nothing errored', () => {
            expect(payload('', 1)).toEqual({ x: 1 });
        });

        it('rejects invalid payload keys and empty buckets', () => {
            expectParseError(
                { match: true, actions: { fireEvent: { type: 't', data: { nativeData: { value: 1 } } } } },
                'invalid payload key',
            );
            expectParseError({ match: true, actions: { fireEvent: { type: 't', data: { _x: { value: 1 } } } } }, 'invalid payload key');
            expectParseError(withPayload(1, { buckets: {} }), 'at least one bucket');
        });
    });

    describe('predicates', () => {
        it('compiles a literal as eq, across value types', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload', size: 0, nothing: null }]);
            const nav = (/** @type {object} */ where) => ({
                count: { api: { path: 'performance.getEntriesByType', args: ['navigation'], where } },
                is: 1,
            });
            expect(match('', nav({ type: 'reload' }), { install })).toBe(true);
            expect(match('', nav({ type: { eq: 'reload' } }), { install })).toBe(true);
            expect(match('', nav({ size: 0 }), { install })).toBe(true);
            expect(match('', nav({ size: '0' }), { install })).toBe(false);
            expect(match('', nav({ nothing: null }), { install })).toBe(true);
            expect(match('', nav({ type: ['navigate', 'reload'] }), { install })).toBe(true);
            expect(match('', nav({ type: { none: ['navigate', 'reload'] } }), { install })).toBe(false);
        });

        it('errors on a comparison over a value that is not a number', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            expect(
                match(
                    '',
                    {
                        count: {
                            api: {
                                path: 'performance.getEntriesByType',
                                args: ['navigation'],
                                where: { type: { gt: 1 } },
                            },
                        },
                        is: 1,
                    },
                    { install },
                ),
            ).toBe('error');
        });

        it('tests finite and nan over NaN, the infinities, a finite number and a string', () => {
            /** @type {Array<[unknown, boolean, boolean]>} */
            const cases = [
                [{ div: [0, 0] }, false, true],
                [{ div: [1, 0] }, false, false],
                [{ div: [-1, 0] }, false, false],
                [3, true, false],
            ];
            for (const [value, finite, nan] of cases) {
                expect(match('', { sum: [value], is: { finite: true } })).toBe(finite);
                expect(match('', { sum: [value], is: { nan: true } })).toBe(nan);
            }
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            const type = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'type' } } };
            expect(match('', { ...type, is: { finite: false } }, { install })).toBe(true);
            expect(match('', { ...type, is: { nan: false } }, { install })).toBe(true);
        });

        it('reads property paths at item and value level, beside reserved keys and operators', () => {
            const html = `<input type="checkbox" checked><input type="text" value="abc">`;
            expect(
                match(html, {
                    count: { element: { selector: 'input', where: { type: 'checkbox', checked: true } } },
                    is: 1,
                }),
            ).toBe(true);
            expect(
                match(html, {
                    count: {
                        element: { selector: 'input', where: { 'value.length': { gt: 2 }, any: [{ type: 'text' }] } },
                    },
                    is: 1,
                }),
            ).toBe(true);
            expect(match(html, { api: { path: 'document.title' }, is: { type: 'string', length: 0 } })).toBe(true);
        });

        it('buckets a value by length', () => {
            expect(
                payload('', { api: { path: 'document.title' } }, { buckets: { empty: { length: 0 }, some: { length: { gt: 0 } } } }),
            ).toEqual({ x: 'empty' });
        });

        it('reads a property named like an operator under `is` through the long form', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            const nav = { first: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } } };
            expect(match('', { ...nav, is: { field: 'type', is: 'reload' } }, { install })).toBe(true);
        });

        it('rejects field or is without the other, and an unknown type name', () => {
            expectParseError(
                { match: { count: { element: { selector: 'p', where: { field: 'id' } } }, is: 1 } },
                '`field` and `is` go together',
            );
            expectParseError({ match: { count: { element: { selector: 'p', where: { is: 1 } } }, is: 1 } }, '`field` and `is` go together');
            expectParseError({ match: { count: { element: { selector: 'p' } }, is: { type: 'integer' } } }, 'unknown type name');
        });

        it('reads a property named like a reserved key in the long form, inside combinators at item level', () => {
            const html = '<div role="dialog"></div><div></div>';
            expect(
                match(html, {
                    count: {
                        element: {
                            selector: 'div',
                            where: { field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' },
                        },
                    },
                    is: 1,
                }),
            ).toBe(true);
            expect(
                match(html, {
                    count: {
                        element: {
                            selector: 'div',
                            where: { any: [{ field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' }, { id: 'x' }] },
                        },
                    },
                    is: 1,
                }),
            ).toBe(true);
            expect(match(html, { count: { element: { selector: 'div', where: { none: [{ hidden: true }] } } }, is: 2 })).toBe(true);
        });

        it('fails the source when a read fails', () => {
            expect(match('<p></p>', { count: { element: { selector: 'p', where: { noSuchProperty: 1 } } }, is: 0 })).toBe('aborted');
        });

        it('tests exists, type, finite and nan first whatever the key order', () => {
            // `gt` on a missing property would fail; `exists` decides first
            expect(
                match('<p></p>', {
                    count: { element: { selector: 'p', where: { noSuchProperty: { gt: 1, exists: true } } } },
                    is: 0,
                }),
            ).toBe(true);
            expect(
                match('<p></p>', {
                    count: { element: { selector: 'p', where: { id: { gt: 1, type: 'number' } } } },
                    is: 0,
                }),
            ).toBe(true);
        });

        it('treats exists and type as property names on items', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', exists: 'yes', type: 'reload' }]);
            expect(
                match(
                    '',
                    {
                        count: {
                            api: {
                                path: 'performance.getEntriesByType',
                                args: ['navigation'],
                                where: { exists: 'yes', type: 'reload' },
                            },
                        },
                        is: 1,
                    },
                    { install },
                ),
            ).toBe(true);
        });

        it('tests absence and type over a missing property, undefined, null, a string and a number', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', u: undefined, nul: null, s: '7', num: 8 }]);
            const test = (/** @type {object} */ where) =>
                match('', { count: { api: { path: 'performance.getEntriesByType', args: ['navigation'], where } }, is: 1 }, { install });
            expect(test({ missing: 8 })).toBe('aborted');
            expect(test({ missing: { exists: true } })).toBe(false);
            expect(test({ missing: { exists: false } })).toBe(true);
            expect(test({ missing: { type: 'undefined' } })).toBe(true);
            expect(test({ u: { exists: true, type: 'undefined' } })).toBe(true);
            expect(test({ nul: { exists: true } })).toBe(true);
            expect(test({ nul: { gt: 7 } })).toBe('error');
            expect(test({ s: { gt: 7 } })).toBe('error');
            expect(test({ s: { type: 'number', gt: 7 } })).toBe(false);
            expect(test({ num: { finite: true, gt: 7 } })).toBe(true);
        });

        it('measures a count over exists, where a catch on the count is not', () => {
            const install = timeline([{ name: 'r', entryType: 'resource' }], { missing: ['responseStatus'] });
            const where = (/** @type {object} */ status) => ({
                api: { path: 'performance.getEntriesByType', args: ['resource'], where: { responseStatus: status } },
            });
            expect(payload('', { count: where({ exists: true, gte: 400 }) }, {}, { install })).toEqual({ x: 0 });
            expect(payload('', { count: where({ gte: 400 }), catch: { absent: 0 } }, {}, { install })).toEqual({});
        });

        it('compares against an operand expression, computed once', () => {
            const install = timeline([
                { name: 'nav', entryType: 'navigation', loadEventEnd: 100 },
                { name: 'a', entryType: 'resource', responseEnd: 50 },
                { name: 'b', entryType: 'resource', responseEnd: 150 },
            ]);
            const detector = {
                match: {
                    all: [
                        {
                            only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'loadEventEnd' } },
                            as: 'loadEventEnd',
                            is: {},
                        },
                        {
                            count: {
                                api: {
                                    path: 'performance.getEntriesByType',
                                    args: ['resource'],
                                    where: { responseEnd: { gt: { ref: 'loadEventEnd' } } },
                                },
                            },
                            is: 1,
                        },
                    ],
                },
            };
            expect(run('', detector, { install }).detected).toBe(true);
        });

        it('reads the native getter when the page overrides the prototype’s', () => {
            const html = IMG('data-complete data-width="0"');
            const afterCapture = (/** @type {any} */ w) => {
                Object.defineProperty(w.HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 999 });
            };
            expect(match(html, { count: { element: BROKEN }, is: 1 }, { install: imageState, afterCapture })).toBe(true);
            expect(
                match(
                    html,
                    { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: 0 },
                    { install: imageState, afterCapture },
                ),
            ).toBe(true);
        });
    });

    describe('api', () => {
        it('gives a scalar path its value, and a string is not a list', () => {
            const head = '<title>Hello there</title>';
            expect(match('', { api: { path: 'document.title' }, is: 'Hello there' }, { head })).toBe(true);
            expect(match('', { count: { api: { path: 'document.title' } }, is: 1 }, { head })).toBe('error');
        });

        it('gives an iterable as a value under is, and as a list under count', () => {
            const install = fonts(['loaded', 'error']);
            expect(match('', { api: { path: 'document.fonts' }, is: { type: 'object' } }, { install })).toBe(true);
            expect(match('', { count: { api: { path: 'document.fonts' } }, is: 2 }, { install })).toBe(true);
        });

        it('reads field from each member of a list, and from a value that is not one', () => {
            const install = fonts(['loaded', 'error']);
            expect(match('', { last: { api: { path: 'document.fonts', field: 'status' } }, is: 'error' }, { install })).toBe(true);
            expect(match('', { api: { path: 'document', field: 'title.length' }, is: 0 })).toBe(true);
        });

        it('reads a path from root', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900, responseStatus: 200 }]);
            const detector = {
                match: {
                    all: [
                        { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } }, as: 'navigation', is: {} },
                        { api: { root: { ref: 'navigation' }, path: 'loadEventEnd' }, is: 900 },
                        { api: { root: { ref: 'navigation' }, path: 'responseStatus' }, is: 200 },
                    ],
                },
            };
            expect(run('', detector, { install }).detected).toBe(true);
            const ids = '<p id="a"></p><p id="b"></p>';
            expect(match(ids, { api: { root: { element: { selector: 'p', field: 'id' } }, path: 'at', args: [-1] }, is: 'b' })).toBe(true);
            expect(match(ids, { api: { root: { element: { selector: 'p' } }, path: 'length' }, is: 2 })).toBe(true);
        });

        it('yields the members of an iterable', () => {
            expect(match('', { count: { api: { path: 'document.fonts' } }, is: 3 }, { install: fonts(['loaded', 'error', 'error']) })).toBe(
                true,
            );
            expect(
                match(
                    '',
                    { count: { api: { path: 'document.fonts', where: { status: 'error' } } }, is: 2 },
                    { install: fonts(['loaded', 'error', 'error']) },
                ),
            ).toBe(true);
            expect(match('<p></p><p></p>', { count: { api: { path: 'document.body.children' } }, is: 2 })).toBe(true);
        });

        it('reads undefined through null', () => {
            expect(match('', { count: { api: { path: 'document.activeElementNope' } }, is: 0 })).toBe('aborted');
            expect(
                match(
                    '',
                    { api: { path: 'document.fullscreenElement.tagName' }, is: { type: 'undefined' } },
                    {
                        install: (w) =>
                            Object.defineProperty(w.Document.prototype, 'fullscreenElement', { configurable: true, get: () => null }),
                    },
                ),
            ).toBe(true);
        });

        it('reads a value the page defines, or a prototype it substitutes, as it stands', () => {
            const definesValue = (/** @type {any} */ w) => {
                w.document.myValue = 3;
            };
            expect(match('', { api: { path: 'document.myValue' }, is: 3 }, { afterCapture: definesValue })).toBe(true);
            // On body rather than document, whose event methods JSDOM still needs after the run
            const substitutes = (/** @type {any} */ w) => {
                Object.setPrototypeOf(w.document.body, { tagName: 'FAKE' });
            };
            expect(match('', { api: { path: 'document.body.tagName' }, is: 'FAKE' }, { afterCapture: substitutes })).toBe(true);
        });

        it('reads a data value and a captured getter', () => {
            const definesValue = (/** @type {any} */ w) => {
                w.myData = { count: 3 };
            };
            expect(match('', { api: { path: 'myData.count' }, is: 3 }, { afterCapture: definesValue })).toBe(true);
            expect(match('', { api: { path: 'document.title' }, is: '' })).toBe(true);
            expect(match('<p id="a"></p>', { only: { element: { selector: 'p' } }, is: { id: 'a' } })).toBe(true);
        });

        it('reads a getter defined on the object itself, where nothing was captured', () => {
            // A getter on the instance, as browsers define `location.href`
            const install = (/** @type {any} */ w) => {
                const location = {};
                Object.defineProperty(location, 'href', { get: () => 'https://example.com/', enumerable: true });
                Object.defineProperty(w, 'fakeLocation', { get: () => location });
            };
            expect(match('', { api: { path: 'fakeLocation.href' }, is: 'https://example.com/' }, { install })).toBe(true);
        });

        it('does not call a page override of iteration', () => {
            const afterCapture = (/** @type {any} */ w) => {
                w.FakeFontFaceSet.prototype[Symbol.iterator] = () => {
                    throw new Error('page override called');
                };
            };
            expect(match('', { count: { api: { path: 'document.fonts' } }, is: 2 }, { install: fonts(['a', 'b']), afterCapture })).toBe(
                true,
            );
        });

        it('fails with denied when a getter throws', () => {
            const install = (/** @type {any} */ w) =>
                Object.defineProperty(w.Document.prototype, 'cookie', {
                    configurable: true,
                    get() {
                        throw new Error('sandboxed');
                    },
                });
            const result = run('', { match: { api: { path: 'document.cookie' }, is: { type: 'string' } } }, { install });
            expect(result.detected).toBe('aborted');
            expect(result.abortKind).toBe('denied');
        });

        it('calls the captured native method the path names', () => {
            const install = timeline([{ name: 'first-contentful-paint', entryType: 'paint', startTime: 120 }]);
            const afterCapture = (/** @type {any} */ w) => {
                w.Performance.prototype.getEntriesByName = () => [];
            };
            const read = {
                only: {
                    api: {
                        path: 'performance.getEntriesByName',
                        args: ['first-contentful-paint', 'paint'],
                        field: 'startTime',
                    },
                },
                is: 120,
            };
            expect(match('', read, { install, afterCapture })).toBe(true);
        });

        it('filters the timeline on numeric and string fields, and fails on a field the engine lacks', () => {
            const install = timeline(
                [
                    { name: 'a', entryType: 'resource', duration: 1500, initiatorType: 'img' },
                    { name: 'b', entryType: 'resource', duration: 200, initiatorType: 'img' },
                    { name: 'c', entryType: 'resource', duration: 3000, initiatorType: 'script' },
                ],
                { missing: ['responseStatus'] },
            );
            const resources = (/** @type {object} */ where) => ({
                api: { path: 'performance.getEntriesByType', args: ['resource'], where },
            });
            expect(match('', { count: resources({ duration: { gt: 1000 }, initiatorType: ['img', 'css'] }), is: 1 }, { install })).toBe(
                true,
            );
            expect(match('', { count: resources({ responseStatus: { gte: 400 } }), is: 0 }, { install })).toBe('aborted');
            expect(match('', { count: resources({ responseStatus: { gte: 400 } }), catch: { absent: 0 }, is: 0 }, { install })).toBe(true);
        });

        it('errors on `where` over a value that is not a list, or an item that is not an object', () => {
            expect(match('', { count: { api: { path: 'document.title', where: { length: 0 } } }, is: 1 })).toBe('error');
            const install = (/** @type {any} */ w) => {
                w.myList = ['a', 'b'];
            };
            expect(match('', { count: { api: { path: 'myList', where: { length: 1 } } }, is: 2 }, { afterCapture: install })).toBe('error');
        });
    });

    describe('root', () => {
        const html = '<div id="comments"><img src="a.png"><p>hello</p></div><img src="b.png"><p>hello</p>';

        it('scopes element and text in every position', () => {
            expect(match(html, { count: { element: { selector: 'img', root: '#comments' } }, is: 1 })).toBe(true);
            expect(match(html, { count: { text: { pattern: 'hello', root: '#comments' } }, is: 1 })).toBe(true);
            expect(match(html, { count: { text: { selector: 'p', pattern: 'hello', root: '#comments' } }, is: 1 })).toBe(true);
            expect(match(html, { count: { text: { xpath: './/text()', pattern: 'hello', root: '#comments' } }, is: 1 })).toBe(true);
            expect(match(html, { element: { selector: 'img', root: '#comments' } })).toBe(true);
            expect(match(html, { only: { element: { selector: 'img', field: 'tagName', root: '#comments' } }, is: 'IMG' })).toBe(true);
        });

        it('scopes element and text by an expression giving a node or a list of nodes', () => {
            const guarded = (/** @type {object} */ scoped) => ({
                match: { all: [{ element: { selector: '#comments' }, as: 'comments' }, scoped] },
            });
            expect(run(html, guarded({ count: { element: { selector: 'img', root: { ref: 'comments' } } }, is: 1 })).detected).toBe(true);
            expect(run(html, guarded({ count: { text: { pattern: 'hello', root: { ref: 'comments' } } }, is: 1 })).detected).toBe(true);
            expect(run('<img>', guarded({ count: { element: { selector: 'img', root: { ref: 'comments' } } }, is: 0 })).detected).toBe(
                false,
            );
            expect(
                match(html, { count: { element: { selector: 'img', root: { only: { element: { selector: '#comments' } } } } }, is: 1 }),
            ).toBe(true);
            expect(match(html, { count: { element: { selector: 'img', root: { api: { path: 'document.body' } } } }, is: 2 })).toBe(true);
        });

        it('reaches an open shadow root through an api root', () => {
            const afterCapture = (/** @type {any} */ w) => {
                const host = w.document.querySelector('x-widget');
                host.attachShadow({ mode: 'open' }).innerHTML = '<img><img>';
            };
            const shadow = { api: { root: { only: { element: { selector: 'x-widget' } } }, path: 'shadowRoot' } };
            expect(
                match('<x-widget></x-widget><img>', { count: { element: { selector: 'img', root: shadow } }, is: 2 }, { afterCapture }),
            ).toBe(true);
            expect(match('<x-widget></x-widget><img>', { count: { element: { selector: 'img', root: shadow } }, is: 0 })).toBe(true);
        });

        it('errors on a root that is not a node', () => {
            expect(match('<p></p>', { count: { element: { selector: 'p', root: { api: { path: 'document.title' } } } }, is: 0 })).toBe(
                'error',
            );
        });

        it('drops a root inside another', () => {
            const nested = '<div class="r"><div class="r"><img></div></div>';
            expect(match(nested, { count: { element: { selector: 'img', root: '.r' } }, is: 1 })).toBe(true);
        });

        it('selects no items when root matches nothing', () => {
            expect(match(html, { count: { element: { selector: 'img', root: '#missing' } }, is: 0 })).toBe(true);
            expect(match(html, { text: { pattern: 'hello', root: '#missing' } })).toBe(false);
        });
    });

    describe('field', () => {
        it('reads a path of several names, and length on a string, an array and a DOM collection', () => {
            const html = '<select><option>a</option><option>b</option></select>';
            expect(match(html, { only: { element: { selector: 'select', field: 'options.length' } }, is: 2 })).toBe(true);
            expect(match(html, { only: { element: { selector: 'select', field: 'tagName.length' } }, is: 6 })).toBe(true);
            const install = timeline([{ name: 'n', entryType: 'navigation', list: [1, 2, 3] }]);
            expect(
                match(
                    '',
                    { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'list.length' } }, is: 3 },
                    { install },
                ),
            ).toBe(true);
        });

        it('gives undefined for a name after null or undefined, in field and in a property path', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', nothing: null }]);
            const nav = { path: 'performance.getEntriesByType', args: ['navigation'] };
            expect(match('', { only: { api: { ...nav, field: 'nothing.length' } }, is: { type: 'undefined' } }, { install })).toBe(true);
            expect(match('', { count: { api: { ...nav, where: { 'nothing.length': { type: 'undefined' } } } }, is: 1 }, { install })).toBe(
                true,
            );
        });

        it('calls the captured native method, and fails with denied when it throws', () => {
            const html = '<div role="main"></div>';
            const afterCapture = (/** @type {any} */ w) => {
                w.Element.prototype.getAttribute = () => 'evil';
            };
            expect(
                match(
                    html,
                    { only: { element: { selector: 'div', field: { path: 'getAttribute', args: ['role'] } } }, is: 'main' },
                    { afterCapture },
                ),
            ).toBe(true);
            expect(match(html, { only: { element: { selector: 'div', field: { path: 'querySelector', args: ['::::'] } } }, is: {} })).toBe(
                'aborted',
            );
        });

        it('computes each feature on its input type, and errors on another', () => {
            const head = '<title>Hello   there world</title>';
            expect(match('', { api: { path: 'document', field: { path: 'title', feature: 'wordCount' } }, is: 3 }, { head })).toBe(true);
            expect(match('', { api: { path: 'document', field: { feature: 'wordCount' } }, is: {} })).toBe('error');
            expect(
                match('<p>x</p>', {
                    only: { element: { selector: 'p', field: { path: 'tagName', feature: 'renderedTextLength' } } },
                    is: {},
                }),
            ).toBe('error');
        });

        it('counts no words in an empty or whitespace-only string', () => {
            expect(
                match(
                    '',
                    { api: { path: 'document', field: { path: 'title', feature: 'wordCount' } }, is: 0 },
                    { head: '<title></title>' },
                ),
            ).toBe(true);
            expect(
                match(
                    '',
                    { api: { path: 'document', field: { path: 'title', feature: 'wordCount' } }, is: 0 },
                    { head: '<title>   </title>' },
                ),
            ).toBe(true);
        });

        it('counts rendered text excluding script, style, template and noscript', () => {
            const html =
                '<div id="r">ab c<script>xxxx</script><style>yy</style><template>zz</template><noscript>ww</noscript><span>d</span></div>';
            expect(match(html, { only: { element: { selector: '#r', field: { feature: 'renderedTextLength' } } }, is: 4 })).toBe(true);
            expect(
                match(html, {
                    count: { element: { selector: 'span', where: { field: { feature: 'renderedTextLength' }, is: 1 } } },
                    is: 1,
                }),
            ).toBe(true);
            expect(match(html, { api: { path: 'document.body', field: { feature: 'renderedTextLength' } }, is: 4 })).toBe(true);
        });

        it('counts text inside two selected elements in both', () => {
            const html = '<div class="c">ab<div class="c">cd</div></div>';
            expect(match(html, { sum: { element: { selector: '.c', field: { feature: 'renderedTextLength' } } }, is: 6 })).toBe(true);
            expect(match(html, { sum: { element: { selector: '.c:not(.c .c)', field: { feature: 'renderedTextLength' } } }, is: 4 })).toBe(
                true,
            );
        });

        it('errors on only over a selector matching nothing', () => {
            expect(
                match('', { only: { element: { selector: '#comments', field: { feature: 'renderedTextLength' } } }, is: { lt: 1 } }),
            ).toBe('error');
        });

        it('rejects malformed fields', () => {
            expectParseError({ match: { only: { element: { selector: 'p', field: {} } }, is: {} } }, 'at least one of');
            expectParseError({ match: { only: { element: { selector: 'p', field: { args: [] } } }, is: {} } }, '`args` needs `path`');
            expectParseError({ match: { only: { element: { selector: 'p', field: { feature: 'nope' } } }, is: {} } }, 'unknown feature');
        });
    });

    describe('the five detectors', () => {
        it('reports a broken image count and share', () => {
            const detector = {
                match: { count: { element: BROKEN }, as: 'brokenImages', is: { gte: 1 } },
                actions: {
                    fireEvent: {
                        type: 'brokenImages',
                        data: {
                            brokenImages: {
                                value: { ref: 'brokenImages' },
                                buckets: { 1: 1, '2-4': { gte: 2, lt: 5 }, '5-9': { gte: 5, lt: 10 }, '10+': { gte: 10 } },
                            },
                            brokenShare: {
                                value: { div: [{ ref: 'brokenImages' }, { count: { element: { selector: 'img' } } }] },
                                buckets: {
                                    under10: { gte: 0, lt: 0.1 },
                                    '10-50': { gte: 0.1, lt: 0.5 },
                                    '50-90': { gte: 0.5, lt: 0.9 },
                                    '90+': { gte: 0.9 },
                                },
                            },
                        },
                    },
                },
            };
            const html = IMG('data-complete') + IMG('data-complete') + IMG('data-complete data-width="4"') + '<img data-complete>';
            const result = run(html, detector, { install: imageState });
            expect(result.detected).toBe(true);
            expect(result.data).toEqual({ brokenImages: '2-4', brokenShare: '50-90' });
        });

        it('reports a slow page load, or a load still running', () => {
            const slowLoad = {
                match: {
                    any: [
                        {
                            api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'loadEventEnd' },
                            as: 'loadEventEnd',
                            is: { gte: 8000 },
                        },
                        {
                            all: [
                                { ref: 'loadEventEnd', is: 0 },
                                { api: { path: 'performance.now', args: [] }, is: { gte: 15000 } },
                            ],
                        },
                    ],
                },
                actions: {
                    fireEvent: {
                        type: 'slowPageLoad',
                        data: {
                            loadEventEnd: {
                                value: { ref: 'loadEventEnd' },
                                buckets: { loading: 0, '8-15s': { gte: 8000, lt: 15000 }, '15s+': { gte: 15000 } },
                            },
                        },
                    },
                },
            };
            const slow = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 9000 }]) });
            expect(slow.data).toEqual({ loadEventEnd: '8-15s' });
            const fast = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900 }]) });
            expect(fast.detected).toBe(false);
            const stillLoading = run('', slowLoad, {
                install: (w) => {
                    timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 0 }])(w);
                    Object.defineProperty(w.Performance.prototype, 'now', { configurable: true, writable: true, value: () => 16000 });
                },
            });
            expect(stillLoading.data).toEqual({ loadEventEnd: 'loading' });
        });

        it('reports failed stylesheets and fonts, both counts either way', () => {
            const detector = {
                match: {
                    any: [
                        {
                            count: {
                                api: {
                                    path: 'performance.getEntriesByType',
                                    args: ['resource'],
                                    where: { initiatorType: 'link', responseStatus: { exists: true, gte: 400 } },
                                },
                            },
                            as: 'failedStylesheets',
                            is: { gt: 0 },
                        },
                        {
                            count: { api: { path: 'document.fonts', where: { status: 'error' } } },
                            catch: { absent: 0 },
                            as: 'failedFontFaces',
                            is: { gt: 0 },
                        },
                    ],
                },
                actions: {
                    fireEvent: {
                        type: 'stylesMissing',
                        data: {
                            failedStylesheets: {
                                value: { ref: 'failedStylesheets' },
                                buckets: { 0: 0, 1: 1, '2-4': { gte: 2, lt: 5 }, '5+': { gte: 5 } },
                            },
                            failedFontFaces: {
                                value: { ref: 'failedFontFaces' },
                                buckets: { 0: 0, 1: 1, '2-4': { gte: 2, lt: 5 }, '5+': { gte: 5 } },
                            },
                        },
                    },
                },
            };
            const failedSheet = timeline([
                { name: 'a.css', entryType: 'resource', initiatorType: 'link', responseStatus: 404 },
                { name: 'b.css', entryType: 'resource', initiatorType: 'link', responseStatus: 200 },
            ]);
            const loadedSheet = timeline([{ name: 'b.css', entryType: 'resource', initiatorType: 'link', responseStatus: 200 }]);
            const both = (/** @type {any} */ w) => {
                failedSheet(w);
                fonts(['error', 'loaded'])(w);
            };
            expect(run('', detector, { install: both }).data).toEqual({ failedStylesheets: '1', failedFontFaces: '1' });
            // No document.fonts: the font count is a handler's 0, not reported
            expect(run('', detector, { install: failedSheet }).data).toEqual({ failedStylesheets: '1' });
            const fontOnly = (/** @type {any} */ w) => {
                loadedSheet(w);
                fonts(['error'])(w);
            };
            expect(run('', detector, { install: fontOnly }).data).toEqual({ failedStylesheets: '0', failedFontFaces: '1' });
            // An engine without responseStatus counts 0, a reading
            const noStatus = (/** @type {any} */ w) => {
                timeline([{ name: 'a.css', entryType: 'resource', initiatorType: 'link' }], { missing: ['responseStatus'] })(w);
                fonts(['error'])(w);
            };
            expect(run('', detector, { install: noStatus }).data).toEqual({ failedStylesheets: '0', failedFontFaces: '1' });
        });

        it('reports an empty known region', () => {
            const detector = {
                match: {
                    all: [
                        { element: { selector: ['#comments'] }, as: 'comments' },
                        { element: { selector: '#comments', field: { feature: 'renderedTextLength' } }, is: { lt: 1 } },
                        {
                            count: {
                                element: {
                                    selector: 'img',
                                    where: { complete: true, naturalWidth: { gt: 0 } },
                                    root: { ref: 'comments' },
                                },
                            },
                            is: { lt: 1 },
                        },
                    ],
                },
                actions: {
                    fireEvent: {
                        type: 'regionEmpty',
                        data: {
                            brokenImages: {
                                value: { count: { element: { ...BROKEN, root: { ref: 'comments' } } } },
                                buckets: { 0: 0, '1+': { gte: 1 } },
                            },
                        },
                    },
                },
            };
            expect(run('', detector, { install: imageState }).detected).toBe(false);
            expect(run('<div id="comments">hi</div>', detector, { install: imageState }).detected).toBe(false);
            expect(run(`<div id="comments">${IMG('data-complete')}</div>`, detector, { install: imageState }).data).toEqual({
                brokenImages: '1+',
            });
            expect(run('<div id="comments"> </div>', detector, { install: imageState }).data).toEqual({ brokenImages: '0' });
        });

        it('counts error phrases in rendered text', () => {
            const detector = {
                match: {
                    count: { text: { xpath: RENDERED, pattern: ['access denied', 'page not found', '404 not found'] } },
                    as: 'keywordCount',
                    is: { gte: 1 },
                },
                actions: {
                    fireEvent: {
                        type: 'errorPage',
                        data: {
                            keywordCount: { value: { ref: 'keywordCount' }, buckets: { 1: 1, '2-4': { gte: 2, lt: 5 }, '5+': { gte: 5 } } },
                        },
                    },
                },
            };
            expect(run('<h1>Page not found</h1><p>404 Not Found</p><script>page not found</script>', detector).data).toEqual({
                keywordCount: '2-4',
            });
        });
    });

    describe('WebDetection results', () => {
        /**
         * @param {any} detectors
         * @returns {WebDetection}
         */
        function createInstance(detectors) {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com/page' },
                platform: {},
                featureSettings: { webDetection: { detectors } },
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const instance = new WebDetection('webDetection', undefined, {}, args);
            instance.init();
            return instance;
        }

        // Frame detection reads window.self and window.top
        /** @type {any} */
        let originalWindow;
        beforeEach(() => {
            originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
        });
        afterEach(() => {
            globalThis.window = originalWindow;
        });

        const aborting = { count: { api: { path: 'noSuchGlobalApi' } }, is: { gt: 0 } };

        it('lists an aborted detector in breakage results, with no data', () => {
            const instance = createInstance({
                g: { d: { match: aborting, actions: { breakageReportData: { data: { x: { value: 1 } } } } } },
            });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: 'aborted' }]);
        });

        it('adds breakageReportData data on a match', () => {
            const instance = createInstance({ g: { d: { match: true, actions: { breakageReportData: { data: { x: { value: 1 } } } } } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true, data: { x: 1 } }]);
        });

        it('returns error for a detector that fails to parse', () => {
            const instance = createInstance({ g: { d: { match: { count: { element: { selector: 'img' } } } } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: 'error' }]);
        });

        it('skips fireEvent and first-success on an aborted run', async () => {
            const detectors = { g: { d: { match: aborting, actions: { fireEvent: { type: 't' } } } } };
            const instance = createInstance(detectors);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            const evaluate = spyOn(instance, '_evaluateMatch').and.callThrough();
            const config = parseDetectors(/** @type {any} */ (detectors)).g.d;
            instance._runAutoDetector('g', 'g.d', config);
            instance._runAutoDetector('g', 'g.d', config);
            await Promise.resolve();
            expect(evaluate).toHaveBeenCalledTimes(2);
            expect(instance.callFeatureMethod).not.toHaveBeenCalled();
        });

        it('fires the event with its data on a match', async () => {
            const detectors = {
                g: { d: { match: true, actions: { fireEvent: { type: 't', data: { x: { value: 2, buckets: { two: 2 } } } } } } },
            };
            const instance = createInstance(detectors);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            instance._runAutoDetector('g', 'g.d', parseDetectors(/** @type {any} */ (detectors)).g.d);
            await Promise.resolve();
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 't', data: { x: 'two' } });
        });
    });
});
