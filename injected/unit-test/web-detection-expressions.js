import { JSDOM } from 'jsdom';
import { compileDetector } from '../src/features/web-detection/compile/compile.js';
import { parseDetectors } from '../src/features/web-detection/compile/detector-config.js';
import { pageSources } from '../src/features/web-detection/sources/index.js';
import { EvaluationContext } from '../src/features/web-detection/evaluate/context.js';
import { NativeReader } from '../src/features/web-detection/evaluate/native-reader.js';
import { ConfigParseError } from '../src/features/web-detection/model/core.js';
import { createDetectorState, runDetector } from '../src/features/web-detection/evaluate/run.js';
import WebDetection from '../src/features/web-detection.js';

/**
 * @typedef {object} RunOptions
 * @property {string} [head] - markup for `<head>`
 * @property {(window: any) => void} [install] - runs before the reader captures native getters, so what it defines is native
 * @property {(window: any) => void} [afterCapture] - runs after the capture, as a page script would
 */

/** The actions of a detector whose `match` is under test. */
const REPORT = { breakageReportData: {} };

/**
 * Compile and run a detector against a JSDOM page, reading through that window's globals.
 *
 * `detected` is the `match` result, or `true` without `match`. `data` is the first event's payload,
 * and `failure` the failure that ended `actions`.
 *
 * @param {string} body - markup for `<body>`
 * @param {any} detector
 * @param {RunOptions} [options]
 * @returns {{ detected: boolean | 'error' | 'aborted', abortError?: string, error?: string, failedAt?: string, data?: Record<string, unknown>, failure?: { path: string, result: 'aborted' | 'error' }, names: Map<string, unknown>, ctx: EvaluationContext }}
 */
function run(body, detector, options = {}) {
    const dom = new JSDOM(`<!DOCTYPE html><html><head>${options.head ?? ''}</head><body>${body}</body></html>`);
    const window = dom.window;
    options.install?.(window);
    const originalDocument = globalThis.document;
    globalThis.document = window.document;
    try {
        const compiled = compileDetector(detector, pageSources(window));
        const reader = new NativeReader(window, compiled.names);
        options.afterCapture?.(window);
        const state = createDetectorState();
        const ctx = new EvaluationContext(reader, state.names, state);
        const result = runDetector(compiled, state, ctx);
        const detected = result.match ?? true;
        const failure =
            result.failedAt !== undefined && result.failedAt.startsWith('actions')
                ? { path: result.failedAt, result: /** @type {'aborted' | 'error'} */ (result.error === undefined ? 'aborted' : 'error') }
                : undefined;
        return {
            detected,
            ...(result.abortError && { abortError: result.abortError }),
            ...(result.error !== undefined && { error: result.error }),
            ...(result.failedAt !== undefined && { failedAt: result.failedAt }),
            data: ctx.events[0]?.data,
            ...(failure && { failure }),
            names: ctx.runNames,
            ctx,
        };
    } finally {
        globalThis.document = originalDocument;
    }
}

/**
 * @param {string} body
 * @param {unknown} match
 * @param {RunOptions} [options]
 */
function holds(body, match, options) {
    return run(body, { match, actions: REPORT }, options).detected;
}

/**
 * Run a detector against a page, and give a run name it binds.
 *
 * @param {string} body
 * @param {unknown} actions
 * @param {string} name
 * @param {RunOptions} [options]
 */
function bound(body, actions, name, options) {
    return run(body, { actions }, options).names.get(name);
}

/**
 * A detector whose `match` holds, by default, and that sends one payload field `x`.
 *
 * @param {unknown} value
 * @param {object} [extra] - `when` and `buckets`
 * @param {unknown} [match]
 */
function withPayload(value, extra = {}, match = true) {
    return { match, actions: { fireEvent: { type: 't', data: { x: { value, ...extra } } } } };
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
    expect(() => compileDetector(/** @type {any} */ (detector), pageSources({}))).toThrowMatching(
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
/** `RENDERED` relative to a `root`. */
const RENDERED_WITHIN = './/text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';
/** Non-whitespace characters of rendered text in each root, one match each. */
const renderedText = (/** @type {unknown} */ root) => ({ text: { xpath: RENDERED_WITHIN, pattern: '\\S', root } });

describe('WebDetection expressions', () => {
    describe('iterators', () => {
        it('text in boolean position agrees with a length of at least one', () => {
            for (const html of ['<p>foo</p>', '<p>bar</p>', '<p>foo foo</p>']) {
                const asBoolean = holds(html, { text: { pattern: 'foo' } });
                const asCount = holds(html, { text: { pattern: 'foo' }, using: 'length', is: { gte: 1 } });
                expect(asBoolean).toBe(asCount);
            }
        });

        it('element in boolean position agrees with a length of at least one', () => {
            for (const html of ['<p class="a"></p>', '<p></p>']) {
                expect(holds(html, { element: { selector: '.a' } })).toBe(
                    holds(html, { element: { selector: '.a' }, using: 'length', is: { gte: 1 } }),
                );
            }
        });

        it('counts non-overlapping matches across selectors and XPath expressions', () => {
            const n = bound(
                '<h1>error</h1><p>error and error</p>',
                { define: { n: { text: { selector: 'h1', xpath: '//p//text()', pattern: 'error' }, using: 'length' } } },
                'n',
            );
            expect(n).toBe(3);
        });

        it('counts a match straddling an XPath chunk boundary once', () => {
            const filler = 'x '.repeat(20);
            // Many short nodes so chunks flush mid-phrase
            const html = `<p>${filler}</p><p>page</p><p> not </p><p>found</p><p>${filler}</p><p>page not found</p>`;
            for (const chunkSize of [0, 8, 16, 1024]) {
                const n = bound(
                    html,
                    {
                        define: {
                            n: {
                                text: { xpath: '//p/text()', pattern: 'page not found', xpathConfig: { chunkSize, chunkTail: 32 } },
                                using: 'length',
                            },
                        },
                    },
                    'n',
                );
                expect(n).withContext(`chunkSize ${chunkSize}`).toBe(2);
            }
        });

        it('matches across a chunk boundary in boolean position as before', () => {
            const html = `<p>${'x '.repeat(50)}</p><p>adblocker </p><p>detected</p>`;
            expect(
                holds(html, {
                    text: { xpath: '//p/text()', pattern: 'adblocker detected', xpathConfig: { chunkSize: 16, chunkTail: 32 } },
                }),
            ).toBe(true);
        });
    });

    describe('types', () => {
        it('rejects each expression in a position whose type config shows is wrong', () => {
            expectParseError({ match: { element: { selector: 'img', field: 'naturalWidth' } }, actions: REPORT }, 'does not fill boolean');
            expectParseError(
                { match: { api: { path: 'document.fonts', where: { status: 'error' } } }, actions: REPORT },
                'does not fill boolean',
            );
            expectParseError(
                { match: { element: { selector: 'img' }, using: 'length' }, actions: REPORT },
                'numbers become booleans only through `is`',
            );
            expectParseError({ match: { only: 5, is: 1 }, actions: REPORT }, 'does not fill list');
            expectParseError(
                { match: { only: { element: { selector: 'img' }, using: 'length' }, is: 1 }, actions: REPORT },
                "'length' does not fill list",
            );
            expectParseError({ match: 5, actions: REPORT }, 'does not fill boolean');
            expectParseError({ match: { sum: [true], is: 1 }, actions: REPORT }, 'does not fill number');
            expectParseError({ match: { only: { if: true, then: 1, else: 2 }, is: 1 }, actions: REPORT }, "'if' does not fill list");
        });

        it('takes an api value of the type its position expects, checked as it is read', () => {
            const hidden = (/** @type {boolean} */ value) => (/** @type {any} */ w) =>
                Object.defineProperty(w.Document.prototype, 'hidden', { configurable: true, get: () => value });
            expect(holds('', { api: { path: 'document.hidden' } }, { install: hidden(true) })).toBe(true);
            expect(holds('', { api: { path: 'document.hidden' } }, { install: hidden(false) })).toBe(false);
            expect(holds('', { api: { path: 'document.title' } })).toBe('error');
            expect(holds('', { any: { api: { path: 'document.hidden' } } }, { install: hidden(true) })).toBe(true);
            expect(holds('', { api: { path: 'document.fonts', field: 'status' } }, { install: fonts(['loaded']) })).toBe('error');
        });

        it('rejects `is` outside boolean and value position, and several expression keys beside it', () => {
            expectParseError(
                { match: { sum: [{ element: { selector: 'img' }, using: 'length', is: { gt: 1 } }], is: 1 }, actions: REPORT },
                '`is` gives a boolean',
            );
            expectParseError(
                { match: { text: { pattern: 'a' }, element: { selector: 'p' }, is: true }, actions: REPORT },
                'several expression keys',
            );
        });

        it('rejects unknown keys and reserved keys', () => {
            expectParseError({ match: { pageFeature: 'x' }, actions: REPORT }, "unknown expression key 'pageFeature'");
            expectParseError({ match: { element: { selector: 'img', foo: 1 } }, actions: REPORT }, "unknown key 'foo'");
            expectParseError(
                { match: { api: { path: 'document.title', allowGetter: true }, is: '' }, actions: REPORT },
                "unknown key 'allowGetter'",
            );
            expectParseError(
                { match: { element: { selector: 'img' }, using: 'length', aggregate: 'max', is: 1 }, actions: REPORT },
                "'aggregate' is reserved",
            );
            expectParseError(
                { match: { element: { selector: 'img' }, using: 'length', catch: { absent: 0 }, is: 1 }, actions: REPORT },
                "unknown expression key 'catch'",
            );
            expectParseError({ match: { if: true, is: 1 }, actions: REPORT }, "'if' needs 'then'");
            expectParseError({ match: { if: true, then: 1, else: 2, other: 3, is: 1 }, actions: REPORT }, "unknown expression key 'other'");
            expectParseError({ match: { api: 'x', as: 'y' }, actions: REPORT }, "unknown expression key 'as'");
        });

        it('reads one bound source as a boolean in an `if` condition and as a list in a payload', () => {
            const detector = {
                actions: [
                    { define: { images: { element: { selector: 'img' } } } },
                    {
                        if: { ref: 'images' },
                        then: { fireEvent: { type: 't', data: { images: { value: { ref: 'images', using: 'length' } } } } },
                    },
                ],
            };
            expect(run(IMG() + IMG(), detector).data).toEqual({ images: 2 });
            expect(run('', detector).data).toBeUndefined();
        });

        it('reads a ref in two positions, its type checked as it is read', () => {
            const detector = (/** @type {unknown} */ value) => ({
                actions: [{ define: { v: value } }, { define: { asNumber: { sum: [{ ref: 'v' }] }, asValue: { ref: 'v' } } }],
            });
            const ran = run('', detector(2));
            expect(ran.names.get('asNumber')).toBe(2);
            expect(ran.names.get('asValue')).toBe(2);
            expect(run('', detector('x')).failure).toEqual({ path: 'actions.1.define.asNumber.sum', result: 'error' });
        });

        it('reads text matches and elements through list operators', () => {
            const html = '<p>Page not found</p><p>Error 404</p>';
            const matches = { text: { pattern: ['not found', 'error'] } };
            expect(holds(html, { ...matches, using: { path: 'at', args: [0] }, is: 'not found' })).toBe(true);
            expect(holds(html, { ...matches, using: { path: 'at', args: [-1] }, is: 'Error' })).toBe(true);
            expect(holds('<p>one match</p>', { only: { text: { pattern: 'match' } }, is: 'match' })).toBe(true);
            expect(holds('<p>match match</p>', { only: { text: { pattern: 'match' } }, is: 'match' })).toBe('error');
            expect(holds('<p id="a"></p>', { only: { element: { selector: 'p' } }, is: { tagName: 'P', id: 'a' } })).toBe(true);
            expect(payload('<p>x</p>', { only: { text: { pattern: 'x' } } })).toEqual({ x: 'x' });
            expect(payload('<p>x</p>', { only: { element: { selector: 'p' } } })).toEqual({});
        });

        it('reads an element source under any as a boolean', () => {
            expect(holds('<p></p>', { any: [{ element: { selector: 'p' } }, false] })).toBe(true);
            expect(holds('', { all: { element: { selector: 'p' } } })).toBe(false);
        });

        it('takes booleans and multi-key objects in value position', () => {
            expect(payload('<p>a</p>', { all: [{ text: { pattern: 'a' } }] })).toEqual({ x: true });
            expect(payload('<p>a</p>', { any: [{ text: { pattern: 'b' } }] })).toEqual({ x: false });
            expect(payload('<p class="c">a</p>', { text: { pattern: 'a' }, element: { selector: '.c' } })).toEqual({ x: true });
            expect(payload('', false)).toEqual({ x: false });
        });

        it('takes boolean literals and an empty object in boolean position', () => {
            expect(holds('', true)).toBe(true);
            expect(holds('', false)).toBe(false);
            expect(holds('', {})).toBe(true);
            expect(holds('', { any: [] })).toBe(false);
        });

        it('rejects an array in every expression position', () => {
            const notExpression = 'an array is not an expression';
            expectParseError({ match: [], actions: REPORT }, notExpression);
            expectParseError({ match: [true], actions: REPORT }, notExpression);
            expectParseError({ match: { all: [true, [true, false]] }, actions: REPORT }, notExpression);
            expectParseError({ match: { if: [true], then: true, else: false }, actions: REPORT }, notExpression);
            expect(holds('', { if: true, then: [true], else: false })).toBe(true);
            expectParseError({ match: { if: true, then: [true, 1], else: false }, actions: REPORT }, "'literal' does not fill boolean");
            expectParseError({ actions: [{ define: { x: [1, 2] } }] }, notExpression);
            expectParseError({ actions: [[{ define: { x: 1 } }]] }, notExpression);
            expectParseError({ actions: { define: { x: { sum: [1, { api: { path: 'Math.max', args: [[1]] } }] } } } }, notExpression);
            expectParseError(withPayload([1, 2]), notExpression);
            expectParseError(withPayload({ sum: [1, [2, 3]] }), notExpression);
            expectParseError({ match: { api: { path: 'document.title' }, is: { eq: ['a'] } }, actions: REPORT }, notExpression);
        });

        it('takes string and null literals in value position only', () => {
            expect(payload('', 'x')).toEqual({ x: 'x' });
            expect(payload('', null)).toEqual({ x: null });
            expect(payload('', { if: true, then: 'yes', else: 'no' })).toEqual({ x: 'yes' });
            expect(payload('', { if: false, then: 'yes', else: null })).toEqual({ x: null });
            expect(holds('', { api: { path: 'document.readyState' }, is: { eq: { api: { path: 'document.readyState' } } } })).toBe(true);
            expect(holds('<p>a</p>', { only: { text: { pattern: 'a' } }, is: { eq: { text: { pattern: 'a' } } } })).toBe(true);
            expectParseError({ match: 'x', actions: REPORT }, "'literal' does not fill boolean position");
            expectParseError({ match: { any: [null] }, actions: REPORT }, "'literal' does not fill boolean position");
            expectParseError({ match: { sum: ['x', 1], is: { gt: 0 } }, actions: REPORT }, "'literal' does not fill number position");
            expectParseError({ match: { only: 'x', is: 1 }, actions: REPORT }, "'literal' does not fill list position");
            expect(holds('<p></p>', { element: { selector: 'p' }, using: 'length', is: { gt: '0' } })).toBe(true);
        });

        it('binds the AND of a multi-key object', () => {
            expect(
                bound('<p class="a">foo</p>', { define: { both: { text: { pattern: 'foo' }, element: { selector: '.a' } } } }, 'both'),
            ).toBe(true);
        });

        it('ANDs `any` with a source key in one object', () => {
            expect(holds('<p class="a">foo</p>', { any: [{ text: { pattern: 'foo' } }], element: { selector: '.a' } })).toBe(true);
            expect(holds('<p>foo</p>', { any: [{ text: { pattern: 'foo' } }], element: { selector: '.a' } })).toBe(false);
        });

        it('rejects operator blocks inside a source', () => {
            expectParseError({ match: { text: { any: [{ pattern: 'a' }] } }, actions: REPORT }, "unknown key 'any'");
            expectParseError(
                { match: { element: [{ selector: 'p' }, { none: [{ selector: 'a' }] }] }, actions: REPORT },
                "unknown key 'none'",
            );
        });
    });

    describe('unwrapping', () => {
        const widths = (/** @type {number[]} */ list) => list.map((w) => IMG(`data-width="${w}"`)).join('');
        const width = { element: { selector: 'img', field: 'naturalWidth' } };

        it('gives a selected list’s one item in number position, and errors over none or several', () => {
            const read = { div: [width, 5], is: 1 };
            expect(holds(widths([5]), read, { install: imageState })).toBe(true);
            expect(holds('', read, { install: imageState })).toBe('error');
            expect(holds(widths([5, 5]), read, { install: imageState })).toBe('error');
        });

        it('gives the one item to a predicate that compares, and the list as an array to one that does not', () => {
            expect(holds(widths([5]), { ...width, is: { gt: 4 } }, { install: imageState })).toBe(true);
            expect(holds(widths([5]), { ...width, is: 5 }, { install: imageState })).toBe(true);
            expect(holds(widths([5, 6]), { ...width, is: { gt: 4 } }, { install: imageState })).toBe('error');
            expect(holds(widths([5, 6]), { ...width, is: { length: 2 } }, { install: imageState })).toBe(true);
            expect(holds(widths([5, 6]), { ...width, is: { type: 'array' } }, { install: imageState })).toBe(true);
            expect(holds('', { ...width, is: {} }, { install: imageState })).toBe(true);
        });

        it('keeps element and text in boolean position as presence', () => {
            expect(holds(IMG() + IMG(), { element: { selector: 'img' } })).toBe(true);
            expect(holds('<p>a a</p>', { text: { pattern: 'a' } })).toBe(true);
        });

        it('does not unwrap an iterable an api reads', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 5 }]);
            const entries = { api: { path: 'performance.getEntriesByType', args: ['navigation'] } };
            expect(holds('', { ...entries, is: { length: 1 } }, { install })).toBe(true);
            // `lt` compares the array as JS does: `[entry] < 1` coerces the entry to `NaN`
            expect(holds('', { ...entries, is: { lt: 1 } }, { install })).toBe(false);
        });

        it('sends a selected list bucketed, each bucket unwrapping it, and errors on one unbucketed', () => {
            const buckets = { small: { lt: 10 }, large: { gte: 10 } };
            expect(run(widths([5]), withPayload(width, { buckets }), { install: imageState }).data).toEqual({ x: 'small' });
            expect(run(widths([5]), withPayload(width, { buckets: { two: { length: 2 } } }), { install: imageState }).data).toEqual({});
            expect(run(widths([5]), withPayload(width), { install: imageState }).failure).toEqual({
                path: 'actions.fireEvent.data.x.value',
                result: 'error',
            });
            expect(run(widths([5, 6]), withPayload(width, { buckets }), { install: imageState }).failure).toEqual({
                path: 'actions.fireEvent.data.x.value',
                result: 'error',
            });
        });
    });

    describe('names and refs', () => {
        it('compiles a ref to a name nothing binds, which reads `undefined`', () => {
            expect(holds('', { ref: 'nope', is: { type: 'undefined' } })).toBe(true);
            expect(holds('', { ref: 'nope', is: true })).toBe(false);
            expect(holds('', { ref: 'nope' })).toBe('error');
        });

        it('evaluates every operand, so a value bound in a later operand is read', () => {
            const detector = {
                actions: [
                    {
                        define: {
                            either: {
                                any: [
                                    { text: { pattern: 'foo' } },
                                    {
                                        expr: { define: { images: { element: { selector: 'img' }, using: 'length' } } },
                                        is: { type: 'undefined' },
                                    },
                                ],
                            },
                        },
                    },
                    { fireEvent: { type: 't', data: { images: { value: { ref: 'images' } } } } },
                ],
            };
            expect(run('<p>foo</p>' + IMG(), detector).data).toEqual({ images: 1 });
        });

        it('reads the value a name holds, not the boolean `is` gives', () => {
            const html = IMG() + IMG() + IMG();
            const actions = [
                { define: { images: { element: { selector: 'img' }, using: 'length' } } },
                { define: { three: { ref: 'images', is: 3 } } },
            ];
            expect(bound(html, actions, 'three')).toBe(true);
        });

        it('reads a bound condition leaf as a boolean under `all`', () => {
            const actions = [{ define: { p: { element: { selector: 'p' } } } }, { define: { has: { all: [{ ref: 'p' }, true] } } }];
            expect(bound('<p></p>', actions, 'has')).toBe(true);
            expect(bound('', actions, 'has')).toBe(false);
        });
    });

    describe('values', () => {
        it('divides by 0 as JS does', () => {
            expect(payload('', { div: [1, 0] }, { when: { ...numberTest('isFinite', false), gt: 0 } })).toEqual({});
            const result = run('', {
                actions: {
                    define: {
                        pos: { div: [1, 0] },
                        neg: { div: [-1, 0] },
                        nan: { div: [0, 0] },
                        nanTested: { ref: 'nan', is: numberTest('isNaN') },
                    },
                },
            });
            expect(result.names.get('pos')).toBe(Infinity);
            expect(result.names.get('neg')).toBe(-Infinity);
            expect(result.names.get('nan')).toBeNaN();
            expect(result.names.get('nanTested')).toBe(true);
        });

        it('carries NaN through each operator', () => {
            for (const op of ['sum', 'mul', 'div']) {
                expect(holds('', { [op]: [{ div: [0, 0] }, 2], is: numberTest('isNaN') }))
                    .withContext(op)
                    .toBe(true);
            }
        });

        it('compares NaN as within no bound, so `none` over a comparison on NaN holds', () => {
            expect(holds('', { div: [0, 0], is: { lt: 5 } })).toBe(false);
            expect(holds('', { div: [0, 0], is: { gte: 5 } })).toBe(false);
            expect(holds('', { none: { div: [0, 0], is: { lt: 5 } } })).toBe(true);
        });

        it('computes negation and subtraction through mul by -1', () => {
            expect(holds('', { mul: [3, -1], is: -3 })).toBe(true);
            expect(holds('', { sum: [5, { mul: [3, -1] }], is: 2 })).toBe(true);
        });
    });

    describe('failures and fails', () => {
        it('aborts on a failure in boolean position', () => {
            const result = run('', { match: { ...FAILING, using: 'length', is: { gt: 0 } }, actions: REPORT });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('SyntaxError');
        });

        it('aborts with the thrown value’s constructor name when a read throws', () => {
            const result = run(
                IMG('data-complete data-throw'),
                { match: { element: { selector: 'img', where: { naturalWidth: 0 } }, using: 'length', is: { gt: 0 } }, actions: REPORT },
                { install: imageState },
            );
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('Error');
            expect(result.failedAt).toBe('match.element.where.naturalWidth');
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
                expect(holds(html, { ...expression, is: predicate }, options))
                    .withContext(`${html} ${JSON.stringify(predicate)}`)
                    .toBe(expected);
            }
        });

        it('tests `fails` first, whatever the key order', () => {
            const width = { only: { element: { selector: 'img', field: 'naturalWidth' } } };
            expect(holds(IMG('data-throw'), { ...width, is: { gt: 0, fails: false } }, { install: imageState })).toBe(false);
            expect(holds(IMG('data-width="5"'), { ...width, is: { gt: 0, fails: false } }, { install: imageState })).toBe(true);
            expect(holds('', { ...FAILING, using: 'length', is: { gt: 0, fails: false } })).toBe(false);
        });

        it('reads exists as a property name', () => {
            expect(holds('', { api: 'document', is: { exists: true } })).toBe(false);
            expect(holds('', { api: 'document', is: { exists: { type: 'undefined' } } })).toBe(true);
        });

        it('tests whether a property is present through Reflect.has, per item and on the engine', () => {
            const install = timeline([{ name: 'r', entryType: 'resource', responseStatus: 404 }]);
            const lacking = timeline([{ name: 'r', entryType: 'resource' }], { missing: ['responseStatus'] });
            const has = { field: { api: { path: 'Reflect.has', args: [{ self: {} }, 'responseStatus'] } }, is: true };
            const errors = {
                api: { path: 'performance.getEntriesByType', args: ['resource'], where: { ...has, responseStatus: { gte: 400 } } },
                using: 'length',
            };
            expect(holds('', { ...errors, is: 1 }, { install })).toBe(true);
            expect(holds('', { ...errors, is: 0 }, { install: lacking })).toBe(true);
            const engine = {
                api: { path: 'Reflect.has', args: [{ api: 'FakePerformanceEntry.prototype' }, 'responseStatus'] },
            };
            const guarded = { if: engine, then: errors, else: 0, is: 0 };
            expect(holds('', guarded, { install: lacking })).toBe(true);
            expect(holds('', { ...guarded, is: 1 }, { install })).toBe(true);
        });

        it('tests each item with `fails`, counting the readable items instead of aborting', () => {
            const html = IMG('data-throw') + IMG('data-width="0"') + IMG('data-width="5"');
            const readable = { element: { selector: 'img', where: { naturalWidth: { fails: false } } }, using: 'length' };
            expect(holds(html, { ...readable, is: 2 }, { install: imageState })).toBe(true);
            const thrown = { element: { selector: 'img', where: { naturalWidth: { fails: true } } }, using: 'length' };
            expect(holds(html, { ...thrown, is: 1 }, { install: imageState })).toBe(true);
        });

        it('reports a value tested with `fails`, and omits a failed one', () => {
            const detector = {
                actions: {
                    fireEvent: {
                        type: 't',
                        data: {
                            failedFontFaces: {
                                value: { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' },
                                when: { fails: false },
                            },
                        },
                    },
                },
            };
            expect(run('', detector, { install: brokenFonts }).data).toEqual({});
            expect(run('', detector, { install: fonts(['loaded', 'error']) }).data).toEqual({ failedFontFaces: 1 });
        });

        it('falls back through `if` over `fails`, reporting the fallback, and fails on the failed read unless handled', () => {
            const failed = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };
            /** @param {object} n - the payload field for `n` */
            const detector = (n) => ({
                actions: [
                    { define: { nOr0: { if: { ...failed, is: { fails: false } }, then: { expr: failed }, else: 0 } } },
                    { fireEvent: { type: 't', data: { nOr0: { value: { ref: 'nOr0' } }, n } } },
                ],
            });
            const handled = detector({ value: failed, when: { fails: false } });
            expect(run('', handled, { install: brokenFonts }).data).toEqual({ nOr0: 0 });
            expect(run('', handled, { install: fonts(['error', 'error']) }).data).toEqual({ nOr0: 2, n: 2 });
            expect(run('', detector({ value: failed }), { install: brokenFonts }).failure).toEqual({
                path: 'actions.1.fireEvent.data.n.value.api',
                result: 'aborted',
            });
        });

        it('lets a tested failure under `none` decide the leaf, and an untested one abort', () => {
            const failedFonts = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };
            expect(holds('', { none: { ...failedFonts, is: { fails: false, gt: 0 } } }, { install: brokenFonts })).toBe(true);
            expect(holds('', { none: { ...failedFonts, is: { gt: 0 } } }, { install: brokenFonts })).toBe('aborted');
        });

        it('evaluates every operand, so a later failure aborts whatever an earlier operand gives', () => {
            const failing = { ...FAILING, using: 'length', is: { gt: 0 } };
            expect(holds('<p>foo</p>', { any: [{ text: { pattern: 'foo' } }, failing] })).toBe('aborted');
            expect(holds('<p>foo</p>', { any: [failing, { text: { pattern: 'foo' } }] })).toBe('aborted');
            expect(holds('', { all: [false, failing] })).toBe('aborted');
            expect(run('', { match: { all: [false, failing] }, actions: REPORT }).failedAt).toBe('match.all.1.api');
        });

        it('tests every key of a predicate object, `fails` and `type` first', () => {
            expect(holds('', { api: 'document', is: { type: 'string', title: { field: FAILING, is: 1 } } })).toBe(false);
            expect(holds('', { api: 'document', is: { nodeType: 2, title: { field: FAILING, is: 1 } } })).toBe('aborted');
        });
    });

    describe('if', () => {
        const images = { element: { selector: 'img' }, using: 'length' };
        const brokenRatio = [
            { define: { images } },
            {
                define: {
                    brokenRatio: {
                        if: { ref: 'images', is: { gt: 0 } },
                        then: { div: [{ element: BROKEN, using: 'length' }, { ref: 'images' }] },
                        else: 0,
                    },
                },
            },
        ];

        it('takes the branch the condition chooses', () => {
            expect(bound('<p></p>', brokenRatio, 'brokenRatio', { install: imageState })).toBe(0);
            expect(
                bound(IMG('data-complete') + IMG('data-complete data-width="5"'), brokenRatio, 'brokenRatio', { install: imageState }),
            ).toBe(0.5);
        });

        it('does not evaluate the other branch', () => {
            expect(holds('', { if: true, then: 1, else: { api: { path: 'document.fonts' }, using: 'length' }, is: 1 })).toBe(true);
        });

        it('applies `using` and `is` beside `if` to the branch taken', () => {
            expect(holds('', { if: true, then: { expr: ['a', 'b'] }, else: { expr: [] }, using: 'length', is: 2 })).toBe(true);
            expect(holds('', { if: false, then: true, else: 3, is: 3 })).toBe(true);
        });

        it('omits a payload key reading a name bound in the branch not taken', () => {
            const detector = {
                actions: [
                    { define: { chosen: { if: false, then: [{ define: { thenValue: 1 } }, 1], else: [{ define: { elseValue: 2 } }, 2] } } },
                    {
                        fireEvent: {
                            type: 't',
                            data: {
                                a: { value: { ref: 'thenValue' } },
                                b: { value: { ref: 'elseValue' } },
                                c: { value: { ref: 'chosen' } },
                            },
                        },
                    },
                ],
            };
            expect(run('', detector).data).toEqual({ b: 2, c: 2 });
        });

        it('takes a branch carrying `is` in boolean position', () => {
            expect(holds('<p>a</p>', { if: true, then: { text: { pattern: 'a' }, using: 'length', is: { gte: 1 } }, else: false })).toBe(
                true,
            );
            expect(holds('<p>a</p>', { if: false, then: true, else: { text: { pattern: 'a' }, using: 'length', is: 0 } })).toBe(false);
        });

        it('takes a sequence in a branch, giving its last value', () => {
            expect(holds('', { if: true, then: [{ define: { x: 1 } }, { ref: 'x', is: 1 }], else: false })).toBe(true);
        });

        it('passes up a failure in its condition', () => {
            expect(holds('', { if: { ...FAILING, using: 'length', is: { gt: 0 } }, then: true, else: false })).toBe('aborted');
        });
    });

    describe('operators', () => {
        it('errors on only over no items', () => {
            expect(
                run('', { match: { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: {} }, actions: REPORT }).detected,
            ).toBe('error');
            expect(holds('', { sum: { element: { selector: 'img', field: 'naturalWidth' } }, is: 0 })).toBe(true);
            expect(holds('', { mul: { element: { selector: 'img', field: 'naturalWidth' } }, is: 1 })).toBe(true);
            const at = { element: { selector: 'img', field: 'naturalWidth' }, using: { path: 'at', args: [0] } };
            expect(holds('', { ...at, is: { type: 'undefined' } })).toBe(true);
            expect(holds('', { ...at, is: { gte: 0 } })).toBe(false);
        });

        it('mixes lists of values with numbers', () => {
            const html = IMG('data-width="3"') + IMG('data-width="9"');
            expect(
                holds(html, { sum: [{ element: { selector: 'img', field: 'naturalWidth' } }, 1], is: 13 }, { install: imageState }),
            ).toBe(true);
        });

        it('reads the one item with only, and errors over none or several', () => {
            const read = { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: { gte: 0 } };
            expect(holds(IMG(), read, { install: imageState })).toBe(true);
            expect(holds('', read, { install: imageState })).toBe('error');
            expect(holds(IMG() + IMG(), read, { install: imageState })).toBe('error');
        });

        it('picks an item by position with at on a root, in document order', () => {
            const html = IMG('data-width="1"') + IMG('data-width="2"') + IMG('data-width="3"');
            const widths = { element: { selector: 'img', field: 'naturalWidth' } };
            expect(holds(html, { ...widths, using: { path: 'at', args: [0] }, is: 1 }, { install: imageState })).toBe(true);
            expect(holds(html, { ...widths, using: { path: 'at', args: [-1] }, is: 3 }, { install: imageState })).toBe(true);
            const images = { element: { selector: 'img' } };
            expect(
                holds(html, { ...images, using: { path: 'at', args: [1], field: 'naturalWidth' }, is: 2 }, { install: imageState }),
            ).toBe(true);
        });

        it('picks an item by position with at on a root, in timeline order', () => {
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: 5 },
                { name: 'b', entryType: 'resource', duration: 7 },
            ]);
            const durations = { api: { path: 'performance.getEntriesByType', args: ['resource'], field: 'duration' } };
            expect(holds('', { ...durations, using: { path: 'at', args: [0] }, is: 5 }, { install })).toBe(true);
            expect(holds('', { ...durations, using: { path: 'at', args: [-1] }, is: 7 }, { install })).toBe(true);
        });

        it('errors on a value of the wrong type', () => {
            expect(holds('<p>x</p>', { sum: [{ element: { selector: 'p', field: 'tagName' } }], is: 1 })).toBe('error');
            expect(holds('<p>x</p>', { only: { element: { selector: 'p', field: 'tagName' } }, is: { gt: 1 } })).toBe(false);
            expect(holds('<p>x</p>', { all: { element: { selector: 'p', field: 'tagName' } } })).toBe('error');
            expect(holds('', { only: { api: { path: 'document.title' } }, is: 0 })).toBe('error');
            expect(holds('', { div: [{ api: { path: 'document.styleSheets' } }, 1], is: 0 })).toBe('error');
            expect(holds('', { sum: { api: { path: 'document.styleSheets' } }, is: 0 })).toBe(true);
        });

        it('takes all, any and none over a list of booleans', () => {
            const html = IMG('data-complete') + IMG();
            expect(holds(html, { all: { element: { selector: 'img', field: 'complete' } } }, { install: imageState })).toBe(false);
            expect(holds(html, { any: { element: { selector: 'img', field: 'complete' } } }, { install: imageState })).toBe(true);
            expect(holds(IMG(), { none: { element: { selector: 'img', field: 'complete' } } }, { install: imageState })).toBe(true);
        });
    });

    describe('eager evaluation', () => {
        /**
         * Run with the image getters installed, and give the number of `complete` reads.
         *
         * @param {string} html
         * @param {any} detector
         */
        function completeReads(html, detector) {
            /** @type {any} */
            let window;
            const result = run(html, detector, {
                install: (w) => {
                    imageState(w);
                    window = w;
                },
            });
            return { result, reads: window.__imageReads.complete };
        }

        const three = IMG('data-complete') + IMG('data-complete') + IMG();

        it('reads every item of a length, whatever the predicate on it', () => {
            const { result, reads } = completeReads(three, {
                match: { element: { selector: 'img', where: { complete: true } }, using: 'length', is: { gte: 1 } },
                actions: REPORT,
            });
            expect(result.detected).toBe(true);
            expect(reads).toBe(3);
        });

        it('reaches a where failure past the items a predicate needs', () => {
            const html = IMG('data-width="1"') + IMG('data-width="1"') + IMG('data-throw');
            const where = { naturalWidth: { gt: 0 } };
            expect(holds(html, { element: { selector: 'img', where }, using: 'length', is: { gte: 2 } }, { install: imageState })).toBe(
                'aborted',
            );
        });

        it('reads every item of a list under `any`', () => {
            const { result, reads } = completeReads(three, {
                match: { any: { element: { selector: 'img', field: 'complete' } } },
                actions: REPORT,
            });
            expect(result.detected).toBe(true);
            expect(reads).toBe(3);
        });

        it('evaluates every operand of `any`, `all`, `none` and the implicit AND', () => {
            const read = { element: { selector: 'img', where: { complete: true } }, using: 'length', is: { gte: 0 } };
            for (const match of [
                { any: [true, read] },
                { all: [false, read] },
                { none: [true, read] },
                { element: { selector: 'p' }, expr: read },
            ]) {
                expect(completeReads(three, { match, actions: REPORT }).reads)
                    .withContext(JSON.stringify(match))
                    .toBe(3);
            }
        });

        it('pulls a bound list once across its refs', () => {
            const { result, reads } = completeReads(three, {
                actions: [
                    { define: { images: { element: { selector: 'img', where: { complete: true } } } } },
                    { define: { any: { ref: 'images' }, n: { ref: 'images', using: 'length' } } },
                ],
            });
            expect(result.names.get('n')).toBe(2);
            expect(reads).toBe(3);
        });

        it('reads the value beside `using` once for several `self` reads', () => {
            const { result, reads } = completeReads(three, {
                actions: {
                    define: {
                        n: {
                            element: { selector: 'img', where: { complete: true } },
                            using: { sum: [{ self: 'length' }, { self: 'length' }] },
                        },
                    },
                },
            });
            expect(result.names.get('n')).toBe(4);
            expect(reads).toBe(3);
        });

        it('reads a source again each time evaluation reaches it', () => {
            const read = { element: { selector: 'img', where: { complete: true } }, using: 'length' };
            const { reads } = completeReads(three, { actions: { define: { a: read, b: read } } });
            expect(reads).toBe(6);
        });
    });

    describe('payloads', () => {
        it('names the first bucket that holds, in key order', () => {
            expect(payload('', 3, { buckets: { low: { lt: 5 }, any: {} } })).toEqual({ x: 'low' });
            expect(payload('', 3, { buckets: { any: {}, low: { lt: 5 } } })).toEqual({ x: 'any' });
        });

        it('omits a value in no bucket, and fails on a failed value no bucket handles', () => {
            const failing = { ...FAILING, using: 'length' };
            expect(payload('', 30, { buckets: { low: { lt: 5 } } })).toEqual({});
            expect(run('', withPayload(failing, { buckets: { any: {} } })).failure).toEqual({
                path: 'actions.fireEvent.data.x.value.api',
                result: 'aborted',
            });
            expect(payload('', failing, { buckets: { unreadable: { fails: true }, any: {} } })).toEqual({ x: 'unreadable' });
        });

        it('omits the key when `when` does not hold, and fails when `when` fails', () => {
            expect(payload('', 3, { when: { gt: 5 } })).toEqual({});
            expect(payload('', 3, { when: { gt: 1 } })).toEqual({ x: 3 });
            expect(run('', withPayload(3, { when: { gt: { ...FAILING, using: 'length' } } })).failure).toEqual({
                path: 'actions.fireEvent.data.x.when.gt.api',
                result: 'aborted',
            });
        });

        it('omits a failed value through a `when` testing `fails`', () => {
            expect(payload('', { ...FAILING, using: 'length' }, { when: { fails: false } })).toEqual({});
            expect(payload('', 3, { when: { fails: false } })).toEqual({ x: 3 });
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

        it('fails at the first key whose value, `when` or bucket fails or errors, in key order', () => {
            const detector = {
                actions: {
                    fireEvent: {
                        type: 't',
                        data: {
                            ok: { value: 1 },
                            zeta: { value: { only: { element: { selector: 'img', field: 'naturalWidth' } } } },
                            alpha: { value: { ...FAILING, using: 'length' } },
                        },
                    },
                },
            };
            expect(run('<p></p>', detector).failure).toEqual({ path: 'actions.fireEvent.data.zeta.value.only', result: 'error' });
        });

        it('sends every key when nothing fails', () => {
            expect(payload('', 1)).toEqual({ x: 1 });
        });

        it('rejects invalid payload keys and empty buckets', () => {
            expectParseError({ actions: { fireEvent: { type: 't', data: { nativeData: { value: 1 } } } } }, 'invalid payload key');
            expectParseError({ actions: { fireEvent: { type: 't', data: { _x: { value: 1 } } } } }, 'invalid payload key');
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
            expect(holds('', nav({ type: 'reload' }), { install })).toBe(true);
            expect(holds('', nav({ type: { eq: 'reload' } }), { install })).toBe(true);
            expect(holds('', nav({ size: 0 }), { install })).toBe(true);
            expect(holds('', nav({ size: '0' }), { install })).toBe(false);
            expect(holds('', nav({ nothing: null }), { install })).toBe(true);
            expect(holds('', nav({ type: { in: ['navigate', 'reload'] } }), { install })).toBe(true);
            expect(holds('', nav({ type: { none: ['navigate', 'reload'] } }), { install })).toBe(false);
            expect(holds('', nav({ type: { none: { in: ['navigate', 'reload'] } } }), { install })).toBe(false);
        });

        it('rejects an array as a predicate', () => {
            const notPredicate = 'an array is not a predicate';
            expectParseError({ match: { api: { path: 'document.title' }, is: ['a', 'b'] }, actions: REPORT }, notPredicate);
            expectParseError({ match: { api: { path: 'performance.getEntries', where: [{ a: 1 }] } }, actions: REPORT }, notPredicate);
            expectParseError({ match: { api: { path: 'document.title' }, is: { length: [1, 2] } }, actions: REPORT }, notPredicate);
            expectParseError(withPayload(1, { when: [1, 2] }), notPredicate);
            expectParseError(withPayload(1, { buckets: { low: [0, 1] } }), notPredicate);
        });

        it('tests for one of several values with in', () => {
            const title = (/** @type {unknown} */ is) => holds('<title>b</title>', { api: { path: 'document.title' }, is }, {});
            expect(title({ in: ['a', 'b'] })).toBe(true);
            expect(title({ in: ['a', 'c'] })).toBe(false);
            expect(title({ in: 'b' })).toBe(true);
            expect(title({ in: [] })).toBe(false);
            expect(title({ in: [{ api: { path: 'String', args: ['b'] } }] })).toBe(true);
            // A list entry contributes each item, and `{"in": {"expr": [...]}}` is `{"in": [...]}`
            expect(title({ in: { expr: ['a', 'b'] } })).toBe(true);
            expect(title({ in: [{ expr: ['a'] }, 'c'] })).toBe(false);
            expect(title({ in: [{ api: { path: 'Array.of', args: ['a', 'b'] } }] })).toBe(true);
            // `===`: no coercion, and `NaN` is in no list
            expect(holds('', { api: { path: 'Number', args: ['7'] }, is: { in: ['7'] } })).toBe(false);
            expect(holds('', { api: { path: 'Number', args: ['x'] }, is: { in: [{ api: { path: 'Number', args: ['x'] } }] } })).toBe(false);
            expect(
                holds('', { api: { path: 'Number', args: ['x'] }, is: { in: { expr: [{ api: { path: 'Number', args: ['x'] } }] } } }),
            ).toBe(false);
            // A selected list gives its one item, as `eq` does, and in a list entry contributes each item
            expect(holds('<p>b</p>', { text: { pattern: 'b' }, is: { in: ['a', 'b'] } })).toBe(true);
            expect(
                holds('<p>a</p><p>b</p>', {
                    api: { path: 'document.title' },
                    is: { in: { element: { selector: 'p', field: 'textContent' } } },
                }),
            ).toBe(false);
            expect(
                holds('<title>b</title><p>a</p><p>b</p>', {
                    api: { path: 'document.title' },
                    is: { in: { element: { selector: 'p', field: 'textContent' } } },
                }),
            ).toBe(true);
            // Every entry is read, and a failed entry fails the test, after a match too
            expect(
                holds('<title>b</title>', { api: { path: 'document.title' }, is: { in: [{ api: { path: 'JSON.parse', args: ['{'] } }] } }),
            ).toBe('aborted');
            expect(
                holds('<title>b</title>', {
                    api: { path: 'document.title' },
                    is: { in: ['b', { api: { path: 'JSON.parse', args: ['{'] } }] },
                }),
            ).toBe('aborted');
            // At item level, `in` is a property path
            const items = (/** @type {object} */ where) => ({ api: { path: 'myItems', where }, using: 'length' });
            const afterCapture = (/** @type {any} */ w) => {
                w.myItems = [{ in: 'x', k: 1 }, { k: 2 }, { k: 3 }];
            };
            expect(holds('', { ...items({ in: 'x' }), is: 1 }, { afterCapture })).toBe(true);
            expect(holds('', { ...items({ k: { in: [1, 3] } }), is: 2 }, { afterCapture })).toBe(true);
        });

        it('compares a value that is not a number as JS does', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            expect(
                holds(
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
            expect(holds('<p>x</p>', { only: { element: { selector: 'p', field: 'tagName' } }, is: { gte: 'O' } })).toBe(true);
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
                expect(holds('', { sum: [value], is: numberTest('isFinite') })).toBe(finite);
                expect(holds('', { sum: [value], is: numberTest('isNaN') })).toBe(nan);
            }
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            const type = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'type' } } };
            expect(holds('', { ...type, is: numberTest('isFinite', false) }, { install })).toBe(true);
            expect(holds('', { ...type, is: numberTest('isNaN', false) }, { install })).toBe(true);
        });

        it('reads finite and nan as property names, not operators', () => {
            expect(holds('', { div: [0, 0], is: { nan: true } })).toBe(false);
            expect(holds('', { sum: [3], is: { finite: { type: 'undefined' } } })).toBe(true);
        });

        it('reads property paths at item and value level, beside reserved keys and operators', () => {
            const html = `<input type="checkbox" checked><input type="text" value="abc">`;
            expect(
                holds(html, {
                    element: { selector: 'input', where: { type: 'checkbox', checked: true } },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(
                holds(html, {
                    element: { selector: 'input', where: { 'value.length': { gt: 2 }, any: [{ type: 'text' }] } },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(holds(html, { api: { path: 'document.title' }, is: { type: 'string', length: 0 } })).toBe(true);
        });

        it('buckets a value by length', () => {
            expect(
                payload('', { api: { path: 'document.title' } }, { buckets: { empty: { length: 0 }, some: { length: { gt: 0 } } } }),
            ).toEqual({ x: 'empty' });
        });

        it('reads a property named like an operator under `is` through the long form', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload' }]);
            const nav = { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } } };
            expect(holds('', { ...nav, is: { field: 'type', is: 'reload' } }, { install })).toBe(true);
        });

        it('rejects field or is without the other, and an unknown type name', () => {
            expectParseError(
                { match: { element: { selector: 'p', where: { field: 'id' } }, using: 'length', is: 1 }, actions: REPORT },
                '`field` and `is` go together',
            );
            expectParseError(
                { match: { element: { selector: 'p', where: { is: 1 } }, using: 'length', is: 1 }, actions: REPORT },
                '`field` and `is` go together',
            );
            expectParseError(
                { match: { element: { selector: 'p' }, using: 'length', is: { type: 'integer' } }, actions: REPORT },
                'unknown type name',
            );
        });

        it('reads a property named like a reserved key in the long form, inside combinators at item level', () => {
            const html = '<div role="dialog"></div><div></div>';
            expect(
                holds(html, {
                    element: {
                        selector: 'div',
                        where: { field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' },
                    },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(
                holds(html, {
                    element: {
                        selector: 'div',
                        where: { any: [{ field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' }, { id: 'x' }] },
                    },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(holds(html, { element: { selector: 'div', where: { none: [{ hidden: true }] } }, using: 'length', is: 2 })).toBe(true);
        });

        it('fails the source when a read fails', () => {
            expect(
                holds(
                    IMG('data-throw'),
                    { element: { selector: 'img', where: { naturalWidth: 1 } }, using: 'length', is: 0 },
                    { install: imageState },
                ),
            ).toBe('aborted');
            expect(holds('<p></p>', { element: { selector: 'p', where: { noSuchProperty: 1 } }, using: 'length', is: 0 })).toBe(true);
        });

        it('tests fails and type first whatever the key order', () => {
            // `gt` on a throwing property would fail; `fails` decides first
            expect(
                holds(
                    IMG('data-throw'),
                    { element: { selector: 'img', where: { naturalWidth: { gt: 1, fails: false } } }, using: 'length', is: 0 },
                    { install: imageState },
                ),
            ).toBe(true);
            expect(
                holds('<p></p>', {
                    element: { selector: 'p', where: { id: { gt: 1, type: 'number' } } },
                    using: 'length',
                    is: 0,
                }),
            ).toBe(true);
        });

        it('treats exists and type as property names on items', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', exists: 'yes', type: 'reload' }]);
            expect(
                holds(
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
                holds(
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

        it('compares against an operand expression, bound once', () => {
            const install = timeline([
                { name: 'nav', entryType: 'navigation', loadEventEnd: 100 },
                { name: 'a', entryType: 'resource', responseEnd: 50 },
                { name: 'b', entryType: 'resource', responseEnd: 150 },
            ]);
            const actions = [
                {
                    define: {
                        loadEventEnd: {
                            only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'loadEventEnd' } },
                        },
                    },
                },
                {
                    define: {
                        late: {
                            api: {
                                path: 'performance.getEntriesByType',
                                args: ['resource'],
                                where: { responseEnd: { gt: { ref: 'loadEventEnd' } } },
                            },
                            using: 'length',
                        },
                    },
                },
            ];
            expect(bound('', actions, 'late', { install })).toBe(1);
        });

        it('reads the native getter when the page overrides the prototype’s', () => {
            const html = IMG('data-complete data-width="0"');
            const afterCapture = (/** @type {any} */ w) => {
                Object.defineProperty(w.HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 999 });
            };
            expect(holds(html, { element: BROKEN, using: 'length', is: 1 }, { install: imageState, afterCapture })).toBe(true);
            expect(
                holds(
                    html,
                    { only: { element: { selector: 'img', field: 'naturalWidth' } }, is: 0 },
                    { install: imageState, afterCapture },
                ),
            ).toBe(true);
        });
    });

    describe('compiled tree', () => {
        /**
         * @param {any} detector
         * @returns {any}
         */
        const compile = (detector) => compileDetector(detector, pageSources({}));

        it('compiles a predicate to nodes with their config paths', () => {
            const { match } = compile({ match: { ref: 'loadEventEnd', is: { gt: 0, lt: 8000 } }, actions: REPORT });
            expect(match.is).toEqual({
                kind: 'combine',
                combinator: 'all',
                entries: [
                    { kind: 'compare', op: 'gt', value: 0, path: 'match.is.gt', scalar: true },
                    { kind: 'compare', op: 'lt', value: 8000, path: 'match.is.lt', scalar: true },
                ],
                path: 'match.is',
                scalar: true,
            });
        });

        it('keeps the operands of in and of comparisons as expressions', () => {
            const { match } = compile({
                match: { ref: 'type', is: { in: ['reload', { ref: 'other' }], eq: { ref: 'other' } } },
                actions: REPORT,
            });
            const [within, equal] = match.is.entries;
            expect(within).toEqual(
                jasmine.objectContaining({
                    kind: 'in',
                    entries: [{ literal: 'reload' }, { operand: jasmine.objectContaining({ kind: 'ref', name: 'other' }) }],
                    path: 'match.is.in',
                }),
            );
            expect(equal).toEqual(
                jasmine.objectContaining({ kind: 'compare', op: 'eq', operand: jasmine.objectContaining({ kind: 'ref', name: 'other' }) }),
            );
        });

        it('guards the other keys with fails and type', () => {
            const { match } = compile({ match: { ref: 'n', is: { gte: 1, fails: false } }, actions: REPORT });
            expect(match.is).toEqual(
                jasmine.objectContaining({
                    kind: 'guarded',
                    guard: jasmine.objectContaining({
                        kind: 'combine',
                        entries: [{ kind: 'fails', expected: false, path: 'match.is.fails', scalar: false }],
                    }),
                    rest: jasmine.objectContaining({
                        kind: 'combine',
                        entries: [jasmine.objectContaining({ kind: 'compare', op: 'gte' })],
                    }),
                }),
            );
        });

        it('reads item properties under where', () => {
            const { match } = compile({
                match: { element: { selector: 'img', where: { complete: true } }, using: 'length', is: 1 },
                actions: REPORT,
            });
            expect(match.root.bodies[0].where).toEqual(
                jasmine.objectContaining({
                    kind: 'where',
                    path: 'match.element.where',
                    predicate: jasmine.objectContaining({
                        kind: 'combine',
                        entries: [
                            {
                                kind: 'read',
                                field: { path: 'match.element.where.complete', names: ['complete'] },
                                next: { kind: 'compare', op: 'eq', value: true, path: 'match.element.where.complete', scalar: true },
                                path: 'match.element.where.complete',
                                scalar: false,
                            },
                        ],
                    }),
                }),
            );
        });

        it('compiles payload buckets in order', () => {
            const { actions } = compile({
                actions: { breakageReportData: { data: { n: { value: { ref: 'n' }, buckets: { low: { lt: 5 }, high: { gte: 5 } } } } } },
            });
            const buckets = actions.data[0].buckets;
            expect(buckets.map((/** @type {[string, any]} */ [name, bucket]) => [name, bucket.entries[0].op, bucket.path])).toEqual([
                ['low', 'lt', 'actions.breakageReportData.data.n.buckets.low'],
                ['high', 'gte', 'actions.breakageReportData.data.n.buckets.high'],
            ]);
        });

        it('holds no function outside the sources, and every kind of predicate', () => {
            const detectors = [
                { match: { ref: 'n', is: { gt: 0, lt: 8000, in: [1, { ref: 'm' }], eq: { ref: 'm' } } }, actions: REPORT },
                { match: { ref: 'n', is: { fails: false, type: ['number', 'string'], any: [1, 2] } }, actions: REPORT },
                { match: { ref: 'n', is: {} }, actions: REPORT },
                {
                    match: {
                        element: {
                            selector: 'img',
                            where: { complete: true, field: 'naturalWidth', is: 0, all: [{ self: 'alt', is: '' }] },
                        },
                        using: 'length',
                        is: { gte: 1 },
                    },
                    actions: REPORT,
                },
                {
                    actions: {
                        breakageReportData: {
                            data: {
                                n: {
                                    value: { ref: 'n' },
                                    when: { type: 'number' },
                                    buckets: { low: { lt: 5 }, high: { none: [{ lt: 5 }] } },
                                },
                            },
                        },
                    },
                },
            ];
            /** @type {string[]} */
            const functions = [];
            /** @type {Set<string>} */
            const kinds = new Set();
            /** @type {Set<object>} */
            const seen = new Set();
            /**
             * @param {unknown} value
             * @param {string} at
             */
            const visit = (value, at) => {
                if (typeof value === 'function') {
                    functions.push(at);
                    return;
                }
                if (typeof value !== 'object' || value === null || seen.has(value)) return;
                seen.add(value);
                const node = /** @type {Record<string, unknown>} */ (value);
                // Predicates carry `scalar`, which no expression node does
                if ('scalar' in node) {
                    kinds.add(String(node.kind));
                    expect(typeof node.path)
                        .withContext(at)
                        .toBe('string');
                }
                for (const [key, child] of Object.entries(node)) {
                    // A source node's `source` is the source's methods
                    if (key === 'source' && node.kind === 'source') continue;
                    visit(child, `${at}.${key}`);
                }
            };
            detectors.forEach((detector, i) => visit(compile(detector), `detectors.${i}`));
            expect(functions).toEqual([]);
            expect([...kinds].sort()).toEqual([
                'always',
                'combine',
                'compare',
                'expression',
                'fails',
                'guarded',
                'in',
                'read',
                'type',
                'where',
            ]);
        });
    });

    describe('using and expr', () => {
        const widths = IMG('data-width="1"') + IMG('data-width="2"');

        it('reads a path, or a body of path, args, where and field, from the value beside it', () => {
            const install = fonts(['loaded', 'error', 'error']);
            expect(holds('', { api: { path: 'document' }, using: 'fonts', is: { type: 'object' } }, { install })).toBe(true);
            const failed = { api: { path: 'document' }, using: { path: 'fonts', where: { status: 'error' } } };
            expect(
                holds('', { api: { path: 'document' }, using: { path: 'fonts', field: 'status' }, is: { length: 3 } }, { install }),
            ).toBe(true);
            expect(holds('', { expr: failed, using: 'length', is: 2 }, { install })).toBe(true);
            expect(
                holds(
                    widths,
                    { element: { selector: 'img', field: 'naturalWidth' }, using: { path: 'at', args: [-1] }, is: 2 },
                    { install: imageState },
                ),
            ).toBe(true);
        });

        it('applies `using`, then `is`', () => {
            expect(holds(widths, { element: { selector: 'img' }, using: 'length', is: { gte: 2 } })).toBe(true);
            expect(payload(widths, { element: { selector: 'img' }, using: 'length' })).toEqual({ x: 2 });
        });

        it('rejects `using` without an expression, without a path or with an unknown key, and `root` on `api`', () => {
            expectParseError({ match: { using: 'length', is: 1 }, actions: REPORT }, '`using` reads from an expression');
            expectParseError({ match: { element: { selector: 'img' }, using: {}, is: 1 }, actions: REPORT }, '`using` needs `path`');
            expectParseError(
                { match: { element: { selector: 'img' }, using: 1, is: 1 }, actions: REPORT },
                '`using` takes a path or an object',
            );
            expectParseError(
                { match: { element: { selector: 'img' }, using: { path: 'at', root: 'x' }, is: 1 }, actions: REPORT },
                "unknown key 'root'",
            );
            expectParseError(
                { match: { api: { root: { element: { selector: 'img' } }, path: 'length' }, is: 1 }, actions: REPORT },
                "unknown key 'root'",
            );
        });

        it('takes a second set of modifiers through `expr`', () => {
            expect(
                holds(widths, { expr: { element: { selector: 'img' }, using: 'length' }, using: { sum: [{ self: {} }, 1] }, is: 3 }),
            ).toBe(true);
        });

        it('gives the boolean an `is` inside `expr` gives', () => {
            const actions = { define: { enough: { expr: { element: { selector: 'img' }, using: 'length', is: { gte: 2 } } } } };
            expect(bound(widths, actions, 'enough')).toBe(true);
            expect(bound(IMG(), actions, 'enough')).toBe(false);
            expect(payload(widths, { expr: { element: { selector: 'img' }, using: 'length', is: { gte: 2 } } })).toEqual({ x: true });
            expectParseError(
                { match: { sum: [{ expr: { element: { selector: 'img' }, using: 'length', is: 1 } }], is: 1 }, actions: REPORT },
                "'expr' does not fill number",
            );
        });

        it('gives the boolean an `is` gives in value position', () => {
            const test = { element: { selector: 'img' }, using: 'length', is: { gte: 2 } };
            const detector = { actions: { fireEvent: { type: 't', data: { enough: { value: test } } } } };
            expect(run(widths, detector).data).toEqual({ enough: true });
            expect(run(IMG(), detector).data).toEqual({ enough: false });
            expect(payload(widths, { api: { path: 'String', args: [{ element: { selector: 'img' }, is: {} }] } })).toEqual({ x: 'true' });
        });

        it('gives its operand in its own position: a list operand of `sum`, and the condition leaf', () => {
            const sum = { sum: { expr: { element: { selector: 'img', field: 'naturalWidth' } } }, is: 3 };
            expect(holds(widths, sum, { install: imageState })).toBe(true);
            expect(holds(widths, { expr: { element: { selector: 'img' } } })).toBe(true);
            expect(holds('', { any: [{ expr: { element: { selector: 'img' } } }] })).toBe(false);
            expectParseError(
                { match: { expr: { element: { selector: 'img', field: 'naturalWidth' } } }, actions: REPORT },
                'does not fill boolean',
            );
        });

        it('gives a list of its entries values over an array', () => {
            expect(holds('', { sum: { expr: [1, 2] }, is: 3 })).toBe(true);
            expect(holds('', { sum: [{ expr: [1, 2] }, 3], is: 6 })).toBe(true);
            expect(holds('', { any: { expr: [false, true] } })).toBe(true);
            expect(holds('', { all: { expr: [true, false] } })).toBe(false);
            expect(holds('<title>x</title>', { any: { expr: [{ api: { path: 'document.title' }, is: 'x' }] } })).toBe(true);
            expect(holds('', { only: { expr: ['a'] }, is: 'a' })).toBe(true);
            expect(holds('', { only: { expr: [] }, is: 'a' })).toBe('error');
            expect(holds('', { expr: [1, 2, 3], using: 'length', is: 3 })).toBe(true);
            expect(holds('', { expr: [1, 2, 3], using: { path: 'at', args: [-1] }, is: 3 })).toBe(true);
            expect(holds('', { expr: [], is: { type: 'array' } })).toBe(true);
            // A selected list entry is an array of its items, as in `args`
            const nested = {
                expr: [{ element: { selector: 'img', field: 'naturalWidth' } }],
                using: { path: 'at', args: [0] },
                is: { length: 2 },
            };
            expect(holds(widths, nested, { install: imageState })).toBe(true);
            // A failed entry fails the list
            expect(holds('', { expr: [1, { api: { path: 'JSON.parse', args: ['{'] } }], using: 'length', is: 2 })).toBe('aborted');
            // Not a JSON scalar, so a payload omits it
            expect(payload('', { expr: [1] })).toEqual({});
            // A list stays one: it is not unwrapped to a number, nor read as a boolean
            expectParseError(withPayload({ div: [{ expr: [6] }, 2] }), "'list' does not fill number position");
            expectParseError({ match: { expr: [true] }, actions: REPORT }, "'list' does not fill boolean position");
        });
    });

    describe('api', () => {
        it('takes a path as short for a body with that path', () => {
            const head = '<title>Hello there</title>';
            expect(holds('', { api: 'document.title', is: 'Hello there' }, { head })).toBe(true);
            expect(holds('', { api: { path: 'Math.max', args: [1, { api: 'document.title.length' }] }, is: 11 }, { head })).toBe(true);
            expect(holds('', { api: 'document.title', using: 'length', is: 11 }, { head })).toBe(true);
            expectParseError({ match: { api: 5 }, actions: REPORT }, '`api` takes a path or an object');
            expectParseError({ match: { api: '' }, actions: REPORT }, 'non-empty');
        });

        it('gives a scalar path its value, and a string is not a list', () => {
            const head = '<title>Hello there</title>';
            expect(holds('', { api: { path: 'document.title' }, is: 'Hello there' }, { head })).toBe(true);
            expect(holds('', { only: { api: { path: 'document.title' } }, is: 'Hello there' }, { head })).toBe('error');
            expect(holds('', { api: { path: 'document.title' }, using: 'length', is: 11 }, { head })).toBe(true);
        });

        it('gives an iterable as a value under is and using, and as a list under only and with field', () => {
            const install = fonts(['loaded', 'error']);
            expect(holds('', { api: { path: 'document.fonts' }, is: { type: 'object' } }, { install })).toBe(true);
            expect(holds('', { api: { path: 'document.fonts', field: 'status' }, using: 'length', is: 2 }, { install })).toBe(true);
            expect(holds('', { api: { path: 'document.fonts' }, using: 'size', is: 2 }, { install })).toBe(true);
            // `length` reads the iterable's own property, which a `FontFaceSet` lacks
            expect(holds('', { api: { path: 'document.fonts' }, using: 'length', is: { type: 'undefined' } }, { install })).toBe(true);
        });

        it('reads field from each member of a list, and from a value that is not one', () => {
            const install = fonts(['loaded', 'error']);
            expect(
                holds(
                    '',
                    { api: { path: 'document.fonts', field: 'status' }, using: { path: 'at', args: [-1] }, is: 'error' },
                    { install },
                ),
            ).toBe(true);
            expect(holds('', { api: { path: 'document', field: 'title.length' }, is: 0 })).toBe(true);
        });

        it('reads a path from root', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900, responseStatus: 200 }]);
            const actions = [
                { define: { navigation: { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'] } } } } },
                {
                    define: {
                        read: {
                            all: [
                                { ref: 'navigation', using: 'loadEventEnd', is: 900 },
                                { ref: 'navigation', using: 'responseStatus', is: 200 },
                            ],
                        },
                    },
                },
            ];
            expect(bound('', actions, 'read', { install })).toBe(true);
            const ids = '<p id="a"></p><p id="b"></p>';
            expect(holds(ids, { element: { selector: 'p', field: 'id' }, using: { path: 'at', args: [-1] }, is: 'b' })).toBe(true);
            expect(holds(ids, { element: { selector: 'p' }, using: 'length', is: 2 })).toBe(true);
        });

        it('yields the members of an iterable', () => {
            expect(
                holds(
                    '',
                    { api: { path: 'document.fonts', field: 'status' }, using: 'length', is: 3 },
                    { install: fonts(['loaded', 'error', 'error']) },
                ),
            ).toBe(true);
            expect(
                holds(
                    '',
                    { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length', is: 2 },
                    { install: fonts(['loaded', 'error', 'error']) },
                ),
            ).toBe(true);
            expect(holds('<p></p><p></p>', { api: { path: 'document.body.children' }, using: 'length', is: 2 })).toBe(true);
        });

        it('reads undefined through null', () => {
            expect(holds('', { api: { path: 'document.activeElementNope' }, using: 'length', is: { type: 'undefined' } })).toBe(true);
            expect(
                holds(
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
            expect(holds('', { api: { path: 'document.myValue' }, is: 3 }, { afterCapture: definesValue })).toBe(true);
            // On body rather than document, whose event methods JSDOM still needs after the run
            const substitutes = (/** @type {any} */ w) => {
                Object.setPrototypeOf(w.document.body, { tagName: 'FAKE' });
            };
            expect(holds('', { api: { path: 'document.body.tagName' }, is: 'FAKE' }, { afterCapture: substitutes })).toBe(true);
        });

        it('reads a data value and a captured getter', () => {
            const definesValue = (/** @type {any} */ w) => {
                w.myData = { count: 3 };
            };
            expect(holds('', { api: { path: 'myData.count' }, is: 3 }, { afterCapture: definesValue })).toBe(true);
            expect(holds('', { api: { path: 'document.title' }, is: '' })).toBe(true);
            expect(holds('<p id="a"></p>', { only: { element: { selector: 'p' } }, is: { id: 'a' } })).toBe(true);
        });

        it('reads a getter defined on the object itself, where nothing was captured', () => {
            // A getter on the instance, as browsers define `location.href`
            const install = (/** @type {any} */ w) => {
                const location = {};
                Object.defineProperty(location, 'href', { get: () => 'https://example.com/', enumerable: true });
                Object.defineProperty(w, 'fakeLocation', { get: () => location });
            };
            expect(holds('', { api: { path: 'fakeLocation.href' }, is: 'https://example.com/' }, { install })).toBe(true);
        });

        /**
         * Two captured classes whose `label` getters differ, a class between them and an item, and an
         * item of the second class.
         *
         * @param {any} w
         */
        const labelled = (w) => {
            w.LabelOne = class {
                get label() {
                    return 'one';
                }
            };
            w.LabelTwo = class {
                get label() {
                    return 'two';
                }
            };
            w.LabelMiddle = class extends w.LabelOne {};
            w.LabelLeaf = class extends w.LabelMiddle {};
            w.labelItems = [new w.LabelLeaf(), new w.LabelTwo(), new w.LabelLeaf()];
        };

        it('reads each item through its own chain', () => {
            const detector = { api: { path: 'labelItems', where: { label: 'two' } }, using: 'length', is: 1 };
            expect(holds('', detector, { install: labelled })).toBe(true);
        });

        it('reads through a chain the page changes between runs of one reader', () => {
            const window = new JSDOM('<!DOCTYPE html><html><body></body></html>').window;
            labelled(window);
            const compiled = compileDetector(
                { actions: { define: { label: { api: { path: 'labelItems.0.label' } } } } },
                pageSources(window),
            );
            const reader = new NativeReader(window, compiled.names);
            const label = () => {
                const state = createDetectorState();
                const ctx = new EvaluationContext(reader, state.names, state);
                runDetector(compiled, state, ctx);
                return ctx.runNames.get('label');
            };
            expect(label()).toBe('one');
            Object.setPrototypeOf(window.LabelMiddle.prototype, window.LabelTwo.prototype);
            expect(label()).toBe('two');
        });

        it('fails when a page Proxy throws on a read', () => {
            const afterCapture = (/** @type {any} */ w) => {
                w.trapped = new Proxy(
                    {},
                    {
                        get: () => {
                            throw new w.TypeError('trapped');
                        },
                    },
                );
            };
            expect(holds('', { api: { path: 'trapped.anything' }, is: { fails: true } }, { afterCapture })).toBe(true);
        });

        it('skips a global whose descriptor read throws, and captures from the rest', () => {
            // As a cross-origin frame's WindowProxy, reached as `window[0]`, throws on every read
            const install = (/** @type {any} */ w) => {
                const blocked = () => {
                    throw new w.DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError');
                };
                w.crossOriginFrame = new Proxy({}, { getOwnPropertyDescriptor: blocked });
                w.TrappedConstructor = new Proxy(function () {}, {
                    getOwnPropertyDescriptor: (target, key) =>
                        key === 'prototype' ? blocked() : Reflect.getOwnPropertyDescriptor(target, key),
                });
            };
            const afterCapture = (/** @type {any} */ w) => {
                Object.defineProperty(w.Document.prototype, 'title', { configurable: true, get: () => 'page override' });
            };
            expect(holds('', { api: { path: 'document.title' }, is: '' }, { install })).toBe(true);
            expect(holds('', { api: { path: 'document.title' }, is: '' }, { install, afterCapture })).toBe(true);
        });

        it('does not call a page override of iteration', () => {
            const afterCapture = (/** @type {any} */ w) => {
                w.FakeFontFaceSet.prototype[Symbol.iterator] = () => {
                    throw new Error('page override called');
                };
            };
            expect(
                holds(
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
            const result = run('', { match: { api: { path: 'document.cookie' }, is: { type: 'string' } }, actions: REPORT }, { install });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('Error');
            expect(holds('', { api: { path: 'document.cookie' }, is: { fails: true } }, { install })).toBe(true);
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
            expect(holds('', read, { install, afterCapture })).toBe(true);
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
                holds(
                    '',
                    { ...resources({ duration: { gt: 1000 }, initiatorType: { in: ['img', 'css'] } }), using: 'length', is: 1 },
                    { install },
                ),
            ).toBe(true);
            expect(holds('', { ...resources({ responseStatus: { gte: 400 } }), using: 'length', is: 0 }, { install })).toBe(true);
        });

        it('errors on `where` over a value that is not a list, or an item that is not an object', () => {
            expect(holds('', { api: { path: 'document.title', where: { length: 0 } }, using: 'length', is: 1 })).toBe('error');
            const install = (/** @type {any} */ w) => {
                w.myList = ['a', 'b'];
            };
            expect(holds('', { api: { path: 'myList', where: { length: 1 } }, using: 'length', is: 2 }, { afterCapture: install })).toBe(
                'error',
            );
        });
    });

    describe('arguments', () => {
        const html = IMG('data-width="3"') + IMG('data-width="9"');
        const widths = { element: { selector: 'img', field: 'naturalWidth' } };
        const options = { install: imageState };

        it('takes the largest and smallest item through Math.max.apply and Math.min.apply', () => {
            expect(holds(html, { api: { path: 'Math.max.apply', args: [null, widths] }, is: 9 }, options)).toBe(true);
            expect(holds(html, { api: { path: 'Math.min.apply', args: [null, widths] }, is: 3 }, options)).toBe(true);
            expect(
                holds(
                    '',
                    { api: { path: 'Math.max.apply', args: [null, widths] }, is: { ...numberTest('isFinite', false), lt: 0 } },
                    options,
                ),
            ).toBe(true);
            expect(holds('', { api: { path: 'Math.max.apply', args: [null, { api: { path: 'undefined' } }] }, is: { lt: 0 } })).toBe(true);
        });

        it('extends and joins lists through concat', () => {
            const extended = { ...widths, using: { path: 'concat', args: [100] } };
            expect(holds(html, { api: { path: 'Math.max.apply', args: [null, extended] }, is: 100 }, options)).toBe(true);
            const leading = { api: { path: 'Array.prototype.concat.call', args: [{ expr: [100] }, widths] } };
            expect(holds(html, { ...leading, using: { path: 'at', args: [0] }, is: 100 }, options)).toBe(true);
            expect(holds(html, { ...leading, using: 'length', is: 3 }, options)).toBe(true);
        });

        it('builds arrays from literals and expressions, inner arrays through expr', () => {
            const built = {
                api: { path: 'Array.of', args: [{ expr: [1, { element: { selector: 'img' }, using: 'length' }] }, 'x', null] },
            };
            expect(holds(html, { api: { path: 'JSON.stringify', args: [built] }, is: '[[1,2],"x",null]' })).toBe(true);
            expectParseError(
                { match: { api: { path: 'Array.of', args: [[1]] }, is: {} }, actions: REPORT },
                'an array is not an expression',
            );
        });

        it('passes a selected list as a new array, so a method changing it leaves the list', () => {
            expect(holds(html, { api: { path: 'Array.isArray', args: [widths] }, is: true }, options)).toBe(true);
            const actions = [
                { define: { widths } },
                { define: { reversed: { api: { path: 'Array.prototype.reverse.call', args: [{ ref: 'widths' }] } } } },
                { define: { first: { ref: 'widths', using: { path: 'at', args: [0] } } } },
            ];
            expect(bound(html, actions, 'first', options)).toBe(3);
        });

        it('builds objects through JSON.parse and Object.fromEntries', () => {
            expect(holds('', { api: { path: 'JSON.parse', args: ['{"a": 5}'], field: 'a' }, is: 5 })).toBe(true);
            const entries = [{ expr: [{ expr: ['images', { element: { selector: 'img' }, using: 'length' }] }] }];
            expect(holds(html, { api: { path: 'Object.fromEntries', args: entries, field: 'images' }, is: 2 })).toBe(true);
        });

        it('reads undefined through api', () => {
            expect(holds('', { api: { path: 'undefined' }, is: { type: 'undefined' } })).toBe(true);
        });

        it('takes expressions in field args', () => {
            const id = { api: { path: 'String', args: ['id'] } };
            expect(
                holds('<p id="a"></p>', { only: { element: { selector: 'p', field: { path: 'getAttribute', args: [id] } } }, is: 'a' }),
            ).toBe(true);
        });

        it('fails when an argument fails', () => {
            const failed = run('', { match: { api: { path: 'Array.of', args: [FAILING] }, is: {} }, actions: REPORT });
            expect(failed.detected).toBe('aborted');
            expect(failed.abortError).toBe('SyntaxError');
            expect(holds('', { api: { path: 'Math.max', args: [7] }, is: 7 })).toBe(true);
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
                const result = run('', { match: { api, is: {} }, actions: REPORT }, options);
                expect(result.detected).withContext(name).toBe('aborted');
                expect(result.abortError).withContext(name).toBe(name);
                expect(holds('', { api, is: { fails: true } }, options))
                    .withContext(name)
                    .toBe(true);
            }
        });

        it('rejects entries that are not literals, expressions or arrays', () => {
            expectParseError(
                { match: { api: { path: 'Array.of', args: [{ composed: true }] }, is: {} }, actions: REPORT },
                "unknown expression key 'composed'",
            );
        });
    });

    describe('root', () => {
        const html = '<div id="comments"><img src="a.png"><p>hello</p></div><img src="b.png"><p>hello</p>';

        it('scopes element and text in every position', () => {
            expect(holds(html, { element: { selector: 'img', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(holds(html, { text: { pattern: 'hello', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(holds(html, { text: { selector: 'p', pattern: 'hello', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(holds(html, { text: { xpath: './/text()', pattern: 'hello', root: '#comments' }, using: 'length', is: 1 })).toBe(true);
            expect(holds(html, { element: { selector: 'img', root: '#comments' } })).toBe(true);
            expect(holds(html, { only: { element: { selector: 'img', field: 'tagName', root: '#comments' } }, is: 'IMG' })).toBe(true);
        });

        it('scopes element and text by an expression giving a node or a list of nodes', () => {
            const guarded = (/** @type {object} */ scoped) => [
                { define: { comments: { element: { selector: '#comments' } } } },
                { define: { held: { all: [{ ref: 'comments' }, scoped] } } },
            ];
            expect(bound(html, guarded({ element: { selector: 'img', root: { ref: 'comments' } }, using: 'length', is: 1 }), 'held')).toBe(
                true,
            );
            expect(bound(html, guarded({ text: { pattern: 'hello', root: { ref: 'comments' } }, using: 'length', is: 1 }), 'held')).toBe(
                true,
            );
            expect(
                bound('<img>', guarded({ element: { selector: 'img', root: { ref: 'comments' } }, using: 'length', is: 0 }), 'held'),
            ).toBe(false);
            expect(
                holds(html, {
                    element: { selector: 'img', root: { only: { element: { selector: '#comments' } } } },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
            expect(holds(html, { element: { selector: 'img', root: { api: { path: 'document.body' } } }, using: 'length', is: 2 })).toBe(
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
                holds(
                    '<x-widget></x-widget><img>',
                    { element: { selector: 'img', root: shadow }, using: 'length', is: 2 },
                    { afterCapture },
                ),
            ).toBe(true);
            expect(holds('<x-widget></x-widget><img>', { element: { selector: 'img', root: shadow }, using: 'length', is: 0 })).toBe(true);
        });

        it('errors on a root that is not a selector or a node', () => {
            expect(
                holds('<p></p>', { element: { selector: 'p', root: { api: { path: 'document.title.length' } } }, using: 'length', is: 0 }),
            ).toBe('error');
            expect(holds('<p></p>', { element: { selector: 'p', root: [1] }, using: 'length', is: 0 })).toBe('error');
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
            expectParseError(withPayload(scoped([['#a']])), 'an array is not an expression');
        });

        it('drops a root inside another', () => {
            const nested = '<div class="r"><div class="r"><img></div></div>';
            expect(holds(nested, { element: { selector: 'img', root: '.r' }, using: 'length', is: 1 })).toBe(true);
        });

        it('drops a root inside a later entry', () => {
            const html = '<div id="a"><img>x</div><img>x';
            const roots = ['#a', { api: { path: 'document.body' } }];
            expect(holds(html, { element: { selector: 'img', root: roots }, using: 'length', is: 2 })).toBe(true);
            expect(holds(html, { text: { pattern: 'x', root: roots }, using: 'length', is: 2 })).toBe(true);
        });

        it('selects no items when root matches nothing', () => {
            expect(holds(html, { element: { selector: 'img', root: '#missing' }, using: 'length', is: 0 })).toBe(true);
            expect(holds(html, { text: { pattern: 'hello', root: '#missing' } })).toBe(false);
        });
    });

    describe('field', () => {
        it('reads a path of several names, and length on a string, an array and a DOM collection', () => {
            const html = '<select><option>a</option><option>b</option></select>';
            expect(holds(html, { only: { element: { selector: 'select', field: 'options.length' } }, is: 2 })).toBe(true);
            expect(holds(html, { only: { element: { selector: 'select', field: 'tagName.length' } }, is: 6 })).toBe(true);
            const install = timeline([{ name: 'n', entryType: 'navigation', list: [1, 2, 3] }]);
            expect(
                holds(
                    '',
                    { only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'list.length' } }, is: 3 },
                    { install },
                ),
            ).toBe(true);
        });

        it('gives undefined for a name after null or undefined, in field and in a property path', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', nothing: null }]);
            const nav = { path: 'performance.getEntriesByType', args: ['navigation'] };
            expect(holds('', { only: { api: { ...nav, field: 'nothing.length' } }, is: { type: 'undefined' } }, { install })).toBe(true);
            expect(
                holds('', { api: { ...nav, where: { 'nothing.length': { type: 'undefined' } } }, using: 'length', is: 1 }, { install }),
            ).toBe(true);
        });

        it('calls the captured native method, and fails with threw when it throws', () => {
            const html = '<div role="main"></div>';
            const afterCapture = (/** @type {any} */ w) => {
                w.Element.prototype.getAttribute = () => 'evil';
            };
            expect(
                holds(
                    html,
                    { only: { element: { selector: 'div', field: { path: 'getAttribute', args: ['role'] } } }, is: 'main' },
                    { afterCapture },
                ),
            ).toBe(true);
            expect(holds(html, { only: { element: { selector: 'div', field: { path: 'querySelector', args: ['::::'] } } }, is: {} })).toBe(
                'aborted',
            );
        });

        it('counts words with matchAll, and none in an empty or whitespace-only string', () => {
            const words = {
                api: { path: 'Array.from', args: [{ api: { path: 'document.title.matchAll', args: ['\\S+'] } }] },
                using: 'length',
            };
            expect(holds('', { ...words, is: 3 }, { head: '<title>Hello   there\tworld</title>' })).toBe(true);
            expect(holds('', { ...words, is: 0 }, { head: '<title></title>' })).toBe(true);
            expect(holds('', { ...words, is: 0 }, { head: '<title>   </title>' })).toBe(true);
        });

        it('counts rendered text as non-whitespace matches, excluding script, style, template and noscript', () => {
            const html =
                '<div id="r">ab c<script>xxxx</script><style>yy</style><template>zz</template><noscript>ww</noscript><span>d</span></div>';
            expect(holds(html, { text: { xpath: RENDERED, pattern: '\\S' }, using: 'length', is: 4 })).toBe(true);
            expect(holds(html, { ...renderedText('#r'), using: 'length', is: 4 })).toBe(true);
            expect(holds(html, { ...renderedText('span'), using: 'length', is: 1 })).toBe(true);
        });

        it('counts rendered text per item, through root self in field and where', () => {
            const html = '<p class="i">ab c</p><p class="i"> </p><p class="i"><script>x</script></p>';
            expect(
                holds(html, { sum: { element: { selector: '.i', field: { ...renderedText({ self: {} }), using: 'length' } } }, is: 3 }),
            ).toBe(true);
            expect(holds(html, { element: { selector: '.i', where: { none: renderedText({ self: {} }) } }, using: 'length', is: 2 })).toBe(
                true,
            );
        });

        it('counts text inside two selected items in both', () => {
            const html = '<div class="c">ab<div class="c">cd</div></div>';
            const count = { ...renderedText({ self: {} }), using: 'length' };
            expect(holds(html, { sum: { element: { selector: '.c', field: count } }, is: 6 })).toBe(true);
            expect(holds(html, { sum: { element: { selector: '.c:not(.c .c)', field: count } }, is: 4 })).toBe(true);
            expect(holds(html, { ...renderedText('.c'), using: 'length', is: 4 })).toBe(true);
        });

        it('counts text matches through the count shortcut as the iterator yields them', () => {
            const html = '<span>abc de</span>'.repeat(50) + '<p>ab<b>c d</b>e</p>';
            const joined = 'abc de'.repeat(50) + 'abc de';
            for (const pattern of ['\\S', 'c d', '\\bde\\b', 'e ?a']) {
                const expected = joined.match(new RegExp(pattern, 'gi'))?.length ?? 0;
                for (const xpathConfig of [{ chunkSize: 7, chunkTail: 3 }, { chunkSize: 0 }]) {
                    const text = { text: { xpath: RENDERED, pattern, xpathConfig } };
                    // `using: "length"` counts through the shortcut, and a property path reads the items
                    expect(holds(html, { ...text, using: 'length', is: expected })).toBe(true);
                    expect(holds(html, { ...text, is: { length: expected } })).toBe(true);
                }
                // Each selected element is matched on its own
                const perElement = 51 * ('abc de'.match(new RegExp(pattern, 'gi'))?.length ?? 0);
                expect(holds(html, { text: { selector: ['span', 'p'], pattern }, using: 'length', is: perElement })).toBe(true);
                expect(holds(html, { text: { selector: ['span', 'p'], pattern }, is: { length: perElement } })).toBe(true);
            }
            expect(holds(html, { text: { xpath: RENDERED, pattern: '\\S' }, using: 'length', is: { lt: 10 } })).toBe(false);
        });

        it('counts no rendered text in a root matching nothing', () => {
            expect(holds('<p>ab</p>', { ...renderedText('#comments'), using: 'length', is: 0 })).toBe(true);
        });

        it('counts rendered text across XPath chunk boundaries once', () => {
            const html = '<span>abc de</span>'.repeat(50);
            for (const xpathConfig of [{ chunkSize: 7, chunkTail: 2 }, { chunkSize: 4, chunkTail: 0 }, { chunkSize: 0 }]) {
                expect(holds(html, { text: { xpath: RENDERED, pattern: '\\S', xpathConfig }, using: 'length', is: 250 })).toBe(true);
            }
        });

        it('takes an expression, with self the value it reads from', () => {
            const head = '<title>Hello   there world</title>';
            expect(
                holds(
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
                holds('<p></p>', {
                    only: { element: { selector: 'p', field: { api: { path: 'String', args: [{ self: 'tagName' }] } } } },
                    is: 'P',
                }),
            ).toBe(true);
            expect(
                holds('<p p="x"></p>', {
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
            expect(holds('', { ...resources({ duration: numberTest('isFinite') }), is: 1 }, { install })).toBe(true);
            expect(
                holds(
                    '',
                    { ...resources({ field: { api: { path: 'Number.isNaN', args: [{ self: 'duration' }] } }, is: true }), is: 1 },
                    { install },
                ),
            ).toBe(true);
            expect(holds('', { ...resources({ duration: { ...numberTest('isFinite', false), gt: 0 } }), is: 1 }, { install })).toBe(true);
            expect(holds('', { ...resources({ duration: { eq: { api: 'Infinity' } } }), is: 1 }, { install })).toBe(true);
            expect(
                holds(
                    '',
                    { ...resources({ duration: { all: [numberTest('isNaN', false), numberTest('isFinite', false)] } }), is: 1 },
                    { install },
                ),
            ).toBe(true);
        });

        it('passes further arguments beside self', () => {
            const html = IMG('data-complete data-width="3"') + IMG('data-complete data-width="9"');
            const clamp = { api: { path: 'Math.min', args: [{ self: 'naturalWidth' }, 5] } };
            expect(holds(html, { sum: { element: { selector: 'img', field: clamp } }, is: 8 }, { install: imageState })).toBe(true);
        });

        it('calls the function captured at init', () => {
            // JSDOM shares the JS builtins of this realm, so the override is undone after the run
            const original = Number.isFinite;
            const afterCapture = (/** @type {any} */ w) => {
                w.Number.isFinite = () => true;
            };
            try {
                expect(holds('', { div: [1, 0], is: numberTest('isFinite') }, { afterCapture })).toBe(false);
            } finally {
                Number.isFinite = original;
            }
        });

        it('fails when the call throws, and on a name that is not a function', () => {
            const result = run('', {
                match: { sum: [1.5], is: { field: { api: { path: 'BigInt', args: [{ self: {} }] } }, is: {} } },
                actions: REPORT,
            });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('RangeError');
            const missing = run('', {
                match: { sum: [1], is: { field: { api: { path: 'Math', args: [{ self: {} }] } }, is: {} } },
                actions: REPORT,
            });
            expect(missing.detected).toBe('aborted');
            expect(missing.abortError).toBe('TypeError');
        });

        it('rejects malformed fields', () => {
            expectParseError(
                { match: { only: { element: { selector: 'p', field: {} } }, is: {} }, actions: REPORT },
                '`field` needs `path`',
            );
            expectParseError(
                { match: { only: { element: { selector: 'p', field: { calls: 1 } } }, is: {} }, actions: REPORT },
                "unknown key 'calls'",
            );
            expectParseError(
                { match: { only: { element: { selector: 'p', field: { call: { api: 'String' } } } }, is: {} }, actions: REPORT },
                "unknown key 'call'",
            );
            expectParseError(
                { match: { only: { element: { selector: 'p', field: { args: [] } } }, is: {} }, actions: REPORT },
                '`args` needs `path`',
            );
            expectParseError(
                { match: { only: { element: { selector: 'p', field: { feature: 'renderedTextLength' } } }, is: {} }, actions: REPORT },
                "unknown key 'feature'",
            );
        });
    });

    describe('self', () => {
        it('reads the value beside using: a value, a list, its length and the value itself', () => {
            const head = '<title>Hello there</title>';
            expect(holds('', { api: 'document.title', using: { self: {} }, is: 'Hello there' }, { head })).toBe(true);
            expect(holds('', { api: 'document.title', using: { self: 'length' }, is: 11 }, { head })).toBe(true);
            expect(holds('<p></p><p></p>', { element: { selector: 'p' }, using: { self: 'length' }, is: 2 })).toBe(true);
            const html = IMG('data-complete data-width="3"') + IMG('data-complete data-width="9"');
            expect(
                holds(
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
            expect(holds('', { ...ratio, is: 0.25 }, { install })).toBe(true);
            expect(bound('', { define: { ratio } }, 'ratio', { install })).toBe(0.25);
        });

        it('reads each item in where, an inherited property included', () => {
            const items = { path: 'JSON.parse', args: ['[{"a":1},{"b":2},{"a":3}]'] };
            const has = (/** @type {string} */ name) => ({ field: { api: { path: 'Reflect.has', args: [{ self: {} }, name] } }, is: true });
            expect(holds('', { api: { ...items, where: has('a') }, using: 'length', is: 2 })).toBe(true);
            expect(holds('<p></p><p></p>', { element: { selector: 'p', where: has('tagName') }, using: 'length', is: 2 })).toBe(true);
            expect(holds('<p></p><p></p>', { element: { selector: 'p', where: has('noSuchProperty') }, using: 'length', is: 0 })).toBe(
                true,
            );
        });

        it('compares two fields of one item', () => {
            const items = { path: 'JSON.parse', args: ['[{"s":1,"e":5},{"s":4,"e":5}]'] };
            expect(holds('', { api: { ...items, where: { e: { gt: { sum: [{ self: 's' }, 2] } } } }, using: 'length', is: 1 })).toBe(true);
        });

        it('binds self in a nested where to the inner item, and in a field under a key to that value', () => {
            const outer = { path: 'JSON.parse', args: ['[{"n":0,"xs":[{"n":1,"v":2},{"n":3,"v":2}]}]'] };
            const field = { self: { path: 'xs', where: { v: { gt: { self: 'n' } } } } };
            expect(holds('', { only: { api: { ...outer, field } }, using: 'length', is: 1 })).toBe(true);
            const items = { path: 'JSON.parse', args: ['[{"nested":{"x":3}},{"nested":{"x":4}}]'] };
            expect(holds('', { api: { ...items, where: { nested: { field: { self: 'x' }, is: 3 } } }, using: 'length', is: 1 })).toBe(true);
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
            expect(holds(html, { element: { selector: 'p', where: probe }, using: 'length', is: 2 }, { install })).toBe(true);
            expect(calls).toBe(3);
            const threshold = { 'textContent.length': { gt: { api: 'threshold' } } };
            expect(holds(html, { element: { selector: 'p', where: threshold }, using: 'length', is: 2 }, { install })).toBe(true);
            expect(reads).toBe(1);
        });

        it('reads a list inside another where, its own self its own item', () => {
            const values = {
                api: { path: 'JSON.parse', args: ['[{"v":1,"w":0},{"v":5,"w":9}]'], where: { v: { gt: { self: 'w' } } }, field: 'v' },
            };
            expect(
                holds('<p>a</p><p>b</p><p>cc</p>', {
                    element: { selector: 'p', where: { 'textContent.length': { lte: { sum: values } } } },
                    using: 'length',
                    is: 2,
                }),
            ).toBe(true);
        });

        it('rejects self outside a binder, and `using` without a path or an expression', () => {
            expectParseError({ match: { self: 'x' }, actions: REPORT }, '`self` reads from `using`, `where` or `field`');
            expectParseError(withPayload({ self: {} }), '`self` reads from');
            expectParseError({ match: { api: 'document', using: {}, is: {} }, actions: REPORT }, '`using` needs `path` or an expression');
        });
    });

    describe('expressions in where', () => {
        const items = { path: 'JSON.parse', args: ['[{"a":1,"b":0},{"a":2,"b":5},{"a":3,"b":0}]'] };

        it('tests each item with a boolean expression over self', () => {
            const has = (/** @type {string} */ name) => ({ api: { path: 'Reflect.has', args: [{ self: {} }, name] } });
            const sparse = { path: 'JSON.parse', args: ['[{"a":1},{"b":2},{"a":3}]'] };
            expect(holds('', { api: { ...sparse, where: has('a') }, using: 'length', is: 2 })).toBe(true);
            expect(holds('<p></p><p></p>', { element: { selector: 'p', where: has('noSuchProperty') }, using: 'length', is: 0 })).toBe(
                true,
            );
        });

        it('mixes expressions and predicates under any, all and none', () => {
            const countIs = (/** @type {unknown} */ where, /** @type {number} */ n) =>
                holds('', { api: { ...items, where }, using: 'length', is: n });
            expect(countIs({ self: 'b', is: { gt: 1 } }, 1)).toBe(true);
            expect(countIs({ any: [{ self: 'b', is: { gt: 1 } }, { a: 1 }] }, 2)).toBe(true);
            expect(countIs({ any: [{ self: 'b', is: 5 }, { a: 3 }] }, 2)).toBe(true);
            expect(countIs({ all: [{ a: { gt: 1 } }, { self: 'b', is: 0 }] }, 1)).toBe(true);
            expect(countIs({ none: [{ self: 'b', is: 0 }], a: { gt: 0 } }, 1)).toBe(true);
        });

        it('scopes a source to the item', () => {
            const html = '<div class="card"><img></div><div class="card"></div><div class="card"><p><img></p></div>';
            const withImage = { element: { selector: 'img', root: { self: {} } } };
            expect(holds(html, { element: { selector: '.card', where: withImage }, using: 'length', is: 2 })).toBe(true);
            const twoParagraphs = { element: { selector: 'p', root: { self: {} } }, using: 'length', is: { gte: 2 } };
            expect(
                holds('<div><p></p><p></p></div><div><p></p></div>', {
                    element: { selector: 'div', where: twoParagraphs },
                    using: 'length',
                    is: 1,
                }),
            ).toBe(true);
        });

        it('reads an expression reading no self once per evaluation of the source', () => {
            let reads = 0;
            const install = (/** @type {any} */ w) => {
                Object.defineProperty(w, 'flag', {
                    get() {
                        reads++;
                        return true;
                    },
                });
            };
            const count = { element: { selector: 'p', where: { api: 'flag' } }, using: 'length', is: 3 };
            expect(holds('<p></p><p></p><p></p>', count, { install })).toBe(true);
            expect(reads).toBe(1);
            expect(holds('<p></p><p></p><p></p>', { all: [count, count] }, { install })).toBe(true);
            expect(reads).toBe(3);
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
            expect(holds('', { api: { path: 'things', where: { self: 'v', is: 1 } }, using: 'length', is: 2 }, { install })).toBe(
                'aborted',
            );
            const readable = { api: { path: 'things', where: { self: 'v', is: { fails: false, eq: 1 } } }, using: 'length', is: 2 };
            expect(holds('', readable, { install })).toBe(true);
        });

        it('reads a property named like an expression key through the long form', () => {
            const html = '<select><option>Sign in</option><option>Other</option></select>';
            const count = (/** @type {unknown} */ where) =>
                holds(html, { element: { selector: 'option', visibility: 'any', where }, using: 'length', is: 1 });
            expect(count({ field: 'text', is: 'Sign in' })).toBe(true);
            expect(count({ self: 'text', is: 'Sign in' })).toBe(true);
            expectParseError({ match: { element: { selector: 'option', where: { text: 'Sign in' } } }, actions: REPORT });
        });

        it('rejects an object mixing expression keys and property paths', () => {
            expectParseError(
                { match: { api: { ...items, where: { self: 'a', is: 1, b: 0 } }, using: 'length', is: 1 }, actions: REPORT },
                "unknown expression key 'b'",
            );
        });
    });

    describe('the five detectors', () => {
        it('reports a broken image count and share', () => {
            const brokenImages = { element: BROKEN, using: 'length' };
            const detector = {
                match: { ...brokenImages, is: { gte: 1 } },
                actions: [
                    {
                        define: {
                            brokenImages,
                            brokenShare: { div: [{ ref: 'brokenImages' }, { element: { selector: 'img' }, using: 'length' }] },
                        },
                    },
                    {
                        breakageReportData: {
                            data: { brokenImages: { value: { ref: 'brokenImages' } }, brokenShare: { value: { ref: 'brokenShare' } } },
                        },
                    },
                    {
                        if: { ref: 'brokenImages', is: 1 },
                        then: { fireEvent: { type: 'brokenImages_count1' } },
                        else: {
                            if: { ref: 'brokenImages', is: { lt: 5 } },
                            then: { fireEvent: { type: 'brokenImages_count2to4' } },
                            else: { fireEvent: { type: 'brokenImages_count5Plus' } },
                        },
                    },
                ],
            };
            const html = IMG('data-complete') + IMG('data-complete') + IMG('data-complete data-width="4"') + '<img data-complete>';
            const result = run(html, detector, { install: imageState });
            expect(result.detected).toBe(true);
            expect(result.ctx.events).toEqual([{ type: 'brokenImages_count2to4' }]);
            expect(result.ctx.entry.data).toEqual({ brokenImages: 2, brokenShare: 0.5 });
        });

        it('reports a slow page load once, refreshing its breakage data on every run until the load ends', () => {
            const slowLoad = {
                actions: {
                    if: { none: [{ ref: 'this.finished', is: true }] },
                    then: [
                        {
                            define: {
                                loadEventEnd: {
                                    only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'loadEventEnd' } },
                                },
                                elapsed: { api: { path: 'performance.now', args: [] } },
                            },
                        },
                        { breakageReportData: { data: { loadEventEnd: { value: { ref: 'loadEventEnd' } } } } },
                        {
                            if: {
                                all: [
                                    {
                                        any: [
                                            { ref: 'loadEventEnd', is: { gte: 8000 } },
                                            { ref: 'elapsed', is: { gte: 15000 } },
                                        ],
                                    },
                                    { none: [{ ref: 'this.sent', is: true }] },
                                ],
                            },
                            then: [
                                {
                                    if: { ref: 'loadEventEnd', is: 0 },
                                    then: { fireEvent: { type: 'pageLoadTime_loadLoading' } },
                                    else: { fireEvent: { type: 'pageLoadTime_load8sPlus' } },
                                },
                                { define: { 'this.sent': true } },
                            ],
                        },
                        { define: { 'this.finished': { ref: 'loadEventEnd', is: { gt: 0 } } } },
                    ],
                },
            };
            const slow = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 9000 }]) });
            expect(slow.ctx.events).toEqual([{ type: 'pageLoadTime_load8sPlus' }]);
            expect(slow.ctx.detectorNames.get('this.finished')).toBe(true);
            const fast = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900 }]) });
            expect(fast.ctx.events).toEqual([]);
            expect(fast.ctx.entry.data).toEqual({ loadEventEnd: 900 });
            const stillLoading = run('', slowLoad, {
                install: (w) => {
                    timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 0 }])(w);
                    Object.defineProperty(w.Performance.prototype, 'now', { configurable: true, writable: true, value: () => 16000 });
                },
            });
            expect(stillLoading.ctx.events).toEqual([{ type: 'pageLoadTime_loadLoading' }]);
            expect(stillLoading.ctx.detectorNames.get('this.finished')).toBe(false);
        });

        it('reports failed stylesheets and fonts, both counts either way', () => {
            const failedStylesheets = {
                api: {
                    path: 'performance.getEntriesByType',
                    args: ['resource'],
                    where: { initiatorType: 'link', responseStatus: { gte: 400 } },
                },
                using: 'length',
            };
            const failedFontFaces = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };
            const detector = {
                match: {
                    any: [
                        { ...failedStylesheets, is: { gt: 0 } },
                        { ...failedFontFaces, is: { gt: 0 } },
                    ],
                },
                actions: [
                    { define: { failedStylesheets, failedFontFaces } },
                    {
                        breakageReportData: {
                            data: {
                                failedStylesheets: { value: { ref: 'failedStylesheets' } },
                                failedFontFaces: { value: { ref: 'failedFontFaces' } },
                            },
                        },
                    },
                ],
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
            expect(run('', detector, { install: both }).ctx.entry.data).toEqual({ failedStylesheets: 1, failedFontFaces: 1 });
            // A `document.fonts` that throws fails `match`, since every operand is evaluated
            const throwingFonts = (/** @type {any} */ w) => {
                failedSheet(w);
                brokenFonts(w);
            };
            const throwing = run('', detector, { install: throwingFonts });
            expect(throwing.detected).toBe('aborted');
            expect(throwing.failedAt).toBe('match.any.1.api');
            const fontOnly = (/** @type {any} */ w) => {
                loadedSheet(w);
                fonts(['error'])(w);
            };
            expect(run('', detector, { install: fontOnly }).ctx.entry.data).toEqual({ failedStylesheets: 0, failedFontFaces: 1 });
            // An engine without responseStatus counts 0, a reading
            const noStatus = (/** @type {any} */ w) => {
                timeline([{ name: 'a.css', entryType: 'resource', initiatorType: 'link' }], { missing: ['responseStatus'] })(w);
                fonts(['error'])(w);
            };
            expect(run('', detector, { install: noStatus }).ctx.entry.data).toEqual({ failedStylesheets: 0, failedFontFaces: 1 });
        });

        it('reports an empty known region', () => {
            const detector = {
                actions: [
                    { define: { comments: { element: { selector: ['#comments'] } } } },
                    {
                        if: { ref: 'comments' },
                        then: {
                            if: {
                                all: [
                                    { none: renderedText({ ref: 'comments' }) },
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
                            then: {
                                breakageReportData: {
                                    data: {
                                        region: { value: 'empty' },
                                        brokenImages: { value: { element: { ...BROKEN, root: { ref: 'comments' } }, using: 'length' } },
                                    },
                                },
                            },
                            else: { breakageReportData: { data: { region: { value: 'filled' } } } },
                        },
                    },
                ],
            };
            const entry = (/** @type {string} */ html) => {
                const { ctx } = run(html, detector, { install: imageState });
                return ctx.entry.written ? ctx.entry.data : undefined;
            };
            expect(entry('')).toBeUndefined();
            expect(entry('<div id="comments">hi</div>')).toEqual({ region: 'filled' });
            expect(entry(`<div id="comments">${IMG('data-complete')}</div>`)).toEqual({ region: 'empty', brokenImages: 1 });
            expect(entry('<div id="comments"> </div>')).toEqual({ region: 'empty', brokenImages: 0 });
        });

        it('counts error phrases in rendered text', () => {
            const keywordCount = {
                text: { xpath: RENDERED, pattern: ['access denied', 'page not found', '404 not found'] },
                using: 'length',
            };
            const detector = {
                match: { ...keywordCount, is: { gte: 1 } },
                actions: [
                    { define: { keywordCount } },
                    { breakageReportData: { data: { keywordCount: { value: { ref: 'keywordCount' } } } } },
                    { if: { ref: 'keywordCount', is: { gte: 2 } }, then: { fireEvent: { type: 'errorPhraseCount_count2Plus' } } },
                ],
            };
            const result = run('<h1>Page not found</h1><p>404 Not Found</p><script>page not found</script>', detector);
            expect(result.ctx.entry.data).toEqual({ keywordCount: 2 });
            expect(result.ctx.events).toEqual([{ type: 'errorPhraseCount_count2Plus' }]);
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
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                { detectorId: 'g.d', errors: { 'match.api': 'aborted' } },
            ]);
        });

        it('lists a detector with no breakageReportData action once a run fails', () => {
            const instance = createInstance({ g: { d: { actions: [{ if: aborting, then: { fireEvent: { type: 't' } } }] } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                { detectorId: 'g.d', errors: { 'actions.0.if.api': 'aborted' } },
            ]);
        });

        it('lists no entry for a detector with no breakageReportData action that has not failed', () => {
            const instance = createInstance({ g: { d: { match: false, actions: { fireEvent: { type: 't' } } } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([]);
        });

        it('adds breakageReportData data on a match', () => {
            const instance = createInstance({ g: { d: { match: true, actions: { breakageReportData: { data: { x: { value: 1 } } } } } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true, data: { x: 1 } }]);
        });

        it('returns error for a detector that fails to parse', () => {
            const instance = createInstance({
                g: { d: { match: { element: { selector: 'img' }, using: 'length' }, actions: { breakageReportData: {} } } },
            });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', errors: { parse: 'error' } }]);
        });

        it('fires nothing on an aborted `match`, and runs again on the next trigger', async () => {
            const detectors = { g: { d: { match: aborting, actions: { fireEvent: { type: 't' } } } } };
            const instance = createInstance(detectors);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            const run = spyOn(instance, '_runDetector').and.callThrough();
            const detector = { groupName: 'g', detectorId: 'g.d', config: parseDetectors(/** @type {any} */ (detectors)).g.d };
            instance._runAutoDetector(detector);
            instance._runAutoDetector(detector);
            await Promise.resolve();
            expect(run).toHaveBeenCalledTimes(2);
            expect(instance.callFeatureMethod).not.toHaveBeenCalled();
        });

        it('fires the event with its data on a match', async () => {
            const detectors = {
                g: { d: { match: true, actions: { fireEvent: { type: 't', data: { x: { value: 2, buckets: { two: 2 } } } } } } },
            };
            const instance = createInstance(detectors);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            instance._runAutoDetector({ groupName: 'g', detectorId: 'g.d', config: parseDetectors(/** @type {any} */ (detectors)).g.d });
            await Promise.resolve();
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 't', data: { x: 'two' } });
        });
    });
});
