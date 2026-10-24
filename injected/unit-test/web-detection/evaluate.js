import {
    BROKEN,
    FAILING,
    IMG,
    REPORT,
    bound,
    brokenFonts,
    expectParseError,
    fonts,
    holds,
    imageState,
    numberTest,
    payload,
    run,
    timeline,
    withPayload,
} from './support.js';

describe('WebDetection evaluate', () => {
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
            expect(payload('', { div: [1, 0] }, { when: { ...numberTest('isFinite', false), gt: 0 } })).toEqual({ x: null });
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

        it('sends an object, a node, NaN and Infinity unbucketed as JSON writes them', () => {
            expect(payload('', { api: { path: 'JSON.parse', args: ['{"a":[1,{"b":null}]}'] } })).toEqual({ x: { a: [1, { b: null }] } });
            expect(payload('<p></p>', { only: { element: { selector: 'p' } } })).toEqual({ x: {} });
            expect(payload('', { div: [0, 0] })).toEqual({ x: null });
            expect(payload('', { div: [1, 0] })).toEqual({ x: null });
        });

        it('omits a value JSON writes as nothing, and fails a key at a value JSON cannot write', () => {
            expect(payload('', { api: { path: 'JSON.parse' } })).toEqual({});
            const install = (/** @type {any} */ window) => {
                const cyclic = { a: 1 };
                window.cyclic = Object.assign(cyclic, { self: cyclic });
                window.throwing = {
                    get a() {
                        throw new RangeError('thrown');
                    },
                };
            };
            const cyclic = run('', withPayload({ api: { path: 'cyclic' } }), { install });
            expect(cyclic.failure).toEqual({ path: 'actions.fireEvent.data.x.value', result: 'aborted' });
            expect(cyclic.abortError).toBe('TypeError');
            expect(run('', withPayload({ api: { path: 'throwing' } }), { install }).abortError).toBe('RangeError');
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
            expect(payload('', { expr: [1, 'a', { expr: [true] }] })).toEqual({ x: [1, 'a', [true]] });
            // A list stays one: it is not unwrapped to a number, nor read as a boolean
            expectParseError(withPayload({ div: [{ expr: [6] }, 2] }), "'list' does not fill number position");
            expectParseError({ match: { expr: [true] }, actions: REPORT }, "'list' does not fill boolean position");
        });
    });
});
