/**
 * Shared vocabulary for adwall benchmarks: the shipped patterns, the expressions that
 * express "rendered text only", and helpers to turn `payloads.mjs` into fixtures.
 *
 * Every spec was carrying its own copy of these, which is how a spec ends up measuring
 * a pattern set that no longer matches what ships.
 */
import { PAYLOADS } from './payloads.mjs';

/** The detector this vocabulary describes, as `groupName.detectorId`. */
export const DETECTOR_KEY = 'adwalls.generic_en';

/** The patterns shipped for `adwalls.generic_en` in privacy-configuration. */
export const PATTERNS = [
    'ad ?block(er)? detected',
    'adjust(ing)?( your)? ad blocking settings',
    '(turn(ing)? off|disable|disabling|deactivate)( your| my)? ad ?block(er)?',
    'your ad ?blocker is on',
    "you('re| are| may be) using an ad blocker",
];

/**
 * A gate is only sound if it cannot reject a page the real patterns would accept.
 * Gating on the full patterns fails that: whole-body text keeps script source in
 * between, so a phrase interrupted by a `<script>` no longer reads as contiguous (see
 * the `boundary` payload). Gating on the shortest keyword every pattern contains
 * survives it, because the keyword itself is unlikely to be split.
 */
export const GATE_PATTERNS = ['ad ?block'];

/** Elements whose text is in the DOM but never rendered. */
export const EXCLUDED = ['script', 'style', 'template', 'noscript'];

/** Rendered text: every text node not beneath an excluded element. */
export const RENDERED_TEXT = `//body//text()[${EXCLUDED.map((tag) => `not(ancestor::${tag})`).join(' and ')}]`;

/**
 * The same intent written against the immediate parent instead of the ancestor chain.
 *
 * It looks like it should be cheaper - one `self::` test per element instead of walking
 * the ancestor chain per text node - and measures consistently slower, because it makes
 * the engine visit every element to reach their text children rather than selecting text
 * nodes directly.
 *
 * It also fails in the opposite direction from the obvious guess.
 * It looks like it should false-positive on text nested deeper than one level inside an
 * excluded element, and against `<noscript>` it does not: with scripting enabled a browser
 * parses noscript content as raw text rather than elements, so there is no inner element
 * for the predicate to admit.
 *
 * What it actually does is false-negative. `//body//*` only matches *descendant* elements
 * of body, so text whose parent is `body` itself is never selected - see the `bare`,
 * `bareWithUnrelatedScript` and `bareSiblingOfMatchingScript` payloads. Worth keeping as a
 * measured variant precisely because reasoning about it gets the direction wrong.
 */
export const RENDERED_TEXT_SELF_AXIS = `//body//*[${EXCLUDED.map((tag) => `not(self::${tag})`).join(' and ')}]/text()`;

/**
 * Wrap a `text` condition into the detector config shape, which is the same shape as
 * `settings.detectors` in privacy-configuration - so a real config pastes straight in.
 *
 * @param {object} text
 * @returns {Record<string, Record<string, object>>}
 */
export const detector = (text) => ({ adwalls: { generic_en: { match: { text } } } });

/**
 * Label a fixture with its expected result for this detector.
 *
 * @param {string} name
 * @param {object} fixture
 * @param {boolean} expected
 * @returns {object}
 */
export const at = (name, fixture, expected) => ({ ...fixture, name, expect: { [DETECTOR_KEY]: expected } });

/**
 * A payload on its own, as a minimal fixture. Fast to run and unambiguous, so this is
 * the right shape for correctness cases.
 *
 * @param {keyof typeof PAYLOADS} name
 * @returns {object}
 */
export function payloadFixture(name) {
    const payload = PAYLOADS[name];
    if (!payload) throw new Error(`Unknown payload "${name}". Known: ${Object.keys(PAYLOADS).join(', ')}`);
    return at(name, { html: payload.html }, payload.expected);
}

/**
 * Every payload as a minimal fixture, or a named subset.
 *
 * @param {Array<keyof typeof PAYLOADS>} [names] - Defaults to all of them
 * @returns {object[]}
 */
export function payloadFixtures(names) {
    return (names ?? /** @type {Array<keyof typeof PAYLOADS>} */ (Object.keys(PAYLOADS))).map(payloadFixture);
}

/**
 * A payload appended to a generated page, so the match is found at realistic scale
 * rather than in an eight-element document.
 *
 * The generator and params are shared with the non-matching fixtures, so a timing
 * difference between them reflects the match and not the page.
 *
 * @param {keyof typeof PAYLOADS} name
 * @param {{ generate: Function, params?: object }} page
 * @returns {object}
 */
export function payloadOnPage(name, { generate, params = {} }) {
    const payload = PAYLOADS[name];
    if (!payload) throw new Error(`Unknown payload "${name}". Known: ${Object.keys(PAYLOADS).join(', ')}`);
    return at(`${name}-on-page`, { generate, params: { ...params, append: payload.html } }, payload.expected);
}
