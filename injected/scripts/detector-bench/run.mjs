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
 *   npm run bench-detectors -- --spec scripts/detector-bench/specs/detector-design/adwall-xpath.mjs
 *
 * See ../../../.agents/skills/detector-performance/SKILL.md
 */
import path from 'node:path';
import { writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import minimist from 'minimist';
import { chromium, firefox, webkit } from '@playwright/test';
import { resolveVariants, bundleMeasureCore, bundleLayoutCore, injectedRoot } from './core/bundle.mjs';
import { collectFacts, collectResults, benchmark, singleSweep, checkLayoutInvalidation } from './core/harness.mjs';
import { summarise, formatFixture, formatScaling, formatSummary, formatAccuracy, compareToStored } from './core/report.mjs';
import { SpecError, assertFixturesLabelled, assertExpectKeysKnown, buildVariants, expandFixtures } from './core/expand.mjs';
import { decideOutcome } from './core/outcome.mjs';

/**
 * A spec's detector config, typed against the shipped privacy-configuration schema.
 *
 * The point of the alias is that a spec's `detectors` is not "some object" - it is
 * literally `settings.detectors` from privacy-configuration, so a config that measures
 * well pastes straight into a real config with no translation. Typing it here means a
 * malformed one is a lint failure naming the bad field, rather than a run that gets as
 * far as "parsed to zero detectors".
 *
 * This is deliberately a type alias rather than a builder API. A builder would insert a
 * layer between what is benchmarked and what ships, and would need mirroring on every
 * schema change.
 *
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.ts').DetectorConfig} DetectorConfig
 */

/**
 * @typedef {Record<string, Record<string, DetectorConfig>>} Detectors
 */

/**
 * @typedef {object} Fixture
 * @property {string} name
 * @property {string} [html] - Body markup, for small fixtures
 * @property {(params: any) => void} [generate] - Runs in the page; use for anything sizeable
 * @property {any} [params] - Passed to `generate`, so one generator covers many sizes
 * @property {Record<string, number[]>} [scale] - One param to sweep, eg `{ rows: [2000, 20000] }`
 * @property {'timing' | 'correctness' | 'both'} [purpose] - Defaults to `both`. `timing` fixtures are skipped under --check-only
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
 * @property {Detectors | ((params: any) => Detectors)} detectors
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
 * @property {Detectors} [detectors] - Algorithm specs: the fixed config
 * @property {ConfigVariant[]} [configs] - Config specs
 * @property {Implementation} [implementation] - Config specs: defaults to the working tree
 * @property {Array<'warm' | 'dirty'>} [layout] - Layout states to measure under; defaults to `['warm']`
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
                      Fixtures marked \`purpose: 'timing'\` are skipped entirely.
  --memory            Also read retained heap around one sweep per variant (chromium only).
                      Read the caveat on \`readMemory\` before trusting it.
  --iterations <n>    Samples per variant per fixture (spec value, else 15)
  --warmup <n>        Untimed sweeps before measuring (spec value, else 3)
  --minBatchMs <n>    Minimum duration of one timed batch (default 2)
  --json <path>       Also write raw results as JSON
  --baseline <path>   Compare medians against a previously written --json run
  --threshold <n>     Percent change reported by --baseline (default ${DEFAULT_THRESHOLD_PERCENT})

Exits non-zero on a behaviour change a variant introduced: against the reference config
and undeclared by \`expectDivergence: true\` (config axis), or against the baseline
implementation (algorithm axis). A fixture the baseline already fails is reported as
pre-existing and does not fail the run.
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
 * A fixture after sweep expansion. `scale` means something different here than it does as
 * authored - one concrete point rather than the set of values to cover - so it is a
 * separate type rather than an optional extra field on `Fixture`.
 *
 * @typedef {Omit<Fixture, 'scale'> & { scale: { group: string, param: string, value: number } | null }} PreparedFixture
 */

/**
 * Spec expansion and variant construction live in `expand.mjs`, which rejects a bad spec by
 * throwing rather than exiting, so they can be tested. Turn that back into a one-line
 * failure here.
 *
 * @template T
 * @param {() => T} build
 * @returns {T}
 */
function orExit(build) {
    try {
        return build();
    } catch (e) {
        if (e instanceof SpecError) {
            console.error(e.message);
            process.exit(1);
        }
        throw e;
    }
}

/** @type {PreparedFixture[]} */
const fixtures = orExit(() => expandFixtures(spec.fixtures, { checkOnly }));

const selected = fixtures.filter((f) => !argv.filter || f.name.includes(argv.filter));
if (selected.length === 0) {
    const scope = checkOnly ? " (note --check-only skips fixtures marked purpose: 'timing')" : '';
    console.error(`No fixtures matched --filter "${argv.filter}"${scope}`);
    process.exit(1);
}

orExit(() => assertFixturesLabelled(selected));

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

const { variants: specVariants, meta: variantMeta } = orExit(() => buildVariants({ axis, spec }));
const { variants, cleanup } = await resolveVariants(specVariants, spec.detectors, path.dirname(specPath));
const measureCore = await bundleMeasureCore();
const layoutCore = await bundleLayoutCore();

/** Whether any variant needs a dirty page, and therefore whether the self-check applies. */
const anyDirtyLayout = variants.some((v) => v.layout === 'dirty');

/**
 * Below this the invalidation is not reaching the boxes being measured, and every dirty
 * timing in the run is measuring a warm page. Generous, because the ratio is large when
 * invalidation works at all - the bug this catches produced a ratio of about 1.
 */
const MIN_LAYOUT_INVALIDATION_RATIO = 1.5;

/**
 * Fixtures below this are small enough to reflow almost for free, so a low ratio there is
 * legitimate rather than a broken invalidation.
 */
const LAYOUT_CHECK_MIN_ELEMENTS = 1000;

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
if (anyDirtyLayout) console.log('layout:     dirty variants invalidate layout inside each timed sweep');
console.log(
    checkOnly
        ? 'sampling:   skipped (--check-only)'
        : `sampling:   ${iterations} samples, ${warmup} warmup sweeps, >=${minBatchMs}ms per batch`,
);
if (withMemory) console.log('memory:     retained heap read around one sweep per variant');

/** @type {import('./core/report.mjs').FixtureReport[]} */
let reports = [];

/** Fixtures whose dirty-layout timings cannot be trusted. Fails the run; see below. */
/** @type {string[]} */
const layoutFailures = [];

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
} catch (e) {
    // A spec rejected mid-run - a fixture labelling an unknown detector, say. Same
    // one-line failure as a spec rejected before the browsers launched.
    if (!(e instanceof SpecError)) throw e;
    console.error(e.message);
    cleanup();
    process.exit(1);
} finally {
    cleanup();
}

/**
 * @param {string} browserName
 * @returns {Promise<{ engine: string, reports: import('./core/report.mjs').FixtureReport[], output: string[] }>}
 */
async function runBrowser(browserName) {
    const browserInstance = await BROWSER_TYPES[browserName].launch();
    /** @type {import('./core/report.mjs').FixtureReport[]} */
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
                await page.addScriptTag({ content: layoutCore });
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
                const layoutByVariant = Object.fromEntries(variants.map((v) => [v.name, v.layout]));

                // Before any timing: confirm the invalidation this fixture will run under
                // actually invalidates. A dirty run that silently measures a warm page is
                // indistinguishable from a real null result.
                const layoutCheck = anyDirtyLayout && !checkOnly ? await page.evaluate(checkLayoutInvalidation) : null;

                const { results, peakChars, detectorKeys } = await page.evaluate(collectResults, {
                    variantNames,
                    detectorsByVariant,
                    layoutByVariant,
                });

                // Before anything is timed: a fixture labelling a detector the config does
                // not define would otherwise be scored as a detection failure rather than
                // reported as the spec error it is. Thrown rather than exited, so the
                // worktree cleanup in the caller's `finally` still runs.
                assertExpectKeysKnown(fixture.name, fixture.expect, detectorKeys);

                const timings = checkOnly
                    ? null
                    : await page.evaluate(benchmark, {
                          variantNames,
                          detectorsByVariant,
                          layoutByVariant,
                          iterations,
                          warmup,
                          minBatchMs,
                      });

                const heapBytes = withMemory ? await readMemory(page, variants) : null;

                const referenceActual = referenceName ? results[referenceName] : null;
                const baselineName = variants.find((v) => v.baseline)?.name;
                const baselineActual = baselineName ? results[baselineName] : null;

                const report = {
                    engine: browserName,
                    fixture: fixture.name,
                    // Carried through so the accuracy summary can exclude `timing` fixtures,
                    // whose single "no match" label every variant satisfies for free.
                    purpose: fixture.purpose ?? 'both',
                    scale: fixture.scale ?? null,
                    facts,
                    layoutCheck,
                    variants: variants.map((variant) => {
                        const actual = results[variant.name];
                        const meta = variantMeta.get(variant.name);
                        const stats = timings ? summarise(timings[variant.name].samples) : { median: 0, p95: 0 };
                        // On the algorithm axis the comparison point is the baseline
                        // implementation, so a divergence can be attributed to the variant
                        // that introduced it rather than to whoever ran the spec.
                        const comparison = axis === 'config' ? referenceActual : baselineActual;
                        const outcome = decideOutcome({
                            axis,
                            expected: fixture.expect,
                            actual,
                            comparison,
                            expectDivergence: meta?.expectDivergence,
                        });

                        return {
                            name: variant.name,
                            baseline: variant.baseline,
                            reference: meta?.reference ?? false,
                            expectDivergence: meta?.expectDivergence ?? false,
                            layout: variant.layout,
                            ...stats,
                            peakChars: peakChars[variant.name] ?? null,
                            heapBytes: heapBytes?.[variant.name] ?? null,
                            expected: fixture.expect,
                            actual,
                            falsePositives: outcome.falsePositives,
                            falseNegatives: outcome.falseNegatives,
                            correct: outcome.correct,
                            unexpected: outcome.unexpected,
                            preExisting: outcome.preExisting,
                            vsReference: outcome.delta,
                        };
                    }),
                };

                if (layoutCheck && facts.elements >= LAYOUT_CHECK_MIN_ELEMENTS && layoutCheck.ratio < MIN_LAYOUT_INVALIDATION_RATIO) {
                    layoutFailures.push(
                        `${browserName} / ${fixture.name}: forced layout cost ${layoutCheck.dirty.toFixed(4)}ms dirty against ` +
                            `${layoutCheck.clean.toFixed(4)}ms clean (${layoutCheck.ratio.toFixed(2)}x). Invalidation is not reaching ` +
                            `the boxes being measured, so every dirty timing here is measuring a warm page.`,
                    );
                }

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
 * Retained heap immediately after one sweep, per variant.
 *
 * READ THIS BEFORE USING THE NUMBER. `Runtime.getHeapUsage().usedSize` excludes V8's
 * large-object space, so any *single* allocation big enough to land there - a few hundred
 * kilobytes - is invisible to it. Measured on chromium:
 *
 * | allocation                    | reported |
 * |-------------------------------|----------|
 * | 40k x 100-char strings (4 MB) | 7.46 MB  |
 * | 16 x 256 KB strings (4 MB)    | 0.02 MB  |
 * | one 4 MB string               | 0.01 MB  |
 * | 100k small objects            | 2.49 MB  |
 *
 * So this column sees costs made of many small objects - an XPath node snapshot - and is
 * blind to costs made of one large buffer - a materialised page string. For a comparison
 * between a bounded-buffer strategy and one that materialises everything, that is exactly
 * backwards, and it will flatter the strategy using more memory.
 *
 * The obvious fix does not work: `HeapProfiler.startSampling` has the identical blind spot
 * at both 4 KB and 64 KB sampling intervals, so it is not worth reaching for. A real
 * `HeapProfiler.takeHeapSnapshot` does see more, and costs 13 seconds and 57 MB of
 * transfer per reading on a 20k-row page, which no benchmark can absorb.
 *
 * For materialised size use the `rendered` fixture fact (see `collectFacts`), which needs
 * no instrumentation and is available for the shipped implementation, or `peak buffer` for
 * variants that report it.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('./core/bundle.mjs').ResolvedVariant[]} variantList
 * @returns {Promise<Record<string, number | null>>}
 */
async function readMemory(page, variantList) {
    /** @type {Record<string, number | null>} */
    const out = {};
    const cdp = await page.context().newCDPSession(page);
    try {
        await cdp.send('HeapProfiler.enable');
        for (const variant of variantList) {
            await cdp.send('HeapProfiler.collectGarbage');
            const before = /** @type {any} */ (await cdp.send('Runtime.getHeapUsage'));
            await page.evaluate(singleSweep, {
                variantName: variant.name,
                detectors: variant.detectors,
                layout: variant.layout,
            });
            const after = /** @type {any} */ (await cdp.send('Runtime.getHeapUsage'));
            out[variant.name] = after.usedSize - before.usedSize;
        }
    } catch {
        // A memory reading is a nice-to-have; losing it should not lose the run.
        for (const variant of variantList) out[variant.name] = null;
    } finally {
        await cdp.detach().catch(() => {});
    }
    return out;
}

if (!checkOnly) {
    const scaling = formatScaling(reports);
    if (scaling) console.log(scaling);
}

// Accuracy before behaviour, because "how well did each variant do" is the question a
// comparison is run to answer, and the behaviour summary below refines it into "and was
// that this variant's doing".
const accuracy = formatAccuracy(reports);
if (accuracy) console.log(accuracy);

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

// A broken invalidation is worse than a slow run: every dirty timing silently becomes a
// warm one, and the table still looks plausible. Fail loudly rather than report it.
if (layoutFailures.length > 0) {
    console.log(
        [
            '',
            '='.repeat(60),
            `== ${layoutFailures.length} fixture(s) where dirty layout did not dirty anything`,
            '='.repeat(60),
            '',
            ...layoutFailures.map((f) => `  - ${f}`),
            '',
            '  Every `(dirty)` timing above is measuring a warm page. See `dirtyLayout` in layout.mjs.',
        ].join('\n'),
    );
}

const unexpectedBehaviour = reports.some((report) => report.variants.some((variant) => variant.unexpected));
process.exit(unexpectedBehaviour || layoutFailures.length > 0 ? 1 : 0);
