import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/tab-suspension/index.html';
const CONFIG = './integration-test/test-pages/tab-suspension/config/tab-suspension.json';
const CONFIG_NATIVE_DISABLED = './integration-test/test-pages/tab-suspension/config/tab-suspension-native-disabled.json';
const CONFIG_INDEXEDDB = './integration-test/test-pages/tab-suspension/config/tab-suspension-indexeddb.json';
const CONFIG_INDEXEDDB_NATIVE_DISABLED =
    './integration-test/test-pages/tab-suspension/config/tab-suspension-indexeddb-native-disabled.json';
const CONFIG_WEBLOCK = './integration-test/test-pages/tab-suspension/config/tab-suspension-weblock.json';
const CONFIG_WEBLOCK_NATIVE_DISABLED = './integration-test/test-pages/tab-suspension/config/tab-suspension-weblock-native-disabled.json';

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
    test('notifies isActive:true when a database is opened', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        await page.evaluate(() => {
            return new Promise((resolve) => {
                const req = indexedDB.open('test-db', 1);
                req.onsuccess = () => resolve(undefined);
            });
        });

        const messages = await collector.waitForMessage('indexedDBStateChanged', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
    });

    test('notifies isActive:false when the last database is closed', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        await page.evaluate(() => {
            return new Promise((resolve) => {
                const req = indexedDB.open('test-db-close', 1);
                req.onsuccess = () => {
                    req.result.close();
                    resolve(undefined);
                };
            });
        });

        const messages = await collector.waitForMessage('indexedDBStateChanged', 2);
        expect(messages).toHaveLength(2);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
        expect(/** @type {{params: any}} */ (messages[1].payload).params).toStrictEqual({ isActive: false });
    });

    test('tracks multiple connections correctly', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        await page.evaluate(() => {
            return new Promise((resolve) => {
                let opened = 0;
                const onOpen = (/** @type {Event} */ e) => {
                    opened++;
                    if (opened === 2) {
                        // Close one — should still be active
                        /** @type {IDBOpenDBRequest} */ (e.target).result.close();
                        resolve(undefined);
                    }
                };
                const r1 = indexedDB.open('multi-db-1', 1);
                r1.onsuccess = onOpen;
                const r2 = indexedDB.open('multi-db-2', 1);
                r2.onsuccess = onOpen;
            });
        });

        // 2x isActive:true (one per open), then 1x isActive:true (close with 1 remaining)
        const messages = await collector.waitForMessage('indexedDBStateChanged', 3);
        expect(messages).toHaveLength(3);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
        expect(/** @type {{params: any}} */ (messages[1].payload).params).toStrictEqual({ isActive: true });
        // After closing one, still one open
        expect(/** @type {{params: any}} */ (messages[2].payload).params).toStrictEqual({ isActive: true });
    });

    test('indexedDB.open still returns a valid request', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        const result = await page.evaluate(() => {
            const request = indexedDB.open('test-db-valid', 1);
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
            return new Promise((resolve) => {
                const req = indexedDB.open('test-db', 1);
                req.onsuccess = () => resolve(undefined);
            });
        });

        // Brief wait to ensure any async message would have been sent
        await page.waitForTimeout(500);

        const messages = await collector.outgoingMessages();
        const dbMessages = messages.filter((m) => 'method' in m.payload && m.payload.method === 'indexedDBStateChanged');
        expect(dbMessages).toHaveLength(0);
    });
});

test.describe('tabSuspension - webLockDetection', () => {
    test('responds isActive:true when a lock is held', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_WEBLOCK);

        // Acquire a lock that stays held while we query
        await page.evaluate(() => {
            navigator.locks.request('test-lock', () => new Promise(() => {}));
        });

        // Small delay to ensure the lock is acquired
        await page.waitForTimeout(100);

        // Simulate native querying the web lock state
        await collector.simulateSubscriptionMessage('tabSuspension', 'getWebLockState', {});

        const messages = await collector.waitForMessage('webLockStateResult', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
    });

    test('responds isActive:false when no locks are held', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_WEBLOCK);

        // Simulate native querying the web lock state (no locks acquired)
        await collector.simulateSubscriptionMessage('tabSuspension', 'getWebLockState', {});

        const messages = await collector.waitForMessage('webLockStateResult', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: false });
    });
});

test.describe('tabSuspension - webLockDetection with nativeEnabled: false', () => {
    test('does not register subscription when nativeEnabled is false', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_WEBLOCK_NATIVE_DISABLED);

        // No subscription registered, so no webLockStateResult messages should appear
        await page.waitForTimeout(500);

        const messages = await collector.outgoingMessages();
        const lockMessages = messages.filter((m) => 'method' in m.payload && m.payload.method === 'webLockStateResult');
        expect(lockMessages).toHaveLength(0);
    });
});
