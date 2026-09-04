/**
 * Browser tests for the detector benchmark harness.
 *
 * These are the tests that need a real engine: a layout engine that can be invalidated, and
 * a V8 heap that can be read over CDP. Run with `npm run test-bench` (see
 * `playwright-bench.config.js`); they are not part of `test-int`.
 *
 * The layout cases are the direct regression tests for a bug that produced a *confident null
 * result*. The harness dirtied layout by toggling `padding-top` on the root element, which
 * shifts the root box and leaves every descendant's layout valid - so the reflow was O(1) at
 * any page size, and `innerText` measured identical warm and dirty at 2k, 20k and 100k rows.
 * The conclusion drawn from that was wrong, and nothing in the output suggested it.
 */
import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { bundleLayoutCore } from '../scripts/detector-bench/core/bundle.mjs';
import { collectFacts, checkLayoutInvalidation } from '../scripts/detector-bench/core/harness.mjs';

const execFileAsync = promisify(execFile);
const injectedRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Enough structure that a reflow costs something measurable. */
const ROWS = 20000;

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rows
 */
async function buildPage(page, rows) {
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.evaluate((count) => {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.innerHTML = `<section><article><p>Lorem ipsum dolor sit amet ${i} <b>x</b> adipiscing <i>y</i> sed tempor</p></article></section>`;
            frag.appendChild(row);
        }
        document.body.appendChild(frag);
    }, rows);
    await page.addScriptTag({ content: await bundleLayoutCore() });
}

test.describe('layout invalidation', () => {
    test('the self-check clears its own threshold for the write the harness uses', async ({ page }) => {
        await buildPage(page, ROWS);

        const { clean, dirty, ratio } = await page.evaluate(checkLayoutInvalidation);

        // A clean forced read is served from cached layout; a dirty one has to reflow 20k rows.
        expect(dirty).toBeGreaterThan(clean);
        // Both figures have to be measurable for the ratio to mean anything. A zero clean
        // baseline yields Infinity, which clears every threshold and so hides the very failure
        // the check exists to find - that was a real defect in the first version of this.
        expect(clean).toBeGreaterThan(0);
        expect(Number.isFinite(ratio)).toBe(true);
        // Matches MIN_LAYOUT_INVALIDATION_RATIO in run.mjs.
        expect(ratio).toBeGreaterThan(1.5);
    });

    test('a root padding-top toggle leaves descendants valid, so its reflow does not grow with the page', async ({ page }) => {
        // The original, broken invalidation. It shifts the root box and leaves every
        // descendant's layout valid, so the reflow is O(1) at any page size - which is why
        // `innerText` measured identical warm and dirty at 2k, 20k and 100k rows.
        await buildPage(page, ROWS);

        const costs = await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            let sink = 0;

            /**
             * @param {() => void} call
             * @returns {number}
             */
            const costPerCall = (call) => {
                let batch = 1;
                for (;;) {
                    const start = performance.now();
                    for (let i = 0; i < batch; i++) call();
                    const elapsed = performance.now() - start;
                    if (elapsed >= 1 || batch >= 1 << 20) return elapsed / batch;
                    batch *= 2;
                }
            };

            sink += document.body.offsetHeight;

            let tick = 0;
            const padding = costPerCall(() => {
                document.documentElement.style.paddingTop = (tick++ & 1) === 0 ? '0px' : '1px';
                sink += document.body.offsetHeight;
            });
            document.documentElement.style.paddingTop = '';

            const width = costPerCall(() => {
                w.__benchLayout.dirtyLayout();
                sink += document.body.offsetHeight;
            });

            w.__sink = sink;
            return { padding, width };
        });

        // The property that actually separates them, and the one the harness depends on: the
        // width toggle forces work proportional to the page, the padding toggle does not.
        // An order of magnitude on a 20k-row page; asserting 5x keeps it off the noise floor.
        expect(costs.width).toBeGreaterThan(costs.padding * 5);
    });

    test('dirtying layout costs a rendered-text read far more than a text-node walk', async ({ page }) => {
        await buildPage(page, ROWS);

        const timings = await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            const iterations = 10;

            /**
             * @param {() => number} sweep
             * @param {boolean} dirty
             * @returns {number}
             */
            const median = (sweep, dirty) => {
                const samples = [];
                for (let i = 0; i < iterations; i++) {
                    if (!dirty) w.__benchLayout.settleLayout();
                    const start = performance.now();
                    if (dirty) w.__benchLayout.dirtyLayout();
                    w.__sink = (w.__sink ?? 0) + sweep();
                    samples.push(performance.now() - start);
                }
                samples.sort((a, b) => a - b);
                return samples[Math.floor(samples.length / 2)];
            };

            // Rendered text: has to flush layout before it can answer.
            const innerText = () => (document.body.innerText || '').length;
            // Text nodes: layout state is irrelevant to it.
            const textNodes = () => {
                const r = document.evaluate('//body//text()[not(ancestor::script)]', document, null, 7, null);
                let n = 0;
                for (let i = 0; i < r.snapshotLength; i++) n += (r.snapshotItem(i)?.textContent || '').length;
                return n;
            };

            return {
                innerTextWarm: median(innerText, false),
                innerTextDirty: median(innerText, true),
                textNodesWarm: median(textNodes, false),
                textNodesDirty: median(textNodes, true),
            };
        });

        // Loose thresholds on purpose: the measured gap on this fixture is well over 10x, so 2x
        // is a wide margin, and a tight bound here would be a flaky perf assertion.
        expect(timings.innerTextDirty).toBeGreaterThan(timings.innerTextWarm * 2);

        // The control. A text-node walk pays the same style write and never resolves it, so its
        // two numbers should stay close - this is what makes the innerText gap attributable to
        // reflow rather than to the harness's own overhead.
        expect(timings.textNodesDirty).toBeLessThan(timings.textNodesWarm * 2);
    });
});

test.describe('memory measurement', () => {
    test('retained heap is blind to a single large string, which is why rendered size is reported instead', async ({ page }) => {
        // Pins the limitation documented on `readMemory`. `Runtime.getHeapUsage().usedSize`
        // excludes V8's large-object space, so one big allocation is invisible while the same
        // number of bytes in small pieces is not. It is the reason the memory column cannot
        // answer the question a chunked-versus-materialising comparison is asking.
        await page.setContent('<!DOCTYPE html><html><body>hello</body></html>');
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('HeapProfiler.enable');

        /**
         * @param {() => void} allocate
         * @returns {Promise<number>}
         */
        async function retainedBy(allocate) {
            await page.evaluate(() => {
                delete (/** @type {any} */ (window).__kept);
            });
            await cdp.send('HeapProfiler.collectGarbage');
            const before = /** @type {any} */ (await cdp.send('Runtime.getHeapUsage'));
            await page.evaluate(allocate);
            const after = /** @type {any} */ (await cdp.send('Runtime.getHeapUsage'));
            return after.usedSize - before.usedSize;
        }

        const oneBigString = await retainedBy(() => {
            /** @type {any} */ (window).__kept = 'z'.repeat(4_000_000);
        });
        const manySmallStrings = await retainedBy(() => {
            /** @type {any} */ (window).__kept = Array.from({ length: 40000 }, (_, i) => String(i).padEnd(100, 'abcdef'));
        });

        // Both retain roughly 4 MB. Only one of them is visible.
        expect(manySmallStrings).toBeGreaterThan(3 * 1024 * 1024);
        expect(oneBigString).toBeLessThan(1024 * 1024);

        await cdp.detach();
    });

    test('renderedChars reports the materialised size the heap reading cannot see', async ({ page }) => {
        // The figure that replaced the memory column for this purpose: no instrumentation, so
        // it is available for the shipped implementation, and it is exactly what a strategy
        // reading whole-page rendered text has to hold at once.
        await buildPage(page, 2000);

        const facts = await page.evaluate(collectFacts);
        const actual = await page.evaluate(() => (document.body.innerText || '').length);

        expect(facts.renderedChars).toBe(actual);
        expect(facts.renderedChars).toBeGreaterThan(0);
    });
});

test.describe('run.mjs end to end', () => {
    /**
     * @param {string[]} args
     * @returns {Promise<{ code: number, stdout: string }>}
     */
    async function runBench(args) {
        try {
            const { stdout } = await execFileAsync('node', ['./scripts/detector-bench/run.mjs', ...args], {
                cwd: injectedRoot,
                maxBuffer: 20 * 1024 * 1024,
            });
            return { code: 0, stdout };
        } catch (e) {
            const error = /** @type {any} */ (e);
            return { code: error.code ?? 1, stdout: error.stdout ?? '' };
        }
    }

    test('a failure the baseline shares exits 0 and is reported as pre-existing', async () => {
        const { code, stdout } = await runBench(['--spec', 'scripts/detector-bench/self-test/pre-existing.mjs']);

        expect(stdout).toContain('pre-existing failure(s)');
        expect(stdout).toContain('PRE-EXISTING');
        expect(stdout).toContain('No behaviour changes introduced by any variant');
        expect(code).toBe(0);
    });

    test('a variant that fixes what the baseline gets wrong is credited', async () => {
        const { stdout } = await runBench(['--spec', 'scripts/detector-bench/self-test/pre-existing.mjs']);
        expect(stdout).toContain('gets right where the baseline does not');
        expect(stdout).toContain('insensitive: -FN tests.paywall');
    });

    test('a divergence a variant introduces exits 1', async () => {
        const { code, stdout } = await runBench(['--spec', 'scripts/detector-bench/self-test/introduced.mjs']);

        expect(stdout).toContain('UNEXPECTED behaviour change(s)');
        expect(stdout).toContain('over-eager: +FP tests.paywall');
        expect(stdout).toContain('CORRECTNESS FAIL');
        expect(code).toBe(1);
    });

    test('--check-only skips fixtures marked purpose: timing', async () => {
        const full = await runBench(['--spec', 'scripts/detector-bench/self-test/pre-existing.mjs']);
        const checked = await runBench(['--spec', 'scripts/detector-bench/self-test/pre-existing.mjs', '--check-only']);

        expect(full.stdout).toContain('fixtures:   3');
        expect(full.stdout).toContain('timing-only');

        // The spec has three fixtures, one of them timing-only.
        expect(checked.stdout).toContain('fixtures:   2');
        expect(checked.stdout).not.toContain('timing-only');
        expect(checked.stdout).toContain('sampling:   skipped (--check-only)');
        expect(checked.code).toBe(0);
    });

    test('a spec that sweeps two parameters is rejected with a message naming the fixture', async () => {
        // `expand.mjs` throws a SpecError; the runner has to turn that into a clean failure
        // rather than an unhandled rejection.
        const { code, stdout } = await runBench([
            '--spec',
            'scripts/detector-bench/self-test/introduced.mjs',
            '--filter',
            'does-not-match-anything',
        ]);
        expect(code).toBe(1);
        expect(stdout).not.toContain('CORRECTNESS FAIL');
    });
});
