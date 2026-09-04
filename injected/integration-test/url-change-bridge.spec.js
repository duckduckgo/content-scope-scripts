import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const CONFIG = 'integration-test/test-pages/url-change-bridge/config/url-change-bridge.json';
const BRIDGE_HTML = '/url-change-bridge/pages/bridge.html';

/**
 * Set up both page world (apple) and isolated world (apple-isolated) contexts,
 * with a shared messageSecret and the Navigation API disabled to simulate WebKit.
 *
 * @param {import("playwright-core").Page} page
 * @param {import("@playwright/test").TestInfo} testInfo
 */
function setupBothContexts(page, testInfo) {
    const pageWorld = ResultsCollector.create(page, testInfo.project.use);
    const isolated = ResultsCollector.create(page, {
        injectName: pageWorld.isolatedVariant(),
        platform: pageWorld.platform.name,
    });

    isolated.withUserPreferences({ messageSecret: 'ABC' });
    pageWorld.withUserPreferences({ messageSecret: 'ABC' });

    return { pageWorld, isolated };
}

test('page world broadcasts URL_CHANGED events to isolated world on pushState', async ({ page }, testInfo) => {
    const { pageWorld, isolated } = setupBothContexts(page, testInfo);

    // Disable Navigation API before scripts are injected to simulate WebKit
    await page.addInitScript(() => {
        Object.defineProperty(globalThis, 'navigation', { value: undefined, writable: true, configurable: true });
    });

    // Expose the messageSecret so the test page can listen for the bridge event
    await page.addInitScript(() => {
        // @ts-expect-error - test helper
        window.__urlChangeBridgeSecret = 'ABC';
    });

    await isolated.setup({ config: CONFIG });
    await pageWorld.load(BRIDGE_HTML, CONFIG);

    const results = await pageWorld.results();
    expect(results['URL change bridge receives pushState events']).toStrictEqual([
        { name: 'event-count', result: 2, expected: 2 },
        { name: 'push-type', result: 'push', expected: 'push' },
        { name: 'replace-type', result: 'replace', expected: 'replace' },
    ]);
});

test('page world does NOT broadcast URL_CHANGED when Navigation API is available', async ({ page }, testInfo) => {
    const { pageWorld, isolated } = setupBothContexts(page, testInfo);

    // Expose the messageSecret so the test page can listen for the bridge event
    await page.addInitScript(() => {
        // @ts-expect-error - test helper
        window.__urlChangeBridgeSecret = 'ABC';
    });

    await isolated.setup({ config: CONFIG });
    await pageWorld.load(BRIDGE_HTML, CONFIG);

    const results = await pageWorld.results();
    // No bridge events should fire when Navigation API is present
    expect(results['URL change bridge receives pushState events']).toStrictEqual([
        { name: 'event-count', result: 0, expected: 2 },
        { name: 'push-type', result: undefined, expected: 'push' },
        { name: 'replace-type', result: undefined, expected: 'replace' },
    ]);
});
