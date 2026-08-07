# Test pages

Nothing here is a captured page. Each generator builds a DOM to order from its parameters, so
a spec picks the *shape* it wants and then sizes it — which is what makes a scaling sweep
possible, and what lets one shape serve both a 2000-element realistic case and a 600k-element
stress case.

Two files, and the split matters: `pages.mjs` generators are serialised into the browser and
build a DOM, while `text-shapes.mjs` functions run in Node and return a string. A generator
**cannot call** a text shape, because it cannot close over module scope — `unbrokenWordRuns`
inlines its own copy for exactly that reason.

## Choosing a shape

Each exists to isolate one cost. Picking on that basis is what turns "this is slower" into
"this is slower per text node".

| Generator | Parameters | Isolates |
|---|---|---|
| `articlePage` | `rows`, `scriptBlocks`, `scriptRepeat` | Nothing in particular — the realistic mixed page, and the reference the others are read against |
| `elementHeavy` | `blocks`, `emptyPerBlock` | Walking past nodes the expression does not select. The only shape where element count and text-node count do not rise together |
| `manyTinyTextNodes` | `count` | Per-node overhead, with character volume held down |
| `textHeavy` | `paragraphs`, `charsPerParagraph` | The mirror: character-proportional cost, with node count held down. `charsPerParagraph` *is* the length of one text node, which is the term that can defeat a buffer bound |
| `deeplyNested` | `rows`, `depth` | Depth alone — one text node per chain, so text is constant across a depth sweep |
| `nestedInline` | `blocks`, `depth` | Depth multiplied by text nodes. The shape real markup has, and the worst case for an ancestor-chain predicate |
| `unbrokenWordRuns` | `blocks`, `charsPerBlock` | A word-boundary scan running to its ceiling on every flush, instead of stopping at the first space |
| `scriptHeavy` | `scriptBlocks`, `scriptRepeat`, `rows` | Large non-rendered text behind little rendered text. Pathological for anything reading `textContent` without excluding scripts |

Every generator also takes `append`, holding payload markup. Keeping the payload separate from
the filler means a matching and a non-matching fixture can share an identical DOM shape, so a
timing difference between them reflects the match rather than the page. `caseOnPage` in
`assertions/to-fixtures.mjs` uses this.

### Text shapes

`prose(n)`, `unbrokenWords(n)` and `sparseBreaks(n)` each return exactly `n` characters. Use
them for a step that operates on text after the DOM work is done — a buffer cut, a boundary
scan, a regex test. `prose` hides a boundary scan's cost because the nearest space is a few
characters away; `unbrokenWords` is its worst case; `sparseBreaks` is the realistic middle
ground that decides whether the worst case is worth designing around.

## Sizing

A spec sets size through `params`, and sweeps one parameter through `scale`:

```js
{ ...at('article-clean', { generate: articlePage }, false), scale: { rows: [2000, 20000, 100000] } }
```

One parameter at a time. A cross product multiplies run time without making the growth easier
to read, and the point of a sweep is a column you can scan down.

Pick sizes that bracket reality: a typical page is 2k–10k elements, and 100k+ is a stress case
— useful for making a difference visible, not for claiming it matters.

## Adding a generator

Three constraints, all enforced by `unit-test/detector-bench/page-gen.spec.js`:

1. **Self-contained.** It runs inside the page, so no imports and no closure over module
   scope. Inline what you need.
2. **Deterministic.** No randomness anywhere, or two runs are not comparable.
3. **The filler must never contain a detector pattern.** If it does, a gated variant's gate
   passes on every page and never short-circuits, which makes gating measure as useless — a
   wrong answer that reads as a finding rather than a bug.

Take `append` and apply it at the end, and take a parameter that scales the thing your shape
is about. Then say in the doc comment which cost the shape isolates and which existing shape
it is the counterpart to; that sentence is what makes it findable later.
