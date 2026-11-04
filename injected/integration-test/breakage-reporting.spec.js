import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const HTML = '/breakage-reporting/index.html';
const CONFIG = './integration-test/test-pages/breakage-reporting/config/config.json';

test.describe('Breakage Reporting Feature', () => {
    test('breakageData is undefined when no features add data', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
        // Disable features that add data to the breakage report.
        config.features.webInterferenceDetection.state = 'disabled';
        config.features.detectorPerf = { state: 'disabled' };
        await collector.load(HTML, config);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigate();

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [resultCall] = await collector.waitForMessage('breakageReportResult');

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
        expect(result.params?.detectorData).toBeUndefined();
        expect(result.params?.breakageData).toBeUndefined();
    });

    test('collects basic metrics without detectors', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigate();

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [resultCall] = await collector.waitForMessage('breakageReportResult');

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
        expect(result.params?.jsPerformance.length).toBe(1);
        expect(result.params?.jsPerformance[0]).toBeGreaterThan(0);
        expect(result.params?.referrer).toBe('http://localhost:3220/breakage-reporting/index.html');
    });

    test('detects no challenges on clean page', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/no-challenge.html');

        const result = await breakageFeature.report(collector);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.botDetection).toBeUndefined();
        expect(result.params?.detectorData?.fraudDetection).toBeUndefined();

        // Verify breakageData contains URL-encoded JSON with detectorData
        expect(result.params?.breakageData).toBeDefined();
        const decodedBreakageData = JSON.parse(decodeURIComponent(result.params?.breakageData));
        expect(decodedBreakageData.detectorData).toEqual(result.params?.detectorData);
        expect(decodedBreakageData.webDetection).toBeUndefined();
    });

    test('detects a Cloudflare challenge by element and by page global', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/captcha-cloudflare.html');

        const entries = webDetectionEntries(await breakageFeature.report(collector));
        expect(entries).toContainEqual({
            detectorId: 'botDetection.cloudflare',
            detected: true,
            data: { vendor: 'Cloudflare', challengeStatus: null },
        });
        expect(entries).toContainEqual({ detectorId: 'botDetection.cloudflareGlobal', detected: true, data: { vendor: 'Cloudflare' } });
        expect(entries.find((e) => e.detectorId === 'botDetection.recaptcha')).toBeUndefined();
    });

    test('detects reCAPTCHA challenge', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/captcha-recaptcha.html');

        const entries = webDetectionEntries(await breakageFeature.report(collector));
        expect(entries).toContainEqual({ detectorId: 'botDetection.recaptcha', detected: true, data: { vendor: 'reCAPTCHA' } });
    });

    test('detects Fraud challenge (PerimeterX)', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/fraud-px.html');

        const entries = webDetectionEntries(await breakageFeature.report(collector));
        expect(entries).toContainEqual({ detectorId: 'fraudDetection.px', detected: true, data: { category: 'PerimeterX' } });
    });

    test('detects fraud warning text in rendered text only', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const breakageFeature = new BreakageReportingSpec(page);
        await breakageFeature.navigateToPage('/breakage-reporting/pages/fraud-text.html');

        const entries = webDetectionEntries(await breakageFeature.report(collector));
        expect(entries).toContainEqual({ detectorId: 'fraudDetection.unusualLogin', detected: true, data: { category: 'phishing' } });
        expect(entries.find((e) => e.detectorId === 'fraudDetection.verifyAccount')).toBeUndefined();
    });
});

/**
 * @param {import("@duckduckgo/messaging").NotificationMessage} result
 * @returns {{ detectorId: string, detected?: true, data?: Record<string, unknown> }[]}
 */
function webDetectionEntries(result) {
    expect(result.params?.breakageData).toBeDefined();
    return JSON.parse(decodeURIComponent(result.params?.breakageData)).webDetection ?? [];
}

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

    /**
     * @param {ResultsCollector} collector
     * @returns {Promise<import("@duckduckgo/messaging").NotificationMessage>}
     */
    async report(collector) {
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [resultCall] = await collector.waitForMessage('breakageReportResult');
        return /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
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
