---
name: detector-performance
description: Benchmark web-detection detector configurations and matching-algorithm changes against generated DOMs, measuring timing, memory and detection correctness together. Use when comparing detector configs, evaluating a change to evaluateMatch, deciding whether to gate an expensive condition behind a cheap one, or answering "is this detector too slow on large pages".
---

# Detector Performance Benchmarking

Measure what a detector config or a change to the matching code actually costs, on DOMs
you control, with detection correctness enforced alongside timing.

## Which question are you asking?

There are two, they want different specs, and they are judged by different rules. Getting
this wrong is the most common way to produce a table that cannot answer anything.

|  | **Algorithm axis** | **Config axis** |
|---|---|---|
| Spec | `kind: 'algorithm'` | `kind: 'config'` |
| Fixed | the detector config | the implementation |
| Varies | `implementations[]` | `configs[]` |
| Asks | is this algorithm efficient, where does it fall down, how do alternatives compare | what does this configured detector cost, and what does gating trade away |
| A behaviour change is | a regression. Full stop | a trade-off to weigh |
| Lives in | `.bench-variants/` (gitignored) | `specs/` (committed) |

That last row follows from the rest. A config spec is pure data: it runs against the
working tree and references no files, so it keeps working as `matching.js` evolves. An
algorithm spec points at experiment code that is discarded once the question is answered,
so committing it would only preserve a snapshot that no longer runs.

Do not use either for end-to-end page-load budgets. The harness measures `evaluateMatch` in
isolation; it does not load the C-S-S bundle, apply remote config, or run the `setTimeout`
schedule in `web-detection.js`.

## The rule that matters

**A faster variant that changes detection results is not automatically a win.**

Every fixture carries `expect` labels, and both axes check against them. The difference is
what happens next. On the algorithm axis any divergence fails the run, because an
implementation that computes something else is not an implementation of the same thing. On
the config axis a divergence is the finding, so it is reported as a delta and the run only
fails if the spec did not declare it with `expectDivergence: true`.

This is not ceremony. Gating an XPath condition behind a whole-body text check measures
around 12x faster on a normal page and looked like an obvious win; it also silently breaks
detection when a phrase spans a `<script>` boundary. Timing alone would have shipped it.

## Running it

From `injected/`:

```sh
npm run bench-detectors -- --spec scripts/detector-bench/specs/adwall-xpath.mjs
npm run bench-drift-guard      # after touching lib/ or matching.js - see below
```

| Flag | Effect |
|---|---|
| `--check-only` | Correctness pass only, no sampling. Seconds instead of minutes - use it while iterating |
| `--memory` | Also read the heap around one sweep per variant (chromium only) |
| `--filter <text>` | Only fixtures whose name contains `<text>` |
| `--browsers <list>` | `chromium,firefox,webkit`. They run concurrently |
| `--iterations <n>` | Samples per variant per fixture (default 15) |
| `--json <path>` / `--baseline <path>` | Write a run; compare medians against one previously written |
| `--threshold <n>` | Percent change `--baseline` reports (default 25, deliberately loose) |

## Writing a config spec

Committed, and the usual starting point. See
[specs/adwall-xpath.mjs](../../../injected/scripts/detector-bench/specs/adwall-xpath.mjs).

```js
import { articlePage } from '../fixtures.mjs';
import { PATTERNS, GATE_PATTERNS, RENDERED_TEXT, detector, at, payloadFixtures } from '../adwall.mjs';

export default {
    kind: 'config',
    fixtures: [
        { ...at('article-clean', { generate: articlePage }, false), scale: { rows: [2000, 20000] } },
        ...payloadFixtures(),
    ],
    configs: [
        { name: 'xpath', baseline: true, reference: true, detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }) },
        { name: 'loose-gated', detectors: detector({ all: [
            { pattern: GATE_PATTERNS, selector: 'body' },
            { pattern: PATTERNS, xpath: RENDERED_TEXT },
        ] }) },
    ],
};
```

Configs use the same shape as `settings.detectors` in privacy-configuration, so a real
config pastes straight in. Detector keys in `expect` are `groupName.detectorId`.

**`baseline` and `reference` are different things.** `baseline` answers "faster or slower
than what"; `reference` answers "different behaviour from what". Usually the same config,
but not necessarily - you might time against the cheapest option while comparing semantics
against the strictest. The reference comparison is what distinguishes "this config is
wrong" from "this config is wrong in a *new* way": if the reference already misses a case,
a candidate that also misses it has introduced nothing.

**`expectDivergence: true`** declares a config known to change behaviour. Declare it only
once you have looked at what it costs; that is the whole point of the column.

**Sweeping a parameter.** Give the config `params` with one key and make `detectors` a
function of it. One variant per value, so a question like "does a larger tail cost more" is
answered by the run rather than by three near-identical blocks:

```js
{
    name: 'tail',
    params: { chunkTail: [64, 512, 4096] },
    detectors: ({ chunkTail }) => detector({ pattern: PATTERNS, xpath: RENDERED_TEXT, xpathConfig: { chunkSize: 8192, chunkTail } }),
}
```

## Writing an algorithm spec

Throwaway. Put the spec and its implementations in
`scripts/detector-bench/.bench-variants/`, which is gitignored.

```js
export default {
    kind: 'algorithm',
    detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }),
    implementations: [
        { name: 'working-tree', baseline: true },
        { name: 'main', source: 'worktree', ref: 'origin/main' },
        { name: 'my-idea', source: 'module', path: './my-idea.js' },
    ],
    fixtures: [/* ... */],
};
```

`source` selects where the code comes from: `working-tree` (default), `worktree` with a
`ref`, or `module` with a `path`. **`working-tree` and `worktree` need no files**, so a
"current versus `main`" comparison is always available without writing anything. A worktree
is created detached and removed afterwards, so nothing in your checkout is touched and
there is no stashing; on a shallow clone you may need `git fetch origin <ref>` first.

Prefer `.bench-variants/` over a branch per idea. Most experiments are discarded, and
branch-per-experiment conflicts with the repo's branch discipline, which is about shipping
work rather than exploring. Reproducibility comes from the spec plus the implementation
source, not from a branch. Promote to a branch only when something is going to land, and
re-benchmark it with `source: 'worktree'` against `main`.

### Use the lib rather than copying matching.js

`lib/` holds the scaffolding, so an experiment is the few lines it actually changes:

- **`lib/matcher.mjs`** - `createMatcher({ matchXPath })` gives you the whole condition tree
  with the XPath-to-boolean step as a parameter, plus `compileXPath`/`snapshot`.
- **`lib/chunk-loop.mjs`** - `chunkedMatcher(retainTail)` for the narrower case where only
  the buffer cut varies, so competing cuts differ in exactly one expression.
- **`lib/shipped-strategy.mjs`** - the lib's rendition of what ships. Use it as the control.

```js
// .bench-variants/my-idea.js
import { createMatcher, snapshot } from '../lib/matcher.mjs';

export const { evaluateMatch } = createMatcher({
    matchXPath(pattern, expression, xpathConfig) {
        // the thing being tried
    },
});
```

### Run the drift guard

`matching.js` exports only `evaluateMatch` and keeps the condition tree, `compileXPath`,
`xpathMatches` and `retainTail` module-private, so `lib/matcher.mjs` is necessarily a copy.
A copy that has drifted does not announce itself - it makes every comparison built on it
wrong in the same direction, and the timing tables still look plausible.

`npm run bench-drift-guard` evaluates every payload in `payloads.mjs` under both the lib and
the real implementation, across six chunk configurations, and fails on any disagreement. It
takes about two seconds. **Run it after changing either `lib/` or `matching.js`.**

The small chunk sizes in that guard are load-bearing: at the default 8192-character chunk a
short payload never reaches a flush, so the tail cut - the fiddliest part and the most
likely to drift - never executes. A deliberately broken walk-back was caught only by the
`chunk=8,tail=4` case.

## Fixtures

Use the generators in
[fixtures.mjs](../../../injected/scripts/detector-bench/fixtures.mjs), each taking an
`append` parameter for payload markup so a matching and a non-matching fixture can share an
identical DOM shape - a timing difference between them then reflects the match, not the page.

- `articlePage` - shallow, mixed inline elements. The default "realistic page" shape.
- `deeplyNested` - ancestor-axis predicates walk upward per text node, so depth costs what flat pages never reveal.
- `manyTinyTextNodes` - isolates per-node overhead from character volume.
- `elementHeavy` - many elements, no text. The only fixture that separates walking past nodes from selecting them, since everywhere else element count and text-node count rise together.
- `nestedInline` - text at every level of the nesting rather than only the leaf, so depth multiplies text nodes. The shape real markup has, and the worst case for an ancestor-chain predicate.
- `textHeavy` - the mirror: isolates character-proportional cost from per-node cost.
- `unbrokenWordRuns` - the same volume as `textHeavy` with no word breaks, so a boundary scan runs to its ceiling on every flush instead of stopping at the first space.
- `scriptHeavy` - large inline scripts with little rendered text. Pathological for anything reading `textContent` without excluding scripts.

Generators run inside the page, so each must be self-contained: no imports, no closure over
module scope, no randomness. For string-level inputs use
[text-shapes.mjs](../../../injected/scripts/detector-bench/text-shapes.mjs) instead
(`prose`, `unbrokenWords`, `sparseBreaks`) - those are Node-side, which is precisely why a
generator cannot call them.

Pick sizes that bracket reality. A typical page is 2k-10k elements; 100k+ is a stress case,
useful for making a difference visible but not representative.

**Never let filler text contain a detector pattern.** If the filler matches, a gated
variant's gate passes on every page and never short-circuits, making gating look useless.
The correctness pass catches it, but it is easier to avoid than to debug.

### The payload matrix

[payloads.mjs](../../../injected/scripts/detector-bench/payloads.mjs) holds the cases any
rendered-text approach has to get right, as markup plus the answer plus why the case exists.
Use `payloadFixtures()` for all of them as minimal fixtures, or `payloadOnPage(name, page)`
to append one to a generated page so a match is found at realistic scale.

Add to it rather than re-deriving it. It exists because these cases kept being rewritten by
hand, and it grew every time an approach turned out to differ on a case nobody had written
down. `DISCRIMINATING_CASES` names the four that each have a plausible approach that
measured well and failed there.

## Reading the output

Per fixture you get the DOM shape and then, per variant, median and p95, optional memory
columns, speed against the baseline, and either a result (algorithm) or a behaviour delta
against the reference (config).

- **Median, not mean.** GC pauses drag a mean around; p95 shows the size of the tail.
- **Compare within a fixture, never across machines.** Absolute numbers are machine-specific; ratios travel.
- **Check p95 against median.** A p95 several times the median means the measurement is noisy - raise `--iterations` or close other applications before trusting a small difference. Re-running an unchanged spec at 9 iterations on a busy machine moved medians by up to 22%.
- **A speedup on a `CORRECTNESS FAIL` row is meaningless.** Fix the divergence, then measure.

Two things keep the numbers honest, both automatic: each sample times a batch of sweeps
sized so the batch lasts at least `--minBatchMs`, which keeps sub-millisecond work
measurable; and samples are collected round-robin across variants, so CPU frequency drift
hits every variant equally. The timed unit is a full detection sweep - every detector in
that variant's config, evaluated once - which is the per-page-load cost the config imposes.

### Working out *why* one variant is slower

The harness measures; it does not explain. It has no instrumentation inside the code under
test, on purpose. To narrow a difference down, add measurements rather than looking for the
tool to attribute one:

- **Per-node or per-character?** Compare `manyTinyTextNodes` against `textHeavy`. They hold
  opposite extremes at similar total cost, so whichever one moves is the answer.
- **What complexity class?** Put `scale` on the fixture and read the `ns/char` column in the
  scaling section. Flat means linear. Rising means worse than linear. Falling means a fixed
  overhead dominating at small sizes.
- **Does depth matter?** `deeplyNested`. Ancestor-axis predicates re-walk the chain per text
  node, which a flat page never shows. It holds characters constant across the sweep, so
  anything that moves is depth.
- **Is it nodes or characters?** `elementHeavy` has no text at all, so any time it records
  is pure traversal. Measured for the shipped expression: roughly 60ns per element walked
  past against 840ns per text node selected, so cost tracks the *selected* set far more
  than the tree it came from - and depth multiplies the second figure.
- **Is it the DOM work or the matching?** Vary the pattern set against a fixed fixture, or
  compare an implementation that skips the concatenation step.
- **Is it memory?** See below. A variant that looks competitive on time can hold two orders
  of magnitude more text.

### Memory

Two columns, and they are not interchangeable:

- **`heap`** (`--memory`) is uninstrumented, so it is the only figure available for the
  shipped implementation - nothing is being added to `matching.js` for a benchmark's
  benefit. It is a single reading after a forced collection rather than a true peak, so read
  it as an order of magnitude. Chromium only.
- **`peak buffer`** is reported by variants that choose to record their high-water buffer
  length via `window.__benchPeakChars`. `lib/chunk-loop.mjs` does it for you. Only
  meaningful for bench-owned code, which is exactly where the instrumentation caveat does
  not matter.

Bounding peak memory is the entire reason chunking exists, so a comparison of a chunked
against an unchunked strategy that reports only time is not answering the question. On a
1M-character page the chunked path held 11k characters against concatenation's 1.00M, and
at 5M characters 26k against 5.00M.

The bound is `chunkSize + chunkTail + the longest single text node`, not `chunkSize +
chunkTail`: a node is appended whole before the flush test runs. On pages whose text
arrives in ordinary nodes that third term vanishes and the peak is flat at 9k characters
whatever the page size, but a page holding its text in one huge node defeats the bound
entirely. `text-heavy` sweeps that term directly - its `charsPerParagraph` *is* the node
length - which is why the peak there rises with the page while `article-clean`'s does not.

## Conventions worth keeping

### State the false-positive/negative delta

"Does this introduce false positives or negatives that were not there before?" is the
question that decides whether a matching change is acceptable, and it needs answering
explicitly against the *previous behaviour*, not just against fixture labels. On the config
axis the `vs reference` column does this for you; on the algorithm axis, and in any PR
description, say it in words.

Two worked reversals, both of which read the opposite way before being measured:

- Gating is a large win when the gate usually fails, which on real pages is nearly always -
  around 12x on a normal article. It **inverts** when the cheap condition is the expensive
  one: on a script-heavy page `body.textContent` scans everything the XPath was written to
  skip, making the gated config roughly 24x worse. The right answer is workload-dependent,
  which is the reason to measure rather than reason.
- The gate is also not semantically free. `body.textContent` keeps excluded content in place
  while the XPath concatenates across it, so `your adblocker <script>var a=1;</script>is on`
  matches the XPath and not the gate. If you gate, gate on a looser discriminator
  (`ad ?block`) than the final pattern.

A third, where the same idea measured 12x slower and 4x faster depending on one detail:
replacing XPath with a `TreeWalker` looks like a clear win, because `FILTER_REJECT` prunes
excluded subtrees where `not(ancestor::script)` re-walks the chain per text node. With a JS
`acceptNode` filter it is 8x-12x *slower* than XPath, because the filter is invoked for
every node and crosses the JS/engine boundary each time, paying that everywhere to save a
walk almost nowhere. With no filter at all - `SHOW_TEXT` alone, exclusions checked by
walking parents of the nodes that survive - the same approach is 1.6x-4x *faster* than
XPath on every node-heavy shape, losing only at depth 100 where the JS ancestor walk costs
more than the engine's. The lesson generalises past this case: when comparing an
engine-implemented loop against a JS one, the per-node boundary crossing dominates, so
where the filtering happens matters more than what it filters.

And one where reasoning got the *direction* wrong, not just the size: checking exclusions
against the immediate parent (`//body//*[not(self::script)]/text()`) looks cheaper than
walking the ancestor chain and measures consistently slower, because it makes the engine
visit every element to reach their text children. It was also assumed to false-positive on
`<noscript>` and does not - with scripting enabled that content is parsed as raw text, so
there is no inner element to admit. What it actually does is false-negative on text whose
parent is `body` itself, because `//body//*` matches descendant elements and `body` is not
one of them.

### Validation belongs in config tests, not in C-S-S

`assertXPathConfig` and `assertValidXPath` in privacy-configuration's
`tests/web-detection-tests.js` are the pattern: a bad value fails a build naming the
detector rather than being silently rewritten on a user's page. C-S-S should not introspect
regexes (no special-casing of `^`, `$` or `\b`) and should not crash on bad config.
`resolveXPathConfig` deliberately clamps and rejects nothing, which is safe only because no
value can break the scan loop.

### Bounded-scan invariants

If you touch `xpathMatches` or `retainTail`, these are the properties that are easy to lose
and expensive to lose quietly:

- **Flushing is driven by characters added since the last test, not total buffer length.**
  Flushing on buffer length couples progress to the tail: once the tail is large the buffer
  never drops back below the threshold, so every subsequent node re-tests the whole buffer.
- **`chunkSize: 0` disables chunking**, accumulating everything for a single test.
- **`chunkTail` is the CPU knob, not `chunkSize`.** Sweeping `chunkSize` from 1024 to
  262144 moves nothing outside noise, because the work it governs - one regex entry and one
  cut per flush - is fixed cost against a scan that is proportional to characters. What
  costs is the *fraction* of the page scanned twice, which is `chunkTail / chunkSize`. At a
  fixed 8192 chunk, tails of 64 and 512 are indistinguishable, 4096 costs about 1.3x and
  8192 about 1.7x. Keep the ratio at or below the default sixteenth; a tail approaching the
  chunk size approaches scanning the page twice.
- **The walk-back ceiling is `MAX_WORD_LENGTH`, deliberately independent of `chunkTail`.**
  Deriving one from the other would let a config raising the tail silently multiply the cost
  of the scan.
- **Chunking is not a net CPU cost.** Against unchunked concatenation it measures within
  noise on non-matching pages, and 1.3x-1.5x *faster* when the match is near the front of
  the document, because a flush that matches returns without reading the rest. The saving
  needs the match to be early: with the payload appended it is 1.0x.
- **The start edge is fixable, the end edge is not.** The tail cut can be extended backwards
  so position 0 is a real word boundary rather than an artefact. The *end* of the buffer has
  no such fix: a trailing `\b` or lookahead sees an artificial end-of-string, and the only
  remedy is to test less than the whole buffer, since the following text has not been read
  yet. That means a backwards scan from the end plus a slice spanning the whole tested
  region - far more than the tail - which is why it is not done.
- **A match longer than the retained tail can straddle a flush and be missed.** Detector
  patterns are phrases of a few dozen characters, so the default leaves a wide margin, but
  the bound is real and belongs in guidance for detector authors.

## After a run

If the finding changes what should ship, update the config or the code and re-run. If it is
a general lesson about detector authoring, record it where detector authors will see it
rather than only in a PR comment - this file, or the web-detection technical design.
