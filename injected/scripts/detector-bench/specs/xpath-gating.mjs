/**
 * Worked example: is it worth gating an expensive XPath text condition behind a
 * cheap whole-body one?
 *
 * Three configs for the same detector:
 * - `body-only`  the implicit `selector: body` path - cheapest, but matches text
 *                inside <script>, which is what the XPath predicate exists to avoid
 * - `xpath`      rendered-text only, via ancestor predicates - correct, expensive
 * - `gated`      `all: [body, xpath]` - the body condition short-circuits, so the
 *                XPath only runs on pages that already look like a candidate
 *
 * THIS SPEC IS EXPECTED TO EXIT NON-ZERO. Two of the three configs genuinely
 * change detection behaviour, and the run is meant to show that:
 * - `body-only` false-positives on `pattern-in-script-only`
 * - `gated` false-negatives on `pattern-spans-script-boundary`, because the
 *   XPath concatenates across the excluded <script> ("your adblocker is on")
 *   while body.textContent keeps it in between ("your adblocker var a=1;is on")
 *
 * That second failure is the reason correctness labels are mandatory: gating is
 * several times faster and timing alone would have called it a clear win.
 */
import { articlePage, scriptHeavy } from '../fixtures.mjs';

/** The patterns shipped for adwalls.generic_en in privacy-configuration. */
const PATTERNS = [
    'ad ?block(er)? detected',
    'adjust(ing)?( your)? ad blocking settings',
    '(turn(ing)? off|disable|disabling|deactivate)( your| my)? ad ?block(er)?',
    'your ad ?blocker is on',
    "you('re| are| may be) using an ad blocker",
];

const RENDERED_TEXT =
    '//body//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';

/** @param {object} text - The `text` condition under test */
const detector = (text) => ({ adwalls: { generic_en: { match: { text } } } });

const ADWALL = '<div class="wall"><p>Please disable your adblocker to continue</p></div>';
const SCRIPT_DECOY = '<script>var msg = "adblocker detected"; showWall(msg);</script>';
const BOUNDARY = '<div>your adblocker <script>var a=1;</script>is on</div>';

/**
 * @param {string} name
 * @param {object} params
 * @param {boolean} expected
 */
const article = (name, params, expected) => ({
    name,
    generate: articlePage,
    params,
    expect: { 'adwalls.generic_en': expected },
});

export default {
    iterations: 15,
    fixtures: [
        article('article-2k-clean', { rows: 2000 }, false),
        article('article-20k-clean', { rows: 20000 }, false),
        {
            name: 'script-heavy-clean',
            generate: scriptHeavy,
            params: { scriptBlocks: 40, scriptRepeat: 400, rows: 100 },
            expect: { 'adwalls.generic_en': false },
        },
        article('article-2k-adwall', { rows: 2000, append: ADWALL }, true),
        article('pattern-in-script-only', { rows: 2000, append: SCRIPT_DECOY }, false),
        article('pattern-spans-script-boundary', { rows: 2000, append: BOUNDARY }, true),
    ],
    variants: [
        { name: 'xpath', baseline: true, detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }) },
        { name: 'body-only', detectors: detector({ pattern: PATTERNS }) },
        {
            name: 'gated',
            detectors: detector({
                all: [
                    { pattern: PATTERNS, selector: 'body' },
                    { pattern: PATTERNS, xpath: RENDERED_TEXT },
                ],
            }),
        },
    ],
};
