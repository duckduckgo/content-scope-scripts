import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/tab-suspension/index.html';
const CONFIG = './integration-test/test-pages/tab-suspension/config/tab-suspension.json';
const CONFIG_NATIVE_DISABLED = './integration-test/test-pages/tab-suspension/config/tab-suspension-native-disabled.json';
const CONFIG_INDEXEDDB = './integration-test/test-pages/tab-suspension/config/tab-suspension-indexeddb.json';
const CONFIG_INDEXEDDB_NATIVE_DISABLED =
    './integration-test/test-pages/tab-suspension/config/tab-suspension-indexeddb-native-disabled.json';

test.describe('tabSuspension - inputFieldFocusDetection', () => {
    test('notifies on text input focus', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.click('#text-input');

        const messages = await collector.waitForMessage('formFocusChanged', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isFocused: true });
    });

    test('notifies on textarea focus', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.click('#textarea');

        const messages = await collector.waitForMessage('formFocusChanged', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isFocused: true });
    });

    test('notifies on select focus', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.focus('#select');

        const messages = await collector.waitForMessage('formFocusChanged', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isFocused: true });
    });

    test('notifies on contentEditable focus', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.click('#contenteditable');

        const messages = await collector.waitForMessage('formFocusChanged', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isFocused: true });
    });

    test('does not notify on non-form element focus', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.click('#button');

        // Brief wait to ensure any async message would have been sent
        await page.waitForTimeout(500);

        const messages = await collector.outgoingMessages();
        const focusMessages = messages.filter((m) => 'method' in m.payload && m.payload.method === 'formFocusChanged');
        expect(focusMessages).toHaveLength(0);
    });
});

test.describe('tabSuspension - inputFieldFocusDetection with nativeEnabled: false', () => {
    test('does not notify on input focus', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NATIVE_DISABLED);

        await page.click('#text-input');

        // Brief wait to ensure any async message would have been sent
        await page.waitForTimeout(500);

        const messages = await collector.outgoingMessages();
        const focusMessages = messages.filter((m) => 'method' in m.payload && m.payload.method === 'formFocusChanged');
        expect(focusMessages).toHaveLength(0);
    });
});

test.describe('tabSuspension - indexedDBDetection', () => {
    test('notifies when indexedDB.open is called', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        await page.evaluate(() => {
            indexedDB.open('test-db', 1);
        });

        const messages = await collector.waitForMessage('indexedDBConnectionOpened', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
    });

    test('indexedDB.open still returns a valid request', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        const result = await page.evaluate(() => {
            const request = indexedDB.open('test-db-2', 1);
            return request instanceof IDBOpenDBRequest;
        });

        expect(result).toBe(true);
    });
});

test.describe('tabSuspension - indexedDBDetection with nativeEnabled: false', () => {
    test('does not notify when indexedDB.open is called', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB_NATIVE_DISABLED);

        await page.evaluate(() => {
            indexedDB.open('test-db', 1);
        });

        // Brief wait to ensure any async message would have been sent
        await page.waitForTimeout(500);

        const messages = await collector.outgoingMessages();
        const dbMessages = messages.filter((m) => 'method' in m.payload && m.payload.method === 'indexedDBConnectionOpened');
        expect(dbMessages).toHaveLength(0);
    });
});
