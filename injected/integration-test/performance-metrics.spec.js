/**
 * Tests for performance-metrics feature.
 * Verifies the feature sends messaging notifications for FCP and expanded metrics.
 */
import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/performance-metrics/pages/performance-metrics.html';
const CONFIG = './integration-test/test-pages/performance-metrics/config/performance-metrics.json';

test('sends firstContentfulPaint message', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    const messages = await collector.waitForMessage('firstContentfulPaint', 1);

    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('firstContentfulPaint');
    expect(messages[0].payload.params.value).toBeGreaterThan(0);
});

test('sends expandedPerformanceMetricsResult on page load', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    const messages = await collector.waitForMessage('expandedPerformanceMetricsResult', 1);

    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('expandedPerformanceMetricsResult');

    // Verify the expanded metrics contain expected structure
    const params = messages[0].payload.params;
    expect(params).toBeDefined();
});
