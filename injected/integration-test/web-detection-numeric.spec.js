import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const CONFIG = './integration-test/test-pages/web-detection/config/config.json';

/**
 * The numeric detectors as privacy-configuration/features/web-detection.json defines them, keyed by
 * group then detector. Kept out of `config/`, whose files are validated against the published
 * privacy-configuration schema, which predates expressions.
 *
 * @type {Record<string, Record<string, any>>}
 */
const DETECTORS = JSON.parse(readFileSync('./integration-test/test-pages/web-detection/numeric/detectors.json', 'utf8'));

/**
 * The detectors ship disabled; each test enables the ones it reads. `match` and `actions` are used
 * as configured, and `triggers` too unless a test overrides them.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} projectUse
 * @param {Array<[string, string]>} detectors - `[group, detector]` pairs
 * @param {(detector: Record<string, any>, id: string) => void} [modify]
 * @param {{ fakeClock?: boolean }} [options] - the fake clock also replaces the performance timeline, so
 *   tests reading the timeline run on real timers
 */
async function setup(page, projectUse, detectors, modify, { fakeClock = true } = {}) {
    const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
    config.features.webEvents = { state: 'enabled', hash: 'test', exceptions: [] };
    /** @type {Record<string, Record<string, any>>} */
    const installed = {};
    for (const [group, id] of detectors) {
        const detector = structuredClone(DETECTORS[group]?.[id]);
        if (!detector) throw new Error(`no detector ${group}.${id}`);
        detector.state = 'enabled';
        modify?.(detector, `${group}.${id}`);
        installed[group] ??= {};
        installed[group][id] = detector;
    }
    config.features.webDetection.settings.detectors = installed;

    const collector = ResultsCollector.create(page, projectUse);
    collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
    if (fakeClock) await page.clock.install();
    await collector.load('/web-detection/index.html', config);
    return collector;
}

/**
 * Run a detector shortly after load on real timers.
 *
 * @param {Record<string, any>} detector
 */
function runSoon(detector) {
    detector.triggers.auto.when.intervalMs = [300];
}

/**
 * Wait on real timers for the detectors to have run.
 *
 * @param {ResultsCollector} collector
 * @param {number} count - auto-run notifications to wait for
 */
async function waitForRuns(collector, count) {
    await expect.poll(async () => (await notifications(collector, 'webDetectionAutoRun')).length).toBeGreaterThanOrEqual(count);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} pagePath
 */
async function navigateTo(page, pagePath) {
    await page.evaluate((targetUrl) => {
        window.location.href = targetUrl;
    }, pagePath);
    await page.waitForURL(`**${pagePath}`);
}

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 * @returns {Promise<Array<Record<string, any>>>}
 */
async function notifications(collector, method) {
    const calls = await collector.outgoingMessages();
    return calls
        .map((c) => /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (c.payload))
        .filter((payload) => payload.method === method)
        .map((payload) => /** @type {Record<string, any>} */ (payload.params));
}

/**
 * Request a breakage report and return its `webDetection` results.
 *
 * @param {ResultsCollector} collector
 * @returns {Promise<Array<Record<string, any>>>}
 */
async function breakageReport(collector) {
    await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
    const [reportCall] = await collector.waitForMessage('breakageReportResult');
    const params = /** @type {Record<string, any>} */ (reportCall.payload).params;
    if (!params.breakageData) return [];
    return JSON.parse(decodeURIComponent(String(params.breakageData))).webDetection ?? [];
}

test.describe('WebDetection numeric detectors', () => {
    test('imageBreakage.broken_images reports the count and share of broken images', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, [['imageBreakage', 'broken_images']]);
        await navigateTo(page, '/web-detection/pages/numeric-broken-images.html');
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));
        await page.clock.fastForward(5000);

        const events = await notifications(collector, 'webEvent');
        expect(events).toEqual([{ type: 'brokenImages', data: { brokenImages: '2-4', brokenShare: '50-90' } }]);
        const runs = await notifications(collector, 'webDetectionAutoRun');
        expect(runs[0]).toEqual(
            expect.objectContaining({ detectorId: 'imageBreakage.broken_images', detected: true, measured: { brokenImages: 2 } }),
        );
    });

    test('imageBreakage.broken_images does not fire on a page whose images loaded', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, [['imageBreakage', 'broken_images']]);
        await navigateTo(page, '/web-detection/pages/numeric-clean.html');
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));
        await page.clock.fastForward(5000);

        expect(await notifications(collector, 'webEvent')).toEqual([]);
    });

    test('styleBreakage.missing_styles_or_fonts reports a failed stylesheet and font', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, [['styleBreakage', 'missing_styles_or_fonts']], runSoon, {
            fakeClock: false,
        });
        await navigateTo(page, '/web-detection/pages/numeric-styles-missing.html');
        await page.waitForFunction(() => [...document.fonts].some((face) => face.status === 'error'));
        await waitForRuns(collector, 1);

        const events = await notifications(collector, 'webEvent');
        expect(events).toEqual([{ type: 'stylesMissing', data: { failedStylesheets: '1', failedFontFaces: '1' } }]);
    });

    test('errorPage.soft404_phrases_count counts error phrases in rendered text only', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, [['errorPage', 'soft404_phrases_count']]);
        await navigateTo(page, '/web-detection/pages/numeric-error-text.html');
        await page.clock.fastForward(1000);

        const events = await notifications(collector, 'webEvent');
        expect(events).toEqual([{ type: 'errorPhraseCount', data: { keywordCount: '2-4' } }]);
    });

    test('errorPage.soft404_features reports an error page served with little text for its bytes', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, [['errorPage', 'soft404_features']], runSoon, { fakeClock: false });
        await navigateTo(page, '/web-detection/pages/numeric-soft404.html');
        await waitForRuns(collector, 1);

        const events = await notifications(collector, 'webEvent');
        expect(events).toEqual([{ type: 'soft404Features', data: { contentByteRatio: '0-0.05', keywordCount: '5-9' } }]);
    });

    test('errorPage.soft404_features does not fire on a working page', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, [['errorPage', 'soft404_features']], runSoon, { fakeClock: false });
        await navigateTo(page, '/web-detection/pages/numeric-clean.html');
        await page.waitForTimeout(600);

        expect(await notifications(collector, 'webEvent')).toEqual([]);
    });

    test('regionBreakage.comments_empty reports an empty region and whether its images broke', async ({ page }, testInfo) => {
        // The shipped detector names one site; run it on the test page
        const onAnyPage = (/** @type {Record<string, any>} */ detector) => {
            detector.triggers.breakageReport.runConditions = { context: { top: true } };
        };
        const collector = await setup(page, testInfo.project.use, [['regionBreakage', 'comments_empty']], onAnyPage);
        await navigateTo(page, '/web-detection/pages/numeric-region-empty.html');
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));

        expect(await breakageReport(collector)).toEqual([
            { detectorId: 'regionBreakage.comments_empty', detected: true, data: { brokenImages: '1+' } },
        ]);
        expect(await notifications(collector, 'webEvent')).toEqual([]);
    });

    test('regionBreakage.comments_empty does not match a filled region', async ({ page }, testInfo) => {
        const onAnyPage = (/** @type {Record<string, any>} */ detector) => {
            detector.triggers.breakageReport.runConditions = { context: { top: true } };
        };
        const collector = await setup(page, testInfo.project.use, [['regionBreakage', 'comments_empty']], onAnyPage);
        await navigateTo(page, '/web-detection/pages/numeric-region-filled.html');

        expect(await breakageReport(collector)).toEqual([]);
    });

    test('pageLoad.load_time reports the load time bucketed, and slow_load does not fire on a fast page', async ({ page }, testInfo) => {
        const collector = await setup(
            page,
            testInfo.project.use,
            [
                ['pageLoad', 'load_time'],
                ['pageLoad', 'slow_load'],
            ],
            runSoon,
            { fakeClock: false },
        );
        await navigateTo(page, '/web-detection/pages/numeric-clean.html');
        await waitForRuns(collector, 1);

        const events = await notifications(collector, 'webEvent');
        expect(events).toEqual([{ type: 'pageLoadTime', data: { loadEventEnd: '0-3s' } }]);
        const runs = await notifications(collector, 'webDetectionAutoRun');
        expect(runs.map((r) => r.detectorId)).toEqual(['pageLoad.load_time']);
    });
});
