/**
 * What does chunking cost, and what does each chunking parameter buy?
 *
 * A config spec: the implementation is whatever is in the working tree, and the thing
 * varied is `xpathConfig`. Questions about *how* to write the detector - gating, the
 * self-axis expression, body-only - are a different question and live in
 * `specs/detector-design/adwall-xpath.mjs`. Questions about which buffer cut to use vary code rather than
 * config, so they live on the algorithm axis (`.bench-variants/tail-strategy.mjs`).
 *
 * Chunking exists to bound peak memory, and bounding it is not free. The added work is
 * two things, both proportional to the number of flushes (N / chunkSize):
 *
 * - the retained tail is scanned again by the next regex test, costing N * (tail / chunkSize)
 * - each flush pays a fixed cost: one more regex entry, and one walk-back over the cut
 *
 * At the defaults that predicts a sixteenth of re-scanned characters plus ~N/8192 fixed
 * costs, and the sweep is here to say whether the constant behind that is small enough to
 * ignore. `chunkSize: 0` is the unchunked control and the baseline, so every ratio in the
 * `vs` column reads directly as "what chunking costs against not chunking at all".
 *
 * Chunking also *saves* CPU whenever the page matches, because a flush that matches
 * returns without reading the rest of the document. That only shows up if the match is
 * near the front, hence `adwall-first` alongside the appended payloads - on `adwall-first`
 * the ratios should invert.
 *
 * Two sweeps of chunkSize rather than one, because they answer different questions:
 * `chunk-fixed-tail` holds the tail at 512 so the only variable is flush frequency, and
 * `chunk-default-tail` lets the tail default to chunkSize/16, which is what a config
 * author who sets only `chunkSize` actually gets.
 *
 * Run it with `--memory` for the heap column. That is the only memory figure available on
 * this axis, because the shipped implementation carries no instrumentation - for the
 * high-water buffer length itself, point a spec's `implementation` at
 * `lib/shipped-strategy.mjs`, which reports `peak buffer` - but note that measures the
 * lib's rendition of the shipped scan rather than `matching.js`, so it is only meaningful
 * while `npm run bench-drift-guard` passes.
 */
import { articlePage, manyTinyTextNodes, scriptHeavy, textHeavy, unbrokenWordRuns } from '../../page-gen/pages.mjs';
import { RENDERED_TEXT } from '../../detectors/expressions.mjs';
import { PATTERNS, detector, at, caseFixtures, caseOnPage } from '../../detectors/adwall.mjs';

/**
 * @param {{ chunkSize: number, chunkTail?: number }} xpathConfig
 * @returns {Record<string, Record<string, object>>}
 */
const chunked = (xpathConfig) => detector({ pattern: PATTERNS, xpath: RENDERED_TEXT, xpathConfig });

/** The adwall payload placed before the generated filler, so a flush matches early. */
const ADWALL_FIRST = '<div class="wall"><p>Please disable your adblocker to continue</p></div>';

export default {
    kind: 'config',
    // Chunking differences are single-digit percentages on prose, which is below the noise
    // floor at the default 15. See the p95 column before trusting anything smaller.
    iterations: 25,

    fixtures: [
        // No match anywhere: what runs on essentially every page load, and where chunking
        // can only cost. Scaled because the overhead is per-flush, so it should track
        // character count rather than appearing at one size.
        // Every `-clean` fixture here is `purpose: 'timing'`. They are labelled "no match"
        // and nothing else, so a correctness pass learns nothing from them that the matching
        // fixtures below do not establish - and the flush path stays covered, because those
        // fixtures are large enough to flush.
        {
            ...at('article-clean', { generate: articlePage }, false),
            scale: { rows: [2000, 20000, 100000] },
            purpose: 'timing',
        },
        // 1M characters over few nodes: isolates the re-scanned tail from per-node cost.
        {
            ...at('text-heavy-clean', { generate: textHeavy, params: { paragraphs: 200, charsPerParagraph: 5000 } }, false),
            purpose: 'timing',
        },
        // The same volume with no word breaks, so every walk-back runs to MAX_WORD_LENGTH
        // instead of stopping at the first space. The worst case for the per-flush cost.
        {
            ...at('unbroken-word-runs-clean', { generate: unbrokenWordRuns, params: { blocks: 200, charsPerBlock: 5000 } }, false),
            purpose: 'timing',
        },
        // The mirror: many nodes, few characters. Flushes are driven by characters, so this
        // should be nearly insensitive to chunkSize - a variant that is not is paying
        // per-node rather than per-character.
        {
            ...at('many-tiny-nodes-clean', { generate: manyTinyTextNodes, params: { count: 40000 } }, false),
            purpose: 'timing',
        },
        // Little rendered text behind ~900KB of script. The selection is small, so chunking
        // should be invisible here whatever the snapshot costs.
        {
            ...at('script-heavy-clean', { generate: scriptHeavy, params: { scriptBlocks: 40, scriptRepeat: 400, rows: 100 } }, false),
            purpose: 'timing',
        },

        // Matching pages. Early match is where chunking wins outright; appended payloads are
        // the worst case for short-circuiting, since everything is scanned before the match.
        at('adwall-first', { html: ADWALL_FIRST, generate: articlePage, params: { rows: 20000 } }, true),
        caseOnPage('wrapped', { generate: articlePage, params: { rows: 20000 } }),
        // Both straddle a boundary in a way a too-small tail could lose, at a size where
        // flushes actually happen.
        caseOnPage('splitInline', { generate: articlePage, params: { rows: 20000 } }),
        caseOnPage('boundary', { generate: articlePage, params: { rows: 20000 } }),

        // The correctness matrix. These are far below one chunk, so they pin that chunking
        // changes nothing on small documents rather than exercising a flush - the flush path
        // at small chunk sizes is covered by `npm run bench-drift-guard`.
        ...caseFixtures(),
    ],

    configs: [
        // chunkSize with the tail held constant: flush frequency is the only variable.
        // 0 first, so it is the baseline and every ratio reads as "cost of chunking".
        {
            name: 'chunk-fixed-tail',
            baseline: true,
            reference: true,
            params: { chunkSize: [0, 1024, 4096, 8192, 32768, 262144] },
            detectors: ({ chunkSize }) => chunked({ chunkSize, chunkTail: 512 }),
        },
        // What a config author who sets only chunkSize gets. The tail moves with the size,
        // so the re-scanned fraction is constant at a sixteenth and only the fixed per-flush
        // cost varies - the difference between this and the sweep above is the tail's share.
        {
            name: 'chunk-default-tail',
            params: { chunkSize: [1024, 4096, 8192, 32768, 262144] },
            detectors: ({ chunkSize }) => chunked({ chunkSize }),
        },
        // The tail at a fixed chunk size. Both halves of its cost scale with the value: the
        // next regex test re-scans it, and the walk-back may traverse it.
        //
        // 0 is deliberately absent. It is the cheapest possible tail and it is unsound - no
        // match can span a flush - so measuring it would only price something that cannot
        // ship, at the cost of a false-negative that reads as a spec failure.
        {
            name: 'tail',
            params: { chunkTail: [64, 512, 4096, 8192] },
            detectors: ({ chunkTail }) => chunked({ chunkSize: 8192, chunkTail }),
        },
    ],
};
