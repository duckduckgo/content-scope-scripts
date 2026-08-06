---
name: detector-performance
description: Benchmark web-detection detector configurations and matching-algorithm changes against generated DOMs, measuring timing and detection correctness together. Use when comparing detector configs, evaluating a change to evaluateMatch, deciding whether to gate an expensive condition behind a cheap one, or answering "is this detector too slow on large pages".
---

# Detector Performance Benchmarking

Measure what a detector config or a change to the matching code actually costs, on DOMs you control, with detection correctness enforced alongside timing.

## When to use this

- Comparing detector configurations: selector vs xpath, broad vs narrow expressions, gating an expensive condition behind a cheap one.
- Evaluating a change to `injected/src/features/web-detection/matching.js` before or during review.
- Answering "is this detector too slow on large pages", or checking a claim that some construct is expensive.
- Producing before/after numbers for a performance PR.

Do not use it for end-to-end page-load budgets. The harness measures `evaluateMatch` in isolation; it does not load the C-S-S bundle, apply remote config, or run the `setTimeout` schedule in `web-detection.js`.

## The rule that matters

**A faster variant that changes detection results is a regression, not a win.**

Every fixture must carry `expect` labels, and the runner exits non-zero on any divergence. This is not ceremony. When this harness was first built, gating an XPath condition behind a whole-body text check measured 6-14x faster and looked like an obvious win; it also silently broke detection when a pattern spanned a `<script>` boundary. Timing alone would have shipped it.

## Running it

From `injected/`:

```sh
npm run bench-detectors -- --spec scripts/detector-bench/specs/xpath-gating.mjs
```

Flags: `--filter <text>` to run a subset of fixtures, `--iterations <n>` for samples per variant per fixture, `--warmup <n>`, `--minBatchMs <n>`, `--json <path>` to dump raw results.

The worked example (`specs/xpath-gating.mjs`) is **expected to exit non-zero** - two of its three configs genuinely change behaviour, which is the lesson it exists to teach.

## Writing a spec

A spec is an ES module in `scripts/detector-bench/specs/` with `fixtures` and `variants`.

```js
import { articlePage } from '../fixtures.mjs';

export default {
    iterations: 15,
    // Shared config, used by any variant that does not define its own.
    detectors: { adwalls: { generic_en: { match: { text: { pattern: ['ad ?block(er)? detected'] } } } } },
    fixtures: [
        {
            name: 'article-20k-clean',
            generate: articlePage,          // runs in the page
            params: { rows: 20000 },        // one generator covers many sizes
            expect: { 'adwalls.generic_en': false },
        },
        {
            name: 'boundary',
            html: 'your adblocker <script>var a=1;</script>is on',
            expect: { 'adwalls.generic_en': true },
        },
    ],
    variants: [
        { name: 'current', baseline: true },
        { name: 'narrow-xpath', detectors: { /* ... */ } },
    ],
};
```

Detector keys in `expect` are `groupName.detectorId`. Configs use the same shape as `settings.detectors` in privacy-configuration, so you can paste a real config straight in.

### Fixtures

Use the generators in [scripts/detector-bench/fixtures.mjs](../../../injected/scripts/detector-bench/fixtures.mjs), or write your own inline. Each generator takes an `append` parameter for the payload markup, so a matching and a non-matching fixture can share an identical DOM shape - a timing difference between them then reflects the match, not the page.

- `articlePage` - shallow, mixed inline elements. The default "realistic page" shape.
- `deeplyNested` - ancestor-axis predicates walk upward per text node, so depth costs what flat pages never reveal.
- `manyTinyTextNodes` - isolates per-node overhead from character volume.
- `textHeavy` - the mirror: isolates character-proportional cost from per-node cost.
- `scriptHeavy` - large inline scripts with little rendered text. Pathological for anything reading `textContent` without excluding scripts.

Generators run inside the page via Playwright, so each must be self-contained: no imports, no closure over module scope, and no randomness.

Pick sizes that bracket reality. A typical page is 2k-10k elements; 100k+ is a stress case, useful for making a difference visible but not representative.

**Never let filler text contain a detector pattern.** This is the easiest way to get a meaningless result: if the filler matches, a gated variant's gate passes on every page and never short-circuits, making gating look useless. The correctness pass catches it, but it is easier to avoid than to debug.

### Variants

Three kinds:

- **`kind: 'config'`** (default) - same code, different detector config. This is most comparisons.
- **`kind: 'worktree'`** with `ref` - benchmark code that exists at some git ref. The runner creates a detached worktree, bundles `matching.js` from it, and removes it afterwards. Nothing in your checkout is touched, so there is no stashing. On a shallow clone you may need `git fetch origin <ref>` first.
- **`kind: 'module'`** with `path` - benchmark a hypothetical implementation that is not committed anywhere. Point at a file that exports `evaluateMatch`. Paths resolve relative to the spec file, exactly like the spec's own imports.

A variant may set both a code kind and its own `detectors`. Mark one variant `baseline: true` to control what the speedup column compares against; otherwise the first is used.

### Testing an uncommitted idea

Put throwaway implementations in `scripts/detector-bench/.bench-variants/` (gitignored). Copy `matching.js` there and edit it, or write a file that re-exports from the real source with one function replaced:

```js
// .bench-variants/early-bail.js
export function evaluateMatch(conditions) { /* candidate implementation */ }
```

Then reference it as `{ name: 'early-bail', kind: 'module', path: '../.bench-variants/early-bail.js' }`.

Prefer this over creating a branch per idea. Most variants are discarded, and branch-per-experiment conflicts with the repo's branch discipline (the meta repo branch name is canonical and submodule branches must match it, which is about shipping work, not exploring). Reproducibility comes from the committed spec plus the variant source, not from a branch.

Promote a variant to a branch only when it is going to be shared or landed. At that point it is a normal feature branch, and you can re-benchmark it with `kind: 'worktree'` against `main`.

## Reading the output

Per fixture, the runner prints the DOM shape (elements, text nodes, chars) and then per variant: median, p95, speedup against the baseline, and correctness.

- **Median, not mean.** GC pauses make means misleading; the p95 column is there to show how bad the tail is.
- **Compare within a fixture, never across machines.** Absolute numbers are machine-specific; ratios are what travel.
- **Check p95 against median.** A p95 several times the median means the measurement is noisy - raise `--iterations` or close other applications before trusting a small difference.
- **A speedup on a variant marked `CORRECTNESS FAIL` is meaningless.** Fix the divergence, then re-measure.

Two measures keep the numbers honest, both automatic: each sample times a batch of sweeps sized so the batch lasts at least `--minBatchMs`, which keeps sub-millisecond work measurable; and samples are collected round-robin across variants, so CPU frequency drift hits every variant equally.

The timed unit is a full detection sweep - every detector in that variant's config evaluated once - which is the per-page-load cost that config imposes.

## Worked example: should an XPath condition be gated?

`specs/xpath-gating.mjs` compares three configs for one adwall detector: `body-only` (implicit `selector: body`), `xpath` (rendered text only, via `not(ancestor::script)` predicates), and `gated` (`all: [body, xpath]`, so the cheap condition short-circuits).

Results on one machine, medians (yours will differ in absolute terms; the ratios hold):

- `article-2k-clean` (12k elements): xpath 9.5 ms, gated 0.80 ms - **12x faster**
- `article-20k-clean` (120k elements): xpath 99 ms, gated 17.2 ms - **~6x faster**
- `script-heavy-clean` (900KB of script text, 143 elements): xpath 0.10 ms, gated 3.3 ms - **~30x slower**
- `pattern-in-script-only`: `body-only` reports a match where there is none - CORRECTNESS FAIL
- `pattern-spans-script-boundary`: `gated` misses a real match - CORRECTNESS FAIL

Three conclusions worth generalising:

1. Gating is a large win when the gate usually fails, which on real pages is nearly always.
2. It inverts when the cheap condition is the expensive one. On a script-heavy page `body.textContent` scans everything the XPath was designed to skip, so gating makes it 29x worse. The right answer is workload-dependent, which is the reason to measure rather than reason.
3. The gate is not semantically free. `body.textContent` keeps excluded content in place while the XPath concatenates across it, so `your adblocker <script>var a=1;</script>is on` matches the XPath and not the gate. If you gate, gate on a looser discriminator (`ad ?block`) than the final pattern.

## After a run

If the finding changes what should ship, update the config or code and re-run. If it is a general lesson about detector authoring, record it where detector authors will see it rather than only in a PR comment.
