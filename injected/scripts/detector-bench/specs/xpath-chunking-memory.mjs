/**
 * The memory side of the chunking trade-off, priced per chunk parameter.
 *
 * `specs/xpath-chunking.mjs` is the CPU half and runs against the working tree, so it can
 * only report `retained` - a coarse delta that carries snapshot allocation and regex
 * internals alongside the buffer, that nothing is going to be added to `matching.js` to
 * improve, and that is blind to a single allocation over about 128KB (see `readMemory` in
 * run.mjs). The exact high-water buffer length is reported only by bench-owned code, so this spec
 * points `implementation` at `lib/shipped-strategy.mjs` and varies config over it. That is
 * what puts `peak buffer` and `median` in one table, which is what "memory versus CPU"
 * actually asks for.
 *
 * WHAT THIS MEASURES: the lib's rendition of the shipped scan, not `matching.js` itself.
 * That is sound here for two reasons, and only for as long as both hold. `npm run
 * bench-drift-guard` fails on any behavioural disagreement between the two across six chunk
 * configurations, and the two measure within noise of each other on every fixture in
 * `.bench-variants/chunking-memory.mjs`. If either stops being true, this spec is measuring
 * something else and the CPU column here should be read from the working-tree spec instead.
 *
 * The parameter grid is the same one the CPU spec sweeps, so the two tables line up row for
 * row and the trade-off can be read across them. Expect the two halves to disagree about
 * which direction is better, which is the entire point:
 *
 * - `chunkSize` buys memory and costs almost no CPU, so it is close to a free knob
 * - `chunkTail` costs CPU proportional to `chunkTail / chunkSize` and buys nothing except
 *   the guarantee that a match spanning a flush is still found
 *
 * `text-heavy` is swept on `charsPerParagraph` rather than paragraph count because that
 * parameter *is* the length of a single text node, and the bound is `chunkSize + chunkTail
 * + longest text node` - a node is appended whole before the flush test runs. It is the
 * only sweep here that can move the peak of a chunked variant at all.
 */
import { articlePage, manyTinyTextNodes, textHeavy, unbrokenWordRuns } from '../fixtures.mjs';
import { PATTERNS, RENDERED_TEXT, detector, at, payloadFixtures, payloadOnPage } from '../adwall.mjs';

/**
 * @param {{ chunkSize: number, chunkTail?: number }} xpathConfig
 * @returns {Record<string, Record<string, object>>}
 */
const chunked = (xpathConfig) => detector({ pattern: PATTERNS, xpath: RENDERED_TEXT, xpathConfig });

export default {
    kind: 'config',
    // The peak buffer is exact rather than sampled, and the heap reading is taken once per
    // variant however many iterations are asked for. Only the median needs samples, and the
    // CPU question is answered more precisely by `specs/xpath-chunking.mjs`.
    iterations: 15,

    // Instrumented, so `peak buffer` is populated. See the caveat above.
    implementation: { name: 'shipped', source: 'module', path: '../lib/shipped-strategy.mjs' },

    fixtures: [
        // `purpose: 'timing'` covers the whole `-clean` set: this spec exists to measure the
        // peak buffer, which is a timed-run figure, and none of these fixtures says anything
        // about correctness that the matching fixtures below do not.
        // Node length swept directly: 1k, 5k and 25k characters in a single text node, at a
        // fixed 5M-character page. The chunked peak should rise with the node and nothing else.
        {
            ...at('text-heavy-clean', { generate: textHeavy, params: { paragraphs: 200 } }, false),
            scale: { charsPerParagraph: [1000, 5000, 25000] },
            purpose: 'timing',
        },
        // Ordinary node lengths at three page sizes: the peak should not move at all.
        {
            ...at('article-clean', { generate: articlePage }, false),
            scale: { rows: [2000, 20000, 100000] },
            purpose: 'timing',
        },
        // Every cut runs to MAX_WORD_LENGTH, which is the case that can extend the retained
        // tail beyond chunkTail.
        {
            ...at('unbroken-word-runs-clean', { generate: unbrokenWordRuns, params: { blocks: 200, charsPerBlock: 5000 } }, false),
            purpose: 'timing',
        },
        // Many nodes, few characters: flushes are character-driven, so the peak should be
        // governed by chunkSize and be indifferent to the node count.
        {
            ...at('many-tiny-nodes-clean', { generate: manyTinyTextNodes, params: { count: 40000 } }, false),
            purpose: 'timing',
        },

        // A match returns at a flush, so the peak is whatever had accumulated by then rather
        // than the bound - early and late matches bracket that.
        at(
            'adwall-first',
            {
                html: '<div class="wall"><p>Please disable your adblocker to continue</p></div>',
                generate: articlePage,
                params: { rows: 20000 },
            },
            true,
        ),
        payloadOnPage('wrapped', { generate: articlePage, params: { rows: 20000 } }),

        ...payloadFixtures(),
    ],

    configs: [
        // The unchunked control and the baseline: peak buffer here is the whole selection,
        // and every other row is read against it.
        {
            name: 'unchunked',
            baseline: true,
            reference: true,
            detectors: chunked({ chunkSize: 0 }),
        },
        // The knob that buys the memory. Tail defaults to chunkSize/16, so this is what a
        // config author who sets only chunkSize actually gets.
        {
            name: 'chunk',
            params: { chunkSize: [1024, 8192, 65536, 262144] },
            detectors: ({ chunkSize }) => chunked({ chunkSize }),
        },
        // The knob that costs the CPU, at the shipped chunk size. It also raises the peak,
        // so it loses on both axes - what it buys is the span a match may straddle.
        {
            name: 'tail',
            params: { chunkTail: [64, 512, 4096, 8192] },
            detectors: ({ chunkTail }) => chunked({ chunkSize: 8192, chunkTail }),
        },
    ],
};
