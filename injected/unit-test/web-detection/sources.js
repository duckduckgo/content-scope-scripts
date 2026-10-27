import { JSDOM } from 'jsdom';
import { compileDetector } from '../../src/features/web-detection/compile/compile.js';
import { EvaluationContext } from '../../src/features/web-detection/evaluate/context.js';
import { NativeReader } from '../../src/features/web-detection/evaluate/native-reader.js';
import { createDetectorState, runDetector } from '../../src/features/web-detection/evaluate/run.js';
import { TaskReadCache } from '../../src/features/web-detection/evaluate/task-read-cache.js';
import { pageSources } from '../../src/features/web-detection/sources/index.js';
import {
    REPORT,
    RENDERED,
    abortError,
    assign,
    bound,
    count,
    defineGetter,
    entriesOf,
    fonts,
    holds,
    reaching,
    rejectsMatch,
    throwing,
    timeline,
} from './support.js';

/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.js').DetectorConfig} RawDetectorConfig
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.js').TextBody} TextBody
 */

describe('WebDetection sources', () => {
    describe('iterators', () => {
        it('agrees in boolean position with a length of at least one', () => {
            const sources = [{ text: { pattern: 'foo' } }, { element: { selector: '.foo' } }];
            for (const html of ['<p>foo</p>', '<p>bar</p>', '<p>foo foo</p>', '<p class="foo"></p>']) {
                for (const source of sources) {
                    expect(holds(html, source))
                        .withContext(`${html} ${JSON.stringify(source)}`)
                        .toBe(holds(html, { ...source, using: 'length', is: { gte: 1 } }));
                }
            }
        });

        it('counts non-overlapping matches across selectors and XPath expressions', () => {
            expect(
                count('<h1>error</h1><p>error and error</p>', { text: { selector: 'h1', xpath: '//p//text()', pattern: 'error' } }),
            ).toBe(3);
        });

        it('counts a match straddling an XPath chunk boundary once', () => {
            const filler = 'x '.repeat(20);
            // Many short nodes so chunks flush mid-phrase
            const html = `<p>${filler}</p><p>page</p><p> not </p><p>found</p><p>${filler}</p><p>page not found</p>`;
            for (const chunkSize of [0, 8, 16, 1024]) {
                const text = { xpath: '//p/text()', pattern: 'page not found', xpathConfig: { chunkSize, chunkTail: 32 } };
                expect(count(html, { text })).withContext(`chunkSize ${chunkSize}`).toBe(2);
            }
        });

        it('counts empty matches as matchAll does, across XPath chunk sizes', () => {
            for (const pattern of ['', 'x?', 'b|', '$']) {
                const expected = [...'abcd'.matchAll(new RegExp(pattern, 'gi'))].length;
                for (const chunkSize of [0, 1, 2, 1024]) {
                    const text = { xpath: '//p/text()', pattern, xpathConfig: { chunkSize, chunkTail: 1 } };
                    expect(count('<p>ab</p><p>cd</p>', { text })).withContext(`${pattern} at chunkSize ${chunkSize}`).toBe(expected);
                }
            }
            expect(count('<p>abc</p>', { text: { pattern: [] } })).toBe(0);
        });
    });

    describe('api', () => {
        it('takes a path as short for a body with that path, and gives a scalar its value, a string not being a list', () => {
            const head = '<title>Hello there</title>';
            expect(holds('', { api: 'document.title', is: 'Hello there' }, { head })).toBe(true);
            expect(holds('', { api: { path: 'Math.max', args: [1, { api: 'document.title.length' }] }, is: 11 }, { head })).toBe(true);
            expect(holds('', { api: 'document.title', using: 'length', is: 11 }, { head })).toBe(true);
            expect(holds('', { only: { api: { path: 'document.title' } }, is: 'Hello there' }, { head })).toBe('error');
            rejectsMatch({ api: 5 }, '`api` takes a path or an object');
            rejectsMatch({ api: '' }, 'non-empty');
        });

        it('gives an iterable as a value under is and using, and its members as a list with field and where', () => {
            const install = fonts(['loaded', 'error', 'error']);
            expect(holds('', { api: { path: 'document.fonts' }, is: { type: 'object' } }, { install })).toBe(true);
            expect(holds('', { api: { path: 'document.fonts' }, using: 'size', is: 3 }, { install })).toBe(true);
            // `length` reads the iterable's own property, which a `FontFaceSet` lacks
            expect(holds('', { api: { path: 'document.fonts' }, using: 'length', is: { type: 'undefined' } }, { install })).toBe(true);
            const statuses = { api: { path: 'document.fonts', field: 'status' } };
            expect(count('', statuses, { install })).toBe(3);
            expect(holds('', { ...statuses, using: { path: 'at', args: [-1] }, is: 'error' }, { install })).toBe(true);
            expect(count('', { api: { path: 'document.fonts', where: { status: 'error' } } }, { install })).toBe(2);
            expect(count('<p></p><p></p>', { api: { path: 'document.body.children' } })).toBe(2);
            expect(holds('', { api: { path: 'document', field: 'title.length' }, is: 0 })).toBe(true);
        });

        it('reads a path from root', () => {
            const install = timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900, responseStatus: 200 }]);
            const read = {
                all: [
                    { ref: 'navigation', using: 'loadEventEnd', is: 900 },
                    { ref: 'navigation', using: 'responseStatus', is: 200 },
                ],
            };
            expect(
                bound('', [{ define: { navigation: { only: entriesOf('navigation') } } }, { define: { read } }], 'read', { install }),
            ).toBe(true);
            const ids = '<p id="a"></p><p id="b"></p>';
            expect(holds(ids, { element: { selector: 'p', field: 'id' }, using: { path: 'at', args: [-1] }, is: 'b' })).toBe(true);
            expect(count(ids, { element: { selector: 'p' } })).toBe(2);
        });

        it('reads a value the page defines, or a prototype it substitutes, as it stands, and a captured getter', () => {
            const definesValue = (/** @type {any} */ w) => {
                w.document.myValue = 3;
                w.myData = { count: 3 };
            };
            expect(holds('', { api: { path: 'document.myValue' }, is: 3 }, { afterCapture: definesValue })).toBe(true);
            expect(holds('', { api: { path: 'myData.count' }, is: 3 }, { afterCapture: definesValue })).toBe(true);
            expect(holds('<p id="a"></p>', { only: { element: { selector: 'p' } }, is: { id: 'a' } })).toBe(true);
            // On body rather than document, whose event methods JSDOM still needs after the run
            const substitutes = (/** @type {any} */ w) => {
                Object.setPrototypeOf(w.document.body, { tagName: 'FAKE' });
            };
            expect(holds('', { api: { path: 'document.body.tagName' }, is: 'FAKE' }, { afterCapture: substitutes })).toBe(true);
        });

        it('reads an own value in place of a value captured on a prototype', () => {
            const afterCapture = (/** @type {any} */ w) => {
                class NetworkError extends w.Error {
                    constructor() {
                        super('timed out');
                        this.name = 'NetworkError';
                    }
                }
                w.lastError = new NetworkError();
                w.bareError = new w.Error();
                class PagePlayer extends w.HTMLElement {}
                w.customElements.define('page-player', PagePlayer);
                w.player = w.document.createElement('page-player');
                w.queue = [];
                w.queue.push = function pagePush() {};
            };
            expect(holds('', { api: 'lastError.message', is: 'timed out' }, { afterCapture })).toBe(true);
            expect(holds('', { api: 'lastError', using: 'name', is: 'NetworkError' }, { afterCapture })).toBe(true);
            expect(holds('', { api: 'bareError.message', is: '' }, { afterCapture })).toBe(true);
            expect(holds('', { api: 'player.constructor.name', is: 'PagePlayer' }, { afterCapture })).toBe(true);
            expect(holds('', { api: 'queue.push.name', is: 'pagePush' }, { afterCapture })).toBe(true);
            // A call uses the captured method where a path reaches its holder, and the page's where none does
            const push = { api: { path: 'queue.push', args: [1] } };
            expect(holds('', reaching('Array.prototype', { ...push, is: 1 }), { afterCapture })).toBe(true);
            expect(holds('', { ...push, is: { type: 'undefined' } }, { afterCapture })).toBe(true);
        });

        it('fails rather than call a page getter in place of a value captured on a prototype', () => {
            let calls = 0;
            const install = (/** @type {any} */ w) => {
                w.Defaults = class {};
                w.Defaults.prototype.label = 'default';
                w.plain = new w.Defaults();
            };
            const afterCapture = (/** @type {any} */ w) => {
                w.owned = new w.Defaults();
                w.owned.label = 'own';
                w.shadowed = new w.Defaults();
                const get = () => {
                    calls++;
                    return 'page';
                };
                Object.defineProperty(w.shadowed, 'label', { get });
                Object.defineProperty(w.Defaults.prototype, 'label', { get });
            };
            expect(abortError('', reaching('Defaults.prototype', { api: 'shadowed.label', is: 'page' }), { install, afterCapture })).toBe(
                'PageAccessor',
            );
            expect(holds('', { api: 'plain.label', is: 'default' }, { install, afterCapture })).toBe(true);
            expect(holds('', { api: 'owned.label', is: 'own' }, { install, afterCapture })).toBe(true);
            expect(calls).toBe(0);
        });

        it('reads the length of a page Proxy over an array by descriptor where a path reaches its prototype, and fails when a trap it calls throws', () => {
            const trapped = (/** @type {object} */ target, /** @type {string} */ trap, /** @type {unknown} */ match) => {
                const afterCapture = (/** @type {any} */ w) => {
                    w.trapped = new Proxy(target, { [trap]: throwing(new w.TypeError('trapped')) });
                };
                return holds('', match, { afterCapture });
            };
            for (const match of [
                { api: 'trapped.length', is: 2 },
                { api: 'trapped', using: 'length', is: 2 },
            ]) {
                expect(trapped([1, 2], 'getOwnPropertyDescriptor', reaching('Array.prototype', match))).toBe('aborted');
                expect(trapped([1, 2], 'get', reaching('Array.prototype', match))).toBe(true);
                // Where no path reaches `Array.prototype`, `length` is read as it stands
                expect(trapped([1, 2], 'getOwnPropertyDescriptor', match)).toBe(true);
                expect(trapped([1, 2], 'get', match)).toBe('aborted');
            }
            expect(trapped({}, 'get', { api: { path: 'trapped.anything' }, is: { fails: true } })).toBe(true);
            expect(trapped({}, 'getPrototypeOf', { api: 'trapped.anything' })).toBe('aborted');
            for (const trap of ['getPrototypeOf', 'getOwnPropertyDescriptor']) {
                expect(trapped({}, trap, { api: { path: 'trapped.anything', args: [] } })).toBe('aborted');
                expect(trapped({}, trap, { api: 'document.title', is: { in: { api: 'trapped' } } })).toBe('aborted');
                expect(trapped({}, trap, { api: { path: 'trapped', where: { a: 1 } }, using: 'length', is: 0 })).toBe('aborted');
                expect(trapped({}, trap, { element: { selector: 'p', root: { api: 'trapped' } } })).toBe('aborted');
            }
        });

        it('reads a getter defined on the object itself, where nothing was captured', () => {
            // A getter on the instance, as browsers define `location.href`
            const install = (/** @type {any} */ w) => {
                const location = {};
                Object.defineProperty(location, 'href', { get: () => 'https://example.com/', enumerable: true });
                defineGetter(w, 'fakeLocation', () => location);
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
            expect(count('', { api: { path: 'labelItems', where: { label: 'two' } } }, { install: labelled })).toBe(1);
        });

        it('reads through a chain the page changes between runs of one reader', () => {
            const window = new JSDOM('<!DOCTYPE html><html><body></body></html>').window;
            labelled(window);
            const compiled = compileDetector(
                { actions: { define: { label: { api: { path: 'labelItems.0.label' } } } } },
                pageSources(window),
            );
            const reader = new NativeReader(window, compiled.names, compiled.paths);
            const label = () => {
                const state = createDetectorState();
                const ctx = new EvaluationContext(reader, state.names);
                runDetector(compiled, state, ctx);
                return ctx.runNames.get('label');
            };
            expect(label()).toBe('one');
            Object.setPrototypeOf(window.LabelMiddle.prototype, window.LabelTwo.prototype);
            expect(label()).toBe('two');
        });

        it('fails when iterating a page list throws', () => {
            /** @type {Record<string, (w: any) => unknown>} */
            const lists = {
                iterator: (w) => ({ [Symbol.iterator]: throwing(new w.TypeError('page')) }),
                next: (w) => ({
                    *[Symbol.iterator]() {
                        yield w.document.body;
                        throw new w.TypeError('page');
                    },
                }),
                index: (w) => defineGetter([w.document.body, w.document.body], '1', throwing(new w.TypeError('page'))),
            };
            for (const list of Object.values(lists)) {
                const afterCapture = (/** @type {any} */ w) => {
                    w.pageList = list(w);
                };
                const detected = (/** @type {unknown} */ match) => holds('', match, { afterCapture });
                expect(detected({ sum: { api: 'pageList' }, is: 0 })).toBe('aborted');
                expect(detected({ api: 'document.title', is: { in: { api: 'pageList' } } })).toBe('aborted');
                expect(detected({ api: { path: 'pageList', where: { a: 1 } }, using: 'length', is: 0 })).toBe('aborted');
                expect(detected({ element: { selector: 'p', root: { api: 'pageList' } } })).toBe('aborted');
            }
        });

        it('skips a holder whose descriptor read throws, and captures from the rest', () => {
            // As a cross-origin frame's WindowProxy, reached as `window[0]`, throws on every read
            const install = (/** @type {any} */ w) => {
                const blocked = throwing(new w.DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError'));
                w.crossOriginFrame = new Proxy({}, { getOwnPropertyDescriptor: blocked });
                w.TrappedConstructor = new Proxy(function () {}, {
                    getOwnPropertyDescriptor: (target, key) =>
                        key === 'prototype' ? blocked() : Reflect.getOwnPropertyDescriptor(target, key),
                });
            };
            const afterCapture = (/** @type {any} */ w) => defineGetter(w.Document.prototype, 'title', () => 'page override');
            const title = reaching('crossOriginFrame', reaching('TrappedConstructor', { api: { path: 'document.title' }, is: '' }));
            expect(holds('', title, { install })).toBe(true);
            expect(holds('', title, { install, afterCapture })).toBe(true);
        });

        it('does not call a page override of iteration', () => {
            const afterCapture = (/** @type {any} */ w) => {
                w.FakeFontFaceSet.prototype[Symbol.iterator] = throwing(new Error('page override called'));
            };
            expect(count('', { api: { path: 'document.fonts', field: 'status' } }, { install: fonts(['a', 'b']), afterCapture })).toBe(2);
        });

        it('fails with threw when a getter throws', () => {
            const install = (/** @type {any} */ w) => defineGetter(w.Document.prototype, 'cookie', throwing(new Error('sandboxed')));
            expect(abortError('', { api: { path: 'document.cookie' }, is: { type: 'string' } }, { install })).toBe('Error');
            expect(holds('', { api: { path: 'document.cookie' }, is: { fails: true } }, { install })).toBe(true);
        });

        it('calls the captured native method the path names', () => {
            const install = timeline([{ name: 'first-contentful-paint', entryType: 'paint', startTime: 120 }]);
            const afterCapture = (/** @type {any} */ w) => {
                w.Performance.prototype.getEntriesByName = () => [];
            };
            const read = {
                only: { api: { path: 'performance.getEntriesByName', args: ['first-contentful-paint', 'paint'], field: 'startTime' } },
            };
            expect(holds('', { ...read, is: 120 }, { install, afterCapture })).toBe(true);
        });

        it('calls the captured Function.prototype methods', () => {
            // JSDOM shares this process's `Function`, so the override is undone before anything else runs
            const original = Object.getOwnPropertyDescriptor(Function.prototype, 'apply');
            let calls = 0;
            const afterCapture = (/** @type {any} */ w) => {
                Object.defineProperty(w.Function.prototype, 'apply', {
                    configurable: true,
                    writable: true,
                    value(/** @type {unknown[]} */ ...args) {
                        if (this === w.Math.max) {
                            calls++;
                            return -1;
                        }
                        return Reflect.apply(/** @type {Function} */ (original?.value), this, args);
                    },
                });
            };
            try {
                expect(holds('', { api: { path: 'Math.max.apply', args: [null, { expr: [3, 9, 4] }] }, is: 9 }, { afterCapture })).toBe(
                    true,
                );
            } finally {
                // eslint-disable-next-line no-extend-native -- intentional: restoring the native the page override replaced
                Object.defineProperty(Function.prototype, 'apply', /** @type {PropertyDescriptor} */ (original));
            }
            expect(calls).toBe(0);
        });

        it('captures names added later, and keeps those it already captured', () => {
            const window = new JSDOM('<!DOCTYPE html><title>native</title>').window;
            const replace = (/** @type {object} */ prototype, /** @type {string} */ name) => defineGetter(prototype, name, () => 'page');
            const reader = new NativeReader(window, ['document', 'title'], ['document']);
            replace(window.Document.prototype, 'title');
            reader.capture(['title', 'nodeName']);
            replace(window.Node.prototype, 'nodeName');
            expect(reader.read(window.document, 'title')).toBe('native');
            expect(reader.read(window.document, 'nodeName')).toBe('#document');
        });

        it('captures only from the global and its chain with no paths', () => {
            const window = new JSDOM('<!DOCTYPE html><title>native</title>').window;
            const reader = new NativeReader(window, ['title'], []);
            defineGetter(window.Document.prototype, 'title', () => 'page');
            expect(reader.read(window.document, 'title')).toBe('page');
        });

        it('captures from the chain of a value a path reaches, for a name read off any value on that chain', () => {
            const install = (/** @type {any} */ w) => {
                w.Item = class {
                    get label() {
                        return 'native';
                    }
                };
                w.current = new w.Item();
                w.makeItem = () => new w.Item();
            };
            const afterCapture = (/** @type {any} */ w) => defineGetter(w.Item.prototype, 'label', () => 'page');
            const made = { api: { path: 'makeItem', args: [] }, using: 'label' };
            expect(holds('', reaching('current', { ...made, is: 'native' }), { install, afterCapture })).toBe(true);
            expect(holds('', { ...made, is: 'page' }, { install, afterCapture })).toBe(true);
        });

        it('does not call at capture a getter it did not capture', () => {
            let reads = 0;
            const install = (/** @type {any} */ w) => {
                const box = {};
                defineGetter(box, 'inner', () => {
                    reads++;
                    return { value: 1 };
                });
                w.outer = { box };
            };
            const window = new JSDOM('<!DOCTYPE html>').window;
            install(window);
            const compiled = compileDetector({ actions: { define: { v: { api: 'outer.box.inner.value' } } } }, pageSources(window));
            const reader = new NativeReader(window, compiled.names, compiled.paths);
            expect(reads).toBe(0);
            expect(reader.read(window.outer.box, 'inner')).toEqual({ value: 1 });
            expect(reads).toBe(1);
        });

        it("reads a function's own name and length over the captured Function.prototype defaults", () => {
            const afterCapture = (/** @type {any} */ w) => {
                w.handler = function handler(/** @type {unknown} */ event, /** @type {unknown} */ extra) {
                    return [event, extra];
                };
            };
            expect(holds('', { api: 'handler.constructor.name', is: 'Function' }, { afterCapture })).toBe(true);
            expect(holds('', { api: 'handler.name', is: 'handler' }, { afterCapture })).toBe(true);
            expect(holds('', { api: 'handler', using: 'length', is: 2 }, { afterCapture })).toBe(true);
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
            const resources = (/** @type {object} */ where) => count('', entriesOf('resource', { where }), { install });
            expect(resources({ duration: { gt: 1000 }, initiatorType: { in: ['img', 'css'] } })).toBe(1);
            expect(resources({ responseStatus: { gte: 400 } })).toBe(0);
        });

        it('errors on `where` over a value that is not a list, or an item that is not an object', () => {
            expect(holds('', { api: { path: 'document.title', where: { length: 0 } }, using: 'length', is: 1 })).toBe('error');
            const afterCapture = assign({ myList: ['a', 'b'] });
            expect(holds('', { api: { path: 'myList', where: { length: 1 } }, using: 'length', is: 2 }, { afterCapture })).toBe('error');
        });
    });

    describe('root', () => {
        const html = '<div id="comments"><img src="a.png"><p>hello</p></div><img src="b.png"><p>hello</p>';

        it('scopes element and text in every position', () => {
            expect(count(html, { element: { selector: 'img', root: '#comments' } })).toBe(1);
            expect(count(html, { text: { pattern: 'hello', root: '#comments' } })).toBe(1);
            expect(count(html, { text: { selector: 'p', pattern: 'hello', root: '#comments' } })).toBe(1);
            expect(count(html, { text: { xpath: './/text()', pattern: 'hello', root: '#comments' } })).toBe(1);
            expect(holds(html, { element: { selector: 'img', root: '#comments' } })).toBe(true);
            expect(holds(html, { only: { element: { selector: 'img', field: 'tagName', root: '#comments' } }, is: 'IMG' })).toBe(true);
        });

        it('scopes element and text by an expression giving a node or a list of nodes', () => {
            const guarded = (/** @type {object} */ scoped) => [
                { define: { comments: { element: { selector: '#comments' } } } },
                { define: { held: { all: [{ ref: 'comments' }, scoped] } } },
            ];
            const images = (/** @type {number} */ n) => ({
                element: { selector: 'img', root: { ref: 'comments' } },
                using: 'length',
                is: n,
            });
            expect(bound(html, guarded(images(1)), 'held')).toBe(true);
            expect(bound(html, guarded({ text: { pattern: 'hello', root: { ref: 'comments' } }, using: 'length', is: 1 }), 'held')).toBe(
                true,
            );
            expect(bound('<img>', guarded(images(0)), 'held')).toBe(false);
            expect(count(html, { element: { selector: 'img', root: { only: { element: { selector: '#comments' } } } } })).toBe(1);
            expect(count(html, { element: { selector: 'img', root: { api: { path: 'document.body' } } } })).toBe(2);
        });

        it('reaches an open shadow root through an api root', () => {
            const afterCapture = (/** @type {any} */ w) => {
                w.document.querySelector('x-widget').attachShadow({ mode: 'open' }).innerHTML = '<img><img>';
            };
            const images = { element: { selector: 'img', root: { only: { element: { selector: 'x-widget' } }, using: 'shadowRoot' } } };
            expect(count('<x-widget></x-widget><img>', images, { afterCapture })).toBe(2);
            expect(count('<x-widget></x-widget><img>', images)).toBe(0);
        });

        it('errors on a root that is not a selector or a node', () => {
            expect(
                holds('<p></p>', { element: { selector: 'p', root: { api: { path: 'document.title.length' } } }, using: 'length', is: 0 }),
            ).toBe('error');
            expect(holds('<p></p>', { element: { selector: 'p', root: [1] }, using: 'length', is: 0 })).toBe('error');
        });

        it('scopes to the union of an array of selectors and expressions', () => {
            const html = '<div id="a"><img></div><div id="b"><img><img></div><img>';
            const images = (/** @type {unknown} */ root) => count(html, { element: { selector: 'img', root } });
            expect(images(['#a', { only: { element: { selector: '#b' } } }])).toBe(3);
            expect(images([{ api: { path: 'document.body' } }, '#a'])).toBe(4);
            expect(images({ api: { path: 'document.body.firstElementChild.tagName' } })).toBe(3);
            expect(images(['#a', null])).toBe(1);
            rejectsMatch({ element: { selector: 'img', root: [] } }, 'at least one entry');
        });

        it('drops a root inside another', () => {
            expect(count('<div class="r"><div class="r"><img></div></div>', { element: { selector: 'img', root: '.r' } })).toBe(1);
        });

        it('drops a root inside a later entry', () => {
            const html = '<div id="a"><img>x</div><img>x';
            const roots = ['#a', { api: { path: 'document.body' } }];
            expect(count(html, { element: { selector: 'img', root: roots } })).toBe(2);
            expect(count(html, { text: { pattern: 'x', root: roots } })).toBe(2);
        });

        it('selects no items when root matches nothing', () => {
            expect(count(html, { element: { selector: 'img', root: '#missing' } })).toBe(0);
            expect(holds(html, { text: { pattern: 'hello', root: '#missing' } })).toBe(false);
        });
    });

    describe('reads in a task', () => {
        const PAGE = '<div id="a"><p>adblocker detected</p></div><div id="b"><p>adblocker detected</p></div>';

        /**
         * Run detectors one after another on one page, each with its own state, all in `task`.
         * `between` runs after each detector, as a detector's `call` could change the page.
         *
         * @param {string} body
         * @param {RawDetectorConfig[]} detectors
         * @param {object} [options]
         * @param {(document: Document) => void} [options.between]
         * @param {(i: number) => TaskReadCache} [options.taskFor] - the task of the i-th detector
         */
        function runInTask(body, detectors, { between = () => {}, taskFor } = {}) {
            const window = new JSDOM(`<!DOCTYPE html><html><body>${body}</body></html>`).window;
            const originalDocument = globalThis.document;
            globalThis.document = window.document;
            const shared = new TaskReadCache();
            try {
                return detectors.map((detector, i) => {
                    const compiled = compileDetector(detector, pageSources(window));
                    const state = createDetectorState();
                    const ctx = new EvaluationContext(
                        new NativeReader(window, compiled.names, compiled.paths),
                        state.names,
                        taskFor?.(i) ?? shared,
                    );
                    const result = runDetector(compiled, state, ctx);
                    between(window.document);
                    return { ...result, names: ctx.runNames };
                });
            } finally {
                globalThis.document = originalDocument;
            }
        }

        /** The `match` result of each detector `runInTask` runs. */
        const matches = (/** @type {Parameters<typeof runInTask>} */ ...args) => runInTask(...args).map((result) => result.match);

        /** @param {Document} document */
        const clearText = (document) => {
            for (const p of document.querySelectorAll('p')) p.textContent = 'nothing here';
        };

        /** @param {TextBody} text */
        const matching = (text) => ({ match: { text }, actions: REPORT });
        const wall = (/** @type {Partial<TextBody>} */ extra = {}) =>
            matching({ xpath: RENDERED, pattern: 'adblocker detected', ...extra });
        const newTask = () => new TaskReadCache();

        it('reads an XPath selection once for the detectors of a task, and the page again in a new task', () => {
            expect(matches(PAGE, [wall(), wall()], { between: clearText })).toEqual([true, true]);
            expect(matches(PAGE, [wall(), wall()], { between: clearText, taskFor: newTask })).toEqual([true, false]);
        });

        it('shares a selection by expression and root', () => {
            const detectors = [wall({ root: '#a' }), wall({ root: '#a' }), wall({ root: '#b' }), wall({ xpath: '//p/text()', root: '#a' })];
            expect(matches(PAGE, detectors, { between: clearText })).toEqual([true, true, false, false]);
        });

        it("reads an element's text once for the detectors of a task", () => {
            const detector = matching({ selector: 'p', pattern: 'adblocker detected' });
            expect(matches(PAGE, [detector, detector], { between: clearText })).toEqual([true, true]);
            expect(matches(PAGE, [detector, detector], { between: clearText, taskFor: newTask })).toEqual([true, false]);
        });

        it('gives each detector the text a detector that stopped early left unread', () => {
            const filler = '<p>' + 'x '.repeat(20) + '</p>';
            const body = `<p>first</p>${filler.repeat(4)}<p>last</p>`;
            const chunked = (/** @type {string} */ pattern) =>
                matching({ xpath: '//p/text()', pattern, xpathConfig: { chunkSize: 16, chunkTail: 4 } });
            expect(matches(body, [chunked('first'), chunked('last'), chunked('first|last')])).toEqual([true, true, true]);
        });

        it('counts the same matches from a shared selection', () => {
            const counting = { actions: { define: { n: { text: { xpath: RENDERED, pattern: 'detected' }, using: 'length' } } } };
            expect(runInTask(PAGE, [counting, counting]).map((result) => result.names.get('n'))).toEqual([2, 2]);
        });

        it('records an invalid expression as an error in each detector that names it', () => {
            const detector = matching({ xpath: '//[', pattern: 'x' });
            const results = runInTask(PAGE, [detector, detector]);
            expect(results.map((result) => result.match)).toEqual(['error', 'error']);
            expect(results[0].failedAt).toBeDefined();
            expect(results[1].failedAt).toBe(results[0].failedAt);
        });
    });
});
