import { JSDOM } from 'jsdom';
import { compileDetector } from '../../src/features/web-detection/compile/compile.js';
import { EvaluationContext } from '../../src/features/web-detection/evaluate/context.js';
import { evaluateOccurrence } from '../../src/features/web-detection/evaluate/evaluate.js';
import { NativeReader } from '../../src/features/web-detection/evaluate/native-reader.js';
import { breakageEntry, createDetectorState, runDetector as runCompiledDetector } from '../../src/features/web-detection/evaluate/run.js';
import { ConfigParseError, isFailure } from '../../src/features/web-detection/model/core.js';
import { pageSources } from '../../src/features/web-detection/sources/index.js';
import WebDetection from '../../src/features/web-detection.js';

/**
 * @typedef {import('../../src/features/web-detection/compile/detector-config.js').RawDetectorConfig} RawDetectorConfig
 * @typedef {import('../../src/features/web-detection/evaluate/run.js').BreakageEntry} BreakageEntry
 */

/**
 * @typedef {object} RunOptions
 * @property {string} [head] - markup for `<head>`
 * @property {(window: any) => void} [install] - runs before the reader captures native getters, so what it defines is native
 * @property {(window: any) => void} [afterCapture] - runs after the capture, as a page script would
 */

/**
 * @typedef {object} TestEnv
 * @property {object} [platform] - Platform config
 * @property {string} [domain] - Current domain
 * @property {boolean} [isTopFrame] - Whether we're in the top frame
 */

/** The actions of a detector whose `match` is under test. */
export const REPORT = { breakageReportData: {} };

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
export function run(body, detector, options = {}) {
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
        const result = runCompiledDetector(compiled, state, ctx);
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
export function holds(body, match, options) {
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
export function bound(body, actions, name, options) {
    return run(body, { actions }, options).names.get(name);
}

/**
 * A detector whose `match` holds, by default, and that sends one payload field `x`.
 *
 * @param {unknown} value
 * @param {object} [extra] - `when` and `buckets`
 * @param {unknown} [match]
 */
export function withPayload(value, extra = {}, match = true) {
    return { match, actions: { fireEvent: { type: 't', data: { x: { value, ...extra } } } } };
}

/**
 * @param {string} body
 * @param {unknown} value
 * @param {object} [extra]
 * @param {RunOptions} [options]
 */
export function payload(body, value, extra, options) {
    return run(body, withPayload(value, extra), options).data;
}

/**
 * @param {unknown} detector
 * @param {RegExp | string} [message]
 */
export function expectParseError(detector, message) {
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
export function numberTest(name, expected = true) {
    return { field: { api: { path: `Number.${name}`, args: [{ self: {} }] } }, is: expected };
}

/**
 * JSDOM loads no images. These getters derive image state from attributes, installed before the
 * capture so the reader takes them as the browser's own: `data-complete`, `data-width`, and
 * `data-throw` making `naturalWidth` throw.
 *
 * @param {any} window
 */
export function imageState(window) {
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
export function timeline(entries, { missing = [] } = {}) {
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
export function fonts(statuses) {
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
export function brokenFonts(window) {
    Object.defineProperty(window.Document.prototype, 'fonts', {
        configurable: true,
        get() {
            throw new Error('refused');
        },
    });
}

/** A read that fails: `JSON.parse` throws on text that does not parse. */
export const FAILING = { api: { path: 'JSON.parse', args: ['{'] } };

export const IMG = (/** @type {string} */ attrs = '') => `<img src="a.png" ${attrs}>`;
export const BROKEN = { selector: 'img', where: { complete: true, naturalWidth: 0, 'currentSrc.length': { gt: 0 } } };
export const RENDERED =
    '//body//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';
/** `RENDERED` relative to a `root`. */
export const RENDERED_WITHIN =
    './/text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';
/** Non-whitespace characters of rendered text in each root, one match each. */
export const renderedText = (/** @type {unknown} */ root) => ({ text: { xpath: RENDERED_WITHIN, pattern: '\\S', root } });

/**
 * A page whose values the tests change between runs. `bad` throws while `throws` is set. The values sit
 * one level below `page`, since the reader captures the data properties of objects on the global.
 *
 * @returns {{ page: { live: { n: number, ready: boolean, label: string, throws: boolean, readonly bad: number } } }}
 */
export function makeGlobal() {
    return {
        page: {
            live: {
                n: 0,
                ready: false,
                label: 'x',
                throws: true,
                get bad() {
                    if (this.throws) throw new TypeError('unreadable');
                    return 1;
                },
            },
        },
    };
}

/**
 * Compile a detector over `global`, and run it against one detector state.
 *
 * @param {{ match?: unknown, actions: unknown }} config
 * @param {object} [global]
 */
export function detector(config, global = makeGlobal()) {
    const compiled = compileDetector(config, pageSources(global));
    const reader = new NativeReader(global, compiled.names);
    const state = createDetectorState();
    /** @type {Array<{ type: string, data?: object }>} */
    const events = [];
    return {
        state,
        events,
        types: () => events.map((event) => event.type),
        run: () => {
            const ctx = new EvaluationContext(reader, state.names, state);
            const run = runCompiledDetector(compiled, state, ctx);
            events.push(...ctx.events);
            return { ...run, ctx };
        },
        entry: () => breakageEntry('g.d', state),
    };
}

/** The global `api` reads from in the feature tests. */
export const testGlobal = /** @type {Record<string, any>} */ (globalThis);

export const aborting = { api: 'page.live.bad', is: { gt: 0 } };
export const erroring = { api: 'page.live.label' };
export const counter = {
    if: { ref: 'this.count', is: { type: 'undefined' } },
    then: 1,
    else: { sum: [{ ref: 'this.count' }, 1] },
};

/**
 * Test harness for running detectors in controlled environment.
 * Handles setup/teardown of window mocks automatically.
 *
 * @param {object} detectorsConfig - The detectors config (group -> detector -> config)
 * @param {TestEnv} [env] - Environment options
 * @returns {BreakageEntry[]}
 */
export function runDetectorsInEnv(detectorsConfig, env = {}) {
    const { platform = {}, domain = 'example.com', isTopFrame = true } = env;

    // Mock window.self/top for frame detection
    const originalWindow = globalThis.window;
    const mockSelf = {};
    // @ts-expect-error - mocking for test
    globalThis.window = { self: mockSelf, top: isTopFrame ? mockSelf : { different: true } };

    try {
        const args = {
            site: { domain, url: `https://${domain}/page` },
            platform,
            featureSettings: { webDetection: { detectors: detectorsConfig } },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        const instance = new WebDetection('webDetection', undefined, {}, args);
        instance.init();
        return instance.runDetectors({ trigger: 'breakageReport' });
    } finally {
        globalThis.window = originalWindow;
    }
}

/**
 * Run a single detector and return results.
 * Wraps detector in standard group/detector structure.
 *
 * @param {RawDetectorConfig} detectorConfig
 * @param {TestEnv} [env]
 * @returns {BreakageEntry[]}
 */
export function runDetector(detectorConfig, env = {}) {
    return runDetectorsInEnv({ group: { detector: detectorConfig } }, env);
}

/**
 * A detector that writes its breakage entry when `match` holds.
 *
 * @param {unknown} match
 * @param {Omit<RawDetectorConfig, 'match' | 'actions'>} [rest]
 * @returns {RawDetectorConfig}
 */
export const detects = (match, rest = {}) => ({ ...rest, match, actions: { breakageReportData: {} } });

/**
 * Compile and evaluate a condition on its own, as a detector's `match`.
 *
 * @param {unknown} match
 * @param {object} [global] - the global object reads go through
 * @returns {true | false | 'aborted'} throws on a parse error or an error
 */
export function evaluateCondition(match, global = globalThis) {
    const compiled = compileDetector({ match, actions: { breakageReportData: {} } }, pageSources(global));
    const value = evaluateOccurrence(
        /** @type {import('../../src/features/web-detection/model/types.js').Node} */ (compiled.match),
        new EvaluationContext(new NativeReader(global, compiled.names)),
    );
    return isFailure(value) ? 'aborted' : value === true;
}
