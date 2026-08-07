/**
 * Detector performance benchmark runner.
 *
 * Two kinds of spec, because there are two different questions:
 *
 *   kind: 'algorithm'  fixed config, varying implementation. Is the algorithm efficient,
 *                      where does it fall down, how do alternatives compare. Any
 *                      behaviour change is a regression.
 *   kind: 'config'     fixed implementation, varying detector config. What does a
 *                      configured detector cost, and what does gating trade away. A
 *                      behaviour change is a trade-off to weigh, not a failure.
 *
 *   npm run bench-detectors -- --spec scripts/detector-bench/specs/adwall-xpath.mjs
 *
 * See ../../../.agents/skills/detector-performance/SKILL.md
 */
import path from 'node:path';
import { writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import minimist from 'minimist';
import { chromium, firefox, webkit } from '@playwright/test';
import { resolveVariants, bundleMeasureCore, injectedRoot } from './bundle.mjs';
import { collectFacts, collectResults, benchmark, singleSweep } from './harness.mjs';
import { summarise, formatFixture, formatScaling, formatSummary, compareToStored } from './report.mjs';

/**
 * @typedef {object} Fixture
 * @property {string} name
 * @property {string} [html] - Body markup, for small fixtures
 * @property {(params: any) => void} [generate] - Runs in the page; use for anything sizeable
 * @property {any} [params] - Passed to `generate`, so one generator covers many sizes
 * @property {Record<string, number[]>} [scale] - One param to sweep, eg `{ rows: [2000, 20000] }`
 * @property {Record<string, boolean>} expect - Required: detector key -> expected match
 */

/**
 * An implementation to compare, in an algorithm spec. `source` is documented on `Variant`
 * in bundle.mjs; `working-tree` and `worktree` need no files.
 *
 * @typedef {object} Implementation
 * @property {string} name
 * @property {'working-tree' | 'worktree' | 'module'} [source]
 * @property {string} [ref]
 * @property {string} [path]
 * @property {boolean} [baseline]
 */

/**
 * A detector configuration to compare, in a config spec.
 *
 * `reference` marks the config whose behaviour is the intended one. It is distinct from
 * `baseline`: `baseline` answers "faster or slower than what", `reference` answers
 * "different behaviour from what". Usually the same config, but not necessarily - you
 * might time against the cheapest option while comparing semantics against the strictest.
 *
 * `expectDivergence` declares that this config is known to change behaviour, so the exit
 * code means an *unexpected* change.
 *
 * @typedef {object} ConfigVariant
 * @property {string} name
 * @property {Record<string, Record<string, object>> | ((params: any) => Record<string, Record<string, object>>)} detectors
 * @property {Record<string, number[]>} [params] - One param to sweep; `detectors` must then be a function
 * @property {boolean} [baseline]
 * @property {boolean} [reference]
 * @property {boolean} [expectDivergence]
 */

/**
 * @typedef {object} Spec
 * @property {'algorithm' | 'config'} kind
 * @property {Fixture[]} fixtures
 * @property {Implementation[]} [implementations] - Algorithm specs
 * @property {Record<string, Record<string, object>>} [detectors] - Algorithm specs: the fixed config
 * @property {ConfigVariant[]} [configs] - Config specs
 * @property {Implementation} [implementation] - Config specs: defaults to the working tree
 * @property {number} [iterations]
 * @property {number} [warmup]
 * @property {number} [minBatchMs]
 */

/**
 * DOM traversal primitives are engine-implemented, and web-detection ships to all three,
 * so a result from one engine does not generalise.
 */
const BROWSER_TYPES = { chromium, firefox, webkit };

/**
 * Below this, a median difference is more likely to be the machine than the code.
 *
 * Deliberately loose. Re-running an unchanged spec at 9 iterations on an otherwise busy
 * developer machine moved medians by up to 22%, so a tighter default would report that as
 * a regression. Tighten it for a quiet machine and a high iteration count.
 */
const DEFAULT_THRESHOLD_PERCENT = 25;

const argv = minimist(process.argv.slice(2), {
    string: ['spec', 'json', 'filter', 'browsers', 'baseline'],
    boolean: ['help', 'check-only', 'memory'],
    default: { minBatchMs: 2, browsers: 'chromium' },
});

if (argv.help || !argv.spec) {
    console.log(`
Detector performance benchmark

  --spec <path>       Spec module to run (required)
  --filter <text>     Only run fixtures whose name contains <text>
  --browsers <list>   Comma-separated: chromium, firefox, webkit (default chromium).
                      Engines run concurrently.
  --check-only        Run the correctness pass and skip all sampling. Seconds, not minutes.
  --memory            Also take a heap reading around one sweep per variant (chromium only)
  --iterations <n>    Samples per variant per fixture (spec value, else 15)
  --warmup <n>        Untimed sweeps before measuring (spec value, else 3)
  --minBatchMs <n>    Minimum duration of one timed batch (default 2)
  --json <path>       Also write raw results as JSON
  --baseline <path>   Compare medians against a previously written --json run
  --threshold <n>     Percent change reported by --baseline (default ${DEFAULT_THRESHOLD_PERCENT})

Exits non-zero on any behaviour change that the spec did not declare with
\`expectDivergence: true\`.
`);
    process.exit(argv.spec ? 0 : 1);
}

const specPath = path.resolve(process.cwd(), argv.spec);
/** @type {{ default: Spec }} */
const specModule = await import(pathToFileURL(specPath).href);
const spec = specModule.default;

const axis = spec.kind;
if (axis !== 'algorithm' && axis !== 'config') {
    console.error(`Spec must declare kind: 'algorithm' or kind: 'config', got ${JSON.stringify(spec.kind)}.`);
    process.exit(1);
}

const iterations = Number(argv.iterations ?? spec.iterations ?? 15);
const warmup = Number(argv.warmup ?? spec.warmup ?? 3);
const minBatchMs = Number(argv.minBatchMs ?? spec.minBatchMs ?? 2);
const checkOnly = Boolean(argv['check-only']);
const withMemory = Boolean(argv.memory);
const thresholdPercent = Number(argv.threshold ?? DEFAULT_THRESHOLD_PERCENT);

/**
 * Expand a single swept parameter into one entry per value.
 *
 * One parameter only. A cross product would multiply run time without making the growth
 * any easier to read, and the whole point of a sweep is a column you can scan down.
 *
 * @param {Record<string, number[]> | undefined} sweep
 * @param {string} label
 * @returns {{ param: string, values: number[] } | null}
 */
function singleSweptParam(sweep, label) {
    if (!sweep) return null;
    const keys = Object.keys(sweep);
    if (keys.length === 0) return null;
    if (keys.length > 1) {
        console.error(`${label} sweeps ${keys.length} parameters (${keys.join(', ')}). Sweep one at a time.`);
        process.exit(1);
    }
    const param = keys[0];
    return { param, values: sweep[param] };
}

/**
 * A fixture after sweep expansion. `scale` means something different here than it does as
 * authored - one concrete point rather than the set of values to cover - so it is a
 * separate type rather than an optional extra field on `Fixture`.
 *
 * @typedef {Omit<Fixture, 'scale'> & { scale: { group: string, param: string, value: number } | null }} PreparedFixture
 */

/** @type {PreparedFixture[]} */
const fixtures = [];
for (const { scale: sweptValues, ...fixture } of spec.fixtures) {
    const sweep = singleSweptParam(sweptValues, `Fixture "${fixture.name}"`);
    if (!sweep) {
        fixtures.push({ ...fixture, scale: null });
        continue;
    }
    for (const value of sweep.values) {
        fixtures.push({
            ...fixture,
            name: `${fixture.name}@${sweep.param}=${value}`,
            params: { ...(fixture.params ?? {}), [sweep.param]: value },
            scale: { group: fixture.name, param: sweep.param, value },
        });
    }
}

const selected = fixtures.filter((f) => !argv.filter || f.name.includes(argv.filter));
if (selected.length === 0) {
    console.error(`No fixtures matched --filter "${argv.filter}"`);
    process.exit(1);
}

for (const fixture of selected) {
    if (!fixture.expect || Object.keys(fixture.expect).length === 0) {
        console.error(`Fixture "${fixture.name}" has no \`expect\` labels. Every fixture must state its expected result.`);
        process.exit(1);
    }
}

const browsers = String(argv.browsers)
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
for (const name of browsers) {
    if (!(name in BROWSER_TYPES)) {
        console.error(`Unknown browser "${name}". Choose from: ${Object.keys(BROWSER_TYPES).join(', ')}`);
        process.exit(1);
    }
}
if (withMemory && browsers.some((name) => name !== 'chromium')) {
    console.error('--memory reads the heap over CDP, which is chromium only. Run it with --browsers chromium.');
    process.exit(1);
}

/**
 * Flatten a spec's variants into the shape `resolveVariants` takes, plus the per-axis
 * metadata the report needs.
 *
 * @returns {{ variants: import('./bundle.mjs').Variant[], meta: Map<string, { reference: boolean, expectDivergence: boolean }> }}
 */
function buildVariants() {
    /** @type {import('./bundle.mjs').Variant[]} */
    const built = [];
    /** @type {Map<string, { reference: boolean, expectDivergence: boolean }>} */
    const meta = new Map();

    if (axis === 'algorithm') {
        if (!spec.implementations?.length) {
            console.error("An algorithm spec needs `implementations`. Use `kind: 'config'` to vary detector config instead.");
            process.exit(1);
        }
        if (!spec.detectors) {
            console.error('An algorithm spec needs a spec-level `detectors`: the fixed config every implementation runs.');
            process.exit(1);
        }
        for (const impl of spec.implementations) {
            built.push({ ...impl, detectors: spec.detectors });
            meta.set(impl.name, { reference: false, expectDivergence: false });
        }
        return { variants: built, meta };
    }

    if (!spec.configs?.length) {
        console.error("A config spec needs `configs`. Use `kind: 'algorithm'` to vary the implementation instead.");
        process.exit(1);
    }
    const implementation = spec.implementation ?? { name: 'working-tree' };

    for (const config of spec.configs) {
        const sweep = singleSweptParam(config.params, `Config "${config.name}"`);
        const entries = sweep
            ? sweep.values.map((value) => ({ name: `${config.name}@${sweep.param}=${value}`, param: { [sweep.param]: value } }))
            : [{ name: config.name, param: null }];

        for (const entry of entries) {
            let detectors;
            if (entry.param) {
                if (typeof config.detectors !== 'function') {
                    console.error(`Config "${config.name}" sweeps a parameter, so \`detectors\` must be a function of it.`);
                    process.exit(1);
                }
                detectors = config.detectors(entry.param);
            } else {
                detectors = typeof config.detectors === 'function' ? config.detectors({}) : config.detectors;
            }

            built.push({
                name: entry.name,
                source: implementation.source,
                ref: implementation.ref,
                path: implementation.path,
                detectors,
                // A swept config compares its own values, so the first is the baseline
                baseline: config.baseline && entry === entries[0],
            });
            meta.set(entry.name, {
                reference: Boolean(config.reference) && entry === entries[0],
                expectDivergence: Boolean(config.expectDivergence),
            });
        }
    }
    return { variants: built, meta };
}

const { variants: specVariants, meta: variantMeta } = buildVariants();
const { variants, cleanup } = await resolveVariants(specVariants, spec.detectors, path.dirname(specPath));
const measureCore = await bundleMeasureCore();

// The reference defaults to the baseline, then to the first config: the report needs
// something to diff behaviour against, and silently having none would read as "no change".
if (axis === 'config' && ![...variantMeta.values()].some((m) => m.reference)) {
    const fallback = variants.find((v) => v.baseline) ?? variants[0];
    if (fallback) {
        const existing = variantMeta.get(fallback.name);
        variantMeta.set(fallback.name, { reference: true, expectDivergence: existing?.expectDivergence ?? false });
    }
}
const referenceName = variants.find((v) => variantMeta.get(v.name)?.reference)?.name;

console.log(`spec:       ${path.relative(injectedRoot, specPath)}`);
console.log(
    `axis:       ${axis} (${axis === 'algorithm' ? 'fixed config, varying implementation' : 'fixed implementation, varying config'})`,
);
console.log(`fixtures:   ${selected.length}`);
console.log(`browsers:   ${browsers.join(', ')}${browsers.length > 1 ? ' (concurrent)' : ''}`);
console.log(`variants:   ${variants.map((v) => `${v.name} [${v.code.key}]`).join(', ')}`);
if (axis === 'config') console.log(`reference:  ${referenceName ?? 'none'}`);
console.log(
    checkOnly
        ? 'sampling:   skipped (--check-only)'
        : `sampling:   ${iterations} samples, ${warmup} warmup sweeps, >=${minBatchMs}ms per batch`,
);
if (withMemory) console.log('memory:     heap read around one sweep per variant');

/** @type {import('./report.mjs').FixtureReport[]} */
let reports = [];

try {
    // Engines are independent processes, so running them concurrently costs nothing but
    // memory. Output is buffered per engine and printed in the requested order, since
    // interleaved progress from three browsers is unreadable.
    const runs = await Promise.all(browsers.map((name) => runBrowser(name)));
    for (const run of runs) {
        console.log(`\n${'='.repeat(60)}\n== ${run.engine}\n${'='.repeat(60)}`);
        console.log(run.output.join('\n'));
        reports = reports.concat(run.reports);
    }
} finally {
    cleanup();
}

/**
 * @param {string} browserName
 * @returns {Promise<{ engine: string, reports: import('./report.mjs').FixtureReport[], output: string[] }>}
 */
async function runBrowser(browserName) {
    const browserInstance = await BROWSER_TYPES[browserName].launch();
    /** @type {import('./report.mjs').FixtureReport[]} */
    const engineReports = [];
    /** @type {string[]} */
    const output = [];

    try {
        for (const fixture of selected) {
            const page = await browserInstance.newPage();
            try {
                await page.setContent(`<!DOCTYPE html><html><body>${fixture.html ?? ''}</body></html>`);
                if (fixture.generate) {
                    await page.evaluate(fixture.generate, fixture.params ?? {});
                }

                const facts = await page.evaluate(collectFacts);

                await page.addScriptTag({ content: measureCore });
                // Each bundle assigns to window.__detectorBench; move it aside under the
                // variant name so several implementations can coexist on one page.
                await page.evaluate(() => {
                    /** @type {any} */ (window).__benchVariants = {};
                });
                for (const variant of variants) {
                    await page.addScriptTag({ content: variant.bundle });
                    await page.evaluate((name) => {
                        const w = /** @type {any} */ (window);
                        w.__benchVariants[name] = w.__detectorBench;
                    }, variant.name);
                }

                const variantNames = variants.map((v) => v.name);
                const detectorsByVariant = Object.fromEntries(variants.map((v) => [v.name, v.detectors]));

                const { results, peakChars } = await page.evaluate(collectResults, { variantNames, detectorsByVariant });

                const timings = checkOnly
                    ? null
                    : await page.evaluate(benchmark, { variantNames, detectorsByVariant, iterations, warmup, minBatchMs });

                const heapBytes = withMemory ? await readHeap(page, variantNames, detectorsByVariant) : null;

                const referenceActual = referenceName ? results[referenceName] : null;

                const report = {
                    engine: browserName,
                    fixture: fixture.name,
                    scale: fixture.scale ?? null,
                    facts,
                    variants: variants.map((variant) => {
                        const actual = results[variant.name];
                        const meta = variantMeta.get(variant.name);
                        const { falsePositives, falseNegatives } = classify(fixture.expect, actual);
                        const correct = falsePositives.length === 0 && falseNegatives.length === 0;
                        const stats = timings ? summarise(timings[variant.name].samples) : { median: 0, p95: 0 };

                        return {
                            name: variant.name,
                            baseline: variant.baseline,
                            reference: meta?.reference ?? false,
                            expectDivergence: meta?.expectDivergence ?? false,
                            ...stats,
                            peakChars: peakChars[variant.name] ?? null,
                            heapBytes: heapBytes?.[variant.name] ?? null,
                            expected: fixture.expect,
                            actual,
                            falsePositives,
                            falseNegatives,
                            correct,
                            // What drives the exit code. An algorithm spec has no way to
                            // declare a change acceptable, so any divergence is unexpected.
                            unexpected: !correct && !(axis === 'config' && meta?.expectDivergence),
                            vsReference: referenceActual ? deltaAgainst(fixture.expect, referenceActual, actual) : null,
                        };
                    }),
                };

                engineReports.push(report);
                output.push(formatFixture(report, axis, { timed: !checkOnly }));
            } finally {
                await page.close();
            }
        }
    } finally {
        await browserInstance.close();
    }

    return { engine: browserName, reports: engineReports, output };
}

/**
 * Split a variant's results into false positives and false negatives against the
 * fixture's labels, which are ground truth.
 *
 * @param {Record<string, boolean>} expected
 * @param {Record<string, boolean | 'error'>} actual
 * @returns {{ falsePositives: string[], falseNegatives: string[] }}
 */
function classify(expected, actual) {
    /** @type {string[]} */
    const falsePositives = [];
    /** @type {string[]} */
    const falseNegatives = [];
    for (const key of Object.keys(expected)) {
        const got = actual[key];
        if (got === expected[key]) continue;
        // An error is neither, but it is certainly not correct - count it on the side that
        // reflects what the detector failed to do.
        if (expected[key]) falseNegatives.push(key);
        else falsePositives.push(key);
    }
    return { falsePositives, falseNegatives };
}

/**
 * What this variant changes relative to the reference config.
 *
 * Distinguishes "this config is wrong" from "this config is wrong in a new way": if the
 * reference already misses a case, a config that also misses it has introduced nothing.
 *
 * @param {Record<string, boolean>} expected
 * @param {Record<string, boolean | 'error'>} reference
 * @param {Record<string, boolean | 'error'>} actual
 * @returns {import('./report.mjs').ReferenceDelta}
 */
function deltaAgainst(expected, reference, actual) {
    /** @type {import('./report.mjs').ReferenceDelta} */
    const delta = { introducedFP: [], introducedFN: [], fixedFP: [], fixedFN: [] };

    for (const key of Object.keys(expected)) {
        const want = expected[key];
        const ref = reference[key];
        const got = actual[key];
        if (ref === got) continue;

        const refCorrect = ref === want;
        if (refCorrect) {
            if (want) delta.introducedFN.push(key);
            else delta.introducedFP.push(key);
        } else {
            if (want) delta.fixedFN.push(key);
            else delta.fixedFP.push(key);
        }
    }
    return delta;
}

/**
 * Heap used immediately after one sweep, per variant.
 *
 * Uninstrumented, which is the point: it is the only memory figure available for the
 * shipped implementation, since nothing is going to be added to `matching.js` for the
 * benefit of a benchmark. It is also coarse - a single reading after a forced collection,
 * not a true peak - so read it as an order of magnitude rather than a measurement.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]} variantNames
 * @param {Record<string, object>} detectorsByVariant
 * @returns {Promise<Record<string, number | null>>}
 */
async function readHeap(page, variantNames, detectorsByVariant) {
    /** @type {Record<string, number | null>} */
    const out = {};
    const cdp = await page.context().newCDPSession(page);
    try {
        await cdp.send('HeapProfiler.enable');
        for (const name of variantNames) {
            await cdp.send('HeapProfiler.collectGarbage');
            const before = /** @type {any} */ (await cdp.send('Runtime.getHeapUsage'));
            await page.evaluate(singleSweep, { variantName: name, detectors: detectorsByVariant[name] });
            const after = /** @type {any} */ (await cdp.send('Runtime.getHeapUsage'));
            out[name] = after.usedSize - before.usedSize;
        }
    } catch {
        // A heap reading is a nice-to-have; losing it should not lose the run.
        for (const name of variantNames) out[name] = null;
    } finally {
        await cdp.detach().catch(() => {});
    }
    return out;
}

if (!checkOnly) {
    const scaling = formatScaling(reports);
    if (scaling) console.log(scaling);
}

console.log(formatSummary(reports, axis));

if (argv.baseline) {
    if (checkOnly) {
        console.log('\n--baseline compares medians, so it has nothing to do under --check-only.');
    } else {
        const stored = JSON.parse(readFileSync(path.resolve(process.cwd(), argv.baseline), 'utf8'));
        console.log(compareToStored(reports, stored, thresholdPercent));
    }
}

if (argv.json) {
    const jsonPath = path.resolve(process.cwd(), argv.json);
    writeFileSync(jsonPath, JSON.stringify({ spec: specPath, axis, iterations, warmup, minBatchMs, reports }, null, 2));
    console.log(`\nWrote ${jsonPath}`);
}

process.exit(reports.some((report) => report.variants.some((variant) => variant.unexpected)) ? 1 : 0);
