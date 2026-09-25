# Assertion sets

An assertion set is the answer key for one detection question: a named collection of cases,
each being markup, the answer, and why the case exists.

It is what makes "how accurate was it" answerable rather than a judgement call. Any
approach — a detector config, an experimental algorithm, the shipped implementation — can be
run against a set and scored, and the accuracy table in a benchmark run is that score.

## Why the answer and the detector are separate

A set is pure data. It names no detector, carries no config, and has no fixture shape.
`to-fixtures.mjs` supplies those, taking the detector key as a parameter:

```js
const { at, caseFixture, caseFixtures, caseOnPage } = fixturesFor('adwalls.generic_en', CASES);
```

That seam is the point. The cases here are about *where text lives in the DOM*, which is a
property of the page rather than of what is being looked for, so the same set should score any
text detector. While the cases were reachable only through a module that hardcoded
`adwalls.generic_en`, a second detector could not use them without copying the set — and a
copied set drifts, which is exactly the failure the set exists to prevent.

`drift-guard.mjs` reads the same set to check `lib/` against the real implementation, so both
work from one definition of correct.

## The sets

| Set | Question |
|---|---|
| `rendered-text.mjs` | Does this approach match rendered text while excluding text that is in the DOM but never displayed? |

`DISCRIMINATING_CASES` names the cases whose whole point is that some plausible approach gets
them wrong. Each has an approach that measured well and failed there: whole-body `textContent`
on `scriptOnly`, gating on the full patterns on `boundary`, per-node testing on `splitInline`,
and any expression rooted at `//body//*` on `bare`.

## Turning a set into fixtures

| Helper | Produces |
|---|---|
| `caseFixtures()` | Every case as a minimal fixture. Tiny and fast — the right shape for correctness |
| `caseFixtures(['a', 'b'])` | A named subset |
| `caseOnPage(name, { generate, params })` | One case appended to a generated page, so the match is found at realistic scale |
| `at(name, fixture, expected)` | Labels an arbitrary fixture, for pages that are not assertion cases |

A typical spec uses `caseFixtures()` for the whole matrix, plus a `caseOnPage(...)` or two for
the cases worth checking at scale.

## Adding a case

Add to a set rather than re-deriving one. The rendered-text set grew every time an approach
turned out to differ on a case nobody had written down, and that is the normal way it grows:
you find a disagreement, you write it down, and every future approach is measured against it.

Give every case a `why`. It is not decoration — a case with no stated reason is one the next
person deletes as redundant, and these cases look redundant right up until an approach fails
one of them.

## Adding a set

Add one when you have a *different* detection question, not merely a different detector. A new
set is warranted when the correct answer for the same markup would differ — matching visible
text rather than rendered text, say, where `display:none` content is excluded but
`visibility:hidden` content is not.

A set needs: the cases, a `QUESTION` string stating what an approach must get right, and both
positive and negative cases. The last is load-bearing: a set that was all one way is satisfied
by a detector that always answers that way, and would score it 100%.
