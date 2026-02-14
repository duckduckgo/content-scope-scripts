import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/page-observer/index.html';
const CONFIG = './integration-test/test-pages/page-observer/config/page-observer-enabled.json';

test('pageObserver sends domLoaded notification', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    const messages = await collector.waitForMessage('domLoaded', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('domLoaded');
});

test('pageObserver sends domLoaded exactly once', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await collector.waitForMessage('domLoaded', 1);

    // Wait a bit to ensure no extra messages arrive
    await page.waitForTimeout(200);

    const all = await collector.outgoingMessages();
    const domLoadedMessages = all.filter((m) => /** @type {{method: string}} */ (m.payload).method === 'domLoaded');
    expect(domLoadedMessages).toHaveLength(1);
});

test('pageObserver does not send when feature is disabled', async ({ page }, testInfo) => {
    const DISABLED_CONFIG = './integration-test/test-pages/page-observer/config/page-observer-disabled.json';
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, DISABLED_CONFIG);

    // Wait to give the feature time to fire (if it were going to)
    await page.waitForTimeout(200);

    const all = await collector.outgoingMessages();
    const domLoadedMessages = all.filter((m) => /** @type {{method: string}} */ (m.payload).method === 'domLoaded');
    expect(domLoadedMessages).toHaveLength(0);
});
