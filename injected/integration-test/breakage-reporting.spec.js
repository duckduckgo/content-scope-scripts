import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const HTML = '/breakage-reporting/index.html';
const CONFIG = './integration-test/test-pages/breakage-reporting/config/config.json';

const WEB_DETECTION_HTML = '/web-detection/index.html';
const WEB_DETECTION_CONFIG = './integration-test/test-pages/web-detection/config/config.json';
const WEB_DETECTION_MATCH_PAGE = '/web-detection/pages/text-match.html';

/**
 * Collect the details of every `breakageReportDebug` broadcast the page receives from now on.
 * @param {import('@playwright/test').Page} page
 */
async function listenForReportDebug(page) {
    await page.evaluate(() => {
        // @ts-expect-error - test-only page global
        window.__reportDebug = [];
        window.addEventListener('breakageReportDebug', (event) => {
            // @ts-expect-error - test-only page global
            window.__reportDebug.push(/** @type {CustomEvent} */ (event).detail);
        });
    });
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<unknown[]>}
 */
async function reportDebugDetails(page) {
    // @ts-expect-error - test-only page global
    return await page.evaluate(() => window.__reportDebug);
}

/**
 * @param {ResultsCollector} collector
 */
async function reportResultCount(collector) {
    const calls = await collector.outgoingMessages();
    return calls.filter(
        (c) => /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (c.payload).method === 'breakageReportResult',
    ).length;
}

test.describe('Breakage report debug broadcast', () => {
    test('a page request gets the report values back without a report to the client', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(WEB_DETECTION_HTML, WEB_DETECTION_CONFIG);
        await new BreakageReportingSpec(page).navigateToPage(WEB_DETECTION_MATCH_PAGE);
        await listenForReportDebug(page);

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('breakageReportDebugRequest')));

        await expect.poll(async () => (await reportDebugDetails(page)).length).toBe(1);
        const [detail] = await reportDebugDetails(page);
        expect(typeof detail).toBe('string');
        const payload = JSON.parse(/** @type {string} */ (detail));
        expect(payload.source).toBe('request');
        expect(payload.result.referrer).toBeDefined();
        const entry = payload.breakageData.webDetection.find(
            (/** @type {{ detectorId: string }} */ e) => e.detectorId === 'adwall.generic_text',
        );
        expect(entry?.detected).toBe(true);
        expect(await reportResultCount(collector)).toBe(0);
    });

    test('a report the client asks for also reaches the page, decoded', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(WEB_DETECTION_HTML, WEB_DETECTION_CONFIG);
        await new BreakageReportingSpec(page).navigateToPage(WEB_DETECTION_MATCH_PAGE);
        await listenForReportDebug(page);

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [resultCall] = await collector.waitForMessage('breakageReportResult');
        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);

        await expect.poll(async () => (await reportDebugDetails(page)).length).toBe(1);
        const payload = JSON.parse(/** @type {string} */ ((await reportDebugDetails(page))[0]));
        expect(payload.source).toBe('report');
        expect(payload.result).toEqual(result.params);
        expect(payload.breakageData).toEqual(JSON.parse(decodeURIComponent(result.params?.breakageData)));
    });

    test('without the debug flag a page request is ignored', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withUserPreferences({ debug: false });
        await collector.load(WEB_DETECTION_HTML, WEB_DETECTION_CONFIG);
        await new BreakageReportingSpec(page).navigateToPage(WEB_DETECTION_MATCH_PAGE);
        await listenForReportDebug(page);

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('breakageReportDebugRequest')));
        // Give a listener, if one were registered, time to collect and answer
        await page.waitForTimeout(500);

        expect(await reportDebugDetails(page)).toEqual([]);
        expect(await reportResultCount(collector)).toBe(0);
    });
});

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

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [resultCall] = await collector.waitForMessage('breakageReportResult');

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.botDetection.detected).toBe(false);
        expect(result.params?.detectorData?.fraudDetection.detected).toBe(false);

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
        const [resultCall] = await collector.waitForMessage('breakageReportResult');

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
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
        const [resultCall] = await collector.waitForMessage('breakageReportResult');

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
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
        const [resultCall] = await collector.waitForMessage('breakageReportResult');

        const result = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (resultCall.payload);
        expect(result.params?.detectorData).toBeDefined();
        expect(result.params?.detectorData?.fraudDetection.detected).toBe(true);

        const fraudResult = result.params?.detectorData?.fraudDetection.results[0];
        expect(fraudResult.alertId).toBe('px');
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
