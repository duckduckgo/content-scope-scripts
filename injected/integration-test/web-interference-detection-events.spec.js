import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const CONFIG_ENABLED = './integration-test/test-pages/web-interference-detection/config/youtube-detection-events.json';
const TEST_PAGE = '/web-interference-detection/pages/youtube-detection-events.html';

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 */
async function getMessagesOfType(collector, method) {
    const calls = await collector.outgoingMessages();
    return calls.filter((c) => /** @type {import('../../messaging/index.js').NotificationMessage} */ (c.payload).method === method);
}

test.describe('YouTube detection events via webInterferenceDetection', () => {
    test('sends webEvent with youtube_adBlocker when ad-blocker modal is detected', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(TEST_PAGE, CONFIG_ENABLED);

        await page.waitForTimeout(2000);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);
        const params =
            /** @type {import('../../messaging/index.js').NotificationMessage} */
            (webEventMessages[0].payload).params;
        expect(params).toEqual({
            type: 'youtube_adBlocker',
            data: {},
        });
    });

    test('webEvent message has correct structure', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(TEST_PAGE, CONFIG_ENABLED);

        await page.waitForTimeout(2000);

        const webEventMessages = await getMessagesOfType(collector, 'webEvent');
        expect(webEventMessages.length).toBeGreaterThanOrEqual(1);

        for (const msg of webEventMessages) {
            expect(msg.payload.context).toBe('contentScopeScripts');
            expect(msg.payload.featureName).toBe('webEvents');
            expect(msg.payload).not.toHaveProperty('nativeData');
            expect(/** @type {import('../../messaging/index.js').NotificationMessage} */ (msg.payload).params).not.toHaveProperty(
                'nativeData',
            );
        }
    });

    test('does not produce page errors during detection and event firing', async ({ page }, testInfo) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error));

        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webEvent: null });
        await collector.load(TEST_PAGE, CONFIG_ENABLED);

        await page.waitForTimeout(2000);

        const relevantErrors = errors.filter((e) => !e.message.includes('net::'));
        expect(relevantErrors).toEqual([]);
    });
});
