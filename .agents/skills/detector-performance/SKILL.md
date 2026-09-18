---
name: detector-performance
description: Benchmark web-detection detector configurations and matching-algorithm changes against generated DOMs, measuring timing, memory and detection correctness together. Use when comparing detector configs, evaluating a change to evaluateMatch, deciding whether to gate an expensive condition behind a cheap one, or answering "is this detector too slow on large pages".
---

# Detector Performance Benchmarking

Measure what a detector config or a change to the matching code actually costs, on DOMs
you control, with detection accuracy scored alongside timing.

This file is the method: which question to ask, how to read the answer, and what has already
been measured. For the layout of the directory - which file to edit for which kind of change -
see [scripts/detector-bench/README.md](../../../injected/scripts/detector-bench/README.md).

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

## Temporary or permanent?

Most benchmarking is exploratory and should leave nothing behind. **Default to throwaway.**

`scripts/detector-bench/.bench-variants/` is gitignored and is the right home for any of it:
a throwaway spec, a config sweep testing a hunch, an experimental `evaluateMatch`. Nothing
there needs a branch, a review or a cleanup pass, and a spec there is written exactly like a
committed one - it just imports from `../` instead of `../../`.

Answering "which of these five configurations is best" almost always means writing five
configs into one throwaway spec, running it, and reporting the table. That is the normal
workflow, and none of those five configs should be committed.

Commit a spec only when the answer will still be worth having later, which in practice means
one of two things:

- **It guards a decision that shipped.** `specs/detector-design/` holds these: re-run when
  that detector's config changes.
- **It re-answers a question every time the code beneath it changes.**
  `specs/implementation/` holds these: how cost scales with DOM shape, what each chunking
  parameter buys.

A spec that answered a question once, and whose answer is now written down, does not belong
in `specs/`. Record the finding as prose - in this file, or the web-detection technical
design - and delete the spec. A stale spec is worse than no spec: it still runs, still
produces a confident table, and nobody knows whether anyone still believes it.

Two things are worth promoting out of a throwaway run even when the spec is discarded:

- **A case an approach got wrong** belongs in an assertion set, so every future approach is
  measured against it. That is how the rendered-text set grew.
- **A DOM shape no generator isolates** belongs in `page-gen/pages.mjs`, with a doc comment
  saying which cost it isolates and which existing shape it is the counterpart to.

Prefer `.bench-variants/` over a branch per idea. Most experiments are discarded, and
branch-per-experiment conflicts with the repo's branch discipline, which is about shipping
work rather than exploring. Reproducibility comes from the spec plus its implementation
source, not from a branch.

## The rule that matters

**A faster variant that changes detection results is not automatically a win.**

Every fixture carries `expect` labels, and both axes check against them. The difference is
what happens next. On the algorithm axis a divergence the variant *introduced* fails the
run, because an implementation that computes something else is not an implementation of the
same thing. On the config axis a divergence is the finding, so it is reported as a delta and
the run only fails if the spec did not declare it with `expectDivergence: true`.

**Introduced, not merely present.** A fixture the baseline implementation also gets wrong is
reported in its own `pre-existing` section and does not fail the run: that is a gap in the
code under study, not something the experiment did. An implementation that gets such a case
*right* is reported as a fix. This is not hypothetical - `innertext-vs-chunked` exits 0 while
reporting three payloads the shipped chunked matcher fails (whitespace-collapsed text, and
text hidden by `display:none` or `visibility:hidden`). Before the distinction existed it
exited 1, and read as though the experiment had caused them.

What has not changed: a divergence from a baseline that was *right* is still a hard failure.

This is not ceremony. Gating an XPath condition behind a whole-body text check measures
around 12x faster on a normal page and looked like an obvious win; it also silently breaks
detection when a phrase spans a `<script>` boundary. Timing alone would have shipped it.

## Running it

From `injected/`:

```sh
npm run bench-detectors -- --spec scripts/detector-bench/specs/detector-design/adwall-xpath.mjs
npm run bench-drift-guard      # after touching lib/ or matching.js - see below
```

| Flag | Effect |
|---|---|
| `--check-only` | Correctness pass only, no sampling. Seconds instead of minutes - use it while iterating. Skips fixtures marked `purpose: 'timing'` |
| `--memory` | Also read retained heap around one sweep per variant (chromium only). Read [Memory](#memory) first - it is blind to large buffers |
| `--filter <text>` | Only fixtures whose name contains `<text>` |
| `--browsers <list>` | `chromium,firefox,webkit`. They run concurrently |
| `--iterations <n>` | Samples per variant per fixture (default 15) |
| `--json <path>` / `--baseline <path>` | Write a run; compare medians against one previously written |
| `--threshold <n>` | Percent change `--baseline` reports (default 25, deliberately loose) |

### Layout state

Spec-level `layout: ['warm', 'dirty']`, defaulting to `['warm']`. Each variant is measured
once per mode, suffixed `(warm)` / `(dirty)`; a warm-only run is named and measured exactly
as before.

This exists because a detector runs on a page that is still changing - that is why it polls -
and any strategy reading *rendered* text (`innerText`, `getBoundingClientRect`, anything
geometric) has to flush pending layout before it can answer, while a text-node walk does not.
Measuring only a settled page hides the difference completely, and the difference is not
small: it reverses the ranking of `innerText` against chunked scanning.

Layout is a property of the run, not of the code under test. The harness imposes it inside
each timed sweep, so every variant pays the identical style write and only the ones needing
geometry pay to resolve it. Do not write invalidation into a variant module: it charges its
own setup to its own timing, and cannot be compared against a variant that does not.

Two things make the mode trustworthy, and both were added after a bug that produced a
confident wrong answer:

- **The invalidation is a `document.body.style.width` toggle**, not root `padding-top`. The
  latter shifts the root box and leaves every descendant's layout valid, so the reflow is
  O(1) at any page size. With it, `innerText` measured *identical* warm and dirty at 2k, 20k
  and 100k rows, and nothing in the output suggested the result was fabricated.
- **A per-fixture self-check** prices a forced geometry read with and without invalidation
  and prints the ratio in the fixture header. Below 1.5x on a fixture over 1000 elements, the
  run fails rather than reporting dirty timings that were never dirty. Note what it does and
  does not catch: it catches invalidation that does *nothing*, not invalidation that is too
  weak. A dirty row matching its warm row on a large fixture is the other symptom to watch.

Because samples are collected round-robin over one shared page, a dirty variant would
otherwise leave layout invalid for whichever variant is sampled next. Warm variants therefore
re-settle layout before each batch, outside the timed region. Skipping that made
`innertext (warm)` report 184ms against its true 7.7ms.

## Writing a config spec

The usual starting point. See
[specs/detector-design/adwall-xpath.mjs](../../../injected/scripts/detector-bench/specs/detector-design/adwall-xpath.mjs).

```js
import { articlePage } from '../../page-gen/pages.mjs';
import { RENDERED_TEXT, gatedOn } from '../../detectors/expressions.mjs';
import { PATTERNS, GATE_PATTERNS, detector, at, caseFixtures } from '../../detectors/adwall.mjs';

export default {
    kind: 'config',
    fixtures: [
        { ...at('article-clean', { generate: articlePage }, false), scale: { rows: [2000, 20000] } },
        ...caseFixtures(),
    ],
    configs: [
        { name: 'xpath', baseline: true, reference: true, detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }) },
        { name: 'loose-gated', detectors: detector(gatedOn(GATE_PATTERNS, PATTERNS, RENDERED_TEXT)) },
    ],
};
```

Configs use the same shape as `settings.detectors` in privacy-configuration, so a real
config pastes straight in. Detector keys in `expect` are `groupName.detectorId`, and a key
naming a detector the config does not define fails the run as a spec error rather than
being scored as a false negative.

**Write the config JSON by hand.** There is deliberately no builder API: the config shape is
the shipped schema, and a builder would put a translation layer between what is benchmarked
and what ships, needing mirroring on every schema change. What is provided instead is
vocabulary — `detectors/expressions.mjs` for where to look (`RENDERED_TEXT`,
`RENDERED_TEXT_SELF_AXIS`, `gatedOn`), and a preset such as `detectors/adwall.mjs` for one
detector's key, patterns and bound assertion set. The `detectors` field is typed against
`DetectorConfig` from privacy-configuration, so a malformed config is a lint failure.

### Which comparison to set up

Four shapes cover nearly everything. Each says what to hold fixed, because a comparison
varying two things at once answers neither question.

| Question | Shape | Hold fixed | The trap |
|---|---|---|---|
| Is this detector written the best way? | `kind: 'config'`, one config per phrasing of the same intent | Implementation, fixtures, patterns | Cheaper phrasings usually change behaviour. Declare with `expectDivergence: true` only after looking at the cost |
| Is gating worth it? | Two configs: bare, and `gatedOn(...)` | Everything but the gate | The gate must be looser than the real patterns. Workload-dependent: ~12x faster on an article, ~24x slower on a script-heavy page |
| What does this parameter buy? | One config with `params: { k: [...] }`, `detectors` a function of it | Every other parameter | One parameter at a time. Make the disabling value the baseline, so each ratio reads as "cost against not doing this at all" |
| Is this code change faster? | `kind: 'algorithm'`, `implementations[]` | The config | Belongs in `.bench-variants/`. `source: 'worktree'` with a ref needs no files |

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

Promote to a branch only when something is going to land, and re-benchmark it with
`source: 'worktree'` against `main`. See [Temporary or permanent?](#temporary-or-permanent)
for why the default is to leave nothing behind.

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

`npm run bench-drift-guard` evaluates every case in `assertions/rendered-text.mjs` under both the lib and
the real implementation, across six chunk configurations, and fails on any disagreement. It
takes about two seconds. **Run it after changing either `lib/` or `matching.js`.**

The small chunk sizes in that guard are load-bearing: at the default 8192-character chunk a
short payload never reaches a flush, so the tail cut - the fiddliest part and the most
likely to drift - never executes. A deliberately broken walk-back was caught only by the
`chunk=8,tail=4` case.

## Fixtures

Use the generators in
[page-gen/pages.mjs](../../../injected/scripts/detector-bench/page-gen/pages.mjs), each taking
an `append` parameter for payload markup so a matching and a non-matching fixture can share an
identical DOM shape - a timing difference between them then reflects the match, not the page.
[page-gen/README.md](../../../injected/scripts/detector-bench/page-gen/README.md) is the full
catalogue with parameters.

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
[page-gen/text-shapes.mjs](../../../injected/scripts/detector-bench/page-gen/text-shapes.mjs)
instead (`prose`, `unbrokenWords`, `sparseBreaks`) - those are Node-side, which is precisely
why a generator cannot call them.

Pick sizes that bracket reality. A typical page is 2k-10k elements; 100k+ is a stress case,
useful for making a difference visible but not representative.

**Never let filler text contain a detector pattern.** If the filler matches, a gated
variant's gate passes on every page and never short-circuits, making gating look useless.
The correctness pass catches it, and so does a unit test over every generator, but a
hand-written fixture can still trip it.

### `purpose`

`purpose: 'timing' | 'correctness' | 'both'`, defaulting to `both`. `--check-only` skips
`timing` fixtures; a full run times everything, since correctness fixtures are tiny.

Mark the scaled `-clean` fixtures `timing`. Their only label is "no match anywhere", which the
assertion set establishes in milliseconds, so generating a 100k-row DOM to re-establish it was
the reason `--check-only` was minutes rather than seconds. It also made the fast iteration loop
the slow one, which is the opposite of the flag's purpose.

Leave `caseOnPage(...)` fixtures as `both` - they are correctness cases at realistic scale.

`timing` fixtures are also excluded from the accuracy table, since a "no match" label on a
generated page is a free mark for every variant. That keeps the accuracy figure identical
between a full run and `--check-only`.

**Skip rather than shrink.** Collapsing a scaled fixture to its smallest point under
`--check-only` looks equivalent and is not: chunk flushes only happen above `chunkSize`
characters, so shrinking would silently stop exercising the flush path, which is the fiddliest
code in the matcher. A skipped fixture is visible in the header count; a shrunk one is not.

### Assertion sets

An assertion set is the answer key for one detection question: markup, the answer, and why the
case exists.
[assertions/rendered-text.mjs](../../../injected/scripts/detector-bench/assertions/rendered-text.mjs)
is the one that exists, and its question is "does this approach match rendered text while
excluding text that is in the DOM but never displayed".

A set names no detector.
[assertions/to-fixtures.mjs](../../../injected/scripts/detector-bench/assertions/to-fixtures.mjs)
binds one to a detector key, which is what lets the same cases score any text detector rather
than only the one they grew up around. A preset does that binding for you: `caseFixtures()`
gives every case as a minimal fixture, `caseOnPage(name, page)` appends one to a generated page
so a match is found at realistic scale.

Add to a set rather than re-deriving one. The rendered-text set exists because these cases kept
being rewritten by hand, and it grew every time an approach turned out to differ on a case
nobody had written down. `DISCRIMINATING_CASES` names the four that each have a plausible
approach that measured well and failed there.

Add a *new* set only for a genuinely different question - matching visible text rather than
rendered text, say, where the correct answer for the same markup would differ. Not for a new
detector.

## Reading the output

Per fixture you get the DOM shape - element, text-node, character and `rendered` counts, plus
the layout invalidation ratio when any variant is dirty - and then, per variant, median and
p95, optional memory columns, speed against the baseline (`vs baseline`), a `behaviour` delta
against the baseline implementation or the reference config, and on the algorithm axis a
`result`.

- **Median, not mean.** GC pauses drag a mean around; p95 shows the size of the tail.
- **Compare within a fixture, never across machines.** Absolute numbers are machine-specific; ratios travel.
- **Check p95 against median.** A p95 several times the median means the measurement is noisy - raise `--iterations` or close other applications before trusting a small difference. Re-running an unchanged spec at 9 iterations on a busy machine moved medians by up to 22%.
- **A speedup on a `CORRECTNESS FAIL` row is meaningless.** Fix the divergence, then measure.
- **`PRE-EXISTING` is not a failure of the variant.** The baseline gets that fixture wrong too. Worth investigating as a gap in the shipped code, but it says nothing about the experiment.

### The accuracy table

After the per-fixture tables, one row per variant: cases correct out of total, with false
positive and false negative counts. It is what makes "compare these approaches" a single run
rather than a manual read of twenty tables, and it is the column to read *before* the timings.

Two things it deliberately does not do. It scores against the fixture labels alone, saying
nothing about whether a divergence was introduced or inherited - the behaviour summary below
it owns that distinction, and that is the one driving the exit code. And it excludes
`purpose: 'timing'` fixtures, whose single "no match" label every variant satisfies for free;
counting them would drag every score towards 100% and make the figure differ between a full
run and `--check-only`.

A variant that is faster and scores lower has not won. Say which cases it lost, in words.

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

Three figures, answering different questions. Do not treat them as interchangeable, and in
particular do not reach for `retained` first - it is the weakest of the three.

- **`rendered`** in the fixture header line is the length of the page's rendered text. It
  needs no instrumentation, so it is available for the shipped implementation, and it is
  exactly what any strategy materialising whole-page text must hold at once. For a
  chunked-versus-materialising comparison this is the figure that speaks to the design.
- **`peak buffer`** is the real measurement, reported by variants that record their
  high-water buffer length via `window.__benchPeakChars`. `lib/chunk-loop.mjs` does it for
  you. Only available for bench-owned code.
- **`retained`** (`--memory`, chromium only) is a single `Runtime.getHeapUsage` delta around
  one sweep after a forced collection. Uninstrumented, and **it has a blind spot large enough
  to invert the comparison you are most likely making.**

`usedSize` excludes V8's large-object space, so a *single* allocation above roughly 128 KB is
invisible to it, while the same number of bytes in small pieces is reported correctly.
Measured on chromium:

| allocation | reported |
|---|---|
| 40k x 100-char strings (4 MB) | 7.46 MB |
| 16 x 256 KB strings (4 MB) | 0.02 MB |
| one 4 MB string | 0.01 MB |
| 100k small objects | 2.49 MB |

So the column sees costs made of many small objects - an XPath node snapshot - and misses
costs made of one large buffer - a materialised page string. That is backwards for a
bounded-buffer comparison, and it flatters whichever strategy uses more memory. It is why
`innerText` appeared to retain 45 KB while building an 8.39M-character string.

**Two apparent fixes do not work, so do not spend the time.** `HeapProfiler.startSampling`
has the identical blind spot at both 4 KB and 64 KB intervals. A real
`HeapProfiler.takeHeapSnapshot` does see more, and costs 13 seconds and 57 MB of transfer per
reading on a 20k-row page.

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
axis the `vs reference` column does this for you; on the algorithm axis the `behaviour`
column does the same against the baseline implementation. In any PR description, say it in
words.

Worked reversals, all of which read the opposite way before being measured:

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

A fourth, where the answer depends entirely on a condition the harness did not originally
model: reading `document.body.innerText` instead of scanning text nodes. It needs no XPath
expression, no snapshot and no concatenation loop, and on a settled page it is *faster* -
1.1x on the element-heavy shape. Once layout is dirty, which is the state a polling detector
actually runs in, it is 1.7x-18.7x slower, and worst on the fixture with no text at all
(`element-heavy`, 20x): there is nothing to read, so the entire cost is the reflow it forces.
It also gives up the bound on peak memory, materialising the whole page text - 8.39M
characters where the chunked path holds 9k.

Two of its correctness differences favour `innerText`, and both are reported as pre-existing
gaps in the chunked matcher rather than as wins: it collapses whitespace the way the user sees
it, and it omits text hidden by `display:none` or `visibility:hidden`, which the XPath
predicate cannot express.

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

## How the harness itself is tested

A benchmark that is quietly wrong is worse than no benchmark, because its output is
persuasive. Three layers, split by what each needs:

| Layer | Where | Run by | Covers |
|---|---|---|---|
| Pure Node | `unit-test/detector-bench/{outcome,expand,report,measure,bundle,assertions}.spec.js` | `npm run test-unit` | The exit-code decision matrix, spec expansion and sweeps, `purpose` filtering, every formatter including accuracy, batch sizing / round-robin ordering against an injected clock, variant resolution and bundle caching, and the assertion-set-to-fixture join |
| jsdom | `unit-test/detector-bench/{harness,page-gen}.spec.js` | `npm run test-unit` | `collectFacts`, `collectResults`, `singleSweep` - the in-page functions that need only a DOM - plus every page generator: that its parameters scale what they name, that it is deterministic, and that its filler matches no detector pattern |
| Browser | `integration-test/detector-bench.spec.js` | `npm run test-bench` | Layout invalidation, the retained-heap blind spot, and `run.mjs` exit codes end to end |

`npm run test-bench` uses its own `playwright-bench.config.js` and is **not** part of
`test-int` or CI: two of its tests assert that one thing costs measurably more than another,
which is sound on a developer machine and a coin toss on a shared runner.

Layout is deliberately not tested in jsdom. There is no layout engine there, so
`measureLayoutInvalidation` would pass vacuously - a test asserting invalidation works in an
environment where nothing can be invalidated is worse than no test. Equally, real matching is
not re-tested at any layer; `unit-test/web-detection.js` and `bench-drift-guard` own that.

Two of these tests exist because the code was wrong in a way that produced plausible output
rather than an error: the `padding-top` no-op, and a self-check whose clean baseline rounded
to zero so its ratio was `Infinity` and cleared every threshold. If you change the layout or
memory paths, those are the tests to read first.

`scripts/detector-bench/self-test/` holds committed specs for the end-to-end exit-code
cases. They live there rather than in `.bench-variants/`, which is gitignored.

## After a run

If the finding changes what should ship, update the config or the code and re-run. If it is
a general lesson about detector authoring, record it where detector authors will see it
rather than only in a PR comment - this file, or the web-detection technical design.
