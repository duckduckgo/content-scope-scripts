import { JSDOM } from 'jsdom';
import { RENDERED, evaluateCondition } from './support.js';

/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.js').Expr} Expr
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.js').ElementBody} ElementBody
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.js').TextBody} TextBody
 */

describe('WebDetection conditions', () => {
    describe('evaluateCondition', () => {
        /**
         * Set up a DOM with given HTML and run evaluateCondition.
         * By default, all elements have non-zero dimensions (appear layouted).
         * Use `zeroSizeSelectors` to specify elements that should have 0x0 dimensions.
         *
         * @param {string} html
         * @param {Expr} match
         * @param {object} [options]
         * @param {string[]} [options.zeroSizeSelectors] - Selectors for elements with 0x0 dimensions
         * @returns {boolean | 'aborted'}
         */
        function matchInDOM(html, match, options = {}) {
            const { zeroSizeSelectors = [] } = options;
            const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
            const originalDocument = globalThis.document;
            const originalGetComputedStyle = globalThis.getComputedStyle;
            const originalDOMParser = globalThis.DOMParser;
            globalThis.document = dom.window.document;
            // `content` visibility mode uses DOMParser; provide JSDOM's implementation.
            globalThis.DOMParser = dom.window.DOMParser;

            // Wrap getComputedStyle to return browser-like defaults (JSDOM returns "" for opacity)
            const jsdomGetComputedStyle = dom.window.getComputedStyle;
            globalThis.getComputedStyle = (el, pseudoElt) => {
                const style = jsdomGetComputedStyle(el, pseudoElt);
                return new Proxy(style, {
                    get(target, prop) {
                        const value = target[prop];
                        // JSDOM returns "" for opacity, browsers return "1"
                        if (prop === 'opacity' && value === '') return '1';
                        return value;
                    },
                });
            };

            // Patch Element prototype to mock getBoundingClientRect based on selectors
            const ElementProto = dom.window.Element.prototype;
            const originalGetBoundingClientRect = ElementProto.getBoundingClientRect;
            ElementProto.getBoundingClientRect = function () {
                const isZeroSize = zeroSizeSelectors.some((sel) => this.matches(sel));
                return {
                    width: isZeroSize ? 0 : 100,
                    height: isZeroSize ? 0 : 50,
                    top: 0,
                    left: 0,
                    right: isZeroSize ? 0 : 100,
                    bottom: isZeroSize ? 0 : 50,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                };
            };

            try {
                return evaluateCondition(match);
            } finally {
                globalThis.document = originalDocument;
                globalThis.getComputedStyle = originalGetComputedStyle;
                globalThis.DOMParser = originalDOMParser;
                ElementProto.getBoundingClientRect = originalGetBoundingClientRect;
            }
        }

        /**
         * @param {string | string[]} pattern
         * @param {Omit<TextBody, 'pattern'>} [rest] - `selector` and `xpath`
         */
        const text = (pattern, rest = {}) => ({ text: { pattern, ...rest } });

        /** An element of class `overlay`, with the visibility given, or none. */
        const overlay = (/** @type {ElementBody['visibility']} */ visibility) => ({
            element: { selector: '.overlay', ...(visibility && { visibility }) },
        });

        /** Elements of class `a` and `b`, holding the text given. */
        const ab = (/** @type {string} */ a, /** @type {string} */ b) => `<div class="a">${a}</div><div class="b">${b}</div>`;

        describe('empty conditions', () => {
            it('should match with empty object (no conditions)', () => {
                expect(matchInDOM('<p>content</p>', {})).toBe(true);
            });
        });

        describe('text matching', () => {
            it('should match text pattern in body', () => {
                expect(matchInDOM('<p>Please disable your adblocker</p>', text('adblocker'))).toBe(true);
            });

            it('should not match when pattern not found', () => {
                expect(matchInDOM('<p>Welcome to our site</p>', text('adblocker'))).toBe(false);
            });

            it('should match case-insensitively', () => {
                expect(matchInDOM('<p>ADBLOCKER detected</p>', text('adblocker'))).toBe(true);
            });

            it('should match if ANY pattern matches (OR)', () => {
                const match = text(['adblocker', 'paywall']);
                expect(matchInDOM('<p>Please disable your adblocker</p>', match)).toBe(true);
                expect(matchInDOM('<p>This is behind a paywall</p>', match)).toBe(true);
                expect(matchInDOM('<p>Welcome to our site</p>', match)).toBe(false);
            });

            it('should match regex patterns', () => {
                expect(matchInDOM('<p>Error code: 12345</p>', text('code:\\s*\\d+'))).toBe(true);
            });

            it('should match patterns that match the empty string, as a regex test does', () => {
                for (const pattern of ['', '^', '$', 'x?', ['abc', '']]) {
                    expect(matchInDOM('<p>abc</p>', text(pattern)))
                        .withContext(JSON.stringify(pattern))
                        .toBe(true);
                }
                expect(matchInDOM('', text(''))).toBe(true);
                expect(matchInDOM('<p>hello</p>', text('(?=hello)'))).toBe(true);
                expect(matchInDOM('<p>welcome</p>', text('(?=hello)'))).toBe(false);
            });

            it('should not match an empty list of patterns, as a disjunction of none', () => {
                expect(matchInDOM('<p>abc</p>', text([]))).toBe(false);
                expect(matchInDOM('', text([]))).toBe(false);
            });

            it('should match text within specific selector', () => {
                const match = text('adblocker', { selector: '#overlay' });
                expect(matchInDOM('<div id="overlay">Disable adblocker</div><p>Normal content</p>', match)).toBe(true);
                expect(matchInDOM('<div id="overlay">Normal content</div><p>Disable adblocker</p>', match)).toBe(false);
            });

            it('should match if ANY selector has matching text (OR)', () => {
                const match = text('adblocker', { selector: ['.a', '.b'] });
                expect(matchInDOM(ab('adblocker', 'other'), match)).toBe(true);
                expect(matchInDOM(ab('other', 'adblocker'), match)).toBe(true);
                expect(matchInDOM(ab('other', 'content'), match)).toBe(false);
            });

            it('should match if ANY pattern in ANY selector (both OR)', () => {
                const match = text(['foo', 'bar'], { selector: ['.a', '.b'] });
                expect(matchInDOM(ab('foo', 'other'), match)).toBe(true);
                expect(matchInDOM(ab('other', 'bar'), match)).toBe(true);
                expect(matchInDOM(ab('none', 'nope'), match)).toBe(false);
            });
        });

        describe('text matching with xpath', () => {
            /**
             * @param {string} html
             * @returns {boolean | 'aborted'}
             */
            function matchRenderedText(html) {
                return matchInDOM(html, text('adblocker detected', { xpath: RENDERED }));
            }

            // `RENDERED` excludes text that is in the DOM but never rendered, so a pattern appearing only
            // inside a <script> body does not match.
            const SCRIPT = '<script>var msg = "adblocker detected"; log(msg);</script>';
            /** @type {Array<[string, string, boolean]>} */
            const RENDERED_CASES = [
                ['not match when the pattern is absent', '<p>Hello!</p>', false],
                ['match text wrapped in elements', '<div class="wall"><p>adblocker detected</p></div>', true],
                ['match bare text in body', 'adblocker detected', true],
                [
                    'match bare text alongside a script without the pattern',
                    `adblocker detected<script>console.log('Hello!');</script>`,
                    true,
                ],
                ['not match when the pattern only appears inside a script', `<div>${SCRIPT}</div>`, false],
                [
                    'match when the pattern appears in both a rendered subtree and a script',
                    `<div class="wall"><p>adblocker detected</p></div>${SCRIPT}`,
                    true,
                ],
                ['match bare text that is a sibling of a script containing the pattern', `adblocker detected${SCRIPT}`, true],
                // Text of all selected nodes is concatenated, so patterns are not confined to one text node
                ['match a pattern spanning inline element boundaries', '<div>adblocker <b>detected</b></div>', true],
                ['not match when the pattern only appears in a style element', '<style>/* adblocker detected */</style>', false],
            ];
            for (const [title, html, expected] of RENDERED_CASES) {
                it(`should ${title}`, () => {
                    expect(matchRenderedText(html)).toBe(expected);
                });
            }

            it('should support ancestry-based scoping', () => {
                const match = text('adblocker', { xpath: '//div[@id="wall"]//text()' });
                expect(matchInDOM('<div id="wall"><span>adblocker</span></div>', match)).toBe(true);
                expect(matchInDOM('<div id="other"><span>adblocker</span></div>', match)).toBe(false);
            });

            it('should match if ANY expression matches (OR)', () => {
                const match = text('adblocker', { xpath: ['//div[@id="a"]//text()', '//div[@id="b"]//text()'] });
                expect(matchInDOM('<div id="a">adblocker</div><div id="b">other</div>', match)).toBe(true);
                expect(matchInDOM('<div id="a">other</div><div id="b">adblocker</div>', match)).toBe(true);
                expect(matchInDOM('<div id="a">other</div><div id="b">none</div>', match)).toBe(false);
            });

            it('should not fall back to body when only xpath is provided', () => {
                // `body` is the implicit selector only when the condition names no source of its own
                expect(matchInDOM('<p>adblocker detected</p>', text('adblocker', { xpath: '//div//text()' }))).toBe(false);
            });

            it('should combine with selector as a disjunction', () => {
                const match = text('adblocker', { selector: '#viaSelector', xpath: '//div[@id="viaXpath"]//text()' });
                expect(matchInDOM('<div id="viaSelector">adblocker</div>', match)).toBe(true);
                expect(matchInDOM('<div id="viaXpath">adblocker</div>', match)).toBe(true);
                expect(matchInDOM('<div id="neither">adblocker</div>', match)).toBe(false);
            });

            it('should see content added between evaluations', () => {
                // Compiled expressions are reused across evaluations; the DOM they run against is not
                const dom = new JSDOM('<!DOCTYPE html><html><body><p>Loading...</p></body></html>');
                const originalDocument = globalThis.document;
                globalThis.document = dom.window.document;
                try {
                    const match = text('adblocker detected', { xpath: RENDERED });
                    expect(evaluateCondition(match)).toBe(false);
                    dom.window.document.body.insertAdjacentHTML('beforeend', '<div class="wall">adblocker detected</div>');
                    expect(evaluateCondition(match)).toBe(true);
                } finally {
                    globalThis.document = originalDocument;
                }
            });

            it('should throw on an invalid expression, surfacing as a detector error', () => {
                expect(() => matchInDOM('<p>adblocker</p>', text('adblocker', { xpath: '//[bad' }))).toThrow();
            });

            describe('chunked scanning', () => {
                /**
                 * Selected text is scanned in chunks rather than concatenated in full. Each case
                 * below sizes `chunkSize` to the fixture so flushes land at known offsets.
                 *
                 * @param {string} html
                 * @param {{ chunkSize?: number, chunkTail?: number }} [xpathConfig]
                 * @param {string} [pattern]
                 * @returns {boolean | 'aborted'}
                 */
                function matchChunked(html, xpathConfig, pattern = 'adblocker detected') {
                    return matchInDOM(html, text(pattern, { xpath: RENDERED, xpathConfig }));
                }

                /** The phrase split across an inline element */
                const SPLIT = '<div>adblocker <b>detected</b></div>';
                /** The phrase across two nodes, the first one exactly one 100-character chunk */
                const STRADDLE = `<span>${'z'.repeat(90)}adblocker </span><span>detected</span>`;

                it('should match across node boundaries when flushing on every node', () => {
                    // chunkSize below the length of a single node, so every node triggers a test.
                    // chunkTail is set explicitly because the derived default would floor to 0 here.
                    expect(matchChunked(SPLIT, { chunkSize: 4, chunkTail: 20 })).toBe(true);
                });

                it('should derive a chunkTail of 0 from a chunkSize below the tail ratio', () => {
                    // floor(4 / 16) is 0, so nothing is retained and the straddling match is lost.
                    // Config CI keeps chunkSize well above this; pinned so the arithmetic is explicit.
                    expect(matchChunked(SPLIT, { chunkSize: 4 })).toBe(false);
                });

                it('should match a pattern straddling a flush boundary', () => {
                    expect(matchChunked(STRADDLE, { chunkSize: 100, chunkTail: 20 })).toBe(true);
                });

                it('should miss a straddling match longer than the retained tail', () => {
                    // Documented limitation: the tail bounds the longest match that survives a
                    // boundary. Remedied from config by raising chunkTail or disabling chunking.
                    expect(matchChunked(STRADDLE, { chunkSize: 100, chunkTail: 2 })).toBe(false);
                    expect(matchChunked(STRADDLE, { chunkSize: 0 })).toBe(true);
                });

                it('should not let a word-boundary pattern assert at a mid-word chunk cut', () => {
                    // Cutting at length - chunkTail would start the buffer at "adblocker", where \b
                    // asserts against the start of the string. The real preceding character is a
                    // word character, so the walk-back extends the tail to include it.
                    const html = `<span>${'z'.repeat(91)}adblocker</span>`;
                    expect(matchChunked(html, { chunkSize: 100, chunkTail: 9 }, '\\badblocker')).toBe(false);
                    expect(matchChunked(html, { chunkSize: 0 }, '\\badblocker')).toBe(false);
                });

                it('should still find a word-boundary match that the walk-back keeps intact', () => {
                    expect(matchChunked(`<span>${'z'.repeat(90)} adblocker</span>`, { chunkSize: 100, chunkTail: 9 }, '\\badblocker')).toBe(
                        true,
                    );
                });

                it('should cap the walk-back at chunkTail when that is the smaller ceiling', () => {
                    // The node ends in an unbroken run of word characters, so the walk-back runs
                    // until it hits its ceiling. That fixes the retained text at exactly 2 * chunkTail.
                    const html = `<span>${'z'.repeat(75)}0123456789abcdefghijklmno</span><span>detected</span>`;
                    const config = { chunkSize: 100, chunkTail: 10 };
                    // Needs exactly the 20 retained characters
                    expect(matchChunked(html, config, '56789abcdefghijklmnodetected')).toBe(true);
                    // Needs 21, one past the ceiling
                    expect(matchChunked(html, config, '456789abcdefghijklmnodetected')).toBe(false);
                });

                it('should cap the walk-back at the word-length limit for a large chunkTail', () => {
                    // Same unbroken run, but a tail past the 64 character word-length ceiling, so
                    // the walk stops there instead: 100 retained plus at most 64 walked back.
                    const run = 'abcdefghij'.repeat(20);
                    const html = `<span>${'z'.repeat(800)}${run}</span><span>detected</span>`;
                    const config = { chunkSize: 1000, chunkTail: 100 };
                    // Needs exactly the 164 retained characters
                    expect(matchChunked(html, config, run.slice(36) + 'detected')).toBe(true);
                    // Needs 165, one past the ceiling
                    expect(matchChunked(html, config, run.slice(35) + 'detected')).toBe(false);
                });

                it('should honour chunkTail: 0 rather than promoting it to a floor', () => {
                    expect(matchChunked(STRADDLE, { chunkSize: 100, chunkTail: 0 })).toBe(false);
                });

                it('should terminate and stay correct when chunkTail far exceeds chunkSize', () => {
                    // Pins the structural progress property: flushing is driven by characters added
                    // since the last test, so an oversized tail cannot stall the scan. Flushing on
                    // total buffer length instead would re-test the whole buffer for every node.
                    const html = `<span>${'z'.repeat(200)}adblocker </span><span>detected</span>`;
                    expect(matchChunked(html, { chunkSize: 10, chunkTail: 1000 })).toBe(true);
                    expect(matchChunked(html, { chunkSize: 10, chunkTail: 1000 }, 'absent phrase')).toBe(false);
                });

                it('should use the built-in defaults when xpathConfig is omitted', () => {
                    // Smaller than the default chunk, so this is a single test either way
                    expect(matchChunked(SPLIT)).toBe(true);
                    expect(matchChunked(SPLIT, {})).toBe(true);
                });

                it('should produce concat-identical results across the fixture set with chunkSize: 0', () => {
                    for (const [, html] of RENDERED_CASES) {
                        expect(matchChunked(html, { chunkSize: 0 })).toBe(matchRenderedText(html));
                    }
                });
            });
        });

        describe('element matching', () => {
            const div = (inner = 'content', style = '') => `<div class="overlay"${style && ` style="${style}"`}>${inner}</div>`;
            const ABSENT = '<div class="other">content</div>';
            const ZERO = { zeroSizeSelectors: ['.overlay'] };
            const CHALLENGE = 'https://challenges.cloudflare.com/cdn-cgi/challenge';
            /** @type {Array<[ElementBody['visibility'], string, string, boolean, { zeroSizeSelectors: string[] }?]>} */
            const cases = [
                ['any', 'match when element exists', div(), true],
                ['any', 'not match when element does not exist', ABSENT, false],
                ['any', 'match even if element is hidden', div('content', 'display: none'), true],
                [undefined, 'match when element exists', div(), true],
                [undefined, 'not match when element does not exist', ABSENT, false],
                [undefined, 'match even if element is hidden', div('content', 'display: none'), true],
                ['hidden', 'match element with display: none', div('content', 'display: none'), true],
                ['hidden', 'match element with visibility: hidden style', div('content', 'visibility: hidden'), true],
                ['hidden', 'match element with opacity: 0', div('content', 'opacity: 0'), true],
                ['hidden', 'match element with zero dimensions', div(), true, ZERO],
                ['hidden', 'not match visible element', div(), false],
                ['hidden', 'not match when element does not exist', ABSENT, false],
                ['visible', 'match visible element', div(), true],
                ['visible', 'not match element with display: none', div('content', 'display: none'), false],
                ['visible', 'not match element with visibility: hidden style', div('content', 'visibility: hidden'), false],
                ['visible', 'not match element with opacity: 0', div('content', 'opacity: 0'), false],
                ['visible', 'not match element with zero dimensions', div(), false, ZERO],
                ['visible', 'not match when element does not exist', ABSENT, false],
                // `content` is layout-free
                ['content', 'match when element has text content', div('Verifying you are human'), true],
                [
                    'content',
                    'match content-filled element even when display:none (unlike visible)',
                    div('challenge', 'display: none'),
                    true,
                ],
                ['content', 'match when element contains a real (cross-origin) iframe', div(`<iframe src="${CHALLENGE}"></iframe>`), true],
                ['content', 'match when element contains a form control', div('<input type="checkbox">'), true],
                ['content', 'not match an empty element', div('   '), false],
                ['content', 'not count about:blank iframes as content', div('<iframe src="about:blank"></iframe>'), false],
                [
                    'content',
                    'not count metadata-only content (script/style)',
                    div('<style>.x{color:red}</style><script>var a=1;</script>'),
                    false,
                ],
                [
                    'content',
                    'match when the element itself is a real (cross-origin) iframe',
                    `<iframe class="overlay" src="${CHALLENGE}"></iframe>`,
                    true,
                ],
                [
                    'content',
                    'not match when the element itself is an about:blank iframe',
                    '<iframe class="overlay" src="about:blank"></iframe>',
                    false,
                ],
                ['content', 'not match when the element itself is an iframe with no src', '<iframe class="overlay"></iframe>', false],
                ['content', 'match when the element itself is a media/form element', '<canvas class="overlay"></canvas>', true],
                ['content', 'match substantial text without serialize+parse (size cap)', div('a'.repeat(50001)), true],
                ['content', 'not match when element does not exist', ABSENT, false],
            ];
            for (const [visibility, title, html, expected, options] of cases) {
                it(`with visibility ${visibility ?? 'unset, so any,'} should ${title}`, () => {
                    expect(matchInDOM(html, overlay(visibility), options)).toBe(expected);
                });
            }

            describe('multiple selectors (OR)', () => {
                it('should match if ANY selector matches', () => {
                    /** @type {Expr} */
                    const match = { element: { selector: ['.a', '.b'], visibility: 'any' } };
                    expect(matchInDOM('<div class="a"></div>', match)).toBe(true);
                    expect(matchInDOM('<div class="b"></div>', match)).toBe(true);
                    expect(matchInDOM('<div class="a"></div><div class="b"></div>', match)).toBe(true);
                    expect(matchInDOM('<div class="c"></div>', match)).toBe(false);
                });

                it('should support CSS selector lists', () => {
                    expect(matchInDOM('<div class="a"></div>', { element: { selector: '.a, .b' } })).toBe(true);
                    expect(matchInDOM('<div class="a"></div>', { element: { selector: '.b, .a' } })).toBe(true);
                });
            });
        });

        describe('combined conditions (AND)', () => {
            it('should require both text and element to match', () => {
                const match = { all: [text('adblocker'), overlay('any')] };
                expect(matchInDOM('<div class="overlay">Disable adblocker</div>', match)).toBe(true);
                // Text matches but element doesn't
                expect(matchInDOM('<p>Disable adblocker</p>', match)).toBe(false);
                // Element matches but text doesn't
                expect(matchInDOM('<div class="overlay">Welcome</div>', match)).toBe(false);
            });
        });

        describe('OR conditions (alternatives)', () => {
            const modal = '<div class="modal"></div>';

            it('should support OR within text conditions', () => {
                expect(matchInDOM('<p>content</p>', { text: [{ pattern: 'adblocker' }, { pattern: 'content' }] })).toBe(true);
            });

            it('should support OR within element conditions', () => {
                expect(matchInDOM(modal, { element: [overlay('any').element, { selector: '.modal', visibility: 'any' }] })).toBe(true);
            });

            it('should match an element a later body accepts after an earlier body rejects it', () => {
                expect(matchInDOM(modal, { element: [{ selector: '.modal', visibility: 'hidden' }, { selector: '.modal' }] })).toBe(true);
                expect(matchInDOM(modal, { element: [{ selector: '.modal', where: { id: 'other' } }, { selector: '.modal' }] })).toBe(true);
            });
        });

        describe('all operator', () => {
            it('should require every condition to match', () => {
                const condition = { all: [text('foo'), text('bar')] };
                expect(matchInDOM('<p>foo bar</p>', condition)).toBe(true);
                expect(matchInDOM('<p>foo</p>', condition)).toBe(false);
                expect(matchInDOM('<p>bar</p>', condition)).toBe(false);
            });

            it('should accept singleton form (object instead of array)', () => {
                expect(matchInDOM('<p>foo</p>', { all: text('foo') })).toBe(true);
                expect(matchInDOM('<p>baz</p>', { all: text('foo') })).toBe(false);
            });

            it('should be vacuously true on empty array', () => {
                expect(matchInDOM('<p>x</p>', { all: [] })).toBe(true);
            });
        });

        describe('any operator', () => {
            it('should match if at least one condition matches', () => {
                const condition = { any: [text('foo'), text('bar')] };
                expect(matchInDOM('<p>foo</p>', condition)).toBe(true);
                expect(matchInDOM('<p>bar</p>', condition)).toBe(true);
                expect(matchInDOM('<p>baz</p>', condition)).toBe(false);
            });

            it('should be equivalent to any over a list of the same booleans', () => {
                // In a list, an entry is in value position, so `text` gives its matches and `is` tests them
                const found = (/** @type {string} */ pattern) => ({ ...text(pattern), is: { length: { gt: 0 } } });
                for (const html of ['<p>foo</p>', '<p>baz</p>']) {
                    expect(matchInDOM(html, { any: [text('foo'), text('bar')] })).toBe(
                        matchInDOM(html, { any: { expr: [found('foo'), found('bar')] } }),
                    );
                }
            });

            it('should be vacuously false on empty array', () => {
                expect(matchInDOM('<p>x</p>', { any: [] })).toBe(false);
            });
        });

        describe('none operator', () => {
            it('should match when no nested condition matches', () => {
                expect(matchInDOM('<p>welcome</p>', { none: [text('foo'), text('bar')] })).toBe(true);
            });

            it('should fail when any nested condition matches', () => {
                expect(matchInDOM('<p>foo</p>', { none: [text('foo'), text('bar')] })).toBe(false);
                expect(matchInDOM('<p>bar</p>', { none: [text('foo'), text('bar')] })).toBe(false);
            });

            it('should accept singleton form', () => {
                expect(matchInDOM('<p>welcome</p>', { none: text('foo') })).toBe(true);
                expect(matchInDOM('<p>foo</p>', { none: text('foo') })).toBe(false);
            });

            it('should be vacuously true on empty array', () => {
                expect(matchInDOM('<p>x</p>', { none: [] })).toBe(true);
            });
        });

        describe('operators combined with all (AND)', () => {
            it('should AND-combine all + none', () => {
                const condition = { all: [{ all: [text('foo')] }, { none: [text('bad')] }] };
                // text contains foo (all) and does not contain bad (none)
                expect(matchInDOM('<p>foo good</p>', condition)).toBe(true);
                // contains foo but also contains bad -> none fails
                expect(matchInDOM('<p>foo bad</p>', condition)).toBe(false);
                // missing foo -> all fails
                expect(matchInDOM('<p>good</p>', condition)).toBe(false);
            });

            it('should AND-combine any + none', () => {
                const condition = { all: [{ any: [text('foo'), text('baz')] }, { none: [text('bad')] }] };
                expect(matchInDOM('<p>foo good</p>', condition)).toBe(true);
                expect(matchInDOM('<p>foo bad</p>', condition)).toBe(false);
            });
        });

        describe('operators at top-level match', () => {
            it('should support all at the match level', () => {
                expect(matchInDOM('<div class="overlay">disable adblocker</div>', { all: [text('adblocker'), overlay('any')] })).toBe(true);
            });

            it('should support any at the match level', () => {
                expect(matchInDOM('<p>welcome</p>', { any: [text('adblocker'), text('welcome')] })).toBe(true);
            });

            it('should support none at the match level', () => {
                expect(matchInDOM('<p>welcome</p>', { none: [text('adblocker')] })).toBe(true);
                expect(matchInDOM('<p>adblocker</p>', { none: [text('adblocker')] })).toBe(false);
            });
        });

        describe('nested operators', () => {
            it('should evaluate deeply nested operator trees', () => {
                // (any[a, b]) AND (none[c])
                const condition = { all: [{ any: [text('a'), text('b')] }, { none: [text('c')] }] };
                expect(matchInDOM('<p>a</p>', condition)).toBe(true);
                expect(matchInDOM('<p>b</p>', condition)).toBe(true);
                expect(matchInDOM('<p>a c</p>', condition)).toBe(false);
                expect(matchInDOM('<p>x</p>', condition)).toBe(false);
            });
        });

        describe('operator children of mixed shape (operator and leaf siblings)', () => {
            // Each child of any/all/none is its own expression: an operator or a source leaf.

            it('should allow all to mix an operator child and a leaf child', () => {
                // all[ any[ text=foo, text=bar ], element=.overlay ]
                const condition = { all: [{ any: [text('foo'), text('bar')] }, overlay('any')] };
                expect(matchInDOM('<div class="overlay">foo</div>', condition)).toBe(true);
                expect(matchInDOM('<div class="overlay">bar</div>', condition)).toBe(true);
                // text matches but element doesn't
                expect(matchInDOM('<p>foo</p>', condition)).toBe(false);
                // element matches but text doesn't
                expect(matchInDOM('<div class="overlay">welcome</div>', condition)).toBe(false);
            });

            it('should allow any to mix an operator child and a leaf child', () => {
                // any[ none[text=bad], text=foo ]
                const condition = { any: [{ none: [text('bad')] }, text('foo')] };
                // none[bad] satisfied (welcome doesn't contain bad) -> any matches
                expect(matchInDOM('<p>welcome</p>', condition)).toBe(true);
                // text=foo matches -> any matches
                expect(matchInDOM('<p>foo</p>', condition)).toBe(true);
                // bad present (none fails) and foo missing -> any fails
                expect(matchInDOM('<p>bad</p>', condition)).toBe(false);
                // both children satisfied
                expect(matchInDOM('<p>foo good</p>', condition)).toBe(true);
            });

            it('should allow none to mix an operator child and a leaf child', () => {
                // none[ all[text=foo, text=bar], text=danger ]
                const condition = { none: [{ all: [text('foo'), text('bar')] }, text('danger')] };
                // neither child matches -> none satisfied
                expect(matchInDOM('<p>welcome</p>', condition)).toBe(true);
                // only foo present -> all[foo,bar] fails, danger absent -> none satisfied
                expect(matchInDOM('<p>foo</p>', condition)).toBe(true);
                // foo+bar -> all matches -> none fails
                expect(matchInDOM('<p>foo bar</p>', condition)).toBe(false);
                // danger leaf matches -> none fails
                expect(matchInDOM('<p>danger</p>', condition)).toBe(false);
            });

            it('should allow operator and leaf siblings inside any', () => {
                // any[ all[text=foo, text=bar], text=quick ]
                const condition = { any: [{ all: [text('foo'), text('bar')] }, text('quick')] };
                // operator child satisfied
                expect(matchInDOM('<p>foo bar</p>', condition)).toBe(true);
                // leaf child satisfied
                expect(matchInDOM('<p>quick</p>', condition)).toBe(true);
                // neither
                expect(matchInDOM('<p>welcome</p>', condition)).toBe(false);
            });
        });

        // Captcha vendor detectors. These mirror the per-provider `captcha` detectors in
        // privacy-configuration/features/web-detection.json — keep the selectors in sync.
        // The metric counts *visible* captcha challenges per navigation, so every detector
        // uses visibility: 'visible'. Window-property signals (window.grecaptcha etc.) are
        // intentionally NOT used: a loaded captcha library is not a visible challenge and
        // would inflate the per-navigation ratio.
        describe('captcha vendor detectors', () => {
            /** @type {Record<string, Expr>} */
            const captcha = {
                recaptcha: {
                    element: {
                        selector: ['.g-recaptcha', "iframe[src*='recaptcha']", "iframe[title*='recaptcha' i]"],
                        visibility: 'visible',
                    },
                },
                hcaptcha: {
                    element: {
                        selector: ['.h-captcha', "iframe[src*='hcaptcha.com']", "iframe[title*='hcaptcha' i]"],
                        visibility: 'visible',
                    },
                },
                turnstile: {
                    element: {
                        // :not(#turnstile-wrapper) excludes the Cloudflare interstitial's own Turnstile wrapper
                        // (<div id="turnstile-wrapper" class="cf-turnstile">), so an interstitial counts as `cloudflare`, not `turnstile`.
                        selector: ['.cf-turnstile:not(#turnstile-wrapper)', '.cf-turnstile:not(#turnstile-wrapper) iframe'],
                        visibility: 'visible',
                    },
                },
                cloudflare: {
                    element: {
                        selector: [
                            '#challenge-form',
                            '#cf-wrapper',
                            '.cf-browser-verification',
                            '#challenge-running',
                            '#cf-challenge-running',
                            '#challenge-stage',
                        ],
                        visibility: 'visible',
                    },
                },
                other: {
                    text: {
                        pattern: [
                            'press (and|&) hold to (confirm|verify)',
                            'slide( right)? to (verify|complete)',
                            'complete the security check to (access|continue)',
                        ],
                    },
                },
            };

            // Representative visible markup per vendor.
            const fixtures = {
                recaptcha:
                    '<div class="g-recaptcha"></div><iframe src="https://www.google.com/recaptcha/api2/anchor" title="reCAPTCHA"></iframe>',
                hcaptcha:
                    '<div class="h-captcha"></div><iframe src="https://newassets.hcaptcha.com/captcha/v1/frame" title="hCaptcha"></iframe>',
                turnstile:
                    '<div class="cf-turnstile"><iframe src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/turnstile"></iframe></div>',
                // The current Cloudflare interstitial embeds Turnstile via <div id="turnstile-wrapper" class="cf-turnstile">,
                // so it carries a .cf-turnstile element. It must match `cloudflare` (via #cf-wrapper/#challenge-*) but NOT
                // `turnstile` — which is why the turnstile selector excludes #turnstile-wrapper.
                cloudflare:
                    '<div id="cf-wrapper"><div id="challenge-running">Checking your browser before accessing the site.</div><div id="challenge-stage"><div id="turnstile-wrapper" class="cf-turnstile"><iframe src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile"></iframe></div></div></div>',
                other: '<main><p>Please press and hold to confirm you are human.</p></main>',
            };

            const vendors = ['recaptcha', 'hcaptcha', 'turnstile', 'cloudflare', 'other'];

            describe('matches its own visible fixture', () => {
                for (const vendor of vendors) {
                    it(`${vendor}`, () => {
                        expect(matchInDOM(fixtures[vendor], captcha[vendor])).toBe(true);
                    });
                }
            });

            describe('does not match other vendors (no double counting)', () => {
                for (const vendor of vendors) {
                    for (const fixtureVendor of vendors) {
                        if (vendor === fixtureVendor) continue;
                        it(`${fixtureVendor} fixture does not match ${vendor}`, () => {
                            expect(matchInDOM(fixtures[fixtureVendor], captcha[vendor])).toBe(false);
                        });
                    }
                }
            });

            describe('does not match when absent', () => {
                const clean = '<main><h1>Welcome</h1><p>Just an ordinary article with nothing to verify.</p></main>';
                for (const vendor of vendors) {
                    it(`${vendor}`, () => {
                        expect(matchInDOM(clean, captcha[vendor])).toBe(false);
                    });
                }
            });

            describe('visibility gating (only visible challenges count)', () => {
                it('hidden recaptcha (display:none) does not match', () => {
                    expect(matchInDOM('<div class="g-recaptcha" style="display: none"></div>', captcha.recaptcha)).toBe(false);
                });

                it('zero-size hcaptcha does not match', () => {
                    expect(matchInDOM('<div class="h-captcha"></div>', captcha.hcaptcha, { zeroSizeSelectors: ['.h-captcha'] })).toBe(
                        false,
                    );
                });

                it('hidden turnstile widget (display:none) does not match', () => {
                    expect(matchInDOM('<div class="cf-turnstile" style="display: none"></div>', captcha.turnstile)).toBe(false);
                });
            });

            it('other does not fire on reCAPTCHA\'s "I\'m not a robot" label', () => {
                expect(matchInDOM('<div class="g-recaptcha">I\'m not a robot</div>', captcha.other)).toBe(false);
            });
        });
    });
});
