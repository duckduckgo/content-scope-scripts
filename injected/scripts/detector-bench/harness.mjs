/**
 * In-page functions. These are serialised by Playwright and executed in the browser, so
 * each one must be entirely self-contained: no imports, no closure over module scope.
 *
 * The shared cores are the exception, and deliberately so. The sampling loop is injected as
 * `window.__benchMeasure` and the layout controls as `window.__benchLayout` (see
 * `bundleMeasureCore` and `bundleLayoutCore` in `bundle.mjs`), so the DOM path, the
 * Node-side string path and the three functions below share one implementation of each
 * rather than carrying copies.
 */

/**
 * Describe the generated DOM, so timings can be read against the shape that produced
 * them, and so a scaling run has a size to normalise against.
 *
 * `renderedChars` is the length of the page's rendered text, and it is here because the
 * memory columns cannot supply it. It is the amount any strategy that materialises the
 * whole page text must hold at once, so it is the figure a bounded-buffer strategy is
 * bounded *against* - and unlike `peak buffer` it needs no instrumentation, so it is
 * available for the shipped implementation too. Reading it forces layout, which is
 * harmless here: this runs once at setup, before anything is timed.
 *
 * @returns {{ elements: number, textNodes: number, chars: number, renderedChars: number }}
 */
export function collectFacts() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNodes = 0;
    let chars = 0;
    while (walker.nextNode()) {
        textNodes++;
        chars += (walker.currentNode.textContent || '').length;
    }
    return {
        elements: document.getElementsByTagName('*').length,
        textNodes,
        chars,
        renderedChars: (document.body.innerText || '').length,
    };
}

/**
 * Evaluate every variant once and report what each detected.
 *
 * Kept separate from timing because it is the only thing `--check-only` needs, and
 * because it is the pass whose result decides whether the timings mean anything at all.
 *
 * `peakChars` is collected here rather than during sampling: a variant that reports its
 * high-water buffer only needs to be observed once, and reading it here keeps the
 * instrumentation out of the timed path entirely.
 *
 * @param {object} args
 * @param {string[]} args.variantNames
 * @param {Record<string, object>} args.detectorsByVariant
 * @param {Record<string, 'warm' | 'dirty'>} [args.layoutByVariant]
 * @returns {{
 *   results: Record<string, Record<string, boolean | 'error'>>,
 *   detectorKeys: Record<string, string[]>,
 *   peakChars: Record<string, number | null>
 * }}
 */
export function collectResults({ variantNames, detectorsByVariant, layoutByVariant = {} }) {
    const w = /** @type {any} */ (window);
    const registry = w.__benchVariants;

    /** @type {Record<string, Record<string, boolean | 'error'>>} */
    const results = {};
    /** @type {Record<string, string[]>} */
    const detectorKeys = {};
    /** @type {Record<string, number | null>} */
    const peakChars = {};

    for (const name of variantNames) {
        const api = registry[name];
        const parsed = api.parseDetectors(detectorsByVariant[name]);

        /** @type {Array<[string, any]>} */
        const entries = [];
        for (const groupName of Object.keys(parsed)) {
            for (const detectorId of Object.keys(parsed[groupName])) {
                entries.push([`${groupName}.${detectorId}`, parsed[groupName][detectorId]]);
            }
        }
        if (entries.length === 0) {
            throw new Error(`Variant "${name}" parsed to zero detectors - check group and detector names`);
        }

        w.__benchPeakChars = 0;

        // Same layout state the timed sweep will run under, so a strategy whose result
        // depends on rendered text is checked against the state it will be measured in.
        if (layoutByVariant[name] === 'dirty') w.__benchLayout.dirtyLayout();

        /** @type {Record<string, boolean | 'error'>} */
        const out = {};
        for (const [key, config] of entries) {
            try {
                out[key] = api.evaluateMatch(config.match);
            } catch {
                out[key] = 'error';
            }
        }

        results[name] = out;
        detectorKeys[name] = entries.map(([key]) => key);
        // Zero means the variant does not report it, since any real sweep touches text.
        peakChars[name] = w.__benchPeakChars > 0 ? w.__benchPeakChars : null;
    }

    return { results, detectorKeys, peakChars };
}

/**
 * Time every variant against the current DOM.
 *
 * The timed unit is a full detection sweep - every detector in that variant's config,
 * evaluated once - which is the per-page-load cost that config imposes.
 *
 * @param {object} args
 * @param {string[]} args.variantNames
 * @param {Record<string, object>} args.detectorsByVariant
 * @param {Record<string, 'warm' | 'dirty'>} [args.layoutByVariant]
 * @param {number} args.iterations
 * @param {number} args.warmup
 * @param {number} args.minBatchMs
 * @returns {Record<string, { samples: number[], batch: number }>}
 */
export function benchmark({ variantNames, detectorsByVariant, layoutByVariant = {}, iterations, warmup, minBatchMs }) {
    const w = /** @type {any} */ (window);
    const registry = w.__benchVariants;

    const subjects = variantNames.map((name) => {
        const api = registry[name];
        const parsed = api.parseDetectors(detectorsByVariant[name]);
        /** @type {any[]} */
        const configs = [];
        for (const groupName of Object.keys(parsed)) {
            for (const detectorId of Object.keys(parsed[groupName])) {
                configs.push(parsed[groupName][detectorId]);
            }
        }
        const dirty = layoutByVariant[name] === 'dirty';
        // Only when the run actually mixes modes. A warm-only run needs no settling, and
        // attaching one would change the shape of every existing spec's measurement.
        const mixedModes = Object.values(layoutByVariant).some((mode) => mode === 'dirty');
        return {
            name,
            // A warm subject has to re-establish clean layout before its batch, because the
            // subject sampled before it may have been a dirty one. Untimed: this is a
            // precondition, not part of what the subject costs.
            prepare: mixedModes && !dirty ? () => w.__benchLayout.settleLayout() : undefined,
            // Returns a value accumulated into a sink, so the engine cannot eliminate
            // the calls as dead code.
            sweep() {
                // Inside the timed region on purpose. The style write costs the same for
                // every variant; only one that needs geometry pays to resolve it, and that
                // asymmetry is the thing being measured. Hoisting this out of the sweep
                // would leave only the first sweep of a batch reflowing.
                if (dirty) w.__benchLayout.dirtyLayout();
                let acc = 0;
                for (const config of configs) {
                    try {
                        acc += api.evaluateMatch(config.match) ? 1 : 0;
                    } catch {
                        acc += 2;
                    }
                }
                return acc;
            },
        };
    });

    const { samples, batches, sink } = w.__benchMeasure.sample({ subjects, iterations, warmup, minBatchMs });
    w.__benchSink = sink;

    /** @type {Record<string, { samples: number[], batch: number }>} */
    const timings = {};
    for (const name of variantNames) {
        timings[name] = { samples: samples[name], batch: batches[name] };
    }
    return timings;
}

/**
 * Run one sweep of one variant, for a memory reading to be taken around.
 *
 * @param {{ variantName: string, detectors: object, layout?: 'warm' | 'dirty' }} args
 * @returns {number}
 */
export function singleSweep({ variantName, detectors, layout = 'warm' }) {
    const w = /** @type {any} */ (window);
    const api = w.__benchVariants[variantName];
    const parsed = api.parseDetectors(detectors);
    if (layout === 'dirty') w.__benchLayout.dirtyLayout();
    let acc = 0;
    for (const groupName of Object.keys(parsed)) {
        for (const detectorId of Object.keys(parsed[groupName])) {
            try {
                acc += api.evaluateMatch(parsed[groupName][detectorId].match) ? 1 : 0;
            } catch {
                acc += 2;
            }
        }
    }
    w.__benchSink = (w.__benchSink ?? 0) + acc;
    return acc;
}

/**
 * Price the layout invalidation on this fixture, so the runner can refuse to report dirty
 * timings that were never dirty.
 *
 * @returns {{ clean: number, dirty: number, ratio: number }}
 */
export function checkLayoutInvalidation() {
    return /** @type {any} */ (window).__benchLayout.measureLayoutInvalidation();
}
