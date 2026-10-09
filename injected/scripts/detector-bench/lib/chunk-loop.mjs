/**
 * Scaffolding for the narrower experiment where only the buffer cut varies.
 *
 * The chunked scan has to decide what to keep after each flush. Comparing ways of
 * doing that is only meaningful if everything around the cut is identical, so the
 * loop lives here and the cut is the parameter:
 *
 * ```js
 * import { chunkedMatcher } from '../lib/chunk-loop.mjs';
 *
 * export const { evaluateMatch } = chunkedMatcher((buffer, chunkTail) => buffer.slice(-chunkTail));
 * ```
 *
 * The loop mirrors `xpathMatches` in `injected/src/features/web-detection/matching.js`,
 * including the property that is easiest to lose when reimplementing it: flushing is
 * driven by characters added *since the last test*, not by total buffer length.
 * Flushing on buffer length couples progress to the tail, so once the tail is large
 * the buffer never drops below the threshold and every subsequent node re-tests the
 * whole buffer.
 */
import { createMatcher, snapshot } from './matcher.mjs';

/** Defaults from `matching.js`, so an experiment run without config matches production. */
export const DEFAULT_CHUNK_SIZE = 8192;
export const CHUNK_TAIL_RATIO = 16;

/**
 * How far a cut may walk looking for a word boundary. Deliberately independent of
 * `chunkTail` in the shipped implementation, so raising the tail does not silently
 * multiply the cost of the scan.
 */
export const MAX_WORD_LENGTH = 64;

/** The regex form of the word test, for experiments measuring its cost. */
export const WORD_CHARACTER = /\w/;

/**
 * `\w` as a code check. Equivalent to `[A-Za-z0-9_]` for every flag combination
 * except `i` with `u`/`v`, which pulls U+017F and U+212A into `\w`.
 *
 * @param {number} code
 * @returns {boolean}
 */
export function isWordCode(code) {
    return (code >= 97 && code <= 122) || (code >= 65 && code <= 90) || (code >= 48 && code <= 57) || code === 95;
}

/**
 * The cut under test.
 *
 * @callback RetainTail
 * @param {string} buffer
 * @param {number} chunkTail
 * @returns {string}
 */

/**
 * @param {RetainTail} retainTail
 * @returns {{ evaluateMatch: (conditions: any) => boolean }}
 */
export function chunkedMatcher(retainTail) {
    return createMatcher({
        matchXPath(pattern, expression, xpathConfig) {
            const chunkSize = xpathConfig?.chunkSize ?? DEFAULT_CHUNK_SIZE;
            const chunkTail = xpathConfig?.chunkTail ?? Math.floor(chunkSize / CHUNK_TAIL_RATIO);

            const nodes = snapshot(expression);
            let buffer = '';
            let pending = 0;
            let peak = 0;
            for (let i = 0; i < nodes.snapshotLength; i++) {
                const text = nodes.snapshotItem(i)?.textContent || '';
                buffer += text;
                pending += text.length;
                if (buffer.length > peak) peak = buffer.length;
                // chunkSize 0 disables chunking, accumulating everything for the single test below
                if (chunkSize > 0 && pending >= chunkSize) {
                    if (pattern.test(buffer)) {
                        recordPeak(peak);
                        return true;
                    }
                    buffer = retainTail(buffer, chunkTail);
                    pending = 0;
                }
            }
            recordPeak(peak);
            return pattern.test(buffer);
        },
    });
}

/**
 * Report the high-water buffer length, which the harness picks up under `--memory`.
 * The bound on this is the entire point of chunking, so it is worth reporting even
 * though timing is what the harness measures by default.
 *
 * @param {number} peak
 */
function recordPeak(peak) {
    const w = /** @type {any} */ (globalThis);
    if (peak > (w.__benchPeakChars ?? 0)) w.__benchPeakChars = peak;
}
