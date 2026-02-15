import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/infra/pages/performance-metrics.html';
const CONFIG_ALL = './integration-test/test-pages/infra/performance-metrics-config.json';
const CONFIG_FCP_ONLY = './integration-test/test-pages/infra/performance-metrics-fcp-only-config.json';
const CONFIG_DISABLED = './integration-test/test-pages/infra/performance-metrics-disabled-config.json';

test.describe('Performance Metrics Feature', () => {
    test('sends firstContentfulPaint notification when FCP is enabled', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FCP_ONLY);

        // Wait for FCP notification to be sent
        const fcpMessages = await collector.waitForMessage('firstContentfulPaint');

        expect(fcpMessages.length).toBe(1);
        const fcp = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (fcpMessages[0].payload);
        expect(fcp.featureName).toBe('performanceMetrics');
        expect(typeof fcp.params?.value).toBe('number');
        expect(fcp.params?.value).toBeGreaterThan(0);
    });

    test('sends expandedPerformanceMetricsResult when expanded metrics are enabled', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ALL);

        // Wait for expanded metrics notification (fires after page load)
        const expandedMessages = await collector.waitForMessage('expandedPerformanceMetricsResult');

        expect(expandedMessages.length).toBe(1);
        const expanded = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (expandedMessages[0].payload);
        expect(expanded.featureName).toBe('performanceMetrics');
        expect(expanded.params?.success).toBe(true);
        expect(expanded.params?.metrics).toBeDefined();
        expect(typeof expanded.params?.metrics?.loadComplete).toBe('number');
        expect(typeof expanded.params?.metrics?.domComplete).toBe('number');
    });

    test('sends vitalsResult when getVitals subscription is triggered', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_DISABLED);

        // Simulate native pushing a getVitals subscription event
        await collector.simulateSubscriptionMessage('performanceMetrics', 'getVitals', {});
        const vitalsMessages = await collector.waitForMessage('vitalsResult');

        expect(vitalsMessages.length).toBe(1);
        const vitals = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (vitalsMessages[0].payload);
        expect(vitals.featureName).toBe('performanceMetrics');
        expect(Array.isArray(vitals.params?.vitals)).toBe(true);
    });

    test('does not send FCP or expanded metrics when both sub-settings are disabled', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_DISABLED);

        // Wait a bit for any messages that shouldn't be sent
        await page.waitForTimeout(1000);
        const calls = await collector.outgoingMessages();

        // No FCP or expanded metrics messages should have been sent
        expect(calls.length).toBe(0);
    });

    test('does not send expanded metrics when only FCP is enabled', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FCP_ONLY);

        // Wait for FCP to fire
        await collector.waitForMessage('firstContentfulPaint');
        await page.waitForTimeout(1000);
        const calls = await collector.outgoingMessages();

        // Only FCP should be present, no expanded metrics
        const hasExpanded = calls.some((c) => /** @type {any} */ (c.payload).method === 'expandedPerformanceMetricsResult');
        expect(hasExpanded).toBe(false);
    });

    test('expanded metrics include firstContentfulPaint value', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ALL);

        const expandedMessages = await collector.waitForMessage('expandedPerformanceMetricsResult');
        expect(expandedMessages.length).toBe(1);
        const expanded = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (expandedMessages[0].payload);
        const metrics = expanded.params?.metrics;
        expect(metrics).toBeDefined();
        // FCP should be available in expanded metrics since the page has painted
        expect(typeof metrics?.firstContentfulPaint).toBe('number');
        expect(metrics?.firstContentfulPaint).toBeGreaterThan(0);
    });

    test('does not send FCP or expanded metrics in iframes', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load('/infra/pages/performance-metrics-framed.html', CONFIG_ALL);

        // Wait for the main frame FCP
        const fcpMessages = await collector.waitForMessage('firstContentfulPaint');
        await page.waitForTimeout(1000);

        // Should only have messages from the main frame, not the iframe
        expect(fcpMessages.length).toBe(1);
    });
});
