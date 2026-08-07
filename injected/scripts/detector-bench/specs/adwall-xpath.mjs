/**
 * What does the adwall detector's rendered-text config cost, and what do the cheaper
 * ways of writing it trade away?
 *
 * A config spec: the implementation is whatever is in the working tree, and the thing
 * being varied is the detector configuration. That makes it durable - there are no
 * experiment files to go stale, so this keeps running and keeps meaning the same thing as
 * `matching.js` evolves.
 *
 * Six ways of writing one detector:
 *
 * - `xpath`        rendered text via ancestor-axis predicates. The reference: correct on
 *                  every case, and the config this comparison is against.
 * - `body-only`    the implicit `selector: body` path. Cheapest by far, and matches text
 *                  inside `<script>`, which is the false positive that started all of this.
 * - `gated`        `all: [body, xpath]` on the full patterns. The body condition
 *                  short-circuits, so the XPath only runs on candidate pages.
 * - `loose-gated`  the same, gating on the shortest shared keyword instead. The sound
 *                  version, and the one worth shipping if gating is worth it at all.
 * - `self-axis`    exclusion checked against the immediate parent rather than the
 *                  ancestor chain. Looks cheaper and measures slower, and diverges in the
 *                  opposite direction from the one you would predict.
 * - `unchunked`    `chunkSize: 0`, so the whole selection is concatenated before testing.
 *                  What the implementation did before chunking, kept as the memory
 *                  comparison - run with `--memory` to see the difference.
 *
 * Three of those change behaviour and say so with `expectDivergence`. That is the point
 * of the spec rather than a defect in it: `gated` is around an order of magnitude faster
 * on a normal page and timing alone would have shipped it, so the run has to show what it
 * costs at the same time as what it saves.
 */
import { articlePage, scriptHeavy, textHeavy } from '../fixtures.mjs';
import {
    PATTERNS,
    GATE_PATTERNS,
    RENDERED_TEXT,
    RENDERED_TEXT_SELF_AXIS,
    detector,
    at,
    payloadFixtures,
    payloadOnPage,
} from '../adwall.mjs';

export default {
    kind: 'config',

    fixtures: [
        // The case that runs on essentially every page load, at two sizes so the growth is
        // visible. A typical page is 2k-10k elements; the larger one is a stress case.
        {
            ...at('article-clean', { generate: articlePage }, false),
            scale: { rows: [2000, 20000] },
        },
        // Little rendered text, ~900KB of script text. The case that inverts gating,
        // because body.textContent scans everything the XPath was written to skip.
        at('script-heavy-clean', { generate: scriptHeavy, params: { scriptBlocks: 40, scriptRepeat: 400, rows: 100 } }, false),
        // Few nodes, high character volume: separates per-character from per-node cost.
        at('text-heavy-clean', { generate: textHeavy, params: { paragraphs: 200, charsPerParagraph: 5000 } }, false),

        // A real match at realistic scale, rather than in an eight-element document.
        payloadOnPage('wrapped', { generate: articlePage, params: { rows: 2000 } }),
        payloadOnPage('boundary', { generate: articlePage, params: { rows: 2000 } }),

        // The full correctness matrix, each payload on its own. Tiny and fast, and the
        // reason a divergence can be named rather than just counted.
        ...payloadFixtures(),
    ],

    configs: [
        {
            name: 'xpath',
            baseline: true,
            reference: true,
            detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }),
        },
        {
            name: 'body-only',
            expectDivergence: true,
            detectors: detector({ pattern: PATTERNS }),
        },
        {
            name: 'gated',
            expectDivergence: true,
            detectors: detector({
                all: [
                    { pattern: PATTERNS, selector: 'body' },
                    { pattern: PATTERNS, xpath: RENDERED_TEXT },
                ],
            }),
        },
        {
            name: 'loose-gated',
            detectors: detector({
                all: [
                    { pattern: GATE_PATTERNS, selector: 'body' },
                    { pattern: PATTERNS, xpath: RENDERED_TEXT },
                ],
            }),
        },
        {
            name: 'self-axis',
            expectDivergence: true,
            detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT_SELF_AXIS }),
        },
        {
            name: 'unchunked',
            detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT, xpathConfig: { chunkSize: 0 } }),
        },
        // A swept parameter: one variant per value, so "does a larger tail cost more" is
        // answered by the run rather than by three copies of this block. The tail is
        // re-scanned by the next regex test and the cut walks backwards over it, so both
        // halves of its cost scale with the value.
        {
            name: 'tail',
            params: { chunkTail: [64, 512, 4096] },
            detectors: ({ chunkTail }) =>
                detector({ pattern: PATTERNS, xpath: RENDERED_TEXT, xpathConfig: { chunkSize: 8192, chunkTail } }),
        },
    ],
};
