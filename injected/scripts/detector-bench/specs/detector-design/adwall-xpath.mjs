/**
 * What does the adwall detector's rendered-text config cost, and what do the cheaper
 * ways of writing it trade away?
 *
 * A config spec: the implementation is whatever is in the working tree, and the thing
 * being varied is the detector configuration. That makes it durable - there are no
 * experiment files to go stale, so this keeps running and keeps meaning the same thing as
 * `matching.js` evolves.
 *
 * SCOPE: how the detector is *written*. The chunking parameters are a different question
 * with a different answer, and live in `specs/implementation/chunking.mjs`.
 *
 * Five ways of writing one detector:
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
 *
 * Three of those change behaviour and say so with `expectDivergence`. That is the point
 * of the spec rather than a defect in it: `gated` is around an order of magnitude faster
 * on a normal page and timing alone would have shipped it, so the run has to show what it
 * costs at the same time as what it saves.
 */
import { articlePage, scriptHeavy, textHeavy } from '../../page-gen/pages.mjs';
import { RENDERED_TEXT, RENDERED_TEXT_SELF_AXIS, gatedOn } from '../../detectors/expressions.mjs';
import { PATTERNS, GATE_PATTERNS, detector, at, caseFixtures, caseOnPage } from '../../detectors/adwall.mjs';

export default {
    kind: 'config',

    fixtures: [
        // The case that runs on essentially every page load, at two sizes so the growth is
        // visible. A typical page is 2k-10k elements; the larger one is a stress case.
        // The `-clean` fixtures are all `purpose: 'timing'`: their only label is "no match
        // anywhere", which the payload matrix below already covers in a few milliseconds.
        // Generating a 20k-row DOM to re-establish it is what made --check-only slow.
        {
            ...at('article-clean', { generate: articlePage }, false),
            scale: { rows: [2000, 20000] },
            purpose: 'timing',
        },
        // Little rendered text, ~900KB of script text. The case that inverts gating,
        // because body.textContent scans everything the XPath was written to skip.
        {
            ...at('script-heavy-clean', { generate: scriptHeavy, params: { scriptBlocks: 40, scriptRepeat: 400, rows: 100 } }, false),
            purpose: 'timing',
        },
        // Few nodes, high character volume: separates per-character from per-node cost.
        {
            ...at('text-heavy-clean', { generate: textHeavy, params: { paragraphs: 200, charsPerParagraph: 5000 } }, false),
            purpose: 'timing',
        },

        // A real match at realistic scale, rather than in an eight-element document.
        caseOnPage('wrapped', { generate: articlePage, params: { rows: 2000 } }),
        caseOnPage('boundary', { generate: articlePage, params: { rows: 2000 } }),

        // The full correctness matrix, each payload on its own. Tiny and fast, and the
        // reason a divergence can be named rather than just counted.
        ...caseFixtures(),
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
            detectors: detector(gatedOn(PATTERNS, PATTERNS, RENDERED_TEXT)),
        },
        {
            name: 'loose-gated',
            detectors: detector(gatedOn(GATE_PATTERNS, PATTERNS, RENDERED_TEXT)),
        },
        {
            name: 'self-axis',
            expectDivergence: true,
            detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT_SELF_AXIS }),
        },
    ],
};
