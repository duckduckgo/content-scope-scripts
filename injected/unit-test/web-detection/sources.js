import { JSDOM } from 'jsdom';
import { compileDetector } from '../../src/features/web-detection/compile/compile.js';
import { EvaluationContext } from '../../src/features/web-detection/evaluate/context.js';
import { NativeReader } from '../../src/features/web-detection/evaluate/native-reader.js';
import { createDetectorState, runDetector } from '../../src/features/web-detection/evaluate/run.js';
import { TaskReadCache } from '../../src/features/web-detection/evaluate/task-read-cache.js';
import { pageSources } from '../../src/features/web-detection/sources/index.js';
import { REPORT, bound, expectParseError, fonts, holds, payload, run, timeline, withPayload } from './support.js';

describe('WebDetection sources', () => {
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
            // A call still uses the captured method
            expect(holds('', { api: { path: 'queue.push', args: [1] }, is: 1 }, { afterCapture })).toBe(true);
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
            const result = run('', { match: { api: 'shadowed.label', is: 'page' }, actions: REPORT }, { install, afterCapture });
            expect(result.detected).toBe('aborted');
            expect(result.abortError).toBe('PageAccessor');
            expect(holds('', { api: 'plain.label', is: 'default' }, { install, afterCapture })).toBe(true);
            expect(holds('', { api: 'owned.label', is: 'own' }, { install, afterCapture })).toBe(true);
            expect(calls).toBe(0);
        });

        it('reads the length of a page Proxy over an array by descriptor', () => {
            const detected = (/** @type {string} */ trap, /** @type {unknown} */ match) => {
                const afterCapture = (/** @type {any} */ w) => {
                    w.trapped = new Proxy([1, 2], {
                        [trap]: () => {
                            throw new w.TypeError('trapped');
                        },
                    });
                };
                return run('', { match, actions: REPORT }, { afterCapture }).detected;
            };
            for (const match of [
                { api: 'trapped.length', is: 2 },
                { api: 'trapped', using: 'length', is: 2 },
            ]) {
                expect(detected('getOwnPropertyDescriptor', match)).toBe('aborted');
                expect(detected('get', match)).toBe(true);
            }
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

        it('fails when a page Proxy throws on a prototype or descriptor lookup', () => {
            const detected = (/** @type {string} */ trap, /** @type {unknown} */ match) => {
                const afterCapture = (/** @type {any} */ w) => {
                    w.trapped = new Proxy(
                        {},
                        {
                            [trap]: () => {
                                throw new w.TypeError('trapped');
                            },
                        },
                    );
                };
                return run('', { match, actions: REPORT }, { afterCapture }).detected;
            };
            expect(detected('getPrototypeOf', { api: 'trapped.anything' })).toBe('aborted');
            for (const trap of ['getPrototypeOf', 'getOwnPropertyDescriptor']) {
                expect(detected(trap, { api: { path: 'trapped.anything', args: [] } })).toBe('aborted');
                expect(detected(trap, { api: 'document.title', is: { in: { api: 'trapped' } } })).toBe('aborted');
                expect(detected(trap, { api: { path: 'trapped', where: { a: 1 } }, using: 'length', is: 0 })).toBe('aborted');
                expect(detected(trap, { element: { selector: 'p', root: { api: 'trapped' } } })).toBe('aborted');
            }
        });

        it('fails when iterating a page list throws', () => {
            /** @type {Record<string, (w: any) => unknown>} */
            const lists = {
                iterator: (w) => ({
                    [Symbol.iterator]() {
                        throw new w.TypeError('page');
                    },
                }),
                next: (w) => ({
                    *[Symbol.iterator]() {
                        yield w.document.body;
                        throw new w.TypeError('page');
                    },
                }),
                index: (w) =>
                    Object.defineProperty([w.document.body, w.document.body], 1, {
                        get() {
                            throw new w.TypeError('page');
                        },
                    }),
            };
            for (const list of Object.values(lists)) {
                const afterCapture = (/** @type {any} */ w) => {
                    w.pageList = list(w);
                };
                const detected = (/** @type {unknown} */ match) => run('', { match, actions: REPORT }, { afterCapture }).detected;
                expect(detected({ sum: { api: 'pageList' }, is: 0 })).toBe('aborted');
                expect(detected({ api: 'document.title', is: { in: { api: 'pageList' } } })).toBe('aborted');
                expect(detected({ api: { path: 'pageList', where: { a: 1 } }, using: 'length', is: 0 })).toBe('aborted');
                expect(detected({ element: { selector: 'p', root: { api: 'pageList' } } })).toBe('aborted');
            }
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

    describe('reads in a task', () => {
        const PAGE = '<div id="a"><p>adblocker detected</p></div><div id="b"><p>adblocker detected</p></div>';
        const RENDERED = '//body//text()[not(ancestor::script)]';

        /**
         * Run detectors one after another on one page, each with its own state, all in `task`.
         * `between` runs after each detector, as a detector's `call` could change the page.
         *
         * @param {string} body
         * @param {Array<{ match?: unknown, actions: unknown }>} detectors
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
                    const ctx = new EvaluationContext(new NativeReader(window, compiled.names), state.names, state, taskFor?.(i) ?? shared);
                    const result = runDetector(compiled, state, ctx);
                    between(window.document);
                    return { ...result, names: ctx.runNames };
                });
            } finally {
                globalThis.document = originalDocument;
            }
        }

        /** @param {Document} document */
        const clearText = (document) => {
            for (const p of document.querySelectorAll('p')) p.textContent = 'nothing here';
        };

        /** @param {unknown} text */
        const matching = (text) => ({ match: { text }, actions: REPORT });

        it('reads an XPath selection once for the detectors of a task', () => {
            const detector = matching({ xpath: RENDERED, pattern: 'adblocker detected' });
            const [first, second] = runInTask(PAGE, [detector, detector], { between: clearText });
            expect(first.match).toBe(true);
            expect(second.match).toBe(true);
        });

        it('reads the page again in a new task', () => {
            const detector = matching({ xpath: RENDERED, pattern: 'adblocker detected' });
            const [, second] = runInTask(PAGE, [detector, detector], { between: clearText, taskFor: () => new TaskReadCache() });
            expect(second.match).toBe(false);
        });

        it('shares a selection by expression and root', () => {
            const first = matching({ xpath: RENDERED, pattern: 'adblocker detected', root: '#a' });
            const results = runInTask(
                PAGE,
                [
                    first,
                    matching({ xpath: RENDERED, pattern: 'adblocker detected', root: '#a' }),
                    matching({ xpath: RENDERED, pattern: 'adblocker detected', root: '#b' }),
                    matching({ xpath: '//p/text()', pattern: 'adblocker detected', root: '#a' }),
                ],
                { between: clearText },
            );
            expect(results.map((result) => result.match)).toEqual([true, true, false, false]);
        });

        it("reads an element's text once for the detectors of a task", () => {
            const detector = matching({ selector: 'p', pattern: 'adblocker detected' });
            const [, shared] = runInTask(PAGE, [detector, detector], { between: clearText });
            expect(shared.match).toBe(true);
            const [, fresh] = runInTask(PAGE, [detector, detector], { between: clearText, taskFor: () => new TaskReadCache() });
            expect(fresh.match).toBe(false);
        });

        it('gives each detector the text a detector that stopped early left unread', () => {
            const filler = '<p>' + 'x '.repeat(20) + '</p>';
            const body = `<p>first</p>${filler.repeat(4)}<p>last</p>`;
            const chunked = (/** @type {string} */ pattern) =>
                matching({ xpath: '//p/text()', pattern, xpathConfig: { chunkSize: 16, chunkTail: 4 } });
            const results = runInTask(body, [chunked('first'), chunked('last'), chunked('first|last')]);
            expect(results.map((result) => result.match)).toEqual([true, true, true]);
        });

        it('counts the same matches from a shared selection', () => {
            const count = { actions: { define: { n: { text: { xpath: RENDERED, pattern: 'detected' }, using: 'length' } } } };
            const results = runInTask(PAGE, [count, count]);
            expect(results.map((result) => result.names.get('n'))).toEqual([2, 2]);
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
