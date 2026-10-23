/**
 * How does rendered-text matching scale with the *shape* of the DOM rather than its text?
 *
 * The chunked scan is proportional to characters and priced by `specs/implementation/chunking.mjs`.
 * Everything before it is proportional to nodes: the engine walks the tree, tests an
 * ancestor chain per candidate text node, and allocates a snapshot of the ones it selects.
 * That is the cost the chunking work never touched, and the one behind the standing review
 * note that broad expressions are expensive on large pages. This spec prices it.
 *
 * Four shape axes, each swept so the growth is readable rather than inferred from one
 * point, and each chosen to move one thing while holding the others still:
 *
 * - `element-heavy`   elements with almost no text. Every other fixture raises element
 *                     count and text-node count together, so this is the only one that
 *                     prices walking past nodes the expression does not select.
 * - `many-tiny-nodes` the mirror: many selected text nodes, negligible characters.
 * - `deeply-nested`   depth with one text node per chain, so `ancestor::` is priced alone.
 * - `nested-inline`   depth multiplied by text nodes, which is what real markup looks like
 *                     and where an ancestor-chain predicate should cost the most.
 *
 * Three ways of writing the condition, because the shape axes are exactly where they
 * diverge, and two of them are the alternatives reviewers keep proposing:
 *
 * - `xpath`      the shipped ancestor-axis expression, and the reference
 * - `self-axis`  exclusion against the immediate parent. It forces the engine to visit
 *                every element rather than selecting text nodes directly, so
 *                `element-heavy` is the fixture that should punish it hardest - and it
 *                false-negatives on text whose parent is `body` (see `detectors/expressions.mjs`)
 * - `body-only`  no XPath at all. The floor: one `textContent` read, no per-node work.
 *                It is the false positive this whole feature exists to remove, so it is
 *                here as a bound on what any node-walking approach could ever save
 *
 * Read the `ns/char` column with care here. These fixtures deliberately break the link
 * between characters and work, so on `element-heavy` it is nearly meaningless - compare
 * medians down the sweep against node counts in the fixture header instead.
 */
import { articlePage, deeplyNested, elementHeavy, manyTinyTextNodes, nestedInline } from '../../page-gen/pages.mjs';
import { RENDERED_TEXT, RENDERED_TEXT_SELF_AXIS } from '../../detectors/expressions.mjs';
import { PATTERNS, detector, at, caseFixtures, caseOnPage } from '../../detectors/adwall.mjs';

export default {
    kind: 'config',
    iterations: 20,

    fixtures: [
        // This spec is entirely about how cost scales with DOM shape, so every scaled
        // fixture is `purpose: 'timing'` - a 160k-node page contributes one "no match"
        // label that the payload matrix already covers.
        // Node count with the text held down: 180k elements, essentially no text.
        {
            ...at('element-heavy-clean', { generate: elementHeavy, params: { emptyPerBlock: 8 } }, false),
            scale: { blocks: [5000, 20000, 60000] },
            purpose: 'timing',
        },
        // Selected text nodes with the characters held down.
        {
            ...at('many-tiny-nodes-clean', { generate: manyTinyTextNodes }, false),
            scale: { count: [10000, 40000, 160000] },
            purpose: 'timing',
        },
        // Depth alone: one text node at the bottom of each chain.
        {
            ...at('deeply-nested-clean', { generate: deeplyNested, params: { rows: 500 } }, false),
            scale: { depth: [10, 30, 100] },
            purpose: 'timing',
        },
        // Depth and text nodes together, in the shape real markup has.
        {
            ...at('nested-inline-clean', { generate: nestedInline, params: { blocks: 5000 } }, false),
            scale: { depth: [3, 6, 12] },
            purpose: 'timing',
        },
        // The realistic mixed page, as the point of reference the others are read against.
        {
            ...at('article-clean', { generate: articlePage }, false),
            scale: { rows: [2000, 20000] },
            purpose: 'timing',
        },

        // A match on a node-heavy page, so short-circuiting is exercised on this axis too.
        caseOnPage('splitInline', { generate: nestedInline, params: { blocks: 5000, depth: 6 } }),
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
            name: 'self-axis',
            expectDivergence: true,
            detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT_SELF_AXIS }),
        },
        {
            name: 'body-only',
            expectDivergence: true,
            detectors: detector({ pattern: PATTERNS }),
        },
    ],
};
