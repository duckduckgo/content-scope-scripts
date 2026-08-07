/**
 * Layout state, as a condition of the run rather than something a variant does to itself.
 *
 * Detectors poll, and they poll because the page is still changing. A strategy that reads
 * *rendered* text - `innerText`, `getBoundingClientRect`, anything geometric - has to
 * flush pending layout before it can answer, and a strategy that walks text nodes does
 * not. Measuring only a settled page hides that difference entirely, and it is not a small
 * one: it reverses the ranking of `innerText` against chunked XPath scanning.
 *
 * Injected into the page as `window.__benchLayout`, the same channel the sampling core
 * uses, so the three serialised harness functions share one implementation instead of
 * carrying three copies of it.
 */

/** Alternated so consecutive writes differ; assigning the same value invalidates nothing. */
let tick = 0;

/**
 * Invalidate layout, so the next thing needing geometry has to reflow.
 *
 * Must be called inside the timed sweep. Called outside it, only the first sweep of a
 * batch reflows and every later one measures a warm page - which collapses the dirty
 * measurement back onto the warm one while still looking like a result.
 *
 * The property has to invalidate *descendants*. Toggling `padding-top` on the root looks
 * like it should and does not: it shifts the root box while leaving every child's layout
 * valid, so the reflow is O(1) whatever the page size. That produced a confident null
 * result - `innerText` measured identical warm and dirty at 2k, 20k and 100k rows - and is
 * the reason `measureLayoutInvalidation` exists. Changing the available width of `body` is
 * the cheap write no descendant can survive.
 */
export function dirtyLayout() {
    document.body.style.width = (tick++ & 1) === 0 ? '100%' : '99.99%';
}

/**
 * Force layout to settle, so what follows starts from a clean page.
 *
 * Needed because every variant shares one page and samples are collected round-robin, so a
 * dirty-layout variant leaves layout invalid for whichever subject runs next. Without this
 * the warm rows silently measure a dirty page and converge on the dirty ones - which is
 * exactly what happened the first time: `innertext (warm)` reported 184ms against its true
 * 9.6ms because `chunked (dirty)` had run immediately before it.
 *
 * Call it *outside* the timed region. It exists to establish a precondition, not to be
 * measured.
 */
export function settleLayout() {
    const w = /** @type {any} */ (window);
    w.__benchSink = (w.__benchSink ?? 0) + document.body.offsetHeight;
}

/** Batch sizing floor, in ms. `performance.now()` is clamped, so a single cached read is unmeasurable. */
const MIN_TIMED_MS = 1;

/** Enough doublings to measure anything; a guard against a call that never registers. */
const MAX_TIMING_BATCH = 1 << 20;

/**
 * Cost of one call, sized so the measurement is not dominated by clock resolution.
 *
 * A fixed iteration count is not good enough here. A clean forced read is served from
 * cached layout and costs so little that twenty of them can total zero, and a zero
 * denominator turns the ratio below into `Infinity` - which passes any threshold, so a
 * broken invalidation and a working one become indistinguishable. That is the exact failure
 * this self-check exists to prevent, so it must not be possible in the check itself.
 *
 * @param {() => void} call
 * @returns {number}
 */
function costPerCall(call) {
    let batch = 1;
    for (;;) {
        const start = performance.now();
        for (let i = 0; i < batch; i++) call();
        const elapsed = performance.now() - start;
        if (elapsed >= MIN_TIMED_MS || batch >= MAX_TIMING_BATCH) return elapsed / batch;
        batch *= 2;
    }
}

/**
 * Check that `dirtyLayout` actually invalidates, by pricing a forced geometry read with
 * and without it.
 *
 * A clean read is served from cached layout, so on any page with real structure the ratio
 * is large. A ratio near 1 means the invalidation is not reaching the boxes being measured,
 * and every dirty timing in the run is worthless.
 *
 * What the ratio catches is invalidation that does nothing at all. It is not a measure of
 * how *much* is being invalidated: a write that reflows only the root box scores above 1
 * while still being O(1) in page size. Read it alongside the timings - a dirty row that
 * matches its warm row on a large fixture is the other symptom.
 *
 * @returns {{ clean: number, dirty: number, ratio: number }}
 */
export function measureLayoutInvalidation() {
    const w = /** @type {any} */ (window);
    let sink = 0;

    // Settle layout first, so the cost of the very first reflow is not charged to `clean`.
    sink += document.body.offsetHeight;

    const clean = costPerCall(() => {
        sink += document.body.offsetHeight;
    });
    const dirty = costPerCall(() => {
        dirtyLayout();
        sink += document.body.offsetHeight;
    });

    w.__benchSink = (w.__benchSink ?? 0) + sink;

    // Both are now measurable by construction, but never divide by a zero that a degenerate
    // page could still produce.
    const ratio = clean > 0 ? dirty / clean : dirty > 0 ? Infinity : 1;
    return { clean, dirty, ratio };
}
