import {
    BROKEN,
    FAILING,
    IMG,
    NATURAL_WIDTH,
    RENDERED,
    abortError,
    assign,
    bound,
    count,
    defineGetter,
    entriesOf,
    expectParseError,
    holds,
    numberTest,
    reaching,
    rejectsMatch,
    renderedText,
    run,
    throwing,
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
            const nav = (/** @type {object} */ where) => count('', entriesOf('navigation', { where }), { install });
            expect(nav({ type: 'reload' })).toBe(1);
            expect(nav({ type: { eq: 'reload' } })).toBe(1);
            expect(nav({ size: 0 })).toBe(1);
            expect(nav({ size: '0' })).toBe(0);
            expect(nav({ nothing: null })).toBe(1);
            expect(nav({ type: { in: ['navigate', 'reload'] } })).toBe(1);
            expect(nav({ type: { none: ['navigate', 'reload'] } })).toBe(0);
            expect(nav({ type: { none: { in: ['navigate', 'reload'] } } })).toBe(0);
        });

        it('rejects an array as a predicate', () => {
            const notPredicate = 'an array is not a predicate';
            rejectsMatch({ api: { path: 'document.title' }, is: ['a', 'b'] }, notPredicate);
            rejectsMatch({ api: { path: 'performance.getEntries', where: [{ a: 1 }] } }, notPredicate);
            rejectsMatch({ api: { path: 'document.title' }, is: { length: [1, 2] } }, notPredicate);
            expectParseError(withPayload(1, { when: [1, 2] }), notPredicate);
            expectParseError(withPayload(1, { buckets: { low: [0, 1] } }), notPredicate);
        });

        it('tests for one of several values with in', () => {
            const title = (/** @type {unknown} */ is, body = '<title>b</title>') => holds(body, { api: 'document.title', is });
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
            const nan = { api: { path: 'Number', args: ['x'] } };
            expect(holds('', { api: { path: 'Number', args: ['7'] }, is: { in: ['7'] } })).toBe(false);
            expect(holds('', { ...nan, is: { in: [nan] } })).toBe(false);
            expect(holds('', { ...nan, is: { in: { expr: [nan] } } })).toBe(false);
            // A selected list gives its one item, as `eq` does, and in a list entry contributes each item
            const texts = { element: { selector: 'p', field: 'textContent' } };
            expect(holds('<p>b</p>', { text: { pattern: 'b' }, is: { in: ['a', 'b'] } })).toBe(true);
            expect(title({ in: texts }, '<p>a</p><p>b</p>')).toBe(false);
            expect(title({ in: texts }, '<title>b</title><p>a</p><p>b</p>')).toBe(true);
            // Every entry is read, and a failed entry fails the test, after a match too
            expect(title({ in: [FAILING] })).toBe('aborted');
            expect(title({ in: ['b', FAILING] })).toBe('aborted');
            // At item level, `in` is a property path
            const afterCapture = assign({ myItems: [{ in: 'x', k: 1 }, { k: 2 }, { k: 3 }] });
            const items = (/** @type {object} */ where) => count('', { api: { path: 'myItems', where } }, { afterCapture });
            expect(items({ in: 'x' })).toBe(1);
            expect(items({ k: { in: [1, 3] } })).toBe(2);
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
            const type = { only: entriesOf('navigation', { field: 'type' }) };
            expect(holds('', { ...type, is: numberTest('isFinite', false) }, { install })).toBe(true);
            expect(holds('', { ...type, is: numberTest('isNaN', false) }, { install })).toBe(true);
        });

        it('reads finite, nan, exists and type as property names, and one named like an operator under `is` through the long form', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', exists: 'yes', type: 'reload' }]);
            /** @type {Array<[object, boolean]>} */
            const cases = [
                [{ div: [0, 0], is: { nan: true } }, false],
                [{ sum: [3], is: { finite: { type: 'undefined' } } }, true],
                [{ api: 'document', is: { exists: true } }, false],
                [{ api: 'document', is: { exists: { type: 'undefined' } } }, true],
                [{ ...entriesOf('navigation', { where: { exists: 'yes', type: 'reload' } }), using: 'length', is: 1 }, true],
                [{ only: entriesOf('navigation'), is: { field: 'type', is: 'reload' } }, true],
            ];
            for (const [match, expected] of cases) {
                expect(holds('', match, { install }))
                    .withContext(JSON.stringify(match))
                    .toBe(expected);
            }
        });

        it('reads property paths at item and value level, beside combinators and operators', () => {
            const html = `<input type="checkbox" checked><input type="text" value="abc">`;
            expect(count(html, { element: { selector: 'input', where: { type: 'checkbox', checked: true } } })).toBe(1);
            expect(count(html, { element: { selector: 'input', where: { 'value.length': { gt: 2 }, any: [{ type: 'text' }] } } })).toBe(1);
            expect(holds(html, { api: { path: 'document.title' }, is: { type: 'string', length: 0 } })).toBe(true);
        });

        it('rejects field or is without the other, and an unknown type name', () => {
            rejectsMatch({ element: { selector: 'p', where: { field: 'id' } }, using: 'length', is: 1 }, '`field` and `is` go together');
            rejectsMatch({ element: { selector: 'p', where: { is: 1 } }, using: 'length', is: 1 }, '`field` and `is` go together');
            rejectsMatch({ element: { selector: 'p' }, using: 'length', is: { type: 'integer' } }, 'unknown type name');
        });

        it('reads a property through the long form, inside combinators at item level', () => {
            const html = '<div role="dialog"></div><div></div>';
            const role = { field: { path: 'getAttribute', args: ['role'] }, is: 'dialog' };
            expect(count(html, { element: { selector: 'div', where: role } })).toBe(1);
            expect(count(html, { element: { selector: 'div', where: { any: [role, { id: 'x' }] } } })).toBe(1);
            expect(count(html, { element: { selector: 'div', where: { none: [{ hidden: true }] } } })).toBe(2);
        });

        it('tests failure and type over a missing property, undefined, null, a string and a number', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', u: undefined, nul: null, s: '7', num: 8 }]);
            const test = (/** @type {object} */ where) => count('', entriesOf('navigation', { where }), { install });
            expect(test({ missing: 8 })).toBe(0);
            expect(test({ missing: { fails: false } })).toBe(1);
            expect(test({ missing: { fails: true } })).toBe(0);
            expect(test({ missing: { type: 'undefined' } })).toBe(1);
            expect(test({ missing: { gte: 0 } })).toBe(0);
            expect(test({ u: { fails: false, type: 'undefined' } })).toBe(1);
            expect(test({ nul: { fails: false } })).toBe(1);
            // Comparisons coerce as JS does: `null > 7` is false, `null >= 0` and `"7" >= 7` are true
            expect(test({ nul: { gt: 7 } })).toBe(0);
            expect(test({ nul: { gte: 0 } })).toBe(1);
            expect(test({ s: { gt: 7 } })).toBe(0);
            expect(test({ s: { gte: 7 } })).toBe(1);
            // Two strings compare as strings: `"7" > "10"`
            expect(test({ s: { gt: '10' } })).toBe(1);
            expect(test({ s: { type: 'number', gt: 7 } })).toBe(0);
            expect(test({ num: { ...numberTest('isFinite'), gt: 7 } })).toBe(1);
            expect(test({ s: { ...numberTest('isFinite'), gt: 7 } })).toBe(0);
        });

        it('reports a length over a comparison on an engine without the field', () => {
            const install = timeline([{ name: 'r', entryType: 'resource' }], { missing: ['responseStatus'] });
            const where = (/** @type {object} */ status) => entriesOf('resource', { where: { responseStatus: status } });
            expect(count('', where({ gte: 400 }), { install })).toBe(0);
            expect(count('', where({ any: [{ type: 'undefined' }, { gte: 400 }] }), { install })).toBe(1);
        });

        it('compares against an operand expression, bound once', () => {
            const install = timeline([
                { name: 'nav', entryType: 'navigation', loadEventEnd: 100 },
                { name: 'a', entryType: 'resource', responseEnd: 50 },
                { name: 'b', entryType: 'resource', responseEnd: 150 },
            ]);
            const late = { ...entriesOf('resource', { where: { responseEnd: { gt: { ref: 'loadEventEnd' } } } }), using: 'length' };
            const actions = [
                { define: { loadEventEnd: { only: entriesOf('navigation', { field: 'loadEventEnd' }) } } },
                { define: { late } },
            ];
            expect(bound('', actions, 'late', { install })).toBe(1);
        });

        it('reads the native getter when the page overrides the prototype’s that a path reaches, and the page’s where none does', () => {
            const html = IMG('data-complete data-width="0"');
            const afterCapture = (/** @type {any} */ w) => defineGetter(w.HTMLImageElement.prototype, 'naturalWidth', () => 999);
            const broken = { element: BROKEN, using: 'length', is: 1 };
            expect(holds(html, reaching('HTMLImageElement.prototype', broken), { afterCapture })).toBe(true);
            expect(holds(html, reaching('HTMLImageElement.prototype', { only: NATURAL_WIDTH, is: 0 }), { afterCapture })).toBe(true);
            expect(count(html, { element: BROKEN }, { afterCapture })).toBe(0);
            expect(holds(html, { only: NATURAL_WIDTH, is: 999 }, { afterCapture })).toBe(true);
        });

        it('gives the elements of several bodies one body after another, each with its own field', () => {
            const html = '<img id="a" class="x"><img id="b">';
            const bodies = [{ selector: 'img', where: { id: 'b' } }, { selector: 'img.x' }];
            expect(count(html, { element: bodies })).toBe(2);
            expect(count(html, { element: [...bodies].reverse() })).toBe(2);
            const overlapping = {
                element: [
                    { selector: 'img', field: 'id' },
                    { selector: 'img.x', field: 'className' },
                ],
            };
            expect(count(html, { expr: overlapping })).toBe(3);
            expect(holds(html, { expr: overlapping, using: '2', is: 'x' })).toBe(true);
        });

        it('counts the elements of several bodies with nothing to test, failing on a root that fails', () => {
            const html = '<img id="a" class="x"><img id="b">';
            expect(count(html, { element: [{ selector: 'img' }, { selector: 'img.x' }] })).toBe(3);
            const install = (/** @type {any} */ w) => defineGetter(w, 'brokenRoot', throwing(new w.TypeError('broken')));
            const bodies = [{ selector: 'img' }, { selector: 'img', root: { api: 'brokenRoot' } }];
            expect(holds(html, { element: bodies, using: 'length', is: { fails: true } }, { install })).toBe(true);
        });
    });

    describe('arguments', () => {
        const html = IMG('data-width="3"') + IMG('data-width="9"');
        const widths = NATURAL_WIDTH;

        it('takes the largest and smallest item through Math.max.apply and Math.min.apply', () => {
            expect(holds(html, { api: { path: 'Math.max.apply', args: [null, widths] }, is: 9 })).toBe(true);
            expect(holds(html, { api: { path: 'Math.min.apply', args: [null, widths] }, is: 3 })).toBe(true);
            expect(
                holds('', { api: { path: 'Math.max.apply', args: [null, widths] }, is: { ...numberTest('isFinite', false), lt: 0 } }),
            ).toBe(true);
            expect(holds('', { api: { path: 'Math.max.apply', args: [null, { api: { path: 'undefined' } }] }, is: { lt: 0 } })).toBe(true);
        });

        it('extends and joins lists through concat', () => {
            const extended = { ...widths, using: { path: 'concat', args: [100] } };
            expect(holds(html, { api: { path: 'Math.max.apply', args: [null, extended] }, is: 100 })).toBe(true);
            const leading = { api: { path: 'Array.prototype.concat.call', args: [{ expr: [100] }, widths] } };
            expect(holds(html, { ...leading, using: { path: 'at', args: [0] }, is: 100 })).toBe(true);
            expect(count(html, leading)).toBe(3);
        });

        it('builds arrays from literals and expressions, inner arrays through expr', () => {
            const built = {
                api: { path: 'Array.of', args: [{ expr: [1, { element: { selector: 'img' }, using: 'length' }] }, 'x', null] },
            };
            expect(holds(html, { api: { path: 'JSON.stringify', args: [built] }, is: '[[1,2],"x",null]' })).toBe(true);
        });

        it('passes a selected list as a new array, so a method changing it leaves the list', () => {
            expect(holds(html, { api: { path: 'Array.isArray', args: [widths] }, is: true })).toBe(true);
            const actions = [
                { define: { widths } },
                { define: { reversed: { api: { path: 'Array.prototype.reverse.call', args: [{ ref: 'widths' }] } } } },
                { define: { first: { ref: 'widths', using: { path: 'at', args: [0] } } } },
            ];
            expect(bound(html, actions, 'first')).toBe(3);
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
            expect(abortError('', { api: { path: 'Array.of', args: [FAILING] }, is: {} })).toBe('SyntaxError');
            expect(holds('', { api: { path: 'Math.max', args: [7] }, is: 7 })).toBe(true);
        });

        it('fails on any throw from the call, which `fails` tests', () => {
            const install = (/** @type {any} */ w) => {
                w.Document.prototype.createElement = throwing(new w.DOMException('refused', 'SecurityError'));
            };
            /** @type {Array<[object, string, RunOptions | undefined]>} */
            const calls = [
                [{ path: 'Math.max.apply', args: [null, 5] }, 'TypeError', undefined],
                [{ path: 'Number.prototype.toFixed.call', args: [1, 500] }, 'RangeError', undefined],
                [{ path: 'document.createElement', args: ['p'] }, 'DOMException', { install }],
            ];
            for (const [api, name, options] of calls) {
                expect(abortError('', { api, is: {} }, options))
                    .withContext(name)
                    .toBe(name);
                expect(holds('', { api, is: { fails: true } }, options))
                    .withContext(name)
                    .toBe(true);
            }
        });

        it('rejects entries that are not literals, expressions or arrays', () => {
            rejectsMatch({ api: { path: 'Array.of', args: [{ composed: true }] }, is: {} }, "unknown expression key 'composed'");
        });
    });

    describe('field', () => {
        it('reads a path of several names, and length on a string, an array and a DOM collection', () => {
            const html = '<select><option>a</option><option>b</option></select>';
            expect(holds(html, { only: { element: { selector: 'select', field: 'options.length' } }, is: 2 })).toBe(true);
            expect(holds(html, { only: { element: { selector: 'select', field: 'tagName.length' } }, is: 6 })).toBe(true);
            const install = timeline([{ name: 'n', entryType: 'navigation', list: [1, 2, 3] }]);
            expect(holds('', { only: entriesOf('navigation', { field: 'list.length' }), is: 3 }, { install })).toBe(true);
        });

        it('gives undefined for a name after null or undefined, in field and in a property path', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', nothing: null }]);
            const field = (/** @type {string} */ path) => ({ only: entriesOf('navigation', { field: path }), is: { type: 'undefined' } });
            expect(holds('', field('nothing.length'), { install })).toBe(true);
            expect(holds('', field('missing.length'), { install })).toBe(true);
            expect(count('', entriesOf('navigation', { where: { 'nothing.length': { type: 'undefined' } } }), { install })).toBe(1);
        });

        it('calls the captured native method where a path reaches its holder, the page method where none does, and fails with threw when it throws', () => {
            const html = '<div role="main"></div>';
            const afterCapture = (/** @type {any} */ w) => {
                w.Element.prototype.getAttribute = () => 'evil';
            };
            const role = { only: { element: { selector: 'div', field: { path: 'getAttribute', args: ['role'] } } } };
            expect(holds(html, reaching('Element.prototype', { ...role, is: 'main' }), { afterCapture })).toBe(true);
            expect(holds(html, { ...role, is: 'evil' }, { afterCapture })).toBe(true);
            expect(holds(html, { only: { element: { selector: 'div', field: { path: 'querySelector', args: ['::::'] } } }, is: {} })).toBe(
                'aborted',
            );
        });

        it('counts words with matchAll, and none in an empty or whitespace-only string', () => {
            const words = { api: { path: 'Array.from', args: [{ api: { path: 'document.title.matchAll', args: ['\\S+'] } }] } };
            expect(count('', words, { head: '<title>Hello   there\tworld</title>' })).toBe(3);
            expect(count('', words, { head: '<title></title>' })).toBe(0);
            expect(count('', words, { head: '<title>   </title>' })).toBe(0);
        });

        it('counts rendered text as non-whitespace matches, excluding script, style, template and noscript', () => {
            const html =
                '<div id="r">ab c<script>xxxx</script><style>yy</style><template>zz</template><noscript>ww</noscript><span>d</span></div>';
            expect(count(html, { text: { xpath: RENDERED, pattern: '\\S' } })).toBe(4);
            expect(count(html, renderedText('#r'))).toBe(4);
            expect(count(html, renderedText('span'))).toBe(1);
        });

        it('counts rendered text per item, through root self in field and where', () => {
            const html = '<p class="i">ab c</p><p class="i"> </p><p class="i"><script>x</script></p>';
            const length = { ...renderedText({ self: {} }), using: 'length' };
            expect(holds(html, { sum: { element: { selector: '.i', field: length } }, is: 3 })).toBe(true);
            expect(count(html, { element: { selector: '.i', where: { none: renderedText({ self: {} }) } } })).toBe(2);
        });

        it('counts text inside two selected items in both', () => {
            const html = '<div class="c">ab<div class="c">cd</div></div>';
            const length = { ...renderedText({ self: {} }), using: 'length' };
            expect(holds(html, { sum: { element: { selector: '.c', field: length } }, is: 6 })).toBe(true);
            expect(holds(html, { sum: { element: { selector: '.c:not(.c .c)', field: length } }, is: 4 })).toBe(true);
            expect(count(html, renderedText('.c'))).toBe(4);
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

        it('takes an expression, with self the value it reads from', () => {
            const titleLength = { api: { path: 'String', args: [{ self: { path: 'title', field: 'length' } }] } };
            expect(
                holds('', { api: { path: 'document', field: titleLength }, is: '17' }, { head: '<title>Hello   there world</title>' }),
            ).toBe(true);
            const p = (/** @type {object} */ field) => ({ only: { element: { selector: 'p', field } } });
            expect(holds('<p></p>', { ...p({ api: { path: 'String', args: [{ self: 'tagName' }] } }), is: 'P' })).toBe(true);
            expect(holds('<p p="x"></p>', { ...p({ path: 'getAttribute', args: [{ self: 'tagName' }] }), is: 'x' })).toBe(true);
        });

        it('tests a value with Number.isFinite and Number.isNaN in where and under is', () => {
            const install = timeline([
                { name: 'a', entryType: 'resource', duration: NaN },
                { name: 'b', entryType: 'resource', duration: Infinity },
                { name: 'c', entryType: 'resource', duration: 5 },
            ]);
            const resources = (/** @type {object} */ where) => count('', entriesOf('resource', { where }), { install });
            expect(resources({ duration: numberTest('isFinite') })).toBe(1);
            expect(resources({ field: { api: { path: 'Number.isNaN', args: [{ self: 'duration' }] } }, is: true })).toBe(1);
            expect(resources({ duration: { ...numberTest('isFinite', false), gt: 0 } })).toBe(1);
            expect(resources({ duration: { eq: { api: 'Infinity' } } })).toBe(1);
            expect(resources({ duration: { all: [numberTest('isNaN', false), numberTest('isFinite', false)] } })).toBe(1);
        });

        it('passes further arguments beside self', () => {
            const html = IMG('data-complete data-width="3"') + IMG('data-complete data-width="9"');
            const clamp = { api: { path: 'Math.min', args: [{ self: 'naturalWidth' }, 5] } };
            expect(holds(html, { sum: { element: { selector: 'img', field: clamp } }, is: 8 })).toBe(true);
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
            expect(abortError('', { sum: [1.5], is: { field: { api: { path: 'BigInt', args: [{ self: {} }] } }, is: {} } })).toBe(
                'RangeError',
            );
            expect(abortError('', { sum: [1], is: { field: { api: { path: 'Math', args: [{ self: {} }] } }, is: {} } })).toBe('TypeError');
        });

        it('rejects malformed fields', () => {
            const field = (/** @type {object} */ body) => ({ only: { element: { selector: 'p', field: body } }, is: {} });
            rejectsMatch(field({}), '`field` needs `path`');
            rejectsMatch(field({ calls: 1 }), "unknown key 'calls'");
            rejectsMatch(field({ call: { api: 'String' } }), "unknown key 'call'");
            rejectsMatch(field({ args: [] }), '`args` needs `path`');
            rejectsMatch(field({ feature: 'renderedTextLength' }), "unknown key 'feature'");
        });
    });

    describe('self', () => {
        it('reads the value beside using: a value, a list, its length and the value itself', () => {
            const head = '<title>Hello there</title>';
            expect(holds('', { api: 'document.title', using: { self: {} }, is: 'Hello there' }, { head })).toBe(true);
            expect(holds('', { api: 'document.title', using: { self: 'length' }, is: 11 }, { head })).toBe(true);
            expect(holds('<p></p><p></p>', { element: { selector: 'p' }, using: { self: 'length' }, is: 2 })).toBe(true);
            const html = IMG('data-complete data-width="3"') + IMG('data-complete data-width="9"');
            expect(holds(html, { ...NATURAL_WIDTH, using: { api: { path: 'Math.max.apply', args: [null, { self: {} }] } }, is: 9 })).toBe(
                true,
            );
        });

        it('mixes several reads of the value beside using', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', transferSize: 50, decodedBodySize: 200 }]);
            const ratio = { only: entriesOf('navigation'), using: { div: [{ self: 'transferSize' }, { self: 'decodedBodySize' }] } };
            expect(holds('', { ...ratio, is: 0.25 }, { install })).toBe(true);
            expect(bound('', { define: { ratio } }, 'ratio', { install })).toBe(0.25);
        });

        it('compares two fields of one item', () => {
            const items = { path: 'JSON.parse', args: ['[{"s":1,"e":5},{"s":4,"e":5}]'] };
            expect(count('', { api: { ...items, where: { e: { gt: { sum: [{ self: 's' }, 2] } } } } })).toBe(1);
        });

        it('binds self in a nested where to the inner item, and in a field under a key to that value', () => {
            const outer = { path: 'JSON.parse', args: ['[{"n":0,"xs":[{"n":1,"v":2},{"n":3,"v":2}]}]'] };
            const field = { self: { path: 'xs', where: { v: { gt: { self: 'n' } } } } };
            expect(count('', { only: { api: { ...outer, field } } })).toBe(1);
            const items = { path: 'JSON.parse', args: ['[{"nested":{"x":3}},{"nested":{"x":4}}]'] };
            expect(count('', { api: { ...items, where: { nested: { field: { self: 'x' }, is: 3 } } } })).toBe(1);
        });

        it('reads a list inside another where, its own self its own item', () => {
            const values = {
                api: { path: 'JSON.parse', args: ['[{"v":1,"w":0},{"v":5,"w":9}]'], where: { v: { gt: { self: 'w' } } }, field: 'v' },
            };
            expect(
                count('<p>a</p><p>b</p><p>cc</p>', {
                    element: { selector: 'p', where: { 'textContent.length': { lte: { sum: values } } } },
                }),
            ).toBe(2);
        });

        it('rejects self outside a binder, and `using` without a path or an expression', () => {
            rejectsMatch({ self: 'x' }, '`self` reads from `using`, `where` or `field`');
            expectParseError(withPayload({ self: {} }), '`self` reads from');
            rejectsMatch({ api: 'document', using: {}, is: {} }, '`using` needs `path` or an expression');
        });
    });

    describe('expressions in where', () => {
        const items = { path: 'JSON.parse', args: ['[{"a":1,"b":0},{"a":2,"b":5},{"a":3,"b":0}]'] };

        it('tests each item with a boolean expression over self, an inherited property included', () => {
            const has = (/** @type {string} */ name) => ({ api: { path: 'Reflect.has', args: [{ self: {} }, name] } });
            const sparse = { path: 'JSON.parse', args: ['[{"a":1},{"b":2},{"a":3}]'] };
            expect(count('', { api: { ...sparse, where: has('a') } })).toBe(2);
            expect(count('<p></p><p></p>', { element: { selector: 'p', where: has('tagName') } })).toBe(2);
            expect(count('<p></p><p></p>', { element: { selector: 'p', where: has('noSuchProperty') } })).toBe(0);
        });

        it('mixes expressions and predicates under any, all and none', () => {
            const matching = (/** @type {unknown} */ where) => count('', { api: { ...items, where } });
            expect(matching({ self: 'b', is: { gt: 1 } })).toBe(1);
            expect(matching({ any: [{ self: 'b', is: { gt: 1 } }, { a: 1 }] })).toBe(2);
            expect(matching({ any: [{ self: 'b', is: 5 }, { a: 3 }] })).toBe(2);
            expect(matching({ all: [{ a: { gt: 1 } }, { self: 'b', is: 0 }] })).toBe(1);
            expect(matching({ none: [{ self: 'b', is: 0 }], a: { gt: 0 } })).toBe(1);
        });

        it('scopes a source to the item', () => {
            const html = '<div class="card"><img></div><div class="card"></div><div class="card"><p><img></p></div>';
            const withImage = { element: { selector: 'img', root: { self: {} } } };
            expect(count(html, { element: { selector: '.card', where: withImage } })).toBe(2);
            const twoParagraphs = { element: { selector: 'p', root: { self: {} } }, using: 'length', is: { gte: 2 } };
            expect(count('<div><p></p><p></p></div><div><p></p></div>', { element: { selector: 'div', where: twoParagraphs } })).toBe(1);
        });

        it('computes an expression once per item, whether it reads self or not', () => {
            let calls = 0;
            let reads = 0;
            const probe = (/** @type {number} */ v) => {
                calls++;
                return v > 1;
            };
            const flag = () => {
                reads++;
                return true;
            };
            const install = assign({ probe });
            // Defined after the capture, which reads a path through any getter it captured
            const afterCapture = (/** @type {any} */ w) => defineGetter(w, 'flag', flag);
            const html = '<p>a</p><p>bb</p><p>ccc</p>';
            const probed = { field: { api: { path: 'probe', args: [{ self: 'textContent.length' }] } }, is: true };
            expect(count(html, { element: { selector: 'p', where: probed } }, { install })).toBe(2);
            expect(calls).toBe(3);
            const flagged = { element: { selector: 'p', where: { api: 'flag' } }, using: 'length', is: 3 };
            expect(holds(html, flagged, { afterCapture })).toBe(true);
            expect(reads).toBe(3);
            expect(holds(html, { all: [flagged, flagged] }, { afterCapture })).toBe(true);
            expect(reads).toBe(9);
        });

        it('reads a value defined before the where once for every item', () => {
            let reads = 0;
            const afterCapture = (/** @type {any} */ w) =>
                defineGetter(w, 'flag', () => {
                    reads++;
                    return true;
                });
            const actions = [
                { define: { f: { api: 'flag' } } },
                { define: { n: { api: { ...items, where: { ref: 'f' } }, using: 'length' } } },
            ];
            expect(run('', { actions }, { afterCapture }).names.get('n')).toBe(3);
            expect(reads).toBe(1);
        });

        it('reads a name a define inside the where binds again for each item', () => {
            const big = (/** @type {unknown} */ read) => ({
                if: { self: 'a', is: { gt: 0 } },
                then: [{ define: { current: { self: 'a' } } }, read],
                else: false,
            });
            expect(count('', { api: { ...items, where: big({ ref: 'current', is: { gt: 1 } }) } })).toBe(2);
            expect(count('', { api: { ...items, where: big({ sum: [{ ref: 'current' }, 0], is: { gt: 1 } }) } })).toBe(2);
            // From a nested where, field or using, which bind `self` again. Only `current` 2 holds each
            const nestedWhere = { api: { ...items, where: { a: { gt: { ref: 'current' } } } }, using: 'length', is: 1 };
            const nestedField = { sum: { api: { ...items, field: { ref: 'current' } } }, is: 6 };
            const nestedUsing = { expr: { api: items, using: 'length' }, using: { sum: [{ self: {} }, { ref: 'current' }] }, is: 5 };
            for (const nested of [nestedWhere, nestedField, nestedUsing]) {
                expect(count('', { api: { ...items, where: big({ all: [nested] }) } })).toBe(1);
            }
        });

        it('runs an action once per item', () => {
            const where = { if: true, then: [{ fireEvent: { type: 'item' } }, true], else: false };
            const { events } = run('', { actions: { define: { n: { api: { ...items, where }, using: 'length' } } } });
            expect(events.length).toBe(3);
        });

        it('tests a when or bucket reading self per item', () => {
            const sent = (/** @type {object} */ extra) => {
                const where = { if: true, then: [{ fireEvent: { type: 'item', data: { x: { value: 1, ...extra } } } }, true], else: false };
                return run('', { actions: { define: { n: { api: { ...items, where }, using: 'length' } } } }).events.map((e) => e.data);
            };
            expect(sent({ when: { eq: { self: 'a' } } })).toEqual([{ x: 1 }, {}, {}]);
            expect(sent({ buckets: { first: { eq: { self: 'a' } } } })).toEqual([{ x: 'first' }, {}, {}]);
        });

        it('computes an expression over a ref inside a where, field or using that reads no self', () => {
            const defined = (/** @type {unknown} */ n) => run('', { actions: [{ define: { lim: 1 } }, { define: { n } }] }).names.get('n');
            const overLim = (/** @type {number} */ add) => ({ sum: [{ ref: 'lim' }, add] });
            expect(defined({ api: { ...items, where: { a: { gt: overLim(0) } } }, using: 'length' })).toBe(2);
            expect(defined({ sum: { api: { ...items, field: overLim(1) } } })).toBe(6);
            expect(defined({ expr: { api: items, using: 'length' }, using: overLim(1) })).toBe(2);
        });

        it('fails the source on a failed read, unless the test reads it with fails', () => {
            const install = assign({ things: [{ v: 1 }, defineGetter({}, 'v', throwing(new TypeError('no'))), { v: 1 }] });
            expect(holds('', { api: { path: 'things', where: { self: 'v', is: 1 } }, using: 'length', is: 2 }, { install })).toBe(
                'aborted',
            );
            expect(count('', { api: { path: 'things', where: { self: 'v', is: { fails: false, eq: 1 } } } }, { install })).toBe(2);
        });

        it('reads a property named like an expression key through the long form', () => {
            const html = '<select><option>Sign in</option><option>Other</option></select>';
            const options = (/** @type {unknown} */ where) => count(html, { element: { selector: 'option', visibility: 'any', where } });
            expect(options({ field: 'text', is: 'Sign in' })).toBe(1);
            expect(options({ self: 'text', is: 'Sign in' })).toBe(1);
            rejectsMatch({ element: { selector: 'option', where: { text: 'Sign in' } } });
        });

        it('rejects an object mixing expression keys and property paths', () => {
            rejectsMatch({ api: { ...items, where: { self: 'a', is: 1, b: 0 } }, using: 'length', is: 1 }, "unknown expression key 'b'");
        });
    });
});
