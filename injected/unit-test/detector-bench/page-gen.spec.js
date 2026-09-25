/**
 * The page generators, run against jsdom.
 *
 * Two things are worth asserting about a generator, and neither is "does it produce the
 * exact DOM I wrote down":
 *
 * 1. **Its parameters do what they claim.** A spec sizes a page through `params` and
 *    `scale`, and a scaling sweep is only readable if the parameter being swept actually
 *    moves the thing it names. A generator whose `rows` silently capped out would produce
 *    a flat `ns/char` column that reads as "linear" rather than as "broken".
 * 2. **Its filler never matches a detector pattern.** This is the trap called out in
 *    `page-gen/pages.mjs` and in the skill, and until now nothing enforced it. If the
 *    filler matches, a gated variant's gate passes on every page and never short-circuits,
 *    which makes gating look useless - a wrong answer that looks like a finding rather
 *    than like a bug.
 *
 * Exact node counts are deliberately not asserted. They are an implementation detail of
 * the markup each generator emits, and pinning them would make every future tweak to a
 * generator a test failure without catching anything the two properties above miss.
 */
import { JSDOM } from 'jsdom';
import * as pages from '../../scripts/detector-bench/page-gen/pages.mjs';
import { prose, unbrokenWords, sparseBreaks } from '../../scripts/detector-bench/page-gen/text-shapes.mjs';
import { PATTERNS, GATE_PATTERNS } from '../../scripts/detector-bench/detectors/adwall.mjs';

/**
 * Run a generator against a fresh jsdom document and report the shape it built.
 *
 * Generators are written for the page and read `document` ambiently, so this installs the
 * globals the same way `run.mjs` gets them from Playwright.
 *
 * @param {Function} generate
 * @param {object} [params]
 * @returns {{ elements: number, textNodes: number, chars: number, text: string, maxDepth: number }}
 */
function build(generate, params = {}) {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const previous = { window: globalThis.window, document: globalThis.document, NodeFilter: globalThis.NodeFilter };
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.NodeFilter = dom.window.NodeFilter;

    try {
        generate(params);

        const walker = dom.window.document.createTreeWalker(dom.window.document.body, dom.window.NodeFilter.SHOW_TEXT);
        let textNodes = 0;
        let chars = 0;
        while (walker.nextNode()) {
            textNodes++;
            chars += (walker.currentNode.textContent || '').length;
        }

        let maxDepth = 0;
        for (const element of dom.window.document.body.querySelectorAll('*')) {
            let depth = 0;
            for (let node = element.parentElement; node && node !== dom.window.document.body; node = node.parentElement) depth++;
            if (depth > maxDepth) maxDepth = depth;
        }

        return {
            elements: dom.window.document.body.getElementsByTagName('*').length,
            textNodes,
            chars,
            text: dom.window.document.body.textContent || '',
            maxDepth,
        };
    } finally {
        globalThis.window = previous.window;
        globalThis.document = previous.document;
        globalThis.NodeFilter = previous.NodeFilter;
    }
}

/** Every generator, with the parameter that should scale it and two values of it. */
const GENERATORS = [
    { name: 'articlePage', generate: pages.articlePage, param: 'rows', small: 10, large: 100 },
    { name: 'deeplyNested', generate: pages.deeplyNested, param: 'rows', small: 10, large: 100 },
    { name: 'elementHeavy', generate: pages.elementHeavy, param: 'blocks', small: 10, large: 100 },
    { name: 'nestedInline', generate: pages.nestedInline, param: 'blocks', small: 10, large: 100 },
    { name: 'manyTinyTextNodes', generate: pages.manyTinyTextNodes, param: 'count', small: 10, large: 100 },
    { name: 'textHeavy', generate: pages.textHeavy, param: 'paragraphs', small: 5, large: 50 },
    { name: 'unbrokenWordRuns', generate: pages.unbrokenWordRuns, param: 'blocks', small: 5, large: 50 },
    { name: 'scriptHeavy', generate: pages.scriptHeavy, param: 'rows', small: 5, large: 50 },
];

describe('detector-bench page-gen', () => {
    describe('every generator', () => {
        for (const { name, generate, param, small, large } of GENERATORS) {
            it(`${name} scales with \`${param}\``, () => {
                const few = build(generate, { [param]: small });
                const many = build(generate, { [param]: large });
                expect(many.elements).toBeGreaterThan(few.elements);
            });

            it(`${name} appends payload markup`, () => {
                // Every generator takes `append`, which is what lets a matching and a
                // non-matching fixture share one DOM shape. A generator that ignored it
                // would silently produce a fixture that can never match.
                const plain = build(generate, { [param]: small });
                const appended = build(generate, { [param]: small, append: '<div id="payload">injected marker</div>' });
                expect(plain.text).not.toContain('injected marker');
                expect(appended.text).toContain('injected marker');
            });

            it(`${name} is deterministic`, () => {
                // Two runs must be comparable, so nothing may be random.
                expect(build(generate, { [param]: small }).text).toBe(build(generate, { [param]: small }).text);
            });

            it(`${name} filler matches no detector pattern`, () => {
                // The trap: filler that matches makes a gate pass on every page, so gating
                // never short-circuits and measures as useless. Tested against the gate
                // patterns as well as the full ones, since the gate is the looser of the
                // two and therefore the easier to trip accidentally.
                const { text } = build(generate, { [param]: large });
                for (const pattern of [...PATTERNS, ...GATE_PATTERNS]) {
                    expect(new RegExp(pattern, 'i').test(text)).toBe(false, `${name} filler matched /${pattern}/i`);
                }
            });
        }
    });

    // Each shape exists to isolate one cost, and a spec picks between them on that basis.
    // These pin the property that makes each one worth having as a separate generator.
    describe('the shape each generator isolates', () => {
        it('elementHeavy has many elements and essentially no text', () => {
            const { elements, chars } = build(pages.elementHeavy, { blocks: 200 });
            expect(elements).toBeGreaterThan(1000);
            expect(chars).toBe(0);
        });

        it('manyTinyTextNodes has many text nodes and few characters each', () => {
            const { textNodes, chars } = build(pages.manyTinyTextNodes, { count: 500 });
            expect(textNodes).toBe(500);
            expect(chars / textNodes).toBeLessThan(3);
        });

        it('textHeavy has few nodes and many characters each', () => {
            const { textNodes, chars } = build(pages.textHeavy, { paragraphs: 10, charsPerParagraph: 2000 });
            expect(textNodes).toBe(10);
            expect(chars / textNodes).toBeGreaterThan(1000);
        });

        it('deeplyNested scales with depth, holding text nodes constant', () => {
            const shallow = build(pages.deeplyNested, { rows: 20, depth: 5 });
            const deep = build(pages.deeplyNested, { rows: 20, depth: 40 });
            expect(deep.maxDepth).toBeGreaterThan(shallow.maxDepth);
            // One text node per chain whatever the depth: that is what prices depth alone.
            expect(deep.textNodes).toBe(shallow.textNodes);
        });

        it('nestedInline multiplies depth by text nodes', () => {
            // The counterpart to deeplyNested: text at every level, so an ancestor-chain
            // predicate re-walks the chain once per level rather than once per chain.
            const shallow = build(pages.nestedInline, { blocks: 20, depth: 3 });
            const deep = build(pages.nestedInline, { blocks: 20, depth: 12 });
            expect(deep.textNodes).toBeGreaterThan(shallow.textNodes);
        });

        it('unbrokenWordRuns holds the volume of textHeavy with no word breaks', () => {
            const { text } = build(pages.unbrokenWordRuns, { blocks: 2, charsPerBlock: 500 });
            expect(text.length).toBe(1000);
            expect(/\s/.test(text)).toBe(false);
        });

        it('scriptHeavy puts most of its characters in script bodies', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
            const previous = { window: globalThis.window, document: globalThis.document };
            globalThis.window = dom.window;
            globalThis.document = dom.window.document;
            try {
                pages.scriptHeavy({ scriptBlocks: 5, scriptRepeat: 50, rows: 10 });
                const body = dom.window.document.body;
                const scriptChars = [...body.querySelectorAll('script')].reduce((n, s) => n + (s.textContent || '').length, 0);
                expect(scriptChars).toBeGreaterThan((body.textContent || '').length - scriptChars);
            } finally {
                globalThis.window = previous.window;
                globalThis.document = previous.document;
            }
        });
    });

    // Node-side string inputs, for measuring a step that runs after the DOM work is done.
    // They cannot be called from a generator, which is the whole reason they are separate.
    describe('text-shapes', () => {
        it('every shape returns exactly the requested length', () => {
            for (const shape of [prose, unbrokenWords, sparseBreaks]) {
                expect(shape(1000).length).toBe(1000);
                expect(shape(7).length).toBe(7);
            }
        });

        it('prose breaks on words and unbrokenWords does not', () => {
            expect(/\s/.test(prose(500))).toBe(true);
            expect(/\s/.test(unbrokenWords(500))).toBe(false);
        });

        it('sparseBreaks holds long unbroken tokens inside prose', () => {
            const text = sparseBreaks(2000);
            expect(/\s/.test(text)).toBe(true);
            // The point of the shape: a backwards boundary scan runs far, but not forever.
            const longestToken = text.split(/\s+/).reduce((longest, token) => Math.max(longest, token.length), 0);
            expect(longestToken).toBeGreaterThan(64);
        });

        it('is deterministic', () => {
            expect(prose(500)).toBe(prose(500));
            expect(unbrokenWords(500)).toBe(unbrokenWords(500));
            expect(sparseBreaks(500)).toBe(sparseBreaks(500));
        });
    });
});
