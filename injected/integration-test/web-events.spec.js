import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const CONFIG_ENABLED = './integration-test/test-pages/web-detection/config/web-events.json';
const CONFIG_DISABLED = './integration-test/test-pages/web-detection/config/web-events-disabled.json';
const CONFIG_EXCEPTION = './integration-test/test-pages/web-detection/config/web-events-exception.json';
const FIRE_EVENT_PAGE = '/web-detection/pages/fire-event.html';

/**
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} projectUse
 * @param {string} configPath
 */
async function setupWithAutoRun(page, projectUse, configPath) {
    const collector = ResultsCollector.create(page, projectUse);
    collector.withMockResponse({ webDetectionAutoRun: null });
    await page.clock.install();
    await collector.load(FIRE_EVENT_PAGE, configPath);
    return collector;
}

/**
 * Collect the details of every `webEventDebug` broadcast the page receives from now on.
 * @param {import('@playwright/test').Page} page
 */
async function listenForDebugEvents(page) {
    await page.evaluate(() => {
        // @ts-expect-error - test-only page global
        window.__webEventDebug = [];
        window.addEventListener('webEventDebug', (event) => {
            // @ts-expect-error - test-only page global
            window.__webEventDebug.push(/** @type {CustomEvent} */ (event).detail);
        });
    });
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<unknown[]>}
 */
async function debugEventDetails(page) {
    // @ts-expect-error - test-only page global
    return await page.evaluate(() => window.__webEventDebug);
}

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 */
async function getMessagesOfType(collector, method) {
    const calls = await collector.outgoingMessages();
    return calls.filter((c) => /** @type {import('../../messaging/index.js').NotificationMessage} */ (c.payload).method === method);
}

test.describe('WebEvents message flow', () => {
    test('sends webEvent message when webEvents is enabled and detector matches', async ({ page }, testInfo) => {
        const collector = await setupWithAutoRun(page, testInfo.project.use, CONFIG_ENABLED);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);
        expect(/** @type {import('../../messaging/index.js').NotificationMessage} */ (webEventMessages[0].payload).params).toEqual({
            type: 'adwall',
            data: {},
        });
    });

    test('does not send webEvent message when webEvents feature is disabled', async ({ page }, testInfo) => {
        const collector = await setupWithAutoRun(page, testInfo.project.use, CONFIG_DISABLED);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBe(0);
    });

    test('does not send webEvent message when webEvents is disabled on this site via additionalCheck', async ({ page }, testInfo) => {
        const collector = await setupWithAutoRun(page, testInfo.project.use, CONFIG_EXCEPTION);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBe(0);
    });

    test('does not send webEvent message when detector does not match', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null });
        await page.clock.install();
        await collector.load('/web-detection/pages/no-detection.html', CONFIG_ENABLED);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBe(0);
    });

    test('webEvent message contains the correct event type from fireEvent config', async ({ page }, testInfo) => {
        const collector = await setupWithAutoRun(page, testInfo.project.use, CONFIG_ENABLED);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);

        for (const msg of webEventMessages) {
            expect(/** @type {import('../../messaging/index.js').NotificationMessage} */ (msg.payload).params?.type).toBe('adwall');
            expect(msg.payload.context).toBe('contentScopeScripts');
            expect(msg.payload.featureName).toBe('webEvents');
        }
    });

    test('webEvent messages never contain a nativeData field', async ({ page }, testInfo) => {
        const collector = await setupWithAutoRun(page, testInfo.project.use, CONFIG_ENABLED);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);

        for (const msg of webEventMessages) {
            expect(msg.payload).not.toHaveProperty('nativeData');
            expect(/** @type {import('../../messaging/index.js').NotificationMessage} */ (msg.payload).params).not.toHaveProperty(
                'nativeData',
            );
        }
    });

    test('debug builds copy each webEvent to the page as a JSON-string CustomEvent', async ({ page }, testInfo) => {
        const collector = await setupWithAutoRun(page, testInfo.project.use, CONFIG_ENABLED);
        await listenForDebugEvents(page);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);
        const details = await debugEventDetails(page);
        expect(details.length).toBe(webEventMessages.length);
        for (const detail of details) {
            // Primitives cross isolated-world boundaries; objects from an isolated world do not (Chromium)
            expect(typeof detail).toBe('string');
            expect(JSON.parse(/** @type {string} */ (detail))).toEqual({ type: 'adwall', data: {} });
        }
    });

    test('without the debug flag no webEvent copy reaches the page', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null });
        collector.withUserPreferences({ debug: false });
        await page.clock.install();
        await collector.load(FIRE_EVENT_PAGE, CONFIG_ENABLED);
        await listenForDebugEvents(page);

        await page.clock.fastForward(100);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);
        expect(await debugEventDetails(page)).toEqual([]);
    });
});
