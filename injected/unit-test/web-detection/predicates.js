import {
    BROKEN,
    FAILING,
    IMG,
    RENDERED,
    REPORT,
    bound,
    expectParseError,
    holds,
    imageState,
    numberTest,
    payload,
    renderedText,
    run,
    timeline,
    withPayload,
} from './support.js';

/**
 * @typedef {import('./support.js').RunOptions} RunOptions
 */

describe('WebDetection predicates', () => {
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

        it('reads property paths at item and value level, beside combinators and operators', () => {
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

        it('reads a property through the long form, inside combinators at item level', () => {
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

        it('gives the elements of several bodies one body after another, each with its own field', () => {
            const html = '<img id="a" class="x"><img id="b">';
            const bodies = [{ selector: 'img', where: { id: 'b' } }, { selector: 'img.x' }];
            expect(holds(html, { element: bodies, using: 'length', is: 2 })).toBe(true);
            expect(holds(html, { element: [...bodies].reverse(), using: 'length', is: 2 })).toBe(true);
            const overlapping = {
                element: [
                    { selector: 'img', field: 'id' },
                    { selector: 'img.x', field: 'className' },
                ],
            };
            expect(holds(html, { expr: overlapping, using: 'length', is: 3 })).toBe(true);
            expect(holds(html, { expr: overlapping, using: '2', is: 'x' })).toBe(true);
        });

        it('counts the elements of several bodies with nothing to test, failing on a root that fails', () => {
            const html = '<img id="a" class="x"><img id="b">';
            expect(holds(html, { element: [{ selector: 'img' }, { selector: 'img.x' }], using: 'length', is: 3 })).toBe(true);
            const install = (/** @type {any} */ w) => {
                Object.defineProperty(w, 'brokenRoot', {
                    get() {
                        throw new w.TypeError('broken');
                    },
                });
            };
            const bodies = [{ selector: 'img' }, { selector: 'img', root: { api: 'brokenRoot' } }];
            expect(holds(html, { element: bodies, using: 'length', is: { fails: true } }, { install })).toBe(true);
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

        it('reads a name a define inside the where binds again for each item', () => {
            const big = (/** @type {unknown} */ read) => ({
                if: { self: 'a', is: { gt: 0 } },
                then: [{ define: { current: { self: 'a' } } }, read],
                else: false,
            });
            expect(holds('', { api: { ...items, where: big({ ref: 'current', is: { gt: 1 } }) }, using: 'length', is: 2 })).toBe(true);
            const sum = { sum: [{ ref: 'current' }, 0], is: { gt: 1 } };
            expect(holds('', { api: { ...items, where: big(sum) }, using: 'length', is: 2 })).toBe(true);
        });

        it('runs an action reading no self once per evaluation of the source', () => {
            const where = { if: true, then: [{ fireEvent: { type: 'item' } }, true], else: false };
            const { events } = run('', { actions: { define: { n: { api: { ...items, where }, using: 'length' } } } });
            expect(events.length).toBe(1);
        });

        it('computes an expression over a ref inside a where, field or using that reads no self', () => {
            const defined = (/** @type {unknown} */ n) => run('', { actions: [{ define: { lim: 1 } }, { define: { n } }] }).names.get('n');
            const overLim = (/** @type {number} */ add) => ({ sum: [{ ref: 'lim' }, add] });
            expect(defined({ api: { ...items, where: { a: { gt: overLim(0) } } }, using: 'length' })).toBe(2);
            expect(defined({ sum: { api: { ...items, field: overLim(1) } } })).toBe(6);
            expect(defined({ expr: { api: items, using: 'length' }, using: overLim(1) })).toBe(2);
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
});
