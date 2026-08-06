/**
 * In-page functions. These are serialised by Playwright and executed in the
 * browser, so each one must be entirely self-contained: no imports, no closure
 * over module scope.
 */

/**
 * Describe the generated DOM, so timings can be read against the shape that
 * produced them.
 *
 * @returns {{ elements: number, textNodes: number, chars: number }}
 */
export function collectFacts() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNodes = 0;
    let chars = 0;
    while (walker.nextNode()) {
        textNodes++;
        chars += (walker.currentNode.textContent || '').length;
    }
    return { elements: document.getElementsByTagName('*').length, textNodes, chars };
}

/**
 * Check correctness, then time every variant against the current DOM.
 *
 * The timed unit is a full detection sweep: every detector in that variant's
 * config, evaluated once. That is the per-page-load cost the config imposes.
 *
 * Two measures guard against noise. Each sample times a batch of sweeps sized so
 * the batch lasts at least `minBatchMs`, which keeps sub-millisecond work
 * measurable. Samples are then collected round-robin across variants rather than
 * all-of-one-then-the-next, so CPU frequency drift hits every variant equally.
 *
 * @param {object} args
 * @param {string[]} args.variantNames
 * @param {Record<string, object>} args.detectorsByVariant
 * @param {number} args.iterations
 * @param {number} args.warmup
 * @param {number} args.minBatchMs
 * @returns {{
 *   correctness: Record<string, Record<string, boolean | 'error'>>,
 *   timings: Record<string, { samples: number[], batch: number }>,
 *   detectorKeys: Record<string, string[]>
 * }}
 */
export function benchmark({ variantNames, detectorsByVariant, iterations, warmup, minBatchMs }) {
    const registry = /** @type {any} */ (window).__benchVariants;

    /** Build the evaluator for one variant. */
    function prepare(name) {
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
        return {
            keys: entries.map(([key]) => key),
            results() {
                /** @type {Record<string, boolean | 'error'>} */
                const out = {};
                for (const [key, config] of entries) {
                    try {
                        out[key] = api.evaluateMatch(config.match);
                    } catch {
                        out[key] = 'error';
                    }
                }
                return out;
            },
            // Returns a value that is accumulated into a sink, so the engine
            // cannot eliminate the calls as dead code.
            sweep() {
                let acc = 0;
                for (const [, config] of entries) {
                    try {
                        acc += api.evaluateMatch(config.match) ? 1 : 0;
                    } catch {
                        acc += 2;
                    }
                }
                return acc;
            },
        };
    }

    const prepared = variantNames.map((name) => ({ name, ...prepare(name) }));

    /** @type {Record<string, Record<string, boolean | 'error'>>} */
    const correctness = {};
    /** @type {Record<string, string[]>} */
    const detectorKeys = {};
    for (const variant of prepared) {
        correctness[variant.name] = variant.results();
        detectorKeys[variant.name] = variant.keys;
    }

    let sink = 0;

    // Warm up every variant before any measurement, so JIT state is comparable.
    for (const variant of prepared) {
        for (let i = 0; i < warmup; i++) sink += variant.sweep();
    }

    // Size each variant's batch independently: a selector check can be 30000x
    // faster than an XPath one, and both need to land above the clock's noise.
    /** @type {Record<string, number>} */
    const batches = {};
    for (const variant of prepared) {
        let batch = 1;
        for (;;) {
            const start = performance.now();
            for (let i = 0; i < batch; i++) sink += variant.sweep();
            if (performance.now() - start >= minBatchMs || batch >= 8192) break;
            batch *= 2;
        }
        batches[variant.name] = batch;
    }

    /** @type {Record<string, number[]>} */
    const samples = {};
    for (const variant of prepared) samples[variant.name] = [];

    for (let round = 0; round < iterations; round++) {
        for (const variant of prepared) {
            const batch = batches[variant.name];
            const start = performance.now();
            for (let i = 0; i < batch; i++) sink += variant.sweep();
            samples[variant.name].push((performance.now() - start) / batch);
        }
    }

    /** @type {any} */ (window).__benchSink = sink;

    /** @type {Record<string, { samples: number[], batch: number }>} */
    const timings = {};
    for (const variant of prepared) {
        timings[variant.name] = { samples: samples[variant.name], batch: batches[variant.name] };
    }

    return { correctness, timings, detectorKeys };
}
