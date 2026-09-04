# Detector benchmarking

Measure what a web-detection detector config, or a change to the matching code, actually
costs — on DOMs you control, with detection accuracy scored alongside timing.

For the full method (how to read the output, what has already been measured and which
conclusions reversed under measurement) see
[`.agents/skills/detector-performance/SKILL.md`](../../../.agents/skills/detector-performance/SKILL.md).
This file is the map of the directory.

```sh
npm run bench-detectors -- --spec scripts/detector-bench/specs/detector-design/adwall-xpath.mjs
npm run bench-detectors -- --spec <spec> --check-only   # accuracy only, seconds not minutes
npm run bench-drift-guard                               # after touching lib/ or matching.js
```

## What lives where

| Directory | Holds | You edit it when |
|---|---|---|
| `core/` | The harness: spec expansion, bundling, in-page measurement, verdicts, reporting | Almost never — changing how benchmarking works, not what is benchmarked |
| `page-gen/` | The test pages, as parameterised generators | Adding a DOM shape no existing generator isolates |
| `assertions/` | Ground-truth case sets: markup, the answer, and why the case exists | Adding a case an approach got wrong, or a set for a new detection question |
| `detectors/` | Detector vocabulary: XPath expressions, and per-detector presets | Adding a detector, or an expression worth comparing |
| `specs/` | Committed comparisons | Asking a question worth keeping the answer to |
| `lib/` | Scaffolding for algorithm experiments | Writing an experiment that changes matching code |
| `self-test/` | Inputs for the harness's own integration tests | Changing the runner's exit-code behaviour |
| `.bench-variants/` | Gitignored scratch | Anything throwaway — see below |

Two entry points sit at the top level: `run.mjs` (the benchmark) and `drift-guard.mjs` (the
correctness check on `lib/`).

## The two questions

There are two, they want different specs, and they are judged by different rules. Getting
this wrong is the most common way to produce a table that cannot answer anything.

|  | **Config axis** | **Algorithm axis** |
|---|---|---|
| Spec | `kind: 'config'` | `kind: 'algorithm'` |
| Fixed | the implementation | the detector config |
| Varies | `configs[]` | `implementations[]` |
| Asks | what does this configured detector cost, and what does gating trade away | is this algorithm efficient, where does it fall down, how do alternatives compare |
| A behaviour change is | a trade-off to weigh | a regression, full stop |
| Lives in | `specs/` (committed) | `.bench-variants/` (gitignored) |

That last row follows from the rest. A config spec is pure data: it runs against the working
tree and references no files, so it keeps working as `matching.js` evolves. An algorithm spec
points at experiment code that is discarded once the question is answered, so committing it
would preserve a snapshot that no longer runs.

`specs/` is grouped by intent:

- **`specs/detector-design/`** — how a detector should be *written*. Durable: the answer
  matters whenever that detector's config changes.
- **`specs/implementation/`** — how the shipped matching code *behaves*: how cost scales with
  DOM shape, what each chunking parameter buys. Durable: the answer matters whenever
  `matching.js` changes.

## Committed or throwaway?

Most benchmarking is exploratory and should leave nothing behind. `.bench-variants/` is
gitignored and is the right home for any of it — a throwaway spec, a config sweep testing a
hunch, an experimental `evaluateMatch`. Nothing there needs a branch, a review or a cleanup
pass.

Commit a spec only when the answer will still be worth having later, which in practice means
one of two things: it guards a decision that shipped, or it re-answers a question every time
the code beneath it changes. A spec that answered a question once, and whose answer is now
written down, belongs in the skill as prose rather than in `specs/` as code.

Prefer `.bench-variants/` over a branch per idea. Reproducibility comes from the spec plus
its implementation source, not from a branch.

## Building a comparison

Configs use the same shape as `settings.detectors` in privacy-configuration, so a real config
pastes straight in and a config that measures well pastes straight back out. Write the JSON
by hand — there is deliberately no builder API, because a builder would put a translation
layer between what is benchmarked and what ships.

What is provided instead is vocabulary. `detectors/expressions.mjs` holds the expressions
worth comparing (`RENDERED_TEXT`, `RENDERED_TEXT_SELF_AXIS`, `gatedOn`), and a preset such as
`detectors/adwall.mjs` holds one detector's key, patterns and bound assertion set.

```js
import { articlePage } from '../../page-gen/pages.mjs';
import { RENDERED_TEXT, gatedOn } from '../../detectors/expressions.mjs';
import { PATTERNS, GATE_PATTERNS, detector, at, caseFixtures } from '../../detectors/adwall.mjs';

export default {
    kind: 'config',
    fixtures: [
        { ...at('article-clean', { generate: articlePage }, false), scale: { rows: [2000, 20000] }, purpose: 'timing' },
        ...caseFixtures(),
    ],
    configs: [
        { name: 'xpath', baseline: true, reference: true, detectors: detector({ pattern: PATTERNS, xpath: RENDERED_TEXT }) },
        { name: 'loose-gated', detectors: detector(gatedOn(GATE_PATTERNS, PATTERNS, RENDERED_TEXT)) },
    ],
};
```

### Comparison recipes

Four shapes cover nearly everything. Each says what to hold fixed, because a comparison that
varies two things at once answers neither question.

| Question | Shape | Hold fixed | The trap |
|---|---|---|---|
| Is this detector written the best way? | `kind: 'config'`, one config per phrasing of the same intent | The implementation, the fixtures, the patterns | Cheaper phrasings usually change behaviour. Mark each with `expectDivergence: true` only once you have looked at what it costs |
| Is gating worth it? | Two configs: bare, and `gatedOn(...)` | Everything but the gate | The gate must be *looser* than the real patterns, or it can reject a page the real condition would accept. Also workload-dependent: ~12x faster on an article, ~24x slower on a script-heavy page |
| What does this parameter buy? | One config with `params: { k: [...] }` and `detectors` as a function of it | Every other parameter | Sweep one parameter at a time. Include the disabling value (`chunkSize: 0`) as the baseline, so each ratio reads as "cost against not doing this at all" |
| Is this code change faster? | `kind: 'algorithm'`, `implementations[]` | The config | Put it in `.bench-variants/`. Use `source: 'worktree'` with a ref for "current versus main" — that needs no files at all |

Two rules apply to all four:

- **A faster variant that changes detection results is not automatically a win.** The
  accuracy table and the behaviour summary exist to make that visible; read them before the
  timings.
- **Never let filler text contain a detector pattern.** If it does, a gated variant's gate
  passes on every page and never short-circuits, so gating measures as useless. A unit test
  over every generator enforces this, but a hand-written fixture can still trip it.

## Reading the output

Per fixture: the DOM shape it built, then per variant the median and p95, memory columns,
speed against the baseline, and what it detected. Then three summaries — scaling, accuracy,
and behaviour.

- **Median, not mean.** GC pauses drag a mean around; p95 shows the size of the tail.
- **Compare within a fixture, never across machines.** Absolute numbers are machine-specific;
  ratios travel.
- **Accuracy is scored over labelled fixtures only.** `purpose: 'timing'` fixtures are
  excluded, because their single "no match" label is free marks for every variant.
- **A speedup on a row that lost accuracy is meaningless.** Fix the divergence, then measure.
- **`PRE-EXISTING` is not the variant's fault.** The baseline gets that case wrong too.

## How the harness is tested

A benchmark that is quietly wrong is worse than none, because its output is persuasive.

| Layer | Where | Run by |
|---|---|---|
| Pure Node | `unit-test/detector-bench/{outcome,expand,report,measure,bundle,assertions}.spec.js` | `npm run test-unit` |
| jsdom | `unit-test/detector-bench/{harness,page-gen}.spec.js` | `npm run test-unit` |
| Browser | `integration-test/detector-bench.spec.js` | `npm run test-bench` |

`npm run test-bench` is **not** part of `test-int` or CI: two of its tests assert that one
thing costs measurably more than another, which is sound on a developer machine and a coin
toss on a shared runner.
