import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/tab-suspension/index.html';

/** Only inputFieldFocusDetection enabled */
const CONFIG_FOCUS = './integration-test/test-pages/tab-suspension/config/tab-suspension.json';

test.describe('tabSuspension - inputFieldFocusDetection', () => {
    test('sends canBeSuspended false after a form element is focused', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#text-input');
        const messages = await collector.waitForMessage('canBeSuspended', 1);
        const result = /** @type {{params: {canBeSuspended: boolean}}} */ (messages[0].payload).params;
        expect(result.canBeSuspended).toBe(false);
    });

    test('sends canBeSuspended false after textarea is focused', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#textarea');
        const messages = await collector.waitForMessage('canBeSuspended', 1);
        const result = /** @type {{params: {canBeSuspended: boolean}}} */ (messages[0].payload).params;
        expect(result.canBeSuspended).toBe(false);
    });

    test('sends canBeSuspended false after contentEditable is focused', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#contenteditable');
        const messages = await collector.waitForMessage('canBeSuspended', 1);
        const result = /** @type {{params: {canBeSuspended: boolean}}} */ (messages[0].payload).params;
        expect(result.canBeSuspended).toBe(false);
    });

    test('does not send notification when non-form elements clicked', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#button');
        await page.waitForTimeout(200);

        const allMessages = await collector.outgoingMessages();
        const canBeSuspendedMessages = allMessages.filter((m) => 'method' in m.payload && m.payload.method === 'canBeSuspended');
        expect(canBeSuspendedMessages.length).toBe(0);
    });
});
