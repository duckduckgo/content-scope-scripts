import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/tab-suspension/index.html';

/** All sub-features enabled */
const CONFIG_ALL = './integration-test/test-pages/tab-suspension/config/tab-suspension-all.json';
/** Only inputFieldFocusDetection enabled */
const CONFIG_FOCUS = './integration-test/test-pages/tab-suspension/config/tab-suspension.json';
/** Only indexedDBDetection enabled */
const CONFIG_INDEXEDDB = './integration-test/test-pages/tab-suspension/config/tab-suspension-indexeddb.json';
/** Only webLockDetection enabled */
const CONFIG_WEBLOCK = './integration-test/test-pages/tab-suspension/config/tab-suspension-weblock.json';
/** All sub-features with nativeEnabled: false */
const CONFIG_NATIVE_DISABLED = './integration-test/test-pages/tab-suspension/config/tab-suspension-native-disabled.json';

/**
 * Helper to query canSuspend and return the result.
 * @param {ResultsCollector} collector
 * @returns {Promise<boolean>}
 */
async function queryCanSuspend(collector) {
    await collector.simulateSubscriptionMessage('tabSuspension', 'canSuspend', {});
    const messages = await collector.waitForMessage('canSuspendResult', 1);
    return /** @type {{params: {canSuspend: boolean}}} */ (messages[0].payload).params.canSuspend;
}

test.describe('tabSuspension - canSuspend baseline', () => {
    test('returns true when no blockers are active', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ALL);

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(true);
    });
});

test.describe('tabSuspension - inputFieldFocusDetection', () => {
    test('returns false after a form element is focused', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#text-input');
        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(false);
    });

    test('returns false after textarea is focused', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#textarea');
        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(false);
    });

    test('returns false after contentEditable is focused', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#contenteditable');
        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(false);
    });

    test('returns true when only non-form elements clicked', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_FOCUS);

        await page.click('#button');
        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(true);
    });
});

test.describe('tabSuspension - indexedDBDetection', () => {
    test('returns false when an IndexedDB connection is open', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        await page.evaluate(() => {
            return new Promise((resolve) => {
                const req = indexedDB.open('test-db', 1);
                req.onsuccess = () => resolve(undefined);
            });
        });

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(false);
    });

    test('returns true after all IndexedDB connections are closed', async ({ page }, testInfo) => {
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

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(true);
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

    test('illegal receiver on open still throws TypeError', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        const result = await page.evaluate(() => {
            try {
                IDBFactory.prototype.open.call({}, 'bad-db');
                return 'no error';
            } catch (e) {
                return e instanceof TypeError ? 'TypeError' : 'other error';
            }
        });

        expect(result).toBe('TypeError');
    });

    test('illegal receiver on close does not affect state', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_INDEXEDDB);

        await page.evaluate(() => {
            try {
                IDBDatabase.prototype.close.call({});
            } catch {
                // expected to throw
            }
        });

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(true);
    });
});

test.describe('tabSuspension - webLockDetection', () => {
    test('returns false when a lock is held', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_WEBLOCK);

        await page.evaluate(() => {
            navigator.locks.request('test-lock', () => new Promise(() => {}));
        });
        await page.waitForTimeout(100);

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(false);
    });

    test('returns true when no locks are held', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_WEBLOCK);

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(true);
    });
});

test.describe('tabSuspension - nativeEnabled: false', () => {
    test('ignores all detectors and returns true', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NATIVE_DISABLED);

        // Trigger conditions that would normally block suspension
        await page.click('#text-input');
        await page.evaluate(() => {
            return new Promise((resolve) => {
                const req = indexedDB.open('test-db', 1);
                req.onsuccess = () => resolve(undefined);
            });
        });

        const canSuspend = await queryCanSuspend(collector);
        expect(canSuspend).toBe(true);
    });
});
