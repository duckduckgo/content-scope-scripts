import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const CONFIG = './integration-test/test-pages/web-detection/config/config.json';

/*
 * Test detectors for the values JSDOM fakes in the unit tests: the performance timeline, fonts,
 * stylesheets and image load state. Without `triggers`, a detector runs for the breakage report.
 */

/** @param {string} field */
const navigation = (field) => ({ only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field } } });

const NAVIGATION_TIMING = {
    actions: [
        { define: { loadEventEnd: navigation('loadEventEnd'), elapsed: { api: { path: 'performance.now', args: [] } } } },
        {
            breakageReportData: {
                data: {
                    loadEventEnd: { value: { ref: 'loadEventEnd' } },
                    elapsed: { value: { ref: 'elapsed' } },
                    status: {
                        value: {
                            if: { api: { path: 'Reflect.has', args: [{ api: 'PerformanceResourceTiming.prototype' }, 'responseStatus'] } },
                            then: navigation('responseStatus'),
                            else: 'unsupported',
                        },
                    },
                    hiddenDuringLoad: {
                        value: {
                            if: { api: { path: 'PerformanceObserver.supportedEntryTypes.includes', args: ['visibility-state'] } },
                            then: {
                                api: {
                                    path: 'performance.getEntriesByName',
                                    args: ['hidden', 'visibility-state'],
                                    where: { startTime: { lt: { ref: 'loadEventEnd' } } },
                                },
                                using: 'length',
                                is: { gt: 0 },
                            },
                            else: 'unsupported',
                        },
                    },
                },
            },
        },
    ],
};

const FAILED_SHEETS = {
    api: { path: 'performance.getEntriesByType', args: ['resource'], where: { initiatorType: 'link', responseStatus: { gte: 400 } } },
    using: 'length',
};
const FAILED_FONTS = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };

const MISSING_STYLES = {
    match: {
        any: [
            { ...FAILED_SHEETS, is: { gt: 0 } },
            { ...FAILED_FONTS, is: { gt: 0 } },
        ],
    },
    actions: {
        breakageReportData: {
            data: {
                failedStylesheets: { value: FAILED_SHEETS },
                failedFontFaces: { value: FAILED_FONTS },
                unappliedStylesheets: {
                    value: { element: { selector: "link[rel~='stylesheet']", where: { sheet: { type: 'null' } } }, using: 'length' },
                },
            },
        },
    },
};

const BROKEN = { selector: 'img', where: { complete: true, naturalWidth: 0, 'currentSrc.length': { gt: 0 } } };

// The report doesn't run it, so its entry is the auto run's
const BROKEN_IMAGES = {
    triggers: { auto: { state: 'enabled', when: { intervalMs: [1000] } }, breakageReport: { state: 'disabled' } },
    match: { element: BROKEN, using: 'length', is: { gte: 1 } },
    actions: [
        {
            define: {
                visibleBroken: { element: { ...BROKEN, visibility: 'visible' }, using: 'length' },
                share: { div: [{ ref: 'visibleBroken' }, { element: { selector: 'img' }, using: 'length' }] },
            },
        },
        {
            breakageReportData: {
                data: {
                    broken: { value: { element: BROKEN, using: 'length' } },
                    visibleBroken: { value: { ref: 'visibleBroken' } },
                    share: { value: { ref: 'share' } },
                },
            },
        },
    ],
};

/**
 * Install the detectors, enabled, under the group `test`.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} projectUse
 * @param {Record<string, Record<string, any>>} detectors - by detector name
 * @param {{ fakeClock?: boolean }} [options] - the fake clock also replaces the performance timeline, so
 *   tests reading the timeline run on real timers
 */
async function setup(page, projectUse, detectors, { fakeClock = false } = {}) {
    const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
    /** @type {Record<string, Record<string, any>>} */
    const installed = {};
    for (const [name, detector] of Object.entries(detectors)) {
        installed[name] = { ...detector, state: 'enabled' };
    }
    config.features.webDetection.settings.detectors = { test: installed };

    const collector = ResultsCollector.create(page, projectUse);
    collector.withMockResponse({ webDetectionAutoRun: null, breakageReportResult: null });
    if (fakeClock) await page.clock.install();
    await collector.load('/web-detection/index.html', config);
    return collector;
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

test.describe('WebDetection browser reads', () => {
    test('reads the navigation timing of the page', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, { navigation: NAVIGATION_TIMING });
        await navigateTo(page, '/web-detection/pages/no-detection.html');
        await page.waitForFunction(() => {
            const entry = /** @type {PerformanceNavigationTiming | undefined} */ (performance.getEntriesByType('navigation')[0]);
            return (entry?.loadEventEnd ?? 0) > 0;
        });

        const [entry, ...rest] = await breakageReport(collector);
        expect(rest).toEqual([]);
        expect(entry).toEqual({
            detectorId: 'test.navigation',
            data: {
                loadEventEnd: expect.any(Number),
                elapsed: expect.any(Number),
                status: expect.anything(),
                hiddenDuringLoad: expect.anything(),
            },
        });
        expect(entry.data.loadEventEnd).toBeGreaterThan(0);
        expect(entry.data.elapsed).toBeGreaterThanOrEqual(entry.data.loadEventEnd);
        const responseStatus = await page.evaluate(() => 'responseStatus' in PerformanceResourceTiming.prototype);
        expect(entry.data.status).toBe(responseStatus ? 200 : 'unsupported');
        const visibilityEntries = await page.evaluate(() => PerformanceObserver.supportedEntryTypes.includes('visibility-state'));
        expect(entry.data.hiddenDuringLoad).toBe(visibilityEntries ? false : 'unsupported');
    });

    test('reads a failed stylesheet and font', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, { styles: MISSING_STYLES });
        await navigateTo(page, '/web-detection/pages/browser-reads-styles-missing.html');
        await page.waitForFunction(() => [...document.fonts].some((face) => face.status === 'error'));

        expect(await breakageReport(collector)).toEqual([
            {
                detectorId: 'test.styles',
                detected: true,
                data: { failedStylesheets: 1, failedFontFaces: 1, unappliedStylesheets: 1 },
            },
        ]);
    });

    test('reports the broken images an auto run read, counting the visible ones', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use, { images: BROKEN_IMAGES }, { fakeClock: true });
        await navigateTo(page, '/web-detection/pages/browser-reads-broken-images.html');
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));
        await page.clock.fastForward(1000);

        expect(await breakageReport(collector)).toEqual([
            { detectorId: 'test.images', detected: true, data: { broken: 3, visibleBroken: 2, share: 0.4 } },
        ]);
    });
});
