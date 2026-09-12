/**
 * The lib's rendition of the shipped xpath strategy: chunked scanning with a
 * word-aligned tail cut, as implemented by `xpathMatches` and `retainTail` in
 * `injected/src/features/web-detection/matching.js`.
 *
 * Two jobs. It is the control in an algorithm comparison, so a difference another
 * experiment shows is attributable to that experiment rather than to the lib. And it
 * is what `drift-guard.mjs` checks against the real implementation, which is what
 * makes the first job trustworthy.
 *
 * Change this only to track a change in `matching.js`, and run the drift guard after.
 */
import { chunkedMatcher, isWordCode, MAX_WORD_LENGTH } from './chunk-loop.mjs';

/**
 * Reduce a scanned buffer to its trailing `chunkTail` characters, extending the cut
 * backwards to the nearest non-word character.
 *
 * @param {string} buffer
 * @param {number} chunkTail
 * @returns {string}
 */
export function retainTail(buffer, chunkTail) {
    let cut = buffer.length - chunkTail;
    if (cut <= 0) return buffer;
    // Ceiling on the walk, so an unbroken run of word characters cannot grow the buffer
    // without limit. Reaching it leaves position 0 mid-word, giving up the boundary
    // guarantee for this flush - a hard bound is worth more than exact `\b` semantics
    // inside a blob a phrase pattern will not match anyway. Never more than `chunkTail`,
    // so a tail of 0 still retains nothing.
    const limit = Math.max(0, cut - Math.min(chunkTail, MAX_WORD_LENGTH));
    // Land the cut just after a non-word character, so position 0 is a real word boundary
    // rather than an artefact of where the chunk ended. This only lengthens the tail, so
    // it introduces no false negative.
    while (cut > limit && isWordCode(buffer.charCodeAt(cut - 1))) cut--;
    return buffer.slice(cut);
}

export const { evaluateMatch } = chunkedMatcher(retainTail);
