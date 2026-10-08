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
 * @returns {{ detected: true | false | 'error' | 'aborted', abortError?: string, data?: Record<string, unknown>, ctx: EvaluationContext, error?: unknown }}
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
        /** @type {{ detected: true | false | 'aborted', abortError?: string }} */
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
 * A predicate testing the value with `Number.isFinite` or `Number.isNaN`, passed it through `self`.
 *
 * @param {'isFinite' | 'isNaN'} name
 * @param {boolean} [expected]
 */
function numberTest(name, expected = true) {
    return { field: { api: { path: `Number.${name}`, args: [{ self: {} }] } }, is: expected };
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
        Object.defineProperty(FakeFontFaceSet.prototype, 'size', { get: () => faces.length });
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

/**
 * `document.fonts` whose getter throws.
 *
 * @param {any} window
 */
function brokenFonts(window) {
    Object.defineProperty(window.Document.prototype, 'fonts', {
        configurable: true,
        get() {
            throw new Error('refused');
        },
    });
}

/** A read that fails: `JSON.parse` throws on text that does not parse. */
const FAILING = { api: { path: 'JSON.parse', args: ['{'] } };

const IMG = (/** @type {string} */ attrs = '') => `<img src="a.png" ${attrs}>`;
const BROKEN = { selector: 'img', where: { complete: true, naturalWidth: 0, 'currentSrc.length': { gt: 0 } } };
const RENDERED = '//body//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';

describe('WebDetection expressions', () => {
    describe('iterators', () => {
        it('text in boolean position agrees with a length of at least one', () => {
            for (const html of ['<p>foo</p>', '<p>bar</p>', '<p>foo foo</p>']) {
                const asBoolean = match(html, { text: { pattern: 'foo' } });
                const asCount = match(html, { text: { pattern: 'foo' }, using: 'length', is: { gte: 1 } });
                expect(asBoolean).toBe(asCount);
            }
        });

        it('element in boolean position agrees with a length of at least one', () => {
            for (const html of ['<p class="a"></p>', '<p></p>']) {
                expect(match(html, { element: { selector: '.a' } })).toBe(
                    match(html, { element: { selector: '.a' }, using: 'length', is: { gte: 1 } }),
                );
            }
        });

        it('counts non-overlapping matches across selectors and XPath expressions', () => {
            const result = run('<h1>error</h1><p>error and error</p>', {
                match: { text: { selector: 'h1', xpath: '//p//text()', pattern: 'error' }, using: 'length', as: 'n', is: { lt: 100 } },
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
                        text: { xpath: '//p/text()', pattern: 'page not found', xpathConfig: { chunkSize, chunkTail: 32 } },
                        using: 'length',
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
            expectParseError({ match: { element: { selector: 'img' }, using: 'length' } }, 'numbers become booleans only through `is`');
            expectParseError({ match: { only: 5, is: 1 } }, 'does not fill list');
            expectParseError({ match: { only: { element: { selector: 'img' }, using: 'length' }, is: 1 } }, "'length' does not fill list");
            expectParseError({ match: 5 }, 'does not fill boolean');
            expectParseError({ match: { sum: [true], is: 1 } }, 'does not fill number');
            expectParseError({ match: { only: { if: { test: true, then: 1, else: 2 } }, is: 1 } }, "'if' does not fill list");
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
                { match: { sum: [{ element: { selector: 'img' }, using: 'length', is: { gt: 1 } }], is: 1 } },
                '`is` gives a boolean',
            );
            expectParseError({ match: { text: { pattern: 'a' }, element: { selector: 'p' }, is: true } }, 'several expression keys');
            expectParseError(withPayload({ element: { selector: 'img' }, using: 'length', is: { gt: 1 } }), '`is` gives a boolean');
        });

        it('rejects unknown keys and reserved keys', () => {
            expectParseError({ match: { pageFeature: 'x' } }, "unknown expression key 'pageFeature'");
            expectParseError({ match: { element: { selector: 'img', foo: 1 } } }, "unknown key 'foo'");
            expectParseError({ match: { api: { path: 'document.title', allowGetter: true }, is: '' } }, "unknown key 'allowGetter'");
            expectParseError(
                { match: { element: { selector: 'img' }, using: 'length', aggregate: 'max', is: 1 } },
                "'aggregate' is reserved",
            );
            expectParseError(
                { match: { element: { selector: 'img' }, using: 'length', catch: { absent: 0 }, is: 1 } },
                "unknown expression key 'catch'",
            );
            expectParseError({ match: { if: { test: true, then: 1 }, is: 1 } }, "'if' needs 'else'");
            expectParseError({ match: { if: { test: true, then: 1, else: 2, other: 3 }, is: 1 } }, "unknown key 'other'");
        });

        it('reads one named source as a boolean in match and as a list in a payload', () => {
            const detector = {
                match: { element: { selector: 'img' }, as: 'images' },
                actions: { fireEvent: { type: 't', data: { images: { value: { ref: 'images', using: 'length' } } } } },
            };
            expect(run(IMG() + IMG(), detector).data).toEqual({ images: 2 });
        });

        it('reads text matches and elements through list operators', () => {
            const html = '<p>Page not found</p><p>Error 404</p>';
            const matches = { text: { pattern: ['not found', 'error'] } };
            expect(match(html, { ...matches, using: { path: 'at', args: [0] }, is: 'not found' })).toBe(true);
            expect(match(html, { ...matches, using: { path: 'at', args: [-1] }, is: 'Error' })).toBe(true);
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

        it('takes string and null literals in value position only', () => {
            expect(payload('', 'x')).toEqual({ x: 'x' });
            expect(payload('', null)).toEqual({ x: null });
            expect(payload('', { if: { test: true, then: 'yes', else: 'no' } })).toEqual({ x: 'yes' });
            expect(payload('', { if: { test: false, then: 'yes', else: null } })).toEqual({ x: null });
            expect(match('', { api: { path: 'document.readyState' }, is: { eq: { api: { path: 'document.readyState' } } } })).toBe(true);
            expect(match('<p>a</p>', { only: { text: { pattern: 'a' } }, is: { eq: { text: { pattern: 'a' } } } })).toBe(true);
            expectParseError({ match: 'x' }, "'literal' does not fill boolean position");
            expectParseError({ match: [null] }, "'literal' does not fill boolean position");
            expectParseError({ match: { sum: ['x', 1], is: { gt: 0 } } }, "'literal' does not fill number position");
            expectParseError({ match: { only: 'x', is: 1 } }, "'literal' does not fill list position");
            expect(match('<p></p>', { element: { selector: 'p' }, using: 'length', is: { gt: '0' } })).toBe(true);
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
            expectParseError({ match: { text: { any: [{ pattern: 'a' }] }, using: 'length', is: 1 } }, 'take boolean position');
        });
    });

    describe('unwrapping', () => {
        const widths = (/** @type {number[]} */ list) => list.map((w) => IMG(`data-width="${w}"`)).join('');
        const width = { element: { selector: 'img', field: 'naturalWidth' } };

        it('gives a selected list’s one item in number position, and errors over none or several', () => {
            const read = { div: [width, 5], is: 1 };
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
            // `lt` compares the array as JS does: `[entry] < 1` coerces the entry to `NaN`
            expect(match('', { ...entries, is: { lt: 1 } }, { install })).toBe(false);
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
        });

        it('computes a ref whose target short-circuiting skipped', () => {
            const result = run('<p>foo</p>' + IMG(), {
                match: {
                    any: [{ text: { pattern: 'foo' } }, { element: { selector: 'img' }, using: 'length', as: 'images', is: { gt: 0 } }],
                },
                actions: { fireEvent: { type: 't', data: { images: { value: { ref: 'images' } } } } },
            });
            expect(result.data).toEqual({ images: 1 });
        });

        it('reads the value a name holds, not the boolean `is` gives', () => {
            const html = IMG() + IMG() + IMG();
            expect(
                match(html, {
                    all: [
                        { element: { selector: 'img' }, using: 'length', as: 'images', is: { gte: 1 } },
                        { ref: 'images', is: 3 },
                    ],
                }),
            ).toBe(true);
        });
    });

    describe('values', () => {
        it('divides by 0 as JS does', () => {
            expect(payload('', { div: [1, 0] }, { when: { ...numberTest('isFinite', false), gt: 0 } })).toEqual({});
            expect(run('', withPayload({ div: [1, 0] })).ctx.memo.size).toBeGreaterThan(0);
            const result = run('', {
                match: {
                    all: [
                        { div: [1, 0], as: 'pos', is: { eq: { api: 'Infinity' } } },
                        { div: [-1, 0], as: 'neg', is: { lt: 0 } },
                        { div: [0, 0], as: 'nan', is: numberTest('isNaN') },
                    ],
                },
            });
            expect(result.detected).toBe(true);
            expect(result.ctx.measured.pos).toBe(Infinity);
            expect(result.ctx.measured.neg).toBe(-Infinity);
            expect(result.ctx.measured.nan).toBeNaN();
        });

        it('carries NaN through each operator', () => {
            for (const op of ['sum', 'mul', 'div']) {
                expect(match('', { [op]: [{ div: [0, 0] }, 2], is: numberTest('isNaN') }))
                    .withContext(op)
                    .toBe(true);
            }
        });

        it('compares NaN as within no bound, so `none` over a comparison on NaN holds', () => {
            expect(match('', { div: [0, 0], is: { lt: 5 } })).toBe(false);
            expect(match('', { div: [0, 0], is: { gte: 5 } })).toBe(false);
            expect(match('', { none: { div: [0, 0], is: { lt: 5 } } })).toBe(true);
        });

        it('computes negation and subtraction through mul by -1', () => {
            expect(match('', { mul: [3, -1], is: -3 })).toBe(true);
            expect(match('', { sum: [5, { mul: [3, -1] }], is: 2 })).toBe(true);
        });
    });

    describe('failures and fails', () => {
        it('aborts on a failure in boolean position', () => {
            const result = run('', { match: { ...FAILING, using: 'length', is: { gt: 0 } } });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('SyntaxError');
        });

        it('aborts with the thrown value’s constructor name when a read throws', () => {
            const result = run(
                IMG('data-complete data-throw'),
                { match: { element: { selector: 'img', where: { naturalWidth: 0 } }, using: 'length', is: { gt: 0 } } },
                { install: imageState },
            );
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('Error');
        });

        it('reads `fails` over a value, a missing name, which reads `undefined`, and a read that throws', () => {
            const width = { only: { element: { selector: 'img', field: 'naturalWidth' } } };
            const missing = { api: { path: 'document.missing' } };
            const options = { install: imageState };
            /** @type {Array<[string, object, object, boolean]>} */
            const cases = [
                [IMG('data-width="5"'), width, { fails: false }, true],
                [IMG('data-width="5"'), width, { fails: true }, false],
                [IMG('data-throw'), width, { fails: true }, true],
                [IMG('data-throw'), width, { fails: false }, false],
                ['', missing, { fails: true }, false],
                ['', missing, { fails: false, type: 'undefined' }, true],
                ['', FAILING, { fails: true }, true],
                ['', { api: { path: 'document.onclick' } }, { fails: false, type: 'null' }, true],
            ];
            for (const [html, expression, predicate, expected] of cases) {
                expect(match(html, { ...expression, is: predicate }, options))
                    .withContext(`${html} ${JSON.stringify(predicate)}`)
                    .toBe(expected);
            }
        });

        it('tests `fails` first, whatever the key order', () => {
            const width = { only: { element: { selector: 'img', field: 'naturalWidth' } } };
            expect(match(IMG('data-throw'), { ...width, is: { gt: 0, fails: false } }, { install: imageState })).toBe(false);
            expect(match(IMG('data-width="5"'), { ...width, is: { gt: 0, fails: false } }, { install: imageState })).toBe(true);
            expect(match('', { ...FAILING, using: 'length', is: { gt: 0, fails: false } })).toBe(false);
        });

        it('reads exists as a property name', () => {
            expect(match('', { api: 'document', is: { exists: true } })).toBe(false);
            expect(match('', { api: 'document', is: { exists: { type: 'undefined' } } })).toBe(true);
        });

        it('tests whether a property is present through Reflect.has, per item and on the engine', () => {
            const install = timeline([{ name: 'r', entryType: 'resource', responseStatus: 404 }]);
            const lacking = timeline([{ name: 'r', entryType: 'resource' }], { missing: ['responseStatus'] });
            const has = { field: { api: { path: 'Reflect.has', args: [{ self: {} }, 'responseStatus'] } }, is: true };
            const errors = {
                api: { path: 'performance.getEntriesByType', args: ['resource'], where: { ...has, responseStatus: { gte: 400 } } },
                using: 'length',
            };
            expect(match('', { ...errors, is: 1 }, { install })).toBe(true);
            expect(match('', { ...errors, is: 0 }, { install: lacking })).toBe(true);
            const engine = {
                api: { path: 'Reflect.has', args: [{ api: 'FakePerformanceEntry.prototype' }, 'responseStatus'] },
            };
            const guarded = { if: { test: engine, then: errors, else: 0 }, is: 0 };
            expect(match('', guarded, { install: lacking })).toBe(true);
            expect(match('', { ...guarded, is: 1 }, { install })).toBe(true);
        });

        it('tests each item with `fails`, counting the readable items instead of aborting', () => {
            const html = IMG('data-throw') + IMG('data-width="0"') + IMG('data-width="5"');
            const readable = { element: { selector: 'img', where: { naturalWidth: { fails: false } } }, using: 'length' };
            expect(match(html, { ...readable, is: 2 }, { install: imageState })).toBe(true);
            const thrown = { element: { selector: 'img', where: { naturalWidth: { fails: true } } }, using: 'length' };
            expect(match(html, { ...thrown, is: 1 }, { install: imageState })).toBe(true);
        });

        it('reports a value tested with `fails`, and omits a failed one', () => {
            const detector = {
                match: {
                    api: { path: 'document.fonts', where: { status: 'error' } },
                    using: 'length',
                    as: 'failedFontFaces',
                    is: { fails: false, lt: 3 },
                },
                actions: { fireEvent: { type: 't', data: { failedFontFaces: { value: { ref: 'failedFontFaces' } } } } },
            };
            expect(run('', detector, { install: brokenFonts }).detected).toBe(false);
            expect(run('', detector, { install: fonts(['loaded', 'error']) }).data).toEqual({ failedFontFaces: 1 });
        });

        it('falls back through `if` over `fails`, reporting the fallback and omitting the failed read', () => {
            const detector = {
                match: {
                    if: {
                        test: {
                            api: { path: 'document.fonts', where: { status: 'error' } },
                            using: 'length',
                            as: 'n',
                            is: { fails: false },
                        },
                        then: { ref: 'n' },
                        else: 0,
                    },
                    as: 'nOr0',
                    is: { gte: 0 },
                },
                actions: { fireEvent: { type: 't', data: { nOr0: { value: { ref: 'nOr0' } }, n: { value: { ref: 'n' } } } } },
            };
            expect(run('', detector, { install: brokenFonts }).data).toEqual({ nOr0: 0 });
            expect(run('', detector, { install: fonts(['error', 'error']) }).data).toEqual({ nOr0: 2, n: 2 });
        });

        it('lets a tested failure under `none` decide the leaf, and an untested one abort', () => {
            const failedFonts = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };
            expect(match('', { none: { ...failedFonts, is: { fails: false, gt: 0 } } }, { install: brokenFonts })).toBe(true);
            expect(match('', { none: { ...failedFonts, is: { gt: 0 } } }, { install: brokenFonts })).toBe('aborted');
        });

        it('passes a ref into an untaken branch through `fails`, omitting the key', () => {
            const detector = {
                match: { if: { test: false, then: { sum: [1], as: 'inner' }, else: 0 }, is: {} },
                actions: { fireEvent: { type: 't', data: { x: { value: { ref: 'inner' }, when: { fails: true } } } } },
            };
            expect(run('', detector).data).toEqual({});
        });

        it('stops at the first failure, so key order decides between a match and an abort', () => {
            const failing = { ...FAILING, using: 'length', is: { gt: 0 } };
            expect(match('<p>foo</p>', { any: [{ text: { pattern: 'foo' } }, failing] })).toBe(true);
            expect(match('<p>foo</p>', { any: [failing, { text: { pattern: 'foo' } }] })).toBe('aborted');
        });
    });

    describe('if', () => {
        const brokenRatio = {
            if: {
                test: { element: { selector: 'img' }, using: 'length', as: 'images', is: { gt: 0 } },
                then: { div: [{ element: BROKEN, using: 'length' }, { ref: 'images' }] },
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
                match: { if: { test: true, then: 1, else: { api: { path: 'document.fonts' }, using: 'length' } }, is: 1 },
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
                    if: { test: { ...FAILING, using: 'length', is: { gt: 0 } }, then: 1, else: 2 },
                    is: {},
                }),
            ).toBe('aborted');
        });
    });

    describe('operators', () => {
        it('errors on only over no items', () => {
            expect(run('', { match: { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: {} } }).detected).toBe('error');
            expect(match('', { sum: { element: { selector: 'img', field: 'naturalWidth' } }, is: 0 })).toBe(true);
            expect(match('', { mul: { element: { selector: 'img', field: 'naturalWidth' } }, is: 1 })).toBe(true);
            const at = { element: { selector: 'img', field: 'naturalWidth' }, using: { path: 'at', args: [0] } };
            expect(match('', { ...at, is: { type: 'undefined' } })).toBe(true);
            expect(match('', { ...at, is: { gte: 0 } })).toBe(false);
        });

        it('mixes lists of values with numbers', () => {
            const html = IMG('data-width="3"') + IMG('data-width="9"');
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

        it('picks an item by position with at on a root, in document order', () => {
            const html = IMG('data-width="1"') + IMG('data-width="2"') + IMG('data-width="3"');
            const widths = { element: { selector: 'img', field: 'naturalWidth' } };
            expect(match(html, { ...widths, using: { path: 'at', args: [0] }, is: 1 }, { install: imageState })).toBe(true);
            expect(match(html, { ...widths, using: { path: 'at', args: [-1] }, is: 3 }, { install: imageState })).toBe(true);
            const images = { element: { selector: 'img' } };
            expect(
                match(html, { ...images, using: { path: 'at', args: [1], field: 'naturalWidth' }, is: 2 }, { install: imageState }),
            ).toBe(true);
        });

        it('picks an item by position with at on a root, in timeline order', () => {
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: 5 },
                { name: 'b', entryType: 'resource', duration: 7 },
            ]);
            const durations = { api: { path: 'performance.getEntriesByType', args: ['resource'], field: 'duration' } };
            expect(match('', { ...durations, using: { path: 'at', args: [0] }, is: 5 }, { install })).toBe(true);
            expect(match('', { ...durations, using: { path: 'at', args: [-1] }, is: 7 }, { install })).toBe(true);
        });

        it('errors on a value of the wrong type', () => {
            expect(match('<p>x</p>', { sum: [{ element: { selector: 'p', field: 'tagName' } }], is: 1 })).toBe('error');
            expect(match('<p>x</p>', { only: { element: { selector: 'p', field: 'tagName' } }, is: { gt: 1 } })).toBe(false);
            expect(match('<p>x</p>', { all: { element: { selector: 'p', field: 'tagName' } } })).toBe('error');
            expect(match('', { only: { api: { path: 'document.title' } }, is: 0 })).toBe('error');
            expect(match('', { div: [{ api: { path: 'document.styleSheets' } }, 1], is: 0 })).toBe('error');
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
        it('gives a length cut short at its bound the results a full length gives', () => {
            const html = Array.from({ length: 7 }, () => IMG('data-complete')).join('');
            const detector = {
                match: { element: { selector: 'img', where: { complete: true } }, using: 'length', as: 'n', is: { gte: 1 } },
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
            expect(match(html, { element: { selector: 'img', where }, using: 'length', is: { gte: 2 } }, { install: imageState })).toBe(
                true,
            );
            expect(match(html, { element: { selector: 'img', where }, using: 'length', is: { gte: 3 } }, { install: imageState })).toBe(
                'aborted',
            );
        });

        it('runs a length with an unbucketed payload to the end', () => {
            const html = Array.from({ length: 7 }, () => IMG()).join('');
            const detector = {
                match: { element: { selector: 'img' }, using: 'length', as: 'n', is: { gte: 1 } },
                actions: { fireEvent: { type: 't', data: { n: { value: { ref: 'n' } } } } },
            };
            expect(run(html, detector).data).toEqual({ n: 7 });
        });

        it('pulls each item once for a boolean then a length over one named source', () => {
            /** @type {any} */
            let window;
            const result = run(
                IMG('data-complete') + IMG('data-complete') + IMG(),
                {
                    match: {
                        all: [
                            { element: { selector: 'img', where: { complete: true } }, as: 'images' },
                            { ref: 'images', using: 'length', as: 'n', is: { lt: 100 } },
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

        it('runs a length with a payload sending it under `when` to the end', () => {
            const html = Array.from({ length: 7 }, () => IMG()).join('');
            const detector = {
                match: { element: { selector: 'img' }, using: 'length', as: 'n', is: { gte: 1 } },
                actions: { fireEvent: { type: 't', data: { n: { value: { ref: 'n' }, when: { gte: 1 } } } } },
            };
            expect(run(html, detector).data).toEqual({ n: 7 });
        });

        it('runs a length read through a ref to a ref to the end', () => {
            const html = Array.from({ length: 7 }, () => IMG()).join('');
            const detector = {
                match: {
                    all: [
                        { element: { selector: 'img' }, using: 'length', as: 'n', is: { gte: 1 } },
                        { ref: 'n', as: 'm', is: { gte: 1 } },
                    ],
                },
                actions: { fireEvent: { type: 't', data: { m: { value: { ref: 'm' } } } } },
            };
            expect(run(html, detector).data).toEqual({ m: 7 });
        });

        it('cuts a length short at the bound of an `is` on an `expr` over it', () => {
            const html = Array.from({ length: 7 }, () => IMG()).join('');
            const result = run(html, {
                match: { expr: { element: { selector: 'img', where: {} }, using: 'length', as: 'n' }, as: 'm', is: { gte: 2 } },
            });
            expect(result.detected).toBe(true);
            expect(result.ctx.measured.n).toBe(2);
        });
    });

    describe('payloads', () => {
        it('names the first bucket that holds, in key order', () => {
            expect(payload('', 3, { buckets: { low: { lt: 5 }, any: {} } })).toEqual({ x: 'low' });
            expect(payload('', 3, { buckets: { any: {}, low: { lt: 5 } } })).toEqual({ x: 'any' });
        });

        it('omits a value in no bucket, or one whose bucket fails', () => {
            expect(payload('', 30, { buckets: { low: { lt: 5 } } })).toEqual({});
            expect(payload('', { ...FAILING, using: 'length' }, { buckets: { any: {} } })).toEqual({});
        });

        it('omits the key when `when` does not hold or fails', () => {
            expect(payload('', 3, { when: { gt: 5 } })).toEqual({});
            expect(payload('', 3, { when: { gt: 1 } })).toEqual({ x: 3 });
            expect(payload('', 3, { when: { gt: { ...FAILING, using: 'length' } } })).toEqual({});
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
                            zeta: { value: { only: { element: { selector: 'img', field: 'naturalWidth' } } } },
                            alpha: {
                                value: 'x'.length === 1 ? 1 : 0,
                                when: { gt: { only: { element: { selector: 'img', field: 'naturalWidth' } } } },
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
                api: { path: 'performance.getEntriesByType', args: ['navigation'], where },
                using: 'length',
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

        it('compares a value that is not a number as JS does', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            expect(
                match(
                    '',
                    {
                        api: {
                            path: 'performance.getEntriesByType',
                            args: ['navigation'],
                            where: { type: { gt: 1 } },
                        },
                        using: 'length',
                        is: 0,
                    },
                    { install },
                ),
            ).toBe(true);
            expect(match('<p>x</p>', { only: { element: { selector: 'p', field: 'tagName' } }, is: { gte: 'O' } })).toBe(true);
        });

        it('tests Number.isFinite and Number.isNaN through call over NaN, the infinities, a finite number and a string', () => {
            /** @type {Array<[unknown, boolean, boolean]>} */
            const cases = [
                [{ div: [0, 0] }, false, true],
                [{ div: [1, 0] }, false, false],
                [{ div: [-1, 0] }, false, false],
                [3, true, false],
            ];
            for (const [value, finite, nan] of cases) {
                expect(match('', { sum: [value], is: numberTest('isFinite') })).toBe(finite);
                expect(match('', { sum: [value], is: numberTest('isNaN') })).toBe(nan);
            }
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            const type = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'type' } } };
            expect(match('', { ...type, is: numberTest('isFinite', false) }, { install })).toBe(true);
            expect(match('', { ...type, is: numberTest('isNaN', false) }, { install })).toBe(true);
        });

        it('reads finite and nan as property names, not operators', () => {
            expect(match('', { div: [0, 0], is: { nan: true } })).toBe(false);
            expect(match('', { sum: [3], is: { finite: { type: 'undefined' } } })).toBe(true);
        });

        it('reads property paths at item and value level, beside reserved keys and operators', () => {
            const html = `<input type="checkbox" checked><input type="text" value="abc">`;
            expect(
                match(html, {
                    element: { selector: 'input', where: { type: 'checkbox', checked: true } },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(
                match(html, {
                    element: { selector: 'input', where: { 'value.length': { gt: 2 }, any: [{ type: 'text' }] } },
                    using: 'length',
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
            const nav = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } } };
            expect(match('', { ...nav, is: { field: 'type', is: 'reload' } }, { install })).toBe(true);
        });

        it('rejects field or is without the other, and an unknown type name', () => {
            expectParseError(
                { match: { element: { selector: 'p', where: { field: 'id' } }, using: 'length', is: 1 } },
                '`field` and `is` go together',
            );
            expectParseError(
                { match: { element: { selector: 'p', where: { is: 1 } }, using: 'length', is: 1 } },
                '`field` and `is` go together',
            );
            expectParseError({ match: { element: { selector: 'p' }, using: 'length', is: { type: 'integer' } } }, 'unknown type name');
        });

        it('reads a property named like a reserved key in the long form, inside combinators at item level', () => {
            const html = '<div role="dialog"></div><div></div>';
            expect(
                match(html, {
                    element: {
                        selector: 'div',
                        where: { field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' },
                    },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(
                match(html, {
                    element: {
                        selector: 'div',
                        where: { any: [{ field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' }, { id: 'x' }] },
                    },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(match(html, { element: { selector: 'div', where: { none: [{ hidden: true }] } }, using: 'length', is: 2 })).toBe(true);
        });

        it('fails the source when a read fails', () => {
            expect(
                match(
                    IMG('data-throw'),
                    { element: { selector: 'img', where: { naturalWidth: 1 } }, using: 'length', is: 0 },
                    { install: imageState },
                ),
            ).toBe('aborted');
            expect(match('<p></p>', { element: { selector: 'p', where: { noSuchProperty: 1 } }, using: 'length', is: 0 })).toBe(true);
        });

        it('tests fails and type first whatever the key order', () => {
            // `gt` on a throwing property would fail; `fails` decides first
            expect(
                match(
                    IMG('data-throw'),
                    { element: { selector: 'img', where: { naturalWidth: { gt: 1, fails: false } } }, using: 'length', is: 0 },
                    { install: imageState },
                ),
            ).toBe(true);
            expect(
                match('<p></p>', {
                    element: { selector: 'p', where: { id: { gt: 1, type: 'number' } } },
                    using: 'length',
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
                        api: {
                            path: 'performance.getEntriesByType',
                            args: ['navigation'],
                            where: { exists: 'yes', type: 'reload' },
                        },
                        using: 'length',
                        is: 1,
                    },
                    { install },
                ),
            ).toBe(true);
        });

        it('tests failure and type over a missing property, undefined, null, a string and a number', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', u: undefined, nul: null, s: '7', num: 8 }]);
            const test = (/** @type {object} */ where) =>
                match(
                    '',
                    { api: { path: 'performance.getEntriesByType', args: ['navigation'], where }, using: 'length', is: 1 },
                    { install },
                );
            expect(test({ missing: 8 })).toBe(false);
            expect(test({ missing: { fails: false } })).toBe(true);
            expect(test({ missing: { fails: true } })).toBe(false);
            expect(test({ missing: { type: 'undefined' } })).toBe(true);
            expect(test({ missing: { gte: 0 } })).toBe(false);
            expect(test({ u: { fails: false, type: 'undefined' } })).toBe(true);
            expect(test({ nul: { fails: false } })).toBe(true);
            // Comparisons coerce as JS does: `null > 7` is false, `null >= 0` and `"7" >= 7` are true
            expect(test({ nul: { gt: 7 } })).toBe(false);
            expect(test({ nul: { gte: 0 } })).toBe(true);
            expect(test({ s: { gt: 7 } })).toBe(false);
            expect(test({ s: { gte: 7 } })).toBe(true);
            expect(test({ s: { type: 'number', gt: 7 } })).toBe(false);
            expect(test({ num: { ...numberTest('isFinite'), gt: 7 } })).toBe(true);
            expect(test({ s: { ...numberTest('isFinite'), gt: 7 } })).toBe(false);
        });

        it('reports a length over a comparison on an engine without the field', () => {
            const install = timeline([{ name: 'r', entryType: 'resource' }], { missing: ['responseStatus'] });
            const where = (/** @type {object} */ status) => ({
                api: { path: 'performance.getEntriesByType', args: ['resource'], where: { responseStatus: status } },
            });
            expect(payload('', { ...where({ gte: 400 }), using: 'length' }, {}, { install })).toEqual({ x: 0 });
            expect(payload('', { ...where({ any: [{ type: 'undefined' }, { gte: 400 }] }), using: 'length' }, {}, { install })).toEqual({
                x: 1,
            });
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
                            api: {
                                path: 'performance.getEntriesByType',
                                args: ['resource'],
                                where: { responseEnd: { gt: { ref: 'loadEventEnd' } } },
                            },
                            using: 'length',
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
            expect(match(html, { element: BROKEN, using: 'length', is: 1 }, { install: imageState, afterCapture })).toBe(true);
            expect(
                match(
                    html,
                    { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: 0 },
                    { install: imageState, afterCapture },
                ),
            ).toBe(true);
        });
    });

    describe('using and expr', () => {
        const widths = IMG('data-width="1"') + IMG('data-width="2"');

        it('reads a path, or a body of path, args, where and field, from the value beside it', () => {
            const install = fonts(['loaded', 'error', 'error']);
            expect(match('', { api: { path: 'document' }, using: 'fonts', is: { type: 'object' } }, { install })).toBe(true);
            const failed = { api: { path: 'document' }, using: { path: 'fonts', where: { status: 'error' } } };
            expect(
                match('', { api: { path: 'document' }, using: { path: 'fonts', field: 'status' }, is: { length: 3 } }, { install }),
            ).toBe(true);
            expect(match('', { expr: failed, using: 'length', is: 2 }, { install })).toBe(true);
            expect(
                match(
                    widths,
                    { element: { selector: 'img', field: 'naturalWidth' }, using: { path: 'at', args: [-1] }, is: 2 },
                    { install: imageState },
                ),
            ).toBe(true);
        });

        it('applies `using`, then `as`, then `is`', () => {
            const result = run(widths, {
                match: { element: { selector: 'img' }, using: 'length', as: 'n', is: { gte: 2 } },
                actions: { fireEvent: { type: 't', data: { n: { value: { ref: 'n' } } } } },
            });
            expect(result.detected).toBe(true);
            expect(result.data).toEqual({ n: 2 });
        });

        it('rejects `using` without an expression, without a path or with an unknown key, and `root` on `api`', () => {
            expectParseError({ match: { using: 'length', is: 1 } }, '`using` reads from an expression');
            expectParseError({ match: { element: { selector: 'img' }, using: {}, is: 1 } }, '`using` needs `path`');
            expectParseError({ match: { element: { selector: 'img' }, using: 1, is: 1 } }, '`using` takes a path or an object');
            expectParseError({ match: { element: { selector: 'img' }, using: { path: 'at', root: 'x' }, is: 1 } }, "unknown key 'root'");
            expectParseError({ match: { api: { root: { element: { selector: 'img' } }, path: 'length' }, is: 1 } }, "unknown key 'root'");
        });

        it('names a value and what `using` reads from it through `expr`', () => {
            const result = run(widths, {
                match: { expr: { element: { selector: 'img' }, as: 'imageElements' }, using: 'length', as: 'imageCount', is: { gte: 2 } },
                actions: {
                    fireEvent: {
                        type: 't',
                        data: {
                            imageCount: { value: { ref: 'imageCount' } },
                            elements: { value: { ref: 'imageElements' }, buckets: { two: { length: 2 } } },
                        },
                    },
                },
            });
            expect(result.detected).toBe(true);
            expect(result.data).toEqual({ imageCount: 2, elements: 'two' });
        });

        it('names the boolean an `is` inside `expr` gives', () => {
            const detector = {
                match: { expr: { element: { selector: 'img' }, using: 'length', is: { gte: 2 } }, as: 'enoughImages' },
                actions: { fireEvent: { type: 't', data: { enough: { value: { ref: 'enoughImages' } } } } },
            };
            expect(run(widths, detector).data).toEqual({ enough: true });
            expect(run(IMG(), detector).detected).toBe(false);
            expect(payload(widths, { expr: { element: { selector: 'img' }, using: 'length', is: { gte: 2 } } })).toEqual({ x: true });
            expectParseError(
                { match: { sum: [{ expr: { element: { selector: 'img' }, using: 'length', is: 1 } }], is: 1 } },
                "'expr' does not fill number",
            );
        });

        it('gives its operand in its own position: a list operand of `sum`, and the condition leaf', () => {
            const sum = { sum: { expr: { element: { selector: 'img', field: 'naturalWidth' }, as: 'w' } }, is: 3 };
            expect(match(widths, sum, { install: imageState })).toBe(true);
            expect(match(widths, { expr: { element: { selector: 'img' } } })).toBe(true);
            expect(match('', { any: [{ expr: { element: { selector: 'img' } } }] })).toBe(false);
            expectParseError({ match: { expr: { element: { selector: 'img', field: 'naturalWidth' } } } }, 'does not fill boolean');
        });
    });

    describe('api', () => {
        it('takes a path as short for a body with that path', () => {
            const head = '<title>Hello there</title>';
            expect(match('', { api: 'document.title', is: 'Hello there' }, { head })).toBe(true);
            expect(match('', { api: { path: 'Math.max', args: [1, { api: 'document.title.length' }] }, is: 11 }, { head })).toBe(true);
            expect(match('', { api: 'document.title', using: 'length', is: 11 }, { head })).toBe(true);
            expectParseError({ match: { api: 5 } }, '`api` takes a path or an object');
            expectParseError({ match: { api: '' } }, 'non-empty');
        });

        it('gives a scalar path its value, and a string is not a list', () => {
            const head = '<title>Hello there</title>';
            expect(match('', { api: { path: 'document.title' }, is: 'Hello there' }, { head })).toBe(true);
            expect(match('', { only: { api: { path: 'document.title' } }, is: 'Hello there' }, { head })).toBe('error');
            expect(match('', { api: { path: 'document.title' }, using: 'length', is: 11 }, { head })).toBe(true);
        });

        it('gives an iterable as a value under is and using, and as a list under only and with field', () => {
            const install = fonts(['loaded', 'error']);
            expect(match('', { api: { path: 'document.fonts' }, is: { type: 'object' } }, { install })).toBe(true);
            expect(match('', { api: { path: 'document.fonts', field: 'status' }, using: 'length', is: 2 }, { install })).toBe(true);
            expect(match('', { api: { path: 'document.fonts' }, using: 'size', is: 2 }, { install })).toBe(true);
            // `length` reads the iterable's own property, which a `FontFaceSet` lacks
            expect(match('', { api: { path: 'document.fonts' }, using: 'length', is: { type: 'undefined' } }, { install })).toBe(true);
        });

        it('reads field from each member of a list, and from a value that is not one', () => {
            const install = fonts(['loaded', 'error']);
            expect(
                match(
                    '',
                    { api: { path: 'document.fonts', field: 'status' }, using: { path: 'at', args: [-1] }, is: 'error' },
                    { install },
                ),
            ).toBe(true);
            expect(match('', { api: { path: 'document', field: 'title.length' }, is: 0 })).toBe(true);
        });

        it('reads a path from root', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900, responseStatus: 200 }]);
            const detector = {
                match: {
                    all: [
                        { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } }, as: 'navigation', is: {} },
                        { ref: 'navigation', using: 'loadEventEnd', is: 900 },
                        { ref: 'navigation', using: 'responseStatus', is: 200 },
                    ],
                },
            };
            expect(run('', detector, { install }).detected).toBe(true);
            const ids = '<p id="a"></p><p id="b"></p>';
            expect(match(ids, { element: { selector: 'p', field: 'id' }, using: { path: 'at', args: [-1] }, is: 'b' })).toBe(true);
            expect(match(ids, { element: { selector: 'p' }, using: 'length', is: 2 })).toBe(true);
        });

        it('yields the members of an iterable', () => {
            expect(
                match(
                    '',
                    { api: { path: 'document.fonts', field: 'status' }, using: 'length', is: 3 },
                    { install: fonts(['loaded', 'error', 'error']) },
                ),
            ).toBe(true);
            expect(
                match(
                    '',
                    { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length', is: 2 },
                    { install: fonts(['loaded', 'error', 'error']) },
                ),
            ).toBe(true);
            expect(match('<p></p><p></p>', { api: { path: 'document.body.children' }, using: 'length', is: 2 })).toBe(true);
        });

        it('reads undefined through null', () => {
            expect(match('', { api: { path: 'document.activeElementNope' }, using: 'length', is: { type: 'undefined' } })).toBe(true);
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
            expect(
                match(
                    '',
                    { api: { path: 'document.fonts', field: 'status' }, using: 'length', is: 2 },
                    { install: fonts(['a', 'b']), afterCapture },
                ),
            ).toBe(true);
        });

        it('fails with threw when a getter throws', () => {
            const install = (/** @type {any} */ w) =>
                Object.defineProperty(w.Document.prototype, 'cookie', {
                    configurable: true,
                    get() {
                        throw new Error('sandboxed');
                    },
                });
            const result = run('', { match: { api: { path: 'document.cookie' }, is: { type: 'string' } } }, { install });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('Error');
            expect(match('', { api: { path: 'document.cookie' }, is: { fails: true } }, { install })).toBe(true);
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

        it('filters the timeline on numeric and string fields, and reads a field the engine lacks as undefined', () => {
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
            expect(
                match('', { ...resources({ duration: { gt: 1000 }, initiatorType: ['img', 'css'] }), using: 'length', is: 1 }, { install }),
            ).toBe(true);
            expect(match('', { ...resources({ responseStatus: { gte: 400 } }), using: 'length', is: 0 }, { install })).toBe(true);
        });

        it('errors on `where` over a value that is not a list, or an item that is not an object', () => {
            expect(match('', { api: { path: 'document.title', where: { length: 0 } }, using: 'length', is: 1 })).toBe('error');
            const install = (/** @type {any} */ w) => {
                w.myList = ['a', 'b'];
            };
            expect(match('', { api: { path: 'myList', where: { length: 1 } }, using: 'length', is: 2 }, { afterCapture: install })).toBe(
                'error',
            );
        });
    });

    describe('arguments', () => {
        const html = IMG('data-width="3"') + IMG('data-width="9"');
        const widths = { element: { selector: 'img', field: 'naturalWidth' } };
        const options = { install: imageState };

        it('takes the largest and smallest item through Math.max.apply and Math.min.apply', () => {
            expect(match(html, { api: { path: 'Math.max.apply', args: [null, widths] }, is: 9 }, options)).toBe(true);
            expect(match(html, { api: { path: 'Math.min.apply', args: [null, widths] }, is: 3 }, options)).toBe(true);
            expect(
                match(
                    '',
                    { api: { path: 'Math.max.apply', args: [null, widths] }, is: { ...numberTest('isFinite', false), lt: 0 } },
                    options,
                ),
            ).toBe(true);
            expect(match('', { api: { path: 'Math.max.apply', args: [null, { api: { path: 'undefined' } }] }, is: { lt: 0 } })).toBe(true);
        });

        it('extends and joins lists through concat', () => {
            const extended = { ...widths, using: { path: 'concat', args: [100] } };
            expect(match(html, { api: { path: 'Math.max.apply', args: [null, extended] }, is: 100 }, options)).toBe(true);
            const leading = { api: { path: 'Array.prototype.concat.call', args: [[100], widths] } };
            expect(match(html, { ...leading, using: { path: 'at', args: [0] }, is: 100 }, options)).toBe(true);
            expect(match(html, { ...leading, using: 'length', is: 3 }, options)).toBe(true);
        });

        it('builds arrays from literals and expressions, nested arrays included', () => {
            const built = { api: { path: 'Array.of', args: [[1, { element: { selector: 'img' }, using: 'length' }], 'x', null] } };
            expect(match(html, { api: { path: 'JSON.stringify', args: [built] }, is: '[[1,2],"x",null]' })).toBe(true);
        });

        it('passes a selected list as a new array, so a method changing it leaves the list', () => {
            expect(match(html, { api: { path: 'Array.isArray', args: [widths] }, is: true }, options)).toBe(true);
            const detector = {
                match: {
                    all: [
                        { api: { path: 'Array.prototype.reverse.call', args: [{ ...widths, as: 'widths' }] }, is: {} },
                        { ref: 'widths', using: { path: 'at', args: [0] }, is: 3 },
                    ],
                },
            };
            expect(run(html, detector, options).detected).toBe(true);
        });

        it('builds objects through JSON.parse and Object.fromEntries', () => {
            expect(match('', { api: { path: 'JSON.parse', args: ['{"a": 5}'], field: 'a' }, is: 5 })).toBe(true);
            const entries = [[['images', { element: { selector: 'img' }, using: 'length' }]]];
            expect(match(html, { api: { path: 'Object.fromEntries', args: entries, field: 'images' }, is: 2 })).toBe(true);
        });

        it('reads undefined through api', () => {
            expect(match('', { api: { path: 'undefined' }, is: { type: 'undefined' } })).toBe(true);
        });

        it('takes expressions in field args', () => {
            const id = { api: { path: 'String', args: ['id'] } };
            expect(
                match('<p id="a"></p>', { only: { element: { selector: 'p', field: { path: 'getAttribute', args: [id] } } }, is: 'a' }),
            ).toBe(true);
        });

        it('fails when an argument fails', () => {
            const failed = run('', { match: { api: { path: 'Array.of', args: [FAILING] }, is: {} } });
            expect(failed.detected).toBe('aborted');
            expect(failed.abortError).toBe('SyntaxError');
            expect(run('', { match: { api: { path: 'Math.max', args: [7] }, as: 'n', is: 7 } }).ctx.measured.n).toBe(7);
        });

        it('fails on any throw from the call, which `fails` tests', () => {
            const install = (/** @type {any} */ w) => {
                w.document.createElement = () => {
                    throw new w.DOMException('refused', 'SecurityError');
                };
            };
            /** @type {Array<[object, string, RunOptions | undefined]>} */
            const calls = [
                [{ path: 'Math.max.apply', args: [null, 5] }, 'TypeError', undefined],
                [{ path: 'Number.prototype.toFixed.call', args: [1, 500] }, 'RangeError', undefined],
                [{ path: 'document.createElement', args: ['p'] }, 'DOMException', { install }],
            ];
            for (const [api, name, options] of calls) {
                const result = run('', { match: { api, is: {} } }, options);
                expect(result.detected).withContext(name).toBe('aborted');
                expect(result.abortError).withContext(name).toBe(name);
                expect(match('', { api, is: { fails: true } }, options))
                    .withContext(name)
                    .toBe(true);
            }
        });

        it('rejects entries that are not literals, expressions or arrays', () => {
            expectParseError(
                { match: { api: { path: 'Array.of', args: [{ composed: true }] }, is: {} } },
                "unknown expression key 'composed'",
            );
            expectParseError(
                { match: { api: { path: 'Array.of', args: [{ element: { selector: 'p' }, using: 'length', is: 1 }] }, is: {} } },
                '`is`',
            );
        });
    });

    describe('root', () => {
        const html = '<div id="comments"><img src="a.png"><p>hello</p></div><img src="b.png"><p>hello</p>';

        it('scopes element and text in every position', () => {
            expect(match(html, { element: { selector: 'img', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(match(html, { text: { pattern: 'hello', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(match(html, { text: { selector: 'p', pattern: 'hello', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(match(html, { text: { xpath: './/text()', pattern: 'hello', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(match(html, { element: { selector: 'img', root: '#comments' } })).toBe(true);
            expect(match(html, { only: { element: { selector: 'img', field: 'tagName', root: '#comments' } }, is: 'IMG' })).toBe(true);
        });

        it('scopes element and text by an expression giving a node or a list of nodes', () => {
            const guarded = (/** @type {object} */ scoped) => ({
                match: { all: [{ element: { selector: '#comments' }, as: 'comments' }, scoped] },
            });
            expect(run(html, guarded({ element: { selector: 'img', root: { ref: 'comments' } }, using: 'length', is: 1 })).detected).toBe(
                true,
            );
            expect(run(html, guarded({ text: { pattern: 'hello', root: { ref: 'comments' } }, using: 'length', is: 1 })).detected).toBe(
                true,
            );
            expect(
                run('<img>', guarded({ element: { selector: 'img', root: { ref: 'comments' } }, using: 'length', is: 0 })).detected,
            ).toBe(false);
            expect(
                match(html, {
                    element: { selector: 'img', root: { only: { element: { selector: '#comments' } } } },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(match(html, { element: { selector: 'img', root: { api: { path: 'document.body' } } }, using: 'length', is: 2 })).toBe(
                true,
            );
        });

        it('reaches an open shadow root through an api root', () => {
            const afterCapture = (/** @type {any} */ w) => {
                const host = w.document.querySelector('x-widget');
                host.attachShadow({ mode: 'open' }).innerHTML = '<img><img>';
            };
            const shadow = { only: { element: { selector: 'x-widget' } }, using: 'shadowRoot' };
            expect(
                match(
                    '<x-widget></x-widget><img>',
                    { element: { selector: 'img', root: shadow }, using: 'length', is: 2 },
                    { afterCapture },
                ),
            ).toBe(true);
            expect(match('<x-widget></x-widget><img>', { element: { selector: 'img', root: shadow }, using: 'length', is: 0 })).toBe(true);
        });

        it('errors on a root that is not a selector or a node', () => {
            expect(
                match('<p></p>', { element: { selector: 'p', root: { api: { path: 'document.title.length' } } }, using: 'length', is: 0 }),
            ).toBe('error');
            expect(match('<p></p>', { element: { selector: 'p', root: [1] }, using: 'length', is: 0 })).toBe('error');
        });

        it('scopes to the union of an array of selectors and expressions', () => {
            const html = '<div id="a"><img></div><div id="b"><img><img></div><img>';
            const scoped = (/** @type {unknown} */ root) => ({ element: { selector: 'img', root }, using: 'length' });
            const images = (/** @type {unknown} */ root) => payload(html, scoped(root))?.x;
            expect(images(['#a', { only: { element: { selector: '#b' } } }])).toBe(3);
            expect(images([{ api: { path: 'document.body' } }, '#a'])).toBe(4);
            expect(images({ api: { path: 'document.body.firstElementChild.tagName' } })).toBe(3);
            expect(images(['#a', null])).toBe(1);
            expectParseError(withPayload(scoped([])), 'at least one entry');
            expectParseError(withPayload(scoped([['#a']])), 'does not fill root position');
        });

        it('drops a root inside another', () => {
            const nested = '<div class="r"><div class="r"><img></div></div>';
            expect(match(nested, { element: { selector: 'img', root: '.r' }, using: 'length', is: 1 })).toBe(true);
        });

        it('selects no items when root matches nothing', () => {
            expect(match(html, { element: { selector: 'img', root: '#missing' }, using: 'length', is: 0 })).toBe(true);
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
            expect(
                match('', { api: { ...nav, where: { 'nothing.length': { type: 'undefined' } } }, using: 'length', is: 1 }, { install }),
            ).toBe(true);
        });

        it('calls the captured native method, and fails with threw when it throws', () => {
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

        it('errors on a feature given another input type', () => {
            expect(match('', { api: { path: 'document', field: { path: 'title', feature: 'renderedTextLength' } }, is: {} })).toBe('error');
            expect(
                match('<p>x</p>', {
                    only: { element: { selector: 'p', field: { path: 'tagName', feature: 'renderedTextLength' } } },
                    is: {},
                }),
            ).toBe('error');
        });

        it('counts words with matchAll, and none in an empty or whitespace-only string', () => {
            const words = {
                api: { path: 'Array.from', args: [{ api: { path: 'document.title.matchAll', args: ['\\S+'] } }] },
                using: 'length',
            };
            expect(match('', { ...words, is: 3 }, { head: '<title>Hello   there\tworld</title>' })).toBe(true);
            expect(match('', { ...words, is: 0 }, { head: '<title></title>' })).toBe(true);
            expect(match('', { ...words, is: 0 }, { head: '<title>   </title>' })).toBe(true);
        });

        it('counts rendered text excluding script, style, template and noscript', () => {
            const html =
                '<div id="r">ab c<script>xxxx</script><style>yy</style><template>zz</template><noscript>ww</noscript><span>d</span></div>';
            expect(match(html, { only: { element: { selector: '#r', field: { feature: 'renderedTextLength' } } }, is: 4 })).toBe(true);
            expect(
                match(html, {
                    element: { selector: 'span', where: { field: { feature: 'renderedTextLength' }, is: 1 } },
                    using: 'length',
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

        it('takes an expression, with self the value it reads from', () => {
            const head = '<title>Hello   there world</title>';
            expect(
                match(
                    '',
                    {
                        api: {
                            path: 'document',
                            field: { api: { path: 'String', args: [{ self: { path: 'title', field: 'length' } }] } },
                        },
                        is: '17',
                    },
                    { head },
                ),
            ).toBe(true);
            expect(
                match('<p></p>', {
                    only: { element: { selector: 'p', field: { api: { path: 'String', args: [{ self: 'tagName' }] } } } },
                    is: 'P',
                }),
            ).toBe(true);
            expect(
                match('<p p="x"></p>', {
                    only: { element: { selector: 'p', field: { path: 'getAttribute', args: [{ self: 'tagName' }] } } },
                    is: 'x',
                }),
            ).toBe(true);
        });

        it('tests a value with Number.isFinite and Number.isNaN in where and under is', () => {
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: NaN },
                { name: 'b', entryType: 'resource', duration: Infinity },
                { name: 'c', entryType: 'resource', duration: 5 },
            ]);
            const resources = (/** @type {object} */ where) => ({
                api: { path: 'performance.getEntriesByType', args: ['resource'], where },
                using: 'length',
            });
            expect(match('', { ...resources({ duration: numberTest('isFinite') }), is: 1 }, { install })).toBe(true);
            expect(
                match(
                    '',
                    { ...resources({ field: { api: { path: 'Number.isNaN', args: [{ self: 'duration' }] } }, is: true }), is: 1 },
                    { install },
                ),
            ).toBe(true);
            expect(match('', { ...resources({ duration: { ...numberTest('isFinite', false), gt: 0 } }), is: 1 }, { install })).toBe(true);
            expect(match('', { ...resources({ duration: { eq: { api: 'Infinity' } } }), is: 1 }, { install })).toBe(true);
            expect(
                match(
                    '',
                    { ...resources({ duration: { all: [numberTest('isNaN', false), numberTest('isFinite', false)] } }), is: 1 },
                    { install },
                ),
            ).toBe(true);
        });

        it('passes further arguments beside self', () => {
            const html = IMG('data-complete data-width="3"') + IMG('data-complete data-width="9"');
            const clamp = { api: { path: 'Math.min', args: [{ self: 'naturalWidth' }, 5] } };
            expect(match(html, { sum: { element: { selector: 'img', field: clamp } }, is: 8 }, { install: imageState })).toBe(true);
        });

        it('calls the function captured at init', () => {
            // JSDOM shares the JS builtins of this realm, so the override is undone after the run
            const original = Number.isFinite;
            const afterCapture = (/** @type {any} */ w) => {
                w.Number.isFinite = () => true;
            };
            try {
                expect(match('', { div: [1, 0], is: numberTest('isFinite') }, { afterCapture })).toBe(false);
            } finally {
                Number.isFinite = original;
            }
        });

        it('fails when the call throws, and on a name that is not a function', () => {
            const result = run('', { match: { sum: [1.5], is: { field: { api: { path: 'BigInt', args: [{ self: {} }] } }, is: {} } } });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('RangeError');
            const missing = run('', { match: { sum: [1], is: { field: { api: { path: 'Math', args: [{ self: {} }] } }, is: {} } } });
            expect(missing.detected).toBe('aborted');
            expect(missing.abortError).toBe('TypeError');
        });

        it('rejects malformed fields', () => {
            expectParseError({ match: { only: { element: { selector: 'p', field: {} } }, is: {} } }, 'at least one of');
            expectParseError({ match: { only: { element: { selector: 'p', field: { calls: 1 } } }, is: {} } }, "unknown key 'calls'");
            expectParseError(
                { match: { only: { element: { selector: 'p', field: { call: { api: 'String' } } } }, is: {} } },
                "unknown key 'call'",
            );
            expectParseError({ match: { only: { element: { selector: 'p', field: { args: [] } } }, is: {} } }, '`args` needs `path`');
            expectParseError({ match: { only: { element: { selector: 'p', field: { feature: 'nope' } } }, is: {} } }, 'unknown feature');
            expectParseError(
                { match: { api: { path: 'document', field: { path: 'title', feature: 'wordCount' } }, is: {} } },
                'unknown feature',
            );
        });
    });

    describe('self', () => {
        it('reads the value beside using: a value, a list, its length and the value itself', () => {
            const head = '<title>Hello there</title>';
            expect(match('', { api: 'document.title', using: { self: {} }, is: 'Hello there' }, { head })).toBe(true);
            expect(match('', { api: 'document.title', using: { self: 'length' }, is: 11 }, { head })).toBe(true);
            expect(match('<p></p><p></p>', { element: { selector: 'p' }, using: { self: 'length' }, is: 2 })).toBe(true);
            const html = IMG('data-complete data-width="3"') + IMG('data-complete data-width="9"');
            expect(
                match(
                    html,
                    {
                        element: { selector: 'img', field: 'naturalWidth' },
                        using: { api: { path: 'Math.max.apply', args: [null, { self: {} }] } },
                        is: 9,
                    },
                    { install: imageState },
                ),
            ).toBe(true);
        });

        it('mixes several reads of the value beside using', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', transferSize: 50, decodedBodySize: 200 }]);
            const navigation = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } } };
            const ratio = { ...navigation, using: { div: [{ self: 'transferSize' }, { self: 'decodedBodySize' }] } };
            expect(match('', { ...ratio, is: 0.25 }, { install })).toBe(true);
            const result = run('', { match: { ...ratio, as: 'ratio', is: { lt: 1 } } }, { install });
            expect(result.detected).toBe(true);
            expect(result.ctx.measured.ratio).toBe(0.25);
        });

        it('reads each item in where, an inherited property included', () => {
            const items = { path: 'JSON.parse', args: ['[{"a":1},{"b":2},{"a":3}]'] };
            const has = (/** @type {string} */ name) => ({ field: { api: { path: 'Reflect.has', args: [{ self: {} }, name] } }, is: true });
            expect(match('', { api: { ...items, where: has('a') }, using: 'length', is: 2 })).toBe(true);
            expect(match('<p></p><p></p>', { element: { selector: 'p', where: has('tagName') }, using: 'length', is: 2 })).toBe(true);
            expect(match('<p></p><p></p>', { element: { selector: 'p', where: has('noSuchProperty') }, using: 'length', is: 0 })).toBe(
                true,
            );
        });

        it('compares two fields of one item', () => {
            const items = { path: 'JSON.parse', args: ['[{"s":1,"e":5},{"s":4,"e":5}]'] };
            expect(match('', { api: { ...items, where: { e: { gt: { sum: [{ self: 's' }, 2] } } } }, using: 'length', is: 1 })).toBe(true);
        });

        it('binds self in a nested where to the inner item, and in a field under a key to that value', () => {
            const outer = { path: 'JSON.parse', args: ['[{"n":0,"xs":[{"n":1,"v":2},{"n":3,"v":2}]}]'] };
            const field = { self: { path: 'xs', where: { v: { gt: { self: 'n' } } } } };
            expect(match('', { only: { api: { ...outer, field } }, using: 'length', is: 1 })).toBe(true);
            const items = { path: 'JSON.parse', args: ['[{"nested":{"x":3}},{"nested":{"x":4}}]'] };
            expect(match('', { api: { ...items, where: { nested: { field: { self: 'x' }, is: 3 } } }, using: 'length', is: 1 })).toBe(true);
        });

        it('computes an expression reading self once per item, and one that does not once per run', () => {
            let calls = 0;
            let reads = 0;
            const install = (/** @type {any} */ w) => {
                Object.defineProperty(w, 'probe', {
                    value: (/** @type {number} */ v) => {
                        calls++;
                        return v > 1;
                    },
                });
                Object.defineProperty(w, 'threshold', {
                    get() {
                        reads++;
                        return 1;
                    },
                });
            };
            const html = '<p>a</p><p>bb</p><p>ccc</p>';
            const probe = { field: { api: { path: 'probe', args: [{ self: 'textContent.length' }] } }, is: true };
            expect(match(html, { element: { selector: 'p', where: probe }, using: 'length', is: 2 }, { install })).toBe(true);
            expect(calls).toBe(3);
            const threshold = { 'textContent.length': { gt: { api: 'threshold' } } };
            expect(match(html, { element: { selector: 'p', where: threshold }, using: 'length', is: 2 }, { install })).toBe(true);
            expect(reads).toBe(1);
        });

        it('reads a list once per run inside another where, its own self its own item', () => {
            const values = {
                api: { path: 'JSON.parse', args: ['[{"v":1,"w":0},{"v":5,"w":9}]'], where: { v: { gt: { self: 'w' } } }, field: 'v' },
                as: 'vs',
            };
            const detector = {
                match: {
                    all: [
                        { element: { selector: 'p', where: { 'textContent.length': { lte: { sum: values } } } }, using: 'length', is: 2 },
                        { ref: 'vs', using: 'length', is: 1 },
                    ],
                },
            };
            expect(run('<p>a</p><p>b</p><p>cc</p>', detector).detected).toBe(true);
        });

        it('rejects self outside a binder, and a name on an expression read per item', () => {
            expectParseError({ match: { self: 'x' } }, '`self` reads from `using`, `where` or `field`');
            expectParseError(withPayload({ self: {} }), '`self` reads from');
            expectParseError(
                { match: { element: { selector: 'p', where: { 'textContent.length': { gt: { self: 'x', as: 'n' } } } } } },
                "'n' names one value per run",
            );
            const branch = { if: { test: { self: 'b', is: 1 }, then: { sum: [1], as: 'one' }, else: 2 } };
            expectParseError({ match: { element: { selector: 'p', where: { a: { gt: branch } } } } }, "'one' names one value per run");
            expectParseError({ match: { api: 'document', using: {}, is: {} } }, '`using` needs `path` or an expression');
        });
    });

    describe('expressions in where', () => {
        const items = { path: 'JSON.parse', args: ['[{"a":1,"b":0},{"a":2,"b":5},{"a":3,"b":0}]'] };

        it('tests each item with a boolean expression over self', () => {
            const has = (/** @type {string} */ name) => ({ api: { path: 'Reflect.has', args: [{ self: {} }, name] } });
            const sparse = { path: 'JSON.parse', args: ['[{"a":1},{"b":2},{"a":3}]'] };
            expect(match('', { api: { ...sparse, where: has('a') }, using: 'length', is: 2 })).toBe(true);
            expect(match('<p></p><p></p>', { element: { selector: 'p', where: has('noSuchProperty') }, using: 'length', is: 0 })).toBe(
                true,
            );
        });

        it('mixes expressions and predicates under any, all, none and arrays', () => {
            const countIs = (/** @type {unknown} */ where, /** @type {number} */ n) =>
                match('', { api: { ...items, where }, using: 'length', is: n });
            expect(countIs({ self: 'b', is: { gt: 1 } }, 1)).toBe(true);
            expect(countIs({ any: [{ self: 'b', is: { gt: 1 } }, { a: 1 }] }, 2)).toBe(true);
            expect(countIs([{ self: 'b', is: 5 }, { a: 3 }], 2)).toBe(true);
            expect(countIs({ all: [{ a: { gt: 1 } }, { self: 'b', is: 0 }] }, 1)).toBe(true);
            expect(countIs({ none: [{ self: 'b', is: 0 }], a: { gt: 0 } }, 1)).toBe(true);
        });

        it('scopes a source to the item', () => {
            const html = '<div class="card"><img></div><div class="card"></div><div class="card"><p><img></p></div>';
            const withImage = { element: { selector: 'img', root: { self: {} } } };
            expect(match(html, { element: { selector: '.card', where: withImage }, using: 'length', is: 2 })).toBe(true);
            const twoParagraphs = { element: { selector: 'p', root: { self: {} } }, using: 'length', is: { gte: 2 } };
            expect(
                match('<div><p></p><p></p></div><div><p></p></div>', {
                    element: { selector: 'div', where: twoParagraphs },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
        });

        it('reads an expression reading no self once per run', () => {
            let reads = 0;
            const install = (/** @type {any} */ w) => {
                Object.defineProperty(w, 'flag', {
                    get() {
                        reads++;
                        return true;
                    },
                });
            };
            const detector = {
                match: {
                    all: [
                        { api: 'flag', as: 'flag' },
                        { element: { selector: 'p', where: { ref: 'flag' } }, using: 'length', is: 3 },
                    ],
                },
            };
            expect(run('<p></p><p></p><p></p>', detector, { install }).detected).toBe(true);
            expect(reads).toBe(1);
        });

        it('fails the source on a failed read, unless the test reads it with fails', () => {
            const install = (/** @type {any} */ w) => {
                const throwing = Object.defineProperty({}, 'v', {
                    get() {
                        throw new w.TypeError('no');
                    },
                });
                Object.defineProperty(w, 'things', { value: [{ v: 1 }, throwing, { v: 1 }] });
            };
            expect(match('', { api: { path: 'things', where: { self: 'v', is: 1 } }, using: 'length', is: 2 }, { install })).toBe(
                'aborted',
            );
            const readable = { api: { path: 'things', where: { self: 'v', is: { fails: false, eq: 1 } } }, using: 'length', is: 2 };
            expect(match('', readable, { install })).toBe(true);
        });

        it('reads a property named like an expression key through the long form', () => {
            const html = '<select><option>Sign in</option><option>Other</option></select>';
            const count = (/** @type {unknown} */ where) =>
                match(html, { element: { selector: 'option', visibility: 'any', where }, using: 'length', is: 1 });
            expect(count({ field: 'text', is: 'Sign in' })).toBe(true);
            expect(count({ self: 'text', is: 'Sign in' })).toBe(true);
            expectParseError({ match: { element: { selector: 'option', where: { text: 'Sign in' } } } });
        });

        it('rejects an object mixing expression keys and property paths, and a name on a per-item expression', () => {
            expectParseError(
                { match: { api: { ...items, where: { self: 'a', is: 1, b: 0 } }, using: 'length', is: 1 } },
                "unknown expression key 'b'",
            );
            expectParseError(
                { match: { api: { ...items, where: { self: 'a', as: 'n' } }, using: 'length', is: 1 } },
                "'n' names one value per run",
            );
        });
    });

    describe('the five detectors', () => {
        it('reports a broken image count and share', () => {
            const detector = {
                match: { element: BROKEN, using: 'length', as: 'brokenImages', is: { gte: 1 } },
                actions: {
                    fireEvent: {
                        type: 'brokenImages',
                        data: {
                            brokenImages: {
                                value: { ref: 'brokenImages' },
                                buckets: { 1: 1, '2-4': { gte: 2, lt: 5 }, '5-9': { gte: 5, lt: 10 }, '10+': { gte: 10 } },
                            },
                            brokenShare: {
                                value: { div: [{ ref: 'brokenImages' }, { element: { selector: 'img' }, using: 'length' }] },
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
                            api: {
                                path: 'performance.getEntriesByType',
                                args: ['resource'],
                                where: { initiatorType: 'link', responseStatus: { gte: 400 } },
                            },
                            using: 'length',
                            as: 'failedStylesheets',
                            is: { gt: 0 },
                        },
                        {
                            api: { path: 'document.fonts', where: { status: 'error' } },
                            using: 'length',
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
            // A `document.fonts` that throws: the font count fails, and is not reported
            const throwingFonts = (/** @type {any} */ w) => {
                failedSheet(w);
                brokenFonts(w);
            };
            expect(run('', detector, { install: throwingFonts }).data).toEqual({ failedStylesheets: '1' });
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
                            element: {
                                selector: 'img',
                                where: { complete: true, naturalWidth: { gt: 0 } },
                                root: { ref: 'comments' },
                            },
                            using: 'length',
                            is: { lt: 1 },
                        },
                    ],
                },
                actions: {
                    fireEvent: {
                        type: 'regionEmpty',
                        data: {
                            brokenImages: {
                                value: { element: { ...BROKEN, root: { ref: 'comments' } }, using: 'length' },
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
                    text: { xpath: RENDERED, pattern: ['access denied', 'page not found', '404 not found'] },
                    using: 'length',
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

        const aborting = { ...FAILING, using: 'length', is: { gt: 0 } };

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
            const instance = createInstance({ g: { d: { match: { element: { selector: 'img' }, using: 'length' } } } });
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
