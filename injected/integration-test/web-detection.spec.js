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
});
