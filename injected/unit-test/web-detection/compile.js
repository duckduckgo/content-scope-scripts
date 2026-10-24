import { compileDetector } from '../../src/features/web-detection/compile/compile.js';
import { compileDetectorConfig, parseDetectors } from '../../src/features/web-detection/compile/detector-config.js';
import { pageSources } from '../../src/features/web-detection/sources/index.js';
import { IMG, REPORT, bound, detects, expectParseError, fonts, holds, imageState, payload, run, timeline, withPayload } from './support.js';

/**
 * @typedef {import('../../src/features/web-detection/compile/detector-config.js').RawDetectorConfig} RawDetectorConfig
 */

describe('WebDetection compile', () => {
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

        it('rejects unknown keys', () => {
            expectParseError({ match: { pageFeature: 'x' }, actions: REPORT }, "unknown expression key 'pageFeature'");
            expectParseError({ match: { element: { selector: 'img', foo: 1 } }, actions: REPORT }, "unknown key 'foo'");
            expectParseError(
                { match: { api: { path: 'document.title', allowGetter: true }, is: '' }, actions: REPORT },
                "unknown key 'allowGetter'",
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

        it('sends a selected list bucketed, each bucket unwrapping it, and unbucketed as an array', () => {
            const buckets = { small: { lt: 10 }, large: { gte: 10 } };
            expect(run(widths([5]), withPayload(width, { buckets }), { install: imageState }).data).toEqual({ x: 'small' });
            expect(run(widths([5]), withPayload(width, { buckets: { two: { length: 2 } } }), { install: imageState }).data).toEqual({});
            expect(run(widths([5, 6]), withPayload(width), { install: imageState }).data).toEqual({ x: [5, 6] });
            expect(run(widths([5, 6]), withPayload(width, { buckets }), { install: imageState }).failure).toEqual({
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

    describe('validation', () => {
        it('rejects detector shapes this release does not run', () => {
            expectParseError({ match: true }, 'a detector needs `actions`');
            expectParseError({ actions: {}, items: [] }, "unknown key 'items'");
            expectParseError({ actions: [] }, 'a sequence holds at least one element');
            expectParseError({ actions: [[{ fireEvent: { type: 'a' } }]] }, 'an array is not an expression');
        });

        it('rejects an action beside an expression key or a modifier', () => {
            expectParseError({ actions: { fireEvent: { type: 'a' }, api: 'x' } }, "'api' is not an action");
            expectParseError({ actions: { define: { x: 1 }, is: true } }, "'is' is not an action");
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
            expectParseError({ actions: { fireEvent: { type: 'a', data: { 'this.x': { value: 1 } } } } }, 'invalid payload key');
        });
    });

    describe('parseDetectors', () => {
        it('should return empty object for invalid input', () => {
            expect(parseDetectors(undefined)).toEqual({});
        });

        it('should skip invalid group names', () => {
            const config = {
                '123invalid': { detector1: detects(true) },
                'invalid-name': { detector2: detects(true) },
                '': { detector3: detects(true) },
            };
            const result = parseDetectors(config);
            expect(Object.keys(result)).toEqual([]);
        });

        it('should accept valid group and detector names', () => {
            const config = {
                ValidGroup: { Detector1: detects(true) },
                validGroup: { detector1: detects(true) },
                adwalls: {
                    generic: detects(true),
                    specific1: detects(true),
                },
                my_group_01: {
                    my_detector07: detects(true),
                },
            };
            const result = parseDetectors(config);
            // correct group names
            expect(Object.keys(result).sort()).toEqual(['ValidGroup', 'adwalls', 'my_group_01', 'validGroup']);
            // correct detector names (get flattened list)
            expect(Object.keys(result).flatMap((group) => Object.keys(result[group]))).toEqual([
                'Detector1',
                'detector1',
                'generic',
                'specific1',
                'my_detector07',
            ]);
        });

        it('should apply defaults to detectors', () => {
            const result = parseDetectors({ adwalls: { generic: detects({ text: { pattern: 'adblocker' } }) } });
            const detector = result.adwalls.generic;

            expect(detector.state).toBe('enabled');
            expect(detector.triggers.breakageReport.state).toBe('enabled');
            expect(detector.triggers.breakageReport.runConditions).toEqual([{ context: { top: true } }]);
        });

        it('should allow custom runConditions to override defaults', () => {
            const config = {
                adwalls: {
                    iframeDetector: detects({ text: { pattern: 'test' } }, { triggers: { breakageReport: { runConditions: [] } } }),
                },
            };
            const result = parseDetectors(config);
            expect(result.adwalls.iframeDetector.triggers.breakageReport.runConditions).toEqual([]);
        });

        it('should allow domain-specific runConditions', () => {
            const config = {
                adwalls: {
                    domainSpecific: detects(
                        { text: { pattern: 'test' } },
                        { triggers: { breakageReport: { runConditions: [{ domain: 'example.com' }] } } },
                    ),
                },
            };
            const result = parseDetectors(config);
            expect(result.adwalls.domainSpecific.triggers.breakageReport.runConditions).toEqual([{ domain: 'example.com' }]);
        });

        /**
         * @param {unknown} detectorConfig
         * @returns {import('../../src/features/web-detection/compile/detector-config.js').DetectorConfig}
         */
        const oneDetectorConfigParsed = (detectorConfig) => {
            const result = parseDetectors({
                group: {
                    detector: /** @type {RawDetectorConfig} */ (detectorConfig),
                },
            });
            return result.group.detector;
        };

        /**
         * @param {unknown} detectorConfig
         * @returns {import('../../src/features/web-detection/compile/compile.js').CompiledDetector}
         */
        const compiledOf = (detectorConfig) => {
            const compiled = compileDetectorConfig(oneDetectorConfigParsed(detectorConfig), globalThis);
            if ('error' in compiled) throw new Error(compiled.error);
            return compiled;
        };

        /**
         * @param {unknown} detectorConfig
         * @returns {string}
         */
        const parseErrorOf = (detectorConfig) => {
            const compiled = compileDetectorConfig(oneDetectorConfigParsed(detectorConfig), globalThis);
            return 'error' in compiled ? compiled.error : '';
        };

        it('should keep the config as given, and not compile it', () => {
            const config = { match: { element: { selector: 'img' }, using: 'length' }, actions: { breakageReportData: {} } };
            expect(oneDetectorConfigParsed(config).raw).toBe(config);
            expect(parseErrorOf(config)).toContain('length');
        });

        it('should allow disabling detector state', () => {
            const result = oneDetectorConfigParsed(detects({ text: { pattern: 'test' } }, { state: 'disabled' }));
            expect(result.state).toBe('disabled');
        });

        it('should allow disabling trigger state', () => {
            const result = oneDetectorConfigParsed(
                detects({ text: { pattern: 'test' } }, { triggers: { breakageReport: { state: 'disabled' } } }),
            );
            expect(result.triggers.breakageReport.state).toBe('disabled');
        });

        it('should compile `match` and `actions`, several action keys as a sequence in config order', () => {
            const compiled = compiledOf({
                match: { text: { pattern: 'test' } },
                actions: { fireEvent: { type: 'adwall' }, breakageReportData: {} },
            });
            expect(compiled.match?.kind).toBe('source');
            expect(compiled.actions.kind).toBe('sequence');
            if (compiled.actions.kind !== 'sequence') return;
            expect(compiled.actions.elements.map((element) => element.kind)).toEqual(['fireEvent', 'breakageReportData']);
            expect(compiledOf({ actions: { breakageReportData: {} } }).match).toBeUndefined();
        });

        it('should reject the shipped shape and the action-list shape', () => {
            expect(parseErrorOf({ match: { text: { pattern: 'test' } } })).toContain('a detector needs `actions`');
            expect(parseErrorOf({ match: true, actions: { fireEvent: { type: 'adwall', state: 'enabled' } } })).toContain(
                "unknown key 'state'",
            );
            expect(parseErrorOf({ actions: [{ when: true, fireEvent: { type: 'adwall' } }] })).toContain("'when' is not an action");
        });

        describe('auto trigger defaults', () => {
            const auto = (/** @type {object} */ triggers) => detects({ text: { pattern: 'test' } }, { triggers });

            it('should apply default state (disabled) to auto trigger', () => {
                const result = oneDetectorConfigParsed(auto({ auto: { when: { intervalMs: [100] } } }));
                expect(result.triggers.auto.state).toBe('disabled');
            });

            it('should apply default runConditions to auto trigger', () => {
                const result = oneDetectorConfigParsed(auto({ auto: { when: { intervalMs: [100] } } }));
                expect(result.triggers.auto.runConditions).toEqual([{ context: { top: true } }]);
            });

            it('should allow overriding state to enabled', () => {
                const result = oneDetectorConfigParsed(auto({ auto: { state: 'enabled', when: { intervalMs: [100, 500] } } }));
                expect(result.triggers.auto.state).toBe('enabled');
                expect(result.triggers.auto.when.intervalMs).toEqual([100, 500]);
            });

            it('should allow overriding runConditions', () => {
                const result = oneDetectorConfigParsed(
                    auto({ auto: { runConditions: [{ domain: 'example.com' }], when: { intervalMs: [100] } } }),
                );
                expect(result.triggers.auto.runConditions).toEqual([{ domain: 'example.com' }]);
            });

            it('should handle multiple intervals', () => {
                const result = oneDetectorConfigParsed(auto({ auto: { when: { intervalMs: [100, 500, 1000, 5000] } } }));
                expect(result.triggers.auto.when.intervalMs).toEqual([100, 500, 1000, 5000]);
            });

            it('should apply default auto trigger when not specified in config', () => {
                const result = oneDetectorConfigParsed(detects({ text: { pattern: 'test' } }));
                // Defaults should be applied for auto trigger
                expect(result.triggers.auto).toBeDefined();
                expect(result.triggers.auto.state).toBe('disabled');
                expect(result.triggers.auto.runConditions).toEqual([{ context: { top: true } }]);
            });

            it('should not interfere with breakageReport trigger defaults', () => {
                const result = oneDetectorConfigParsed(auto({ auto: { when: { intervalMs: [100] } } }));
                // breakageReport defaults should still be applied
                expect(result.triggers.breakageReport.state).toBe('enabled');
                expect(result.triggers.breakageReport.runConditions).toEqual([{ context: { top: true } }]);
            });
        });
    });
});
