# Bench harness test fixtures

Committed inputs for `integration-test/detector-bench.spec.js`, which runs `run.mjs` as a
subprocess to check its exit codes and its reporting.

These are here rather than in `.bench-variants/` because that directory is gitignored — it
is a scratch space for experiments in progress, and a test cannot depend on it.

They are deliberately trivial. The implementations below do not use `lib/matcher.mjs` and
say nothing about how detection should work; each exists to produce one specific *outcome*
so the runner's handling of that outcome can be asserted:

| Module | Behaviour |
|---|---|
| `strict-case.js` | Matches `PAYWALL` only, via `textContent`. Wrong about a lowercase page. |
| `strict-case-rendered.js` | The same wrong answer reached differently, via `innerText`. |
| `case-insensitive.js` | Correct on every fixture here. |
| `always-match.js` | Matches everything, so it false-positives on a clean page. |

| Spec | Asserts |
|---|---|
| `pre-existing.mjs` | A failure the baseline shares is reported, not blamed on a variant: exit 0. Also carries a `purpose: 'timing'` fixture, for the `--check-only` skip. |
| `introduced.mjs` | A divergence a variant introduces fails the run: exit 1. |
