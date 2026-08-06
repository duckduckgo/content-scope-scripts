/**
 * Detector performance benchmark runner.
 *
 * Compares detector configurations and matching-algorithm variants against
 * generated DOMs, reporting timing and correctness together.
 *
 *   npm run bench-detectors -- --spec scripts/detector-bench/specs/xpath-gating.mjs
 *
 * See ../../../.agents/skills/detector-performance/SKILL.md
 */
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import minimist from 'minimist';
import { chromium } from '@playwright/test';
import { resolveVariants, injectedRoot } from './bundle.mjs';
import { collectFacts, benchmark } from './harness.mjs';
import { summarise, formatFixture, formatSummary } from './report.mjs';

/**
 * @typedef {object} Fixture
 * @property {string} name
 * @property {string} [html] - Body markup, for small fixtures
 * @property {(params: any) => void} [generate] - Runs in the page; use for anything sizeable
 * @property {any} [params] - Passed to `generate`, so one generator covers many sizes
 * @property {Record<string, boolean>} expect - Required: detector key -> expected match
 */

/**
 * @typedef {object} Spec
 * @property {Fixture[]} fixtures
 * @property {import('./bundle.mjs').Variant[]} variants
 * @property {Record<string, Record<string, object>>} [detectors] - Shared config for code variants
 * @property {number} [iterations]
 * @property {number} [warmup]
 * @property {number} [minBatchMs]
 */

const argv = minimist(process.argv.slice(2), {
    string: ['spec', 'json', 'filter'],
    boolean: ['help'],
    default: { minBatchMs: 2 },
});

if (argv.help || !argv.spec) {
    console.log(`
Detector performance benchmark

  --spec <path>       Spec module to run (required)
  --filter <text>     Only run fixtures whose name contains <text>
  --iterations <n>    Samples per variant per fixture (spec value, else 15)
  --warmup <n>        Untimed sweeps before measuring (spec value, else 3)
  --minBatchMs <n>    Minimum duration of one timed batch (default 2)
  --json <path>       Also write raw results as JSON

Exits non-zero if any variant's detection results differ from the fixture labels.
`);
    process.exit(argv.spec ? 0 : 1);
}

const specPath = path.resolve(process.cwd(), argv.spec);
/** @type {{ default: Spec }} */
const specModule = await import(pathToFileURL(specPath).href);
const spec = specModule.default;

const iterations = Number(argv.iterations ?? spec.iterations ?? 15);
const warmup = Number(argv.warmup ?? spec.warmup ?? 3);
const minBatchMs = Number(argv.minBatchMs ?? spec.minBatchMs ?? 2);

const fixtures = spec.fixtures.filter((f) => !argv.filter || f.name.includes(argv.filter));
if (fixtures.length === 0) {
    console.error(`No fixtures matched --filter "${argv.filter}"`);
    process.exit(1);
}

for (const fixture of fixtures) {
    if (!fixture.expect || Object.keys(fixture.expect).length === 0) {
        console.error(`Fixture "${fixture.name}" has no \`expect\` labels. Every fixture must state its expected result.`);
        process.exit(1);
    }
}

const { variants, cleanup } = await resolveVariants(spec.variants, spec.detectors, path.dirname(specPath));

console.log(`spec:       ${path.relative(injectedRoot, specPath)}`);
console.log(`fixtures:   ${fixtures.length}`);
console.log(`variants:   ${variants.map((v) => `${v.name} [${v.code.key}]`).join(', ')}`);
console.log(`sampling:   ${iterations} samples, ${warmup} warmup sweeps, >=${minBatchMs}ms per batch`);

const browserInstance = await chromium.launch();
/** @type {import('./report.mjs').FixtureReport[]} */
const reports = [];

try {
    for (const fixture of fixtures) {
        const page = await browserInstance.newPage();
        try {
            await page.setContent(`<!DOCTYPE html><html><body>${fixture.html ?? ''}</body></html>`);
            if (fixture.generate) {
                await page.evaluate(fixture.generate, fixture.params ?? {});
            }

            const facts = await page.evaluate(collectFacts);

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

            const { correctness, timings } = await page.evaluate(benchmark, {
                variantNames: variants.map((v) => v.name),
                detectorsByVariant: Object.fromEntries(variants.map((v) => [v.name, v.detectors])),
                iterations,
                warmup,
                minBatchMs,
            });

            reports.push({
                fixture: fixture.name,
                facts,
                variants: variants.map((variant) => {
                    const actual = correctness[variant.name];
                    const correct = Object.keys(fixture.expect).every((key) => actual[key] === fixture.expect[key]);
                    return {
                        name: variant.name,
                        baseline: variant.baseline,
                        ...summarise(timings[variant.name].samples),
                        correct,
                        expected: fixture.expect,
                        actual,
                    };
                }),
            });

            console.log(formatFixture(reports[reports.length - 1]));
        } finally {
            await page.close();
        }
    }
} finally {
    await browserInstance.close();
    cleanup();
}

console.log(formatSummary(reports));

if (argv.json) {
    const jsonPath = path.resolve(process.cwd(), argv.json);
    writeFileSync(jsonPath, JSON.stringify({ spec: specPath, iterations, warmup, minBatchMs, reports }, null, 2));
    console.log(`\nWrote ${jsonPath}`);
}

const failed = reports.some((report) => report.variants.some((variant) => !variant.correct));
process.exit(failed ? 1 : 0);
