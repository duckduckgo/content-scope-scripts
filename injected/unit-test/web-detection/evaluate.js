import { ItemBuffer } from '../../src/features/web-detection/model/lists.js';
import {
    BROKEN,
    FAILING,
    IMG,
    NATURAL_WIDTH,
    RENDERED,
    REPORT,
    abortError,
    assign,
    bindings,
    bound,
    brokenFonts,
    count,
    entriesOf,
    expectParseError,
    expectRun,
    fires,
    fonts,
    holds,
    numberTest,
    payload,
    rejectsMatch,
    run,
    throwing,
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
            const later = { expr: { define: { images: { element: { selector: 'img' }, using: 'length' } } }, is: { type: 'undefined' } };
            const either = { any: [{ text: { pattern: 'foo' } }, later] };
            const detector = { actions: [{ define: { either } }, fires({ images: { value: { ref: 'images' } } })] };
            expect(run('<p>foo</p>' + IMG(), detector).data).toEqual({ images: 1 });
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
            const define = { pos: { div: [1, 0] }, neg: { div: [-1, 0] }, nan: { div: [0, 0] } };
            const nanTested = { ref: 'nan', is: numberTest('isNaN') };
            expect(bindings(run('', { actions: { define: { ...define, nanTested } } }))).toEqual({
                pos: Infinity,
                neg: -Infinity,
                nan: NaN,
                nanTested: true,
            });
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
            expect(abortError('', { ...FAILING, using: 'length', is: { gt: 0 } })).toBe('SyntaxError');
        });

        it('aborts with the thrown value’s constructor name when a read throws', () => {
            const match = { element: { selector: 'img', where: { naturalWidth: 0 } }, using: 'length', is: { gt: 0 } };
            expectRun(run(IMG('data-complete data-throw'), { match, actions: REPORT }), {
                detected: 'aborted',
                abortError: 'Error',
                failedAt: 'match.element.where.naturalWidth',
            });
        });

        it('reads `fails` over a value, a missing name, which reads `undefined`, and a read that throws', () => {
            const width = { only: NATURAL_WIDTH };
            const missing = { api: { path: 'document.missing' } };
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
                expect(holds(html, { ...expression, is: predicate }))
                    .withContext(`${html} ${JSON.stringify(predicate)}`)
                    .toBe(expected);
            }
        });

        it('tests `fails` first, whatever the key order', () => {
            const width = { only: NATURAL_WIDTH, is: { gt: 0, fails: false } };
            expect(holds(IMG('data-throw'), width)).toBe(false);
            expect(holds(IMG('data-width="5"'), width)).toBe(true);
            expect(holds('', { ...FAILING, using: 'length', is: { gt: 0, fails: false } })).toBe(false);
        });

        it('tests whether a property is present through Reflect.has, per item and on the engine', () => {
            const install = timeline([{ name: 'r', entryType: 'resource', responseStatus: 404 }]);
            const lacking = timeline([{ name: 'r', entryType: 'resource' }], { missing: ['responseStatus'] });
            const has = { field: { api: { path: 'Reflect.has', args: [{ self: {} }, 'responseStatus'] } }, is: true };
            const errors = entriesOf('resource', { where: { ...has, responseStatus: { gte: 400 } } });
            expect(count('', errors, { install })).toBe(1);
            expect(count('', errors, { install: lacking })).toBe(0);
            const engine = { api: { path: 'Reflect.has', args: [{ api: 'FakePerformanceEntry.prototype' }, 'responseStatus'] } };
            const guarded = { if: engine, then: { ...errors, using: 'length' }, else: 0, is: 0 };
            expect(holds('', guarded, { install: lacking })).toBe(true);
            expect(holds('', { ...guarded, is: 1 }, { install })).toBe(true);
        });

        it('tests each item with `fails`, counting the readable items instead of aborting', () => {
            const html = IMG('data-throw') + IMG('data-width="0"') + IMG('data-width="5"');
            expect(count(html, { element: { selector: 'img', where: { naturalWidth: { fails: false } } } })).toBe(2);
            expect(count(html, { element: { selector: 'img', where: { naturalWidth: { fails: true } } } })).toBe(1);
        });

        it('falls back through `if` over `fails`, reporting the fallback, and fails on the failed read unless handled', () => {
            const failed = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };
            /** @param {object} n - the payload field for `n` */
            const detector = (n) => ({
                actions: [
                    { define: { nOr0: { if: { ...failed, is: { fails: false } }, then: { expr: failed }, else: 0 } } },
                    fires({ nOr0: { value: { ref: 'nOr0' } }, n }),
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
            expect(holds('', { api: 'document', is: { title: { field: FAILING, is: 1 }, type: 'string' } })).toBe(false);
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
            expect(bound('<p></p>', brokenRatio, 'brokenRatio')).toBe(0);
            expect(bound(IMG('data-complete') + IMG('data-complete data-width="5"'), brokenRatio, 'brokenRatio')).toBe(0.5);
        });

        it('does not evaluate the other branch', () => {
            const failing = { ...FAILING, using: 'length' };
            expect(holds('', { if: true, then: 1, else: failing, is: 1 })).toBe(true);
            expect(holds('', { if: false, then: failing, else: 1, is: 1 })).toBe(true);
        });

        it('applies `using` and `is` beside `if` to the branch taken', () => {
            expect(holds('', { if: true, then: { expr: ['a', 'b'] }, else: { expr: [] }, using: 'length', is: 2 })).toBe(true);
            expect(holds('', { if: false, then: true, else: 3, is: 3 })).toBe(true);
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
    });

    describe('operators', () => {
        it('errors on only over no items', () => {
            expect(holds('', { only: NATURAL_WIDTH, is: {} })).toBe('error');
            expect(holds('', { sum: NATURAL_WIDTH, is: 0 })).toBe(true);
            expect(holds('', { mul: NATURAL_WIDTH, is: 1 })).toBe(true);
            const at = { ...NATURAL_WIDTH, using: { path: 'at', args: [0] } };
            expect(holds('', { ...at, is: { type: 'undefined' } })).toBe(true);
            expect(holds('', { ...at, is: { gte: 0 } })).toBe(false);
        });

        it('mixes lists of values with numbers', () => {
            expect(holds(IMG('data-width="3"') + IMG('data-width="9"'), { sum: [NATURAL_WIDTH, 1], is: 13 })).toBe(true);
        });

        it('reads the one item with only, and errors over none or several', () => {
            const read = { only: NATURAL_WIDTH, is: { gte: 0 } };
            expect(holds(IMG(), read)).toBe(true);
            expect(holds('', read)).toBe('error');
            expect(holds(IMG() + IMG(), read)).toBe('error');
        });

        it('picks an item by position with at on a root, in document and in timeline order', () => {
            const at = (/** @type {number} */ index) => ({ path: 'at', args: [index] });
            const html = IMG('data-width="1"') + IMG('data-width="2"') + IMG('data-width="3"');
            expect(holds(html, { ...NATURAL_WIDTH, using: at(0), is: 1 })).toBe(true);
            expect(holds(html, { ...NATURAL_WIDTH, using: at(-1), is: 3 })).toBe(true);
            expect(holds(html, { element: { selector: 'img' }, using: { ...at(1), field: 'naturalWidth' }, is: 2 })).toBe(true);
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: 5 },
                { name: 'b', entryType: 'resource', duration: 7 },
            ]);
            const durations = entriesOf('resource', { field: 'duration' });
            expect(holds('', { ...durations, using: at(0), is: 5 }, { install })).toBe(true);
            expect(holds('', { ...durations, using: at(-1), is: 7 }, { install })).toBe(true);
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
            const complete = { element: { selector: 'img', field: 'complete' } };
            expect(holds(IMG('data-complete') + IMG(), { all: complete })).toBe(false);
            expect(holds(IMG('data-complete') + IMG(), { any: complete })).toBe(true);
            expect(holds(IMG(), { none: complete })).toBe(true);
        });
    });

    describe('eager evaluation', () => {
        /**
         * Run, and give the number of `complete` reads.
         *
         * @param {string} html
         * @param {any} detector
         */
        function completeReads(html, detector) {
            const result = run(html, detector);
            return { result, reads: result.window.__imageReads.complete };
        }

        const three = IMG('data-complete') + IMG('data-complete') + IMG();

        it('reads every item of a length or a list, and every operand of `any`, `all`, `none` and the implicit AND', () => {
            const read = { element: { selector: 'img', where: { complete: true } }, using: 'length', is: { gte: 1 } };
            /** @type {Array<[object, boolean]>} */
            const cases = [
                [read, true],
                [{ any: { element: { selector: 'img', field: 'complete' } } }, true],
                [{ any: [true, read] }, true],
                [{ all: [false, read] }, false],
                [{ none: [true, read] }, false],
                [{ element: { selector: 'p' }, expr: read }, false],
            ];
            for (const [match, detected] of cases) {
                const { result, reads } = completeReads(three, { match, actions: REPORT });
                expect([result.detected, reads]).withContext(JSON.stringify(match)).toEqual([detected, 3]);
            }
        });

        it('reaches a where failure past the items a predicate needs', () => {
            const html = IMG('data-width="1"') + IMG('data-width="1"') + IMG('data-throw');
            const where = { naturalWidth: { gt: 0 } };
            expect(holds(html, { element: { selector: 'img', where }, using: 'length', is: { gte: 2 } })).toBe('aborted');
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
            const n = { element: { selector: 'img', where: { complete: true } }, using: { sum: [{ self: 'length' }, { self: 'length' }] } };
            const { result, reads } = completeReads(three, { actions: { define: { n } } });
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

        it('buckets a string by length', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'navigate' }]);
            const buckets = { short: { length: { lt: 3 } }, long: { length: { gte: 3 } } };
            expect(payload('', { only: entriesOf('navigation', { field: 'type' }) }, { buckets }, { install })).toEqual({ x: 'long' });
        });

        it('sends an unbucketed string, boolean and null as-is', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', type: 'reload', nothing: null, flag: true }]);
            const read = (/** @type {string} */ field) => ({ only: entriesOf('navigation', { field }) });
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
            const cyclic = { a: 1 };
            // An enumerable getter, which JSON reads
            const thrown = {
                get a() {
                    throw new RangeError('thrown');
                },
            };
            const install = assign({ cyclic: Object.assign(cyclic, { self: cyclic }), thrown });
            const result = run('', withPayload({ api: { path: 'cyclic' } }), { install });
            expect(result.failure).toEqual({ path: 'actions.fireEvent.data.x.value', result: 'aborted' });
            expect(result.abortError).toBe('TypeError');
            expect(run('', withPayload({ api: { path: 'thrown' } }), { install }).abortError).toBe('RangeError');
        });

        it('fails at the first key whose value, `when` or bucket fails or errors, in key order', () => {
            const detector = {
                actions: fires({
                    ok: { value: 1 },
                    zeta: { value: { only: NATURAL_WIDTH } },
                    alpha: { value: { ...FAILING, using: 'length' } },
                }),
            };
            expect(run('<p></p>', detector).failure).toEqual({ path: 'actions.fireEvent.data.zeta.value.only', result: 'error' });
        });

        it('sends every key when nothing fails', () => {
            expect(payload('', 1)).toEqual({ x: 1 });
        });

        it('rejects invalid payload keys and empty buckets', () => {
            expectParseError({ actions: fires({ nativeData: { value: 1 } }) }, 'invalid payload key');
            expectParseError({ actions: fires({ _x: { value: 1 } }) }, 'invalid payload key');
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
            expect(holds(widths, { ...NATURAL_WIDTH, using: { path: 'at', args: [-1] }, is: 2 })).toBe(true);
        });

        it('applies `using`, then `is`', () => {
            expect(holds(widths, { element: { selector: 'img' }, using: 'length', is: { gte: 2 } })).toBe(true);
            expect(payload(widths, { element: { selector: 'img' }, using: 'length' })).toEqual({ x: 2 });
        });

        it('rejects `using` without an expression, without a path or with an unknown key, and `root` on `api`', () => {
            rejectsMatch({ using: 'length', is: 1 }, '`using` reads from an expression');
            rejectsMatch({ element: { selector: 'img' }, using: {}, is: 1 }, '`using` needs `path`');
            rejectsMatch({ element: { selector: 'img' }, using: 1, is: 1 }, '`using` takes a path or an object');
            rejectsMatch({ element: { selector: 'img' }, using: { path: 'at', root: 'x' }, is: 1 }, "unknown key 'root'");
            rejectsMatch({ api: { root: { element: { selector: 'img' } }, path: 'length' }, is: 1 }, "unknown key 'root'");
        });

        it('takes a second set of modifiers through `expr`', () => {
            expect(
                holds(widths, { expr: { element: { selector: 'img' }, using: 'length' }, using: { sum: [{ self: {} }, 1] }, is: 3 }),
            ).toBe(true);
        });

        it('gives the boolean an `is` inside `expr` gives', () => {
            const enough = { expr: { element: { selector: 'img' }, using: 'length', is: { gte: 2 } } };
            expect(bound(widths, { define: { enough } }, 'enough')).toBe(true);
            expect(bound(IMG(), { define: { enough } }, 'enough')).toBe(false);
            expect(payload(widths, enough)).toEqual({ x: true });
            rejectsMatch(
                { sum: [{ expr: { element: { selector: 'img' }, using: 'length', is: 1 } }], is: 1 },
                "'expr' does not fill number",
            );
        });

        it('gives the boolean an `is` gives in value position', () => {
            const test = { element: { selector: 'img' }, using: 'length', is: { gte: 2 } };
            const detector = { actions: fires({ enough: { value: test } }) };
            expect(run(widths, detector).data).toEqual({ enough: true });
            expect(run(IMG(), detector).data).toEqual({ enough: false });
            expect(payload(widths, { api: { path: 'String', args: [{ element: { selector: 'img' }, is: {} }] } })).toEqual({ x: 'true' });
        });

        it('gives its operand in its own position: a list operand of `sum`, and the condition leaf', () => {
            expect(holds(widths, { sum: { expr: NATURAL_WIDTH }, is: 3 })).toBe(true);
            expect(holds(widths, { expr: { element: { selector: 'img' } } })).toBe(true);
            expect(holds('', { any: [{ expr: { element: { selector: 'img' } } }] })).toBe(false);
            rejectsMatch({ expr: NATURAL_WIDTH }, 'does not fill boolean');
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
            expect(holds(widths, { expr: [NATURAL_WIDTH], using: { path: 'at', args: [0] }, is: { length: 2 } })).toBe(true);
            // A failed entry fails the list
            expect(holds('', { expr: [1, FAILING], using: 'length', is: 2 })).toBe('aborted');
            expect(payload('', { expr: [1, 'a', { expr: [true] }] })).toEqual({ x: [1, 'a', [true]] });
            // A list stays one: it is not unwrapped to a number, nor read as a boolean
            expectParseError(withPayload({ div: [{ expr: [6] }, 2] }), "'list' does not fill number position");
            rejectsMatch({ expr: [true] }, "'list' does not fill boolean position");
        });
    });

    describe('iter', () => {
        const ws = { define: { ws: { api: { path: 'RegExp', args: ['\\s+', 'g'] } } } };
        /** The non-whitespace characters of rendered text: 8 KB chunks, each with its whitespace removed */
        const strippedChunks = {
            sum: {
                iter: { text: { xpath: RENDERED, pattern: '[\\s\\S]+' } },
                field: { api: { path: 'String.prototype.replace.call', args: [{ self: {} }, { ref: 'ws' }, ''] }, using: 'length' },
            },
        };
        const perCharacter = { text: { xpath: RENDERED, pattern: '\\S' }, using: 'length' };

        /**
         * Both counts of a page's rendered text.
         *
         * @param {string} html
         * @returns {Record<string, unknown>}
         */
        function counts(html) {
            const values = { chunks: { value: strippedChunks }, characters: { value: perCharacter } };
            return run(html, { actions: [ws, fires(values)] }).data ?? {};
        }

        it('streams into sum, mul, any, all, none and length', () => {
            const html = '<p>a</p><p>bb</p><p>ccc</p>';
            const lengths = { iter: { element: { selector: 'p' } }, field: 'textContent.length' };
            expect(payload(html, { sum: lengths })).toEqual({ x: 6 });
            expect(payload(html, { mul: [lengths, 2] })).toEqual({ x: 12 });
            expect(payload(html, { any: { ...lengths, field: { self: 'textContent.length', is: 3 } } })).toEqual({ x: true });
            expect(payload(html, { all: { ...lengths, field: { self: 'textContent.length', is: 3 } } })).toEqual({ x: false });
            expect(payload(html, { none: { ...lengths, field: { self: 'textContent.length', is: 4 } } })).toEqual({ x: true });
            expect(payload(html, { iter: { element: { selector: 'p' } }, using: 'length' })).toEqual({ x: 3 });
            expect(payload(html, { iter: { text: { pattern: '\\w' } }, using: 'length' })).toEqual({ x: 6 });
        });

        it('streams an api list and a page iterator', () => {
            const head = '<title>foo boo</title>';
            const matches = { api: { path: 'document.title.matchAll', args: [{ api: { path: 'RegExp', args: ['o', 'g'] } }] } };
            expect(payload('', { iter: matches, using: 'length' }, undefined, { head })).toEqual({ x: 4 });
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: 5 },
                { name: 'b', entryType: 'resource', duration: 7 },
            ]);
            expect(payload('', { sum: { iter: entriesOf('resource'), field: 'duration' } }, undefined, { install })).toEqual({ x: 12 });
        });

        it('filters and maps text matches, strings, with `where` and `field` over `self`', () => {
            const words = { iter: { text: { pattern: '\\w+' } }, where: { self: 'length', is: { gt: 2 } }, field: 'length' };
            expect(payload('<p>a bb ccc dddd</p>', { sum: words })).toEqual({ x: 7 });
            expect(holds('<p>a</p>', { iter: { text: { pattern: '\\w+' } }, where: { length: 1 }, using: 'length', is: 1 })).toBe('error');
        });

        it('keeps none of the items a streaming reader reads', () => {
            const take = spyOn(ItemBuffer.prototype, 'take').and.callThrough();
            expect(payload('<p>a</p><p>bb</p>', { sum: { iter: { element: { selector: 'p' } }, field: 'textContent.length' } })).toEqual({
                x: 3,
            });
            expect(take).toHaveBeenCalledTimes(1);
            const buffer = /** @type {ItemBuffer} */ (take.calls.mostRecent().object);
            expect(buffer.values).toEqual([]);
            expect(take.calls.mostRecent().returnValue).toBeDefined();
        });

        it('counts the non-whitespace characters of rendered text as the per-character count does', () => {
            /** @type {Record<string, string>} */
            const pages = {
                empty: '',
                spaces: '<p>Hello  world, <b>foo</b>bar baz</p><div>  a\n b  </div>',
                unicode: '<p> x y　z</p>',
                hidden: '<p>a</p><script>b c</script><style>d e</style><template>f</template><noscript>g</noscript>',
                longNode: `<p>${'ab cd\n'.repeat(3000)}</p>`,
                manyNodes: '<span>abc def</span> '.repeat(3000),
            };
            for (const [name, html] of Object.entries(pages)) {
                const { chunks, characters } = counts(html);
                expect(chunks).withContext(name).toBe(characters);
            }
            expect(counts('').chunks).toBe(0);
            expect(counts(pages.manyNodes).chunks).toBe(18000);
        });

        it('stops `any`, `all` and `none` at the entry that decides, leaving later entries unread', () => {
            expect(holds('', { any: { iter: [true, FAILING] } })).toBe(true);
            expect(holds('', { any: [true, FAILING] })).toBe('aborted');
            expect(holds('', { all: { iter: [false, FAILING] } })).toBe(false);
            expect(holds('', { none: { iter: [true, FAILING] } })).toBe(false);
            expect(holds('', { any: { iter: [false, FAILING] } })).toBe('aborted');

            const later = { element: { selector: 'img', where: { complete: true } }, using: 'length', is: { gt: 0 } };
            const result = run(IMG('data-complete'), { match: { any: { iter: [true, later] } }, actions: REPORT });
            expect([result.detected, result.window.__imageReads.complete ?? 0]).toEqual([true, 0]);

            const action = { expr: { define: { late: 1 } }, is: { type: 'undefined' } };
            expect(bound('', [{ define: { r: { any: { iter: [true, action] } } } }], 'late')).toBeUndefined();
            expect(bound('', [{ define: { r: { any: { iter: [false, action] } } } }], 'late')).toBe(1);
        });

        it('gives entries the position of an operand, contributing each item of a list entry', () => {
            expect(payload(IMG('data-width="3"') + IMG('data-width="4"'), { sum: { iter: [1, NATURAL_WIDTH] } })).toEqual({ x: 8 });
            expect(holds('<p></p>', { any: { iter: [false, { element: { selector: 'p' } }] } })).toBe(true);
            expect(payload('', { iter: [1, { expr: [2, 3] }] })).toEqual({ x: [1, 2, 3] });
        });

        it('fails at the first failed item, unless `where` tests `fails` on it', () => {
            const failed = run('', { actions: { define: { n: { sum: { iter: [1, FAILING, 2] } } } } });
            expect(failed.failure?.result).toBe('aborted');
            expect(failed.failure?.path).toContain('.iter.1');
            const skipFailed = { self: {}, is: { fails: false } };
            expect(payload('', { sum: { iter: [1, FAILING, 2], where: skipFailed } })).toEqual({ x: 3 });

            const afterCapture = (/** @type {any} */ w) => {
                w.pageList = {
                    *[Symbol.iterator]() {
                        yield w.document.body;
                        throw new w.TypeError('page');
                    },
                };
            };
            expect(holds('', { iter: { api: 'pageList' }, using: 'length', is: 1 }, { afterCapture })).toBe('aborted');
            expect(holds('', { iter: { api: 'pageList' }, where: skipFailed, using: 'length', is: 1 }, { afterCapture })).toBe(true);
            const throwsAtOnce = (/** @type {any} */ w) => {
                w.pageList = { [Symbol.iterator]: throwing(new w.TypeError('page')) };
            };
            expect(holds('', { sum: { iter: { api: 'pageList' } }, is: 0 }, { afterCapture: throwsAtOnce })).toBe('aborted');
            expect(holds('', { sum: { iter: { api: 'document.title' } }, is: 0 })).toBe('error');
        });

        it('reads an iter in full where a list is read whole', () => {
            const html = '<p>a</p><p>bb</p>';
            const texts = { iter: { element: { selector: 'p' } }, field: 'textContent' };
            expect(payload(html, texts)).toEqual({ x: ['a', 'bb'] });
            expect(payload('', { api: { path: 'Math.max.apply', args: [null, { iter: [1, 5, 3] }] } })).toEqual({ x: 5 });
            expect(payload(html, { only: { ...texts, where: { self: 'textContent', is: 'bb' } } })).toEqual({ x: 'bb' });
            expect(payload(html, { ...texts, using: { path: 'at', args: [-1] } })).toEqual({ x: 'bb' });
        });

        it('binds an iter as its expression, evaluated again at each ref', () => {
            const three = IMG('data-complete') + IMG('data-complete') + IMG();
            const result = run(three, {
                actions: [
                    { define: { complete: { iter: { element: { selector: 'img', where: { complete: true } } } } } },
                    { define: { a: { ref: 'complete', using: 'length' }, b: { ref: 'complete', using: 'length' } } },
                    fires({ n: { value: { ref: 'a' } }, items: { value: { ref: 'complete' } } }),
                ],
            });
            expect(result.names.get('a')).toBe(2);
            expect(result.ctx.measured).not.toEqual(jasmine.objectContaining({ complete: jasmine.anything() }));
            expect(result.window.__imageReads.complete).toBe(9);
            expect(result.data?.n).toBe(2);
            expect(result.data?.items).toEqual([{}, {}]);
            expectParseError({ actions: { define: { 'this.x': { iter: [1] } } } }, "a 'this.' name holds no 'iter'");
        });

        describe('evaluate-once recipe', () => {
            /**
             * Two reads of a value the recipe evaluates once, and how many times it was evaluated.
             *
             * @param {unknown} value
             */
            function readTwice(value) {
                const counted = {
                    expr: [{ define: { calls: { sum: [{ ref: 'calls' }, 1] } } }, value],
                    using: { path: 'at', args: [-1] },
                };
                const once = {
                    iter: [{ if: { ref: 'kept', is: { type: 'undefined' } }, then: counted, else: { ref: 'kept' } }],
                    where: { expr: { define: { kept: { self: {} } } }, is: { type: 'undefined' } },
                };
                // A failed read is left out of the payload rather than failing it
                const read = { value: { only: { ref: 'once' } }, when: { fails: false } };
                return run('', {
                    actions: [{ define: { calls: 0, once } }, fires({ a: read, b: read, calls: { value: { ref: 'calls' } } })],
                });
            }

            it('evaluates the value at the first ref and reads it after', () => {
                expect(readTwice(42).data).toEqual({ a: 42, b: 42, calls: 1 });
            });

            it('evaluates a failed value again at each ref, each failing', () => {
                expect(readTwice(FAILING).data).toEqual({ calls: 2 });
            });

            it('evaluates an undefined value again at each ref', () => {
                expect(readTwice({ ref: 'nothing' }).data).toEqual({ calls: 2 });
            });
        });
    });
});
