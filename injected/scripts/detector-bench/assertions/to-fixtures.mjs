/**
 * Turn an assertion set into spec fixtures for a given detector.
 *
 * An assertion set (see `rendered-text.mjs`) is pure data - markup, the answer, and why
 * the case exists - and says nothing about which detector is being asked. A spec fixture
 * needs the opposite: a name and an `expect` map keyed by `groupName.detectorId`. This
 * module is the join between them, and taking the detector key as a parameter is what
 * lets one assertion set score any detector rather than only the one it grew up around.
 *
 * ```js
 * const { at, caseFixtures, caseOnPage } = fixturesFor('adwalls.generic_en', CASES);
 * ```
 */

/**
 * @typedef {import('./rendered-text.mjs').AssertionCase} AssertionCase
 */

/**
 * A fixture as a spec authors it. Mirrors the `Fixture` typedef in `run.mjs`; repeated
 * here rather than imported because `run.mjs` parses `argv` at import time.
 *
 * @typedef {object} SpecFixture
 * @property {string} name
 * @property {string} [html]
 * @property {Function} [generate]
 * @property {object} [params]
 * @property {Record<string, boolean>} expect
 */

/**
 * Bind an assertion set to a detector key.
 *
 * @param {string} detectorKey - `groupName.detectorId`, as it appears in a fixture's `expect`
 * @param {Record<string, AssertionCase>} cases
 */
export function fixturesFor(detectorKey, cases) {
    /**
     * Label an arbitrary fixture with its expected result for this detector. Use it for
     * fixtures that are not assertion cases - a generated page with no match, say.
     *
     * @param {string} name
     * @param {object} fixture
     * @param {boolean} expected
     * @returns {SpecFixture}
     */
    const at = (name, fixture, expected) => ({ ...fixture, name, expect: { [detectorKey]: expected } });

    /**
     * @param {string} name
     * @returns {AssertionCase}
     */
    function lookup(name) {
        const found = cases[name];
        if (!found) throw new Error(`Unknown case "${name}". Known: ${Object.keys(cases).join(', ')}`);
        return found;
    }

    /**
     * One case on its own, as a minimal fixture. Fast to run and unambiguous, so this is
     * the right shape for correctness cases.
     *
     * @param {string} name
     * @returns {SpecFixture}
     */
    const caseFixture = (name) => at(name, { html: lookup(name).html }, lookup(name).expected);

    /**
     * Every case as a minimal fixture, or a named subset.
     *
     * @param {string[]} [names] - Defaults to all of them
     * @returns {SpecFixture[]}
     */
    const caseFixtures = (names) => (names ?? Object.keys(cases)).map(caseFixture);

    /**
     * One case appended to a generated page, so the match is found at realistic scale
     * rather than in an eight-element document.
     *
     * The generator and params are shared with the non-matching fixtures, so a timing
     * difference between them reflects the match and not the page.
     *
     * @param {string} name
     * @param {{ generate: Function, params?: object }} page
     * @returns {SpecFixture}
     */
    const caseOnPage = (name, { generate, params = {} }) => {
        const found = lookup(name);
        return at(`${name}-on-page`, { generate, params: { ...params, append: found.html } }, found.expected);
    };

    return { detectorKey, at, caseFixture, caseFixtures, caseOnPage };
}
