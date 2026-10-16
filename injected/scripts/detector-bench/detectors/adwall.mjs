/**
 * The adwall detector as a preset: its key, its shipped patterns, and the assertion set
 * bound to it.
 *
 * A preset is the concrete half of the vocabulary - what this particular detector looks
 * for. The abstract half, where to look, lives in `expressions.mjs` and is shared with
 * every other text detector. Splitting them is what lets a second detector reuse the
 * measured expressions without inheriting adwall's patterns.
 *
 * Every spec was carrying its own copy of the patterns, which is how a spec ends up
 * measuring a pattern set that no longer matches what ships.
 */
import { CASES } from '../assertions/rendered-text.mjs';
import { fixturesFor } from '../assertions/to-fixtures.mjs';

/** The detector this preset describes, as `groupName.detectorId`. */
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
 * The shortest keyword every shipped pattern contains, for use as a gate.
 *
 * A gate is only sound if it cannot reject a page the real patterns would accept, and
 * gating on the full patterns fails that - see `gatedOn` in `expressions.mjs`.
 */
export const GATE_PATTERNS = ['ad ?block'];

/**
 * Wrap a `text` condition into the detector config shape, which is the same shape as
 * `settings.detectors` in privacy-configuration - so a real config pastes straight in.
 *
 * @param {object} text
 * @returns {Record<string, Record<string, object>>}
 */
export const detector = (text) => ({ adwalls: { generic_en: { match: { text } } } });

/**
 * The rendered-text assertion set, labelled for this detector.
 *
 * `at` labels an arbitrary fixture; `caseFixture`/`caseFixtures` produce minimal
 * correctness fixtures; `caseOnPage` appends one to a generated page.
 */
export const { at, caseFixture, caseFixtures, caseOnPage } = fixturesFor(DETECTOR_KEY, CASES);
