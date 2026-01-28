import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/breakage-reporting/index.html';
const CONFIG = './integration-test/test-pages/breakage-reporting/config/config.json';
const CONFIG_DISABLED = './integration-test/test-pages/breakage-reporting/config/config-disabled.json';

test.describe('Breakage Reporting Feature', () => {
    test('breakageData is undefined when no features add data', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_DISABLED);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigate();

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeUndefined();
        expect(result.params?.breakageData).toBeUndefined();
    });

    test('collects basic metrics without detectors', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigate();

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        expect(calls.length).toBe(1);
        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.jsPerformance.length).toBe(1);
        expect(result.params?.jsPerformance[0]).toBeGreaterThan(0);
        expect(result.params?.referrer).toBe('http://localhost:3220/breakage-reporting/index.html');
    });

    test('detects no challenges on clean page', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/no-challenge.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.botDetection.detected).toBe(false);
        expect(result.params?.detectorData?.fraudDetection.detected).toBe(false);
        expect(result.params?.detectorData?.adwallDetection.detected).toBe(false);

        // Verify breakageData contains URL-encoded JSON with detectorData
        expect(result.params?.breakageData).toBeDefined();
        const decodedBreakageData = JSON.parse(decodeURIComponent(result.params?.breakageData));
        expect(decodedBreakageData.detectorData).toEqual(result.params?.detectorData);
    });

    test('detects Cloudflare challenge', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/captcha-cloudflare.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.botDetection.detected).toBe(true);
        expect(result.params?.detectorData?.botDetection.results.length).toBeGreaterThan(0);

        const cloudflareResult = result.params?.detectorData?.botDetection.results[0];
        expect(cloudflareResult.vendor).toBe('Cloudflare');
        expect(cloudflareResult.challengeType).toBe('cloudflare');
        expect(cloudflareResult.detected).toBe(true);
    });

    test('detects reCAPTCHA challenge', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/captcha-recaptcha.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.botDetection.detected).toBe(true);

        const recaptchaResult = result.params?.detectorData?.botDetection.results.find((r) => r.challengeType === 'recaptcha');
        expect(recaptchaResult).toBeDefined();
        expect(recaptchaResult.vendor).toBe('reCAPTCHA');
        expect(recaptchaResult.detected).toBe(true);
    });

    test('detects Fraud challenge (PerimeterX)', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/fraud-px.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.fraudDetection.detected).toBe(true);

        const fraudResult = result.params?.detectorData?.fraudDetection.results[0];
        expect(fraudResult.alertId).toBe('px');
    });

    test('detects adwall on page with adblocker message', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/adwall.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.adwallDetection.detected).toBe(true);
        expect(result.params?.detectorData?.adwallDetection.results.length).toBeGreaterThan(0);

        const adwallResult = result.params?.detectorData?.adwallDetection.results[0];
        expect(adwallResult.detectorId).toBe('generic');
        expect(adwallResult.detected).toBe(true);
    });

    test('does not detect adwall on clean page', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/no-challenge.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        const calls = await collector.outgoingMessages();

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (calls[0].payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.adwallDetection.detected).toBe(false);
        expect(result.params?.detectorData?.adwallDetection.results.length).toBe(0);
    });
});

export class BreakageReportingSpec {
    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;
    }

    async navigate() {
        await this.navigateToPage('/breakage-reporting/pages/ref.html');
    }

    async navigateToPage(url) {
        await this.page.evaluate((targetUrl) => {
            window.location.href = targetUrl;
        }, url);
        await this.page.waitForURL(`**${url}`);

        // Wait for first paint event to ensure we can get the performance metrics
        await this.page.evaluate(() => {
            const response = new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.name === 'first-paint') {
                            observer.disconnect();
                            // @ts-expect-error - error TS2810: Expected 1 argument, but got 0. 'new Promise()' needs a JSDoc hint to produce a 'resolve' that can be called without arguments.
                            resolve();
                        }
                    });
                });

                observer.observe({ type: 'paint', buffered: true });
            });
            return response;
        });
    }
}
