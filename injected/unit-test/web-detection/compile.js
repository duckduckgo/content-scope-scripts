import { compileDetector } from '../../src/features/web-detection/compile/compile.js';
import { compileDetectorConfig, parseDetectors } from '../../src/features/web-detection/compile/detector-config.js';
import { pageSources } from '../../src/features/web-detection/sources/index.js';
import {
    IMG,
    NATURAL_WIDTH,
    REPORT,
    bindings,
    bound,
    defineGetter,
    detects,
    entriesOf,
    expectParseError,
    fires,
    fonts,
    holds,
    payload,
    rejectsMatch,
    run,
    timeline,
    withPayload,
} from './support.js';

/**
 * @typedef {import('../../src/features/web-detection/compile/detector-config.js').RawDetectorConfig} RawDetectorConfig
 */

describe('WebDetection compile', () => {
    describe('types', () => {
        it('rejects each expression in a position whose type config shows is wrong', () => {
            rejectsMatch({ element: { selector: 'img', field: 'naturalWidth' } }, 'does not fill boolean');
            rejectsMatch({ api: { path: 'document.fonts', where: { status: 'error' } } }, 'does not fill boolean');
            rejectsMatch({ element: { selector: 'img' }, using: 'length' }, 'numbers become booleans only through `is`');
            rejectsMatch({ only: 5, is: 1 }, 'does not fill list');
            rejectsMatch({ only: { element: { selector: 'img' }, using: 'length' }, is: 1 }, "'length' does not fill list");
            rejectsMatch(5, 'does not fill boolean');
            rejectsMatch({ sum: [true], is: 1 }, 'does not fill number');
            rejectsMatch({ only: { if: true, then: 1, else: 2 }, is: 1 }, "'if' does not fill list");
        });

        it('takes an api value of the type its position expects, checked as it is read', () => {
            const hidden = (/** @type {boolean} */ value) => (/** @type {any} */ w) =>
                defineGetter(w.Document.prototype, 'hidden', () => value);
            expect(holds('', { api: { path: 'document.hidden' } }, { install: hidden(true) })).toBe(true);
            expect(holds('', { api: { path: 'document.hidden' } }, { install: hidden(false) })).toBe(false);
            expect(holds('', { api: { path: 'document.title' } })).toBe('error');
            expect(holds('', { any: { api: { path: 'document.hidden' } } }, { install: hidden(true) })).toBe(true);
            expect(holds('', { api: { path: 'document.fonts', field: 'status' } }, { install: fonts(['loaded']) })).toBe('error');
        });

        it('rejects `is` outside boolean and value position, and several expression keys beside it', () => {
            rejectsMatch({ sum: [{ element: { selector: 'img' }, using: 'length', is: { gt: 1 } }], is: 1 }, '`is` gives a boolean');
            rejectsMatch({ text: { pattern: 'a' }, element: { selector: 'p' }, is: true }, 'several expression keys');
        });

        it('rejects unknown keys', () => {
            rejectsMatch({ pageFeature: 'x' }, "unknown expression key 'pageFeature'");
            rejectsMatch({ element: { selector: 'img', foo: 1 } }, "unknown key 'foo'");
            rejectsMatch({ api: { path: 'document.title', allowGetter: true }, is: '' }, "unknown key 'allowGetter'");
            rejectsMatch({ element: { selector: 'img' }, using: 'length', catch: { absent: 0 }, is: 1 }, "unknown expression key 'catch'");
            rejectsMatch({ if: true, is: 1 }, "'if' needs 'then'");
            rejectsMatch({ if: true, then: 1, else: 2, other: 3, is: 1 }, "unknown expression key 'other'");
            rejectsMatch({ api: 'x', as: 'y' }, "unknown expression key 'as'");
        });

        it('reads one bound source as a boolean in an `if` condition and as a list in a payload', () => {
            const detector = {
                actions: [
                    { define: { images: { element: { selector: 'img' } } } },
                    { if: { ref: 'images' }, then: fires({ images: { value: { ref: 'images', using: 'length' } } }) },
                ],
            };
            expect(run(IMG() + IMG(), detector).data).toEqual({ images: 2 });
            expect(run('', detector).data).toBeUndefined();
        });

        it('reads a ref in two positions, its type checked as it is read', () => {
            const detector = (/** @type {unknown} */ value) => ({
                actions: [{ define: { v: value } }, { define: { asNumber: { sum: [{ ref: 'v' }] }, asValue: { ref: 'v' } } }],
            });
            expect(bindings(run('', detector(2)))).toEqual({ v: 2, asNumber: 2, asValue: 2 });
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
            expect(payload('<p>x</p>', { only: { element: { selector: 'p' } } })).toEqual({ x: {} });
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
            rejectsMatch([], notExpression);
            rejectsMatch([true], notExpression);
            rejectsMatch({ all: [true, [true, false]] }, notExpression);
            rejectsMatch({ if: [true], then: true, else: false }, notExpression);
            expect(holds('', { if: true, then: [true], else: false })).toBe(true);
            rejectsMatch({ if: true, then: [true, 1], else: false }, "'literal' does not fill boolean");
            expectParseError({ actions: [{ define: { x: [1, 2] } }] }, notExpression);
            expectParseError({ actions: [[{ define: { x: 1 } }]] }, notExpression);
            expectParseError({ actions: { define: { x: { sum: [1, { api: { path: 'Math.max', args: [[1]] } }] } } } }, notExpression);
            expectParseError(withPayload([1, 2]), notExpression);
            expectParseError(withPayload({ sum: [1, [2, 3]] }), notExpression);
            rejectsMatch({ api: { path: 'document.title' }, is: { eq: ['a'] } }, notExpression);
        });

        it('takes string and null literals in value position only', () => {
            expect(payload('', 'x')).toEqual({ x: 'x' });
            expect(payload('', null)).toEqual({ x: null });
            expect(payload('', { if: true, then: 'yes', else: 'no' })).toEqual({ x: 'yes' });
            expect(payload('', { if: false, then: 'yes', else: null })).toEqual({ x: null });
            expect(holds('', { api: { path: 'document.readyState' }, is: { eq: { api: { path: 'document.readyState' } } } })).toBe(true);
            expect(holds('<p>a</p>', { only: { text: { pattern: 'a' } }, is: { eq: { text: { pattern: 'a' } } } })).toBe(true);
            rejectsMatch('x', "'literal' does not fill boolean position");
            rejectsMatch({ any: [null] }, "'literal' does not fill boolean position");
            rejectsMatch({ sum: ['x', 1], is: { gt: 0 } }, "'literal' does not fill number position");
            rejectsMatch({ only: 'x', is: 1 }, "'literal' does not fill list position");
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
            rejectsMatch({ text: { any: [{ pattern: 'a' }] } }, "unknown key 'any'");
            rejectsMatch({ element: [{ selector: 'p' }, { none: [{ selector: 'a' }] }] }, "unknown key 'none'");
        });
    });

    describe('unwrapping', () => {
        const widths = (/** @type {number[]} */ list) => list.map((w) => IMG(`data-width="${w}"`)).join('');
        const width = NATURAL_WIDTH;

        it('gives a selected list’s one item in number position, and errors over none or several', () => {
            const read = { div: [width, 5], is: 1 };
            expect(holds(widths([5]), read)).toBe(true);
            expect(holds('', read)).toBe('error');
            expect(holds(widths([5, 5]), read)).toBe('error');
        });

        it('gives the one item to a predicate that compares, and the list as an array to one that does not', () => {
            expect(holds(widths([5]), { ...width, is: { gt: 4 } })).toBe(true);
            expect(holds(widths([5]), { ...width, is: 5 })).toBe(true);
            expect(holds(widths([5, 6]), { ...width, is: { gt: 4 } })).toBe('error');
            expect(holds(widths([5, 6]), { ...width, is: { length: 2 } })).toBe(true);
            expect(holds(widths([5, 6]), { ...width, is: { type: 'array' } })).toBe(true);
            expect(holds('', { ...width, is: {} })).toBe(true);
        });

        it('keeps element and text in boolean position as presence', () => {
            expect(holds(IMG() + IMG(), { element: { selector: 'img' } })).toBe(true);
            expect(holds('<p>a a</p>', { text: { pattern: 'a' } })).toBe(true);
        });

        it('does not unwrap an iterable an api reads', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 5 }]);
            expect(holds('', { ...entriesOf('navigation'), is: { length: 1 } }, { install })).toBe(true);
            // `lt` compares the array as JS does: `[entry] < 1` coerces the entry to `NaN`
            expect(holds('', { ...entriesOf('navigation'), is: { lt: 1 } }, { install })).toBe(false);
        });

        it('sends a selected list bucketed, each bucket unwrapping it, and unbucketed as an array', () => {
            const buckets = { small: { lt: 10 }, large: { gte: 10 } };
            expect(payload(widths([5]), width, { buckets })).toEqual({ x: 'small' });
            expect(payload(widths([5]), width, { buckets: { two: { length: 2 } } })).toEqual({});
            expect(payload(widths([5, 6]), width)).toEqual({ x: [5, 6] });
            expect(run(widths([5, 6]), withPayload(width, { buckets })).failure).toEqual({
                path: 'actions.fireEvent.data.x.value',
                result: 'error',
            });
        });
    });

    describe('compiled tree', () => {
        /**
         * @param {any} detector
         * @returns {any}
         */
        const compile = (detector) => compileDetector(detector, pageSources({}));

        it('compiles a predicate to nodes with their config paths', () => {
            const { match } = compile(detects({ ref: 'loadEventEnd', is: { gt: 0, lt: 8000 } }));
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
            const { match } = compile(detects({ ref: 'type', is: { in: ['reload', { ref: 'other' }], eq: { ref: 'other' } } }));
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
            const { match } = compile(detects({ ref: 'n', is: { gte: 1, fails: false } }));
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
            const { match } = compile(detects({ element: { selector: 'img', where: { complete: true } }, using: 'length', is: 1 }));
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
            const where = { complete: true, field: 'naturalWidth', is: 0, all: [{ self: 'alt', is: '' }] };
            const buckets = { low: { lt: 5 }, high: { none: [{ lt: 5 }] } };
            const detectors = [
                detects({ ref: 'n', is: { gt: 0, lt: 8000, in: [1, { ref: 'm' }], eq: { ref: 'm' } } }),
                detects({ ref: 'n', is: { fails: false, type: ['number', 'string'], any: [1, 2] } }),
                detects({ ref: 'n', is: {} }),
                detects({ element: { selector: 'img', where }, using: 'length', is: { gte: 1 } }),
                { actions: { breakageReportData: { data: { n: { value: { ref: 'n' }, when: { type: 'number' }, buckets } } } } },
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

    describe('validation', () => {
        it('rejects detector shapes this release does not run', () => {
            expectParseError({ match: true }, 'a detector needs `actions`');
            expectParseError({ actions: {}, items: [] }, "unknown key 'items'");
            expectParseError({ actions: [] }, 'a sequence holds at least one element');
            expectParseError({ actions: [[{ fireEvent: { type: 'a' } }]] }, 'an array is not an expression');
        });

        it('rejects an action beside an expression key or a modifier, and a key that is not an action', () => {
            expectParseError({ actions: { fireEvent: { type: 'a' }, api: 'x' } }, "'api' is not an action");
            expectParseError({ actions: { define: { x: 1 }, is: true } }, "'is' is not an action");
            expectParseError({ actions: [{ when: true, fireEvent: { type: 'adwall' } }] }, "'when' is not an action");
        });

        it('rejects unknown keys in the actions, and the shipped `state`', () => {
            expectParseError({ actions: { fireEvent: { type: 'a', state: 'enabled' } } }, "unknown key 'state'");
            expectParseError({ actions: { breakageReportData: { state: 'enabled' } } }, "unknown key 'state'");
            expectParseError({ actions: { fireEvent: {} } }, '`type` takes a string');
            expectParseError({ actions: { fireEvent: 'a' } }, '`fireEvent` takes an object');
        });

        it('rejects a `define` that is not an object of valid names', () => {
            expectParseError({ actions: { define: {} } }, '`define` takes an object of at least one name');
            expectParseError({ actions: { define: true } }, '`define` takes an object of at least one name');
            expectParseError({ actions: { define: { '1x': 1 } } }, 'invalid name');
            expectParseError({ actions: { define: { 'that.x': 1 } } }, 'invalid name');
            expectParseError({ actions: { define: { x: { foo: 1 } } } }, "unknown expression key 'foo'");
        });

        it('rejects `as`, and a payload key with `this.`', () => {
            expectParseError({ actions: { define: { x: { api: 'a', as: 'y' } } } }, "unknown expression key 'as'");
            expectParseError({ actions: fires({ 'this.x': { value: 1 } }) }, 'invalid payload key');
        });
    });

    describe('parseDetectors', () => {
        const on = detects(true);
        const TOP = [{ context: { top: true } }];
        const DOMAIN = [{ domain: 'example.com' }];
        const parsedOne = (/** @type {unknown} */ config) =>
            parseDetectors({ group: { detector: /** @type {RawDetectorConfig} */ (config) } }).group.detector;
        /** @returns {any} */
        const compiledOf = (/** @type {unknown} */ config) => compileDetectorConfig(parsedOne(config), globalThis);

        it('should return empty object for invalid input, and skip invalid group names', () => {
            expect(parseDetectors(undefined)).toEqual({});
            expect(parseDetectors({ '123invalid': { d: on }, 'invalid-name': { d: on }, '': { d: on } })).toEqual({});
        });

        it('should accept valid group and detector names', () => {
            const result = parseDetectors({
                ValidGroup: { Detector1: on },
                validGroup: { detector1: on },
                adwalls: { generic: on, specific1: on },
                my_group_01: { my_detector07: on },
            });
            expect(Object.keys(result).sort()).toEqual(['ValidGroup', 'adwalls', 'my_group_01', 'validGroup']);
            expect(Object.values(result).flatMap((group) => Object.keys(group))).toEqual([
                'Detector1',
                'detector1',
                'generic',
                'specific1',
                'my_detector07',
            ]);
        });

        it('should default the detector state to enabled, which config can disable', () => {
            expect(parsedOne(on).state).toBe('enabled');
            expect(parsedOne(detects(true, { state: 'disabled' })).state).toBe('disabled');
        });

        /** @type {Array<[string, any, 'breakageReport' | 'auto', object]>} */
        const triggerCases = [
            ['apply breakageReport defaults', undefined, 'breakageReport', { state: 'enabled', runConditions: TOP }],
            [
                'allow custom runConditions to override defaults',
                { breakageReport: { runConditions: [] } },
                'breakageReport',
                { runConditions: [] },
            ],
            [
                'allow domain-specific runConditions',
                { breakageReport: { runConditions: DOMAIN } },
                'breakageReport',
                { runConditions: DOMAIN },
            ],
            ['allow disabling trigger state', { breakageReport: { state: 'disabled' } }, 'breakageReport', { state: 'disabled' }],
            ['apply auto defaults when auto is not configured', undefined, 'auto', { state: 'disabled', runConditions: TOP }],
            [
                'apply auto defaults beside its intervals',
                { auto: { when: { intervalMs: [100] } } },
                'auto',
                { state: 'disabled', runConditions: TOP },
            ],
            [
                'allow enabling auto, with several intervals',
                { auto: { state: 'enabled', when: { intervalMs: [100, 500, 1000, 5000] } } },
                'auto',
                { state: 'enabled', when: { intervalMs: [100, 500, 1000, 5000] } },
            ],
            [
                'allow overriding auto runConditions',
                { auto: { runConditions: DOMAIN, when: { intervalMs: [100] } } },
                'auto',
                { runConditions: DOMAIN },
            ],
            [
                'keep breakageReport defaults beside auto',
                { auto: { when: { intervalMs: [100] } } },
                'breakageReport',
                { state: 'enabled', runConditions: TOP },
            ],
        ];
        for (const [title, triggers, name, expected] of triggerCases) {
            it(`should ${title}`, () => {
                expect(parsedOne(detects(true, triggers && { triggers })).triggers[name]).toEqual(jasmine.objectContaining(expected));
            });
        }

        it('should keep the config as given, and not compile it', () => {
            const config = { match: { element: { selector: 'img' }, using: 'length' }, actions: REPORT };
            expect(parsedOne(config).raw).toBe(config);
            expect(compiledOf(config).error).toContain('length');
        });

        it('should compile `match` and `actions`, several action keys as a sequence in config order', () => {
            const compiled = compiledOf({
                match: { text: { pattern: 'test' } },
                actions: { fireEvent: { type: 'adwall' }, breakageReportData: {} },
            });
            expect(compiled.match.kind).toBe('source');
            expect(compiled.actions.kind).toBe('sequence');
            expect(compiled.actions.elements.map((/** @type {any} */ element) => element.kind)).toEqual([
                'fireEvent',
                'breakageReportData',
            ]);
            expect(compiledOf({ actions: REPORT }).match).toBeUndefined();
        });
    });
});
