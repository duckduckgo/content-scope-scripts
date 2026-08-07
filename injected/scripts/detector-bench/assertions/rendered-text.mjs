/**
 * Assertion set: **does this approach match rendered text while excluding text that is
 * in the DOM but never displayed?**
 *
 * That question is the accuracy standard a rendered-text matching approach is held to,
 * and these are the DOM shapes that decide it. Any approach - a detector config, an
 * experimental algorithm, the shipped implementation - can be run against this set and
 * scored, which is what makes "how accurate was it" answerable rather than a judgement
 * call.
 *
 * The set exists because the same cases kept being re-derived by hand. It started as the
 * false positive that motivated the work - adwall copy appearing inside a `<script>`
 * body, `<script>{"text": "disable your adblocker"}</script>` - and grew every time an
 * approach turned out to differ on a case nobody had written down. Add to it rather than
 * re-deriving it.
 *
 * Deliberately pure data: markup, the answer, and why the case exists. No detector names,
 * no config, no fixture shape - `to-fixtures.mjs` supplies those, which is what lets one
 * set serve any detector. `drift-guard.mjs` reads the same set to check the lib against
 * the real implementation, so both work from one definition of correct.
 *
 * The phrases used are the shipped `adwalls.generic_en` ones, because they are real, but
 * nothing here depends on that detector: the cases are about *where* text lives in the
 * DOM, not what it says.
 *
 * Every case is a `<body>` fragment. Each either contains a phrase as *rendered* text
 * (`expected: true`) or contains it only somewhere that is not rendered, or not at all
 * (`expected: false`).
 *
 * @typedef {object} AssertionCase
 * @property {string} html - Body fragment
 * @property {boolean} expected - Whether rendered-text matching should report a match
 * @property {string} why - What this case is here to pin down
 */

/** What an approach must get right to pass this set. Shown in the accuracy summary. */
export const QUESTION = 'match rendered text, excluding text present in the DOM but never displayed';

/** @type {Record<string, AssertionCase>} */
export const CASES = {
    absent: {
        html: '<p>Hello!</p>',
        expected: false,
        why: 'the overwhelmingly common case - no pattern anywhere, and the one that runs on every page load',
    },
    wrapped: {
        html: '<div class="wall"><p>Please disable your adblocker to continue</p></div>',
        expected: true,
        why: 'the plain positive: phrase in a single text node inside a wrapper',
    },
    bare: {
        html: 'adblocker detected',
        expected: true,
        why: 'text directly under body, with no element between it and the root. Discriminating: any expression built on `//body//*` misses this, because that matches descendant elements and body is not one of them',
    },
    bareWithUnrelatedScript: {
        html: `adblocker detected<script>console.log('Hello!');</script>`,
        expected: true,
        why: 'a script on the page must not suppress a real match elsewhere',
    },
    scriptOnly: {
        html: '<script>var msg = "adblocker detected"; showWall(msg);</script>',
        expected: false,
        why: 'the false positive that motivated all of this - the reason the predicate exists',
    },
    scriptOnlyNested: {
        html: '<div><section><script>var msg = "adblocker detected";</script></section></div>',
        expected: false,
        why: 'exclusion must hold at any depth, not just for a direct child of body',
    },
    renderedAndScript: {
        html: '<div class="wall"><p>adblocker detected</p></div><script>var msg = "adblocker detected"; log(msg);</script>',
        expected: true,
        why: 'a decoy in a script must not mask the genuine rendered match',
    },
    bareSiblingOfMatchingScript: {
        html: 'adblocker detected<script>var msg = "adblocker detected"; log(msg);</script>',
        expected: true,
        why: 'same as above with no wrapper element, which some ancestor-walking approaches get wrong',
    },
    splitInline: {
        html: '<div class="wall"><p>Please <em>disable</em> your <b>adblocker</b> to continue</p></div>',
        expected: true,
        why: 'the shape real adwall copy usually has - a phrase broken across inline markup, so per-node testing false-negatives',
    },
    boundary: {
        html: '<div>your adblocker <script>var a=1;</script>is on</div>',
        expected: true,
        why: 'phrase interrupted by an excluded subtree. Rendered text reads it as contiguous; whole-body textContent does not, which is why a gate on the full patterns is unsound',
    },
    styleOnly: {
        html: '<style>/* adblocker detected */</style>',
        expected: false,
        why: 'exclusion is not script-specific',
    },
    templateOnly: {
        html: '<template><div><p>adblocker detected</p></div></template>',
        expected: false,
        why: 'template content is inert and never rendered',
    },
    noscriptOnly: {
        html: '<noscript><div><p>adblocker detected</p></div></noscript>',
        expected: false,
        why: 'never rendered with scripting enabled. Note the inner markup is NOT parsed as elements in that case - the whole thing is one text node - so this case does not discriminate between ancestor-axis and self-axis exclusion the way it looks like it should',
    },
};

/**
 * Cases whose whole point is that some plausible approach gets them wrong. Each has an
 * approach that measured well and failed here:
 * - `scriptOnly` - whole-body `textContent`, the original false positive
 * - `boundary` - gating an xpath condition on the same patterns
 * - `splitInline` - testing each selected node separately instead of jointly
 * - `bare` - any expression rooted at `//body//*`
 */
export const DISCRIMINATING_CASES = ['scriptOnly', 'boundary', 'splitInline', 'bare'];
