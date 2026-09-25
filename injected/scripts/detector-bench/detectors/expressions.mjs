/**
 * XPath expressions for text-matching detector configs, and the vocabulary for talking
 * about them.
 *
 * Detector-agnostic on purpose. These express *where to look* - which is a property of
 * the DOM, not of what is being looked for - so every detector that wants rendered text
 * wants the same expression. Keeping them here rather than in a detector preset is what
 * stops each new detector re-deriving an expression that has already been measured.
 *
 * These are named constants rather than a config-building API. The detector config shape
 * is the shipped privacy-configuration schema, so a config that benches well should paste
 * straight into `settings.detectors` without translation - a builder would put a layer in
 * between and would need mirroring on every schema change.
 */

/** Elements whose text is in the DOM but never rendered. */
export const EXCLUDED = ['script', 'style', 'template', 'noscript'];

/**
 * Rendered text: every text node not beneath an excluded element.
 *
 * The shipped expression, and the reference any alternative is measured against. It
 * selects text nodes directly and filters on ancestry, which is what lets it exclude
 * `<script>` bodies that a `textContent` read would include.
 */
export const RENDERED_TEXT = `//body//text()[${EXCLUDED.map((tag) => `not(ancestor::${tag})`).join(' and ')}]`;

/**
 * The same intent written against the immediate parent instead of the ancestor chain.
 *
 * It looks like it should be cheaper - one `self::` test per element instead of walking
 * the ancestor chain per text node - and measures consistently slower, because it makes
 * the engine visit every element to reach their text children rather than selecting text
 * nodes directly.
 *
 * It also fails in the opposite direction from the obvious guess. It looks like it should
 * false-positive on text nested deeper than one level inside an excluded element, and
 * against `<noscript>` it does not: with scripting enabled a browser parses noscript
 * content as raw text rather than elements, so there is no inner element for the predicate
 * to admit.
 *
 * What it actually does is false-negative. `//body//*` only matches *descendant* elements
 * of body, so text whose parent is `body` itself is never selected - see the `bare`,
 * `bareWithUnrelatedScript` and `bareSiblingOfMatchingScript` cases in
 * `assertions/rendered-text.mjs`. Worth keeping as a measured variant precisely because
 * reasoning about it gets the direction wrong.
 */
export const RENDERED_TEXT_SELF_AXIS = `//body//*[${EXCLUDED.map((tag) => `not(self::${tag})`).join(' and ')}]/text()`;

/**
 * A cheap whole-body text condition placed in front of an expensive one, so the expensive
 * condition only runs on candidate pages.
 *
 * Sound only if the gate cannot reject a page the real condition would accept, which is
 * why `gatePatterns` must be *looser* than `patterns`. Gating on the same patterns fails
 * that: whole-body text keeps script source in between, so a phrase interrupted by a
 * `<script>` no longer reads as contiguous (the `boundary` case). Gate on the shortest
 * keyword every pattern contains instead.
 *
 * Worth measuring rather than assuming. Gating is around 12x faster on a normal article,
 * where the gate almost always fails, and around 24x *slower* on a script-heavy page,
 * where `body.textContent` scans everything the XPath was written to skip.
 *
 * @param {string[]} gatePatterns - The loose discriminator, tested against `body`
 * @param {string[]} patterns - The real patterns
 * @param {string} expression - The expensive XPath expression
 * @returns {{ all: object[] }}
 */
export const gatedOn = (gatePatterns, patterns, expression) => ({
    all: [
        { pattern: gatePatterns, selector: 'body' },
        { pattern: patterns, xpath: expression },
    ],
});
