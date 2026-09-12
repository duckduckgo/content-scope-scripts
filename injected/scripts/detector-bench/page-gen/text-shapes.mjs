/**
 * Inputs for string-level subjects.
 *
 * Separate from `pages.mjs` because these are the opposite kind of thing. A page
 * generator is serialised into the page and builds a DOM; these are plain Node-side
 * functions returning a string, for measuring a step that operates on text after the
 * DOM work is done - a buffer cut, a boundary scan, a regex test.
 *
 * Keeping them apart matters in one direction specifically: a fixture generator cannot
 * close over module scope, so it cannot call these. `unbrokenWordRuns` in `pages.mjs`
 * inlines its own copy for exactly that reason.
 *
 * All output is deterministic, so runs are comparable.
 */

/**
 * Ordinary prose. The realistic case, and the one that hides a boundary scan's cost:
 * the nearest space is usually a few characters away.
 *
 * @param {number} length
 * @returns {string}
 */
export function prose(length) {
    const sentence = 'The quick brown fox jumps over the lazy dog while the sun sets behind distant hills. ';
    return sentence.repeat(Math.ceil(length / sentence.length)).slice(0, length);
}

/**
 * An unbroken run of word characters. The worst case for any backwards or forwards scan
 * looking for a non-word character, since there is never one to find and every scan runs
 * to its ceiling.
 *
 * @param {number} length
 * @returns {string}
 */
export function unbrokenWords(length) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[i % alphabet.length];
    return out;
}

/**
 * Prose with an occasional long token - a URL, hash or base64 fragment. The realistic
 * middle ground, and the shape that decides whether the worst case above is worth
 * designing around or is a curiosity.
 *
 * @param {number} length
 * @returns {string}
 */
export function sparseBreaks(length) {
    const token = unbrokenWords(200);
    const chunk = prose(300) + token + ' ';
    return chunk.repeat(Math.ceil(length / chunk.length)).slice(0, length);
}
