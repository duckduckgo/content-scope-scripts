import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const BASE_CONFIG = './integration-test/test-pages/web-detection/config/config.json';

/**
 * Build a config enabling detectorPerf alongside the detector-hosting features.
 * Reuses the web-detection test config (auto-run detectors and breakage-report
 * detectors) so both wrapped call paths are exercised.
 */
function buildConfig() {
    const config = JSON.parse(readFileSync(BASE_CONFIG, 'utf8'));
    config.features.webEvents = { state: 'enabled', hash: 'test', exceptions: [] };
    config.features.detectorPerf = {
        state: 'enabled',
        hash: 'test',
        exceptions: [],
        settings: {
            defaults: {
                singleRunThresholdsMs: [8, 16, 50, 150],
                totalPerPageThresholdsMs: [50, 100, 250],
            },
            combinedThresholdsMs: [100, 250, 500],
            detectorOverrides: {},
        },
    };
    // Empty interferenceTypes settings object: breakageReporting reads this via
    // getFeatureSetting and runs the bot/fraud/adwall utils with their defaults.
    config.features.webInterferenceDetection = {
        state: 'enabled',
        hash: 'test',
        exceptions: [],
        settings: { interferenceTypes: {} },
    };
    return config;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} projectUse
 */
async function setup(page, projectUse) {
    const collector = ResultsCollector.create(page, projectUse);
    collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
    await page.clock.install();
    await collector.load('/web-detection/index.html', buildConfig());
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
 * Simulate the page being hidden (tab switch / backgrounded), which triggers
 * the detectorPerf flush.
 * @param {import('@playwright/test').Page} page
 */
async function hidePage(page) {
    await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
    });
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function showPage(page) {
    await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
    });
}

/**
 * Collect the detectorPerf event types sent through webEvents so far.
 * @param {ResultsCollector} collector
 * @returns {Promise<string[]>}
 */
async function getDetectorPerfEvents(collector) {
    const calls = await collector.outgoingMessages();
    return calls
        .map((c) => /** @type {import('../../messaging/index.js').NotificationMessage} */ (c.payload))
        .filter((payload) => payload.method === 'webEvent' && String(payload.params?.type).startsWith('detectorPerf_'))
        .map((payload) => String(payload.params?.type));
}

test.describe('DetectorPerf Feature', () => {
    test('auto-run webDetection scans are timed and flushed on hidden, once per page', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        // Trigger the auto-run scans (configured at 100ms and 300ms intervals)
        await page.clock.fastForward(300);

        // Nothing is emitted per detector run
        expect(await getDetectorPerfEvents(collector)).toEqual([]);

        await hidePage(page);

        const events = await getDetectorPerfEvents(collector);
        expect(events).toContain('detectorPerf_measured');
        // Config-driven detectors are attributed to the pooled webDetection label
        expect(events).toContain('detectorPerf_webDetection_ran');

        // Repeated hidden/visible cycles (bfcache-style) must not re-emit
        await showPage(page);
        await hidePage(page);
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

        const eventsAfterCycles = await getDetectorPerfEvents(collector);
        expect(eventsAfterCycles).toEqual(events);
        const counts = new Map();
        for (const type of eventsAfterCycles) {
            counts.set(type, (counts.get(type) ?? 0) + 1);
        }
        for (const [type, count] of counts) {
            expect(count, `event ${type} must be emitted at most once per page`).toBe(1);
        }
    });

    test('on-demand detectors via the breakage-report path are timed per detector', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/no-detection.html');

        // Native requests a breakage report: runs bot/fraud/adwall utils and
        // the webDetection breakageReport trigger
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');

        // Still nothing before the page is hidden
        expect(await getDetectorPerfEvents(collector)).toEqual([]);

        await hidePage(page);

        const events = await getDetectorPerfEvents(collector);
        expect(events).toContain('detectorPerf_measured');
        expect(events).toContain('detectorPerf_bot_ran');
        expect(events).toContain('detectorPerf_fraud_ran');
        expect(events).toContain('detectorPerf_adwall_ran');
        expect(events).toContain('detectorPerf_webDetection_ran');
        // The YouTube detector is excluded from detectorPerf entirely
        expect(events.filter((type) => type.includes('youtube'))).toEqual([]);
    });

    test('measurement leaves no page-observable performance timeline entries', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        await page.clock.fastForward(300);
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        await hidePage(page);

        const timelineEntries = await page.evaluate(() => {
            return performance
                .getEntriesByType('mark')
                .concat(performance.getEntriesByType('measure'))
                .map((entry) => entry.name)
                .filter((name) => name.toLowerCase().includes('detector'));
        });
        expect(timelineEntries).toEqual([]);
    });

    test('emits only measured when the feature is enabled but no detector runs', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/no-detection.html');

        await hidePage(page);

        const events = await getDetectorPerfEvents(collector);
        expect(events).toEqual(['detectorPerf_measured']);
    });

    test('emits nothing when the detectorPerf feature is disabled', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null });
        await page.clock.install();
        const config = buildConfig();
        config.features.detectorPerf.state = 'disabled';
        await collector.load('/web-detection/index.html', config);
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        await page.clock.fastForward(300);
        await hidePage(page);

        expect(await getDetectorPerfEvents(collector)).toEqual([]);
    });
});
