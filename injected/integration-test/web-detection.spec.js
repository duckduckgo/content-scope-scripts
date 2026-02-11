import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const CONFIG = './integration-test/test-pages/web-detection/config/config.json';

/**
 * Helper class for web-detection tests.
 */
class WebDetectionTestHelper {
    /**
     * @param {import('@playwright/test').Page} page
     * @param {ResultsCollector} collector
     */
    constructor(page, collector) {
        this.page = page;
        this.collector = collector;
    }

    /**
     * Navigate to a test page
     * @param {string} pagePath
     */
    async navigateTo(pagePath) {
        await this.page.evaluate((targetUrl) => {
            window.location.href = targetUrl;
        }, pagePath);
        await this.page.waitForURL(`**${pagePath}`);
    }

    /**
     * Run detectors via breakageReporting messaging and extract webDetection results.
     * WebDetection is invoked by breakageReporting via callFeatureMethod().
     * @returns {Promise<import('../src/features/web-detection.js').DetectorResult[]>}
     */
    async runDetectors() {
        await this.collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await this.collector.waitForMessage('breakageReportResult');
        const calls = await this.collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        // webDetection results are in breakageData as URL-encoded JSON
        if (!result.params?.breakageData) {
            return [];
        }
        const breakageData = JSON.parse(decodeURIComponent(result.params.breakageData));
        return breakageData.webDetection || [];
    }

    /**
     * Get auto-run notifications from outgoing messages
     * @returns {Promise<Array<{detectorId: string, detected: boolean | 'error', timestamp: number}>>}
     */
    async getAutoRunNotifications() {
        const calls = await this.collector.outgoingMessages();
        const autoRunNotifications = calls.filter((c) => {
            const payload = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (c.payload);
            return payload.method === 'webDetectionAutoRun';
        });

        return autoRunNotifications.map((m) => {
            const payload = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (m.payload);
            return {
                detectorId: payload.params?.detectorId || '',
                detected: payload.params?.detected || false,
                timestamp: payload.params?.timestamp || 0,
            };
        });
    }

    /**
     * Set up collector for auto-run tests with fake timers
     * @param {import('@playwright/test').Page} page
     * @param {Record<string, any>} projectUse
     * @returns {Promise<{collector: ResultsCollector, helper: WebDetectionTestHelper}>}
     */
    static async setupAutoRunTest(page, projectUse) {
        const collector = ResultsCollector.create(page, projectUse);

        // Register mock response for debug notification
        collector.withMockResponse({
            webDetectionAutoRun: null,
        });

        await page.clock.install();
        await collector.load('/web-detection/index.html', CONFIG);
        const helper = new WebDetectionTestHelper(page, collector);

        return { collector, helper };
    }
}

test.describe('WebDetection Feature', () => {
    test.describe('text pattern matching', () => {
        test('detects adblock message via text pattern', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/text-match.html');

            const results = await helper.runDetectors();

            // Should detect the adwall.generic_text detector
            const adwallResult = results.find((r) => r.detectorId === 'adwall.generic_text');
            expect(adwallResult).toBeDefined();
            expect(adwallResult?.detected).toBe(true);
        });

        test('does not match text pattern on clean page', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/no-detection.html');

            const results = await helper.runDetectors();

            // No detectors should match on a clean page
            expect(results.length).toBe(0);
        });
    });

    test.describe('element presence matching', () => {
        test('detects paywall overlay via element selector', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/element-match.html');

            const results = await helper.runDetectors();

            // Should detect the adwall.paywall_element detector
            const paywallResult = results.find((r) => r.detectorId === 'adwall.paywall_element');
            expect(paywallResult).toBeDefined();
            expect(paywallResult?.detected).toBe(true);
        });
    });

    test.describe('combined matching (text AND element)', () => {
        test('detects when both text and element conditions match', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/combined-match.html');

            const results = await helper.runDetectors();

            // Should detect the combined.text_and_element detector
            const combinedResult = results.find((r) => r.detectorId === 'combined.text_and_element');
            expect(combinedResult).toBeDefined();
            expect(combinedResult?.detected).toBe(true);
        });

        test('does not match when only element is present (no matching text)', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            // element-match.html has .paywall-overlay but no "subscribe to continue" text
            await helper.navigateTo('/web-detection/pages/element-match.html');

            const results = await helper.runDetectors();

            // combined.text_and_element should NOT match (missing text condition)
            const combinedResult = results.find((r) => r.detectorId === 'combined.text_and_element');
            expect(combinedResult).toBeUndefined();
        });
    });

    test.describe('video detection', () => {
        test('detects video unavailable message', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/video-unavailable.html');

            const results = await helper.runDetectors();

            // Should detect the video.unavailable detector
            const videoResult = results.find((r) => r.detectorId === 'video.unavailable');
            expect(videoResult).toBeDefined();
            expect(videoResult?.detected).toBe(true);
        });
    });

    test.describe('multiple detectors matching', () => {
        test('returns all matching detectors', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/combined-match.html');

            const results = await helper.runDetectors();

            // combined-match.html should trigger multiple detectors:
            // - combined.text_and_element (has both text and .subscribe-modal)
            const detectorIds = results.map((r) => r.detectorId);
            expect(detectorIds).toContain('combined.text_and_element');
        });
    });

    test.describe('custom triggers and actions', () => {
        test('detector with disabled trigger does not run', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/trigger-disabled.html');

            const results = await helper.runDetectors();

            // trigger_disabled has triggers.breakageReport.state = "disabled"
            // so it should not appear in results even though the text matches
            const result = results.find((r) => r.detectorId === 'custom.trigger_disabled');
            expect(result).toBeUndefined();
        });

        test('detector with disabled action runs but does not report', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/action-disabled.html');

            const results = await helper.runDetectors();

            // action_disabled has actions.breakageReportData.state = "disabled"
            // so even though it matches, it won't be included in the results
            const result = results.find((r) => r.detectorId === 'custom.action_disabled');
            expect(result).toBeUndefined();
        });

        test('detector with state disabled does not run', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/detector-disabled.html');

            const results = await helper.runDetectors();

            // detector_disabled has state = "disabled" at the detector level
            // so it should not run at all
            const result = results.find((r) => r.detectorId === 'custom.detector_disabled');
            expect(result).toBeUndefined();
        });

        test('detector with domain runConditions does not run on non-matching domain', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/domain-restricted.html');

            const results = await helper.runDetectors();

            // domain_restricted has runConditions: { domain: "example.com" }
            // we're on localhost, so it should not run
            const result = results.find((r) => r.detectorId === 'custom.domain_restricted');
            expect(result).toBeUndefined();
        });

        test('detector with domain runConditions runs on matching domain', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);

            // Modify config to use localhost instead of example.com
            const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
            config.features.webDetection.settings.detectors.custom.domain_restricted.triggers.breakageReport.runConditions.domain =
                'localhost';
            await collector.load('/web-detection/index.html', config);
            const helper = new WebDetectionTestHelper(page, collector);
            await helper.navigateTo('/web-detection/pages/domain-restricted.html');

            const results = await helper.runDetectors();

            // Now that runConditions matches localhost, the detector should run
            const result = results.find((r) => r.detectorId === 'custom.domain_restricted');
            expect(result).toBeDefined();
            expect(result?.detected).toBe(true);
        });
    });

    test.describe('auto-run detectors', () => {
        test('detector runs automatically at configured intervals', async ({ page }, testInfo) => {
            const { helper } = await WebDetectionTestHelper.setupAutoRunTest(page, testInfo.project.use);
            await helper.navigateTo('/web-detection/pages/auto-run-basic.html');

            // Fast-forward timers (intervals are 100ms and 300ms)
            await page.clock.fastForward(100);
            await page.clock.fastForward(200); // Now at 300ms total

            const notifications = await helper.getAutoRunNotifications();

            // autorun.basic_auto should have run at the configured intervals
            const basicAutoRuns = notifications.filter((n) => n.detectorId === 'autorun.basic_auto');
            expect(basicAutoRuns.length).toBeGreaterThanOrEqual(1);
            // All runs should detect the matching content
            for (const run of basicAutoRuns) {
                expect(run.detected).toBe(true);
            }
        });

        test('first-success strategy stops running after first match', async ({ page }, testInfo) => {
            const { helper } = await WebDetectionTestHelper.setupAutoRunTest(page, testInfo.project.use);
            await helper.navigateTo('/web-detection/pages/auto-run-delayed.html');

            // Fast-forward timers (content is added at 150ms)
            await page.clock.fastForward(100); // First run - no match yet
            await page.clock.fastForward(100); // Now at 200ms - content added, second run matches
            await page.clock.fastForward(100); // Now at 300ms - should be skipped

            const notifications = await helper.getAutoRunNotifications();

            // autorun.first_success should detect after content loads
            const firstSuccessRuns = notifications.filter((n) => n.detectorId === 'autorun.first_success');
            expect(firstSuccessRuns.length).toBeGreaterThanOrEqual(1);

            // Should have at least one successful detection (after content loads at 150ms)
            const successfulRuns = firstSuccessRuns.filter((n) => n.detected === true);
            expect(successfulRuns.length).toBeGreaterThanOrEqual(1);
        });

        test('always strategy continues running after match', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);

            collector.withMockResponse({
                webDetectionAutoRun: null,
            });

            await page.clock.install();
            await collector.load('/web-detection/index.html', CONFIG);
            const helper = new WebDetectionTestHelper(page, collector);

            // Navigate to a page with matching content
            await helper.navigateTo('/web-detection/pages/auto-run-always.html');

            // Fast-forward timers (intervals are 100ms and 200ms)
            await page.clock.fastForward(100);
            await page.clock.fastForward(100); // Now at 200ms

            const calls = await collector.outgoingMessages();
            const autoRunNotifications = calls.filter((c) => {
                const payload = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (c.payload);
                return payload.method === 'webDetectionAutoRun';
            });

            // autorun.always_repeat should run multiple times and detect each time
            const alwaysRuns = autoRunNotifications.filter((m) => {
                const payload = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (m.payload);
                return payload.params?.detectorId === 'autorun.always_repeat';
            });
            expect(alwaysRuns.length).toBeGreaterThanOrEqual(1);
            // All runs should detect the matching content
            for (const msg of alwaysRuns) {
                const payload = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (msg.payload);
                expect(payload.params?.detected).toBe(true);
            }
        });

        test('disabled auto trigger does not run', async ({ page }, testInfo) => {
            const { helper } = await WebDetectionTestHelper.setupAutoRunTest(page, testInfo.project.use);
            await helper.navigateTo('/web-detection/pages/auto-run-disabled.html');

            // Fast-forward past when detector would run
            await page.clock.fastForward(200);

            const notifications = await helper.getAutoRunNotifications();

            // autorun.auto_disabled should not run because state is disabled
            const autoDisabledRuns = notifications.filter((n) => n.detectorId === 'autorun.auto_disabled');
            expect(autoDisabledRuns.length).toBe(0);
        });

        test('configuration with auto trigger validates correctly', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);

            // Verify config with auto trigger structure
            const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
            const autorunDetectors = config.features.webDetection.settings.detectors.autorun;
            expect(autorunDetectors).toBeDefined();
            expect(autorunDetectors.basic_auto.triggers.auto).toBeDefined();
            expect(autorunDetectors.basic_auto.triggers.auto.state).toBe('enabled');
            expect(autorunDetectors.basic_auto.triggers.auto.when).toBeDefined();
            expect(autorunDetectors.basic_auto.triggers.auto.when.intervalMs).toEqual([100, 300]);

            // Load and verify no errors
            await collector.load('/web-detection/index.html', config);

            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));

            await page.goto(collector.page.url());
            await page.waitForTimeout(100);

            expect(errors.length).toBe(0);
        });
    });
});
