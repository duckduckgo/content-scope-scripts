import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/duck-ai-data-clearing/index.html';
const CONFIG = './integration-test/test-pages/duck-ai-data-clearing/config/enabled.json';

test('duck-ai-data-clearing feature is ready', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    // Wait for completion message
    const messages = await collector.waitForMessage('duckAiClearDataReady', 1);

    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataReady');
});

test('duck-ai-data-clearing feature clears localStorage and IndexedDB', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    const duckAiDataClearing = new DuckAiDataClearingSpec(page);

    // Setup test data
    await duckAiDataClearing.setupTestData();
    await duckAiDataClearing.waitForDataSetup();

    // Trigger data clearing via messaging
    await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', {});

    // Wait for completion message
    const messages = await collector.waitForMessage('duckAiClearDataCompleted', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataCompleted');

    // Verify data is actually cleared
    await duckAiDataClearing.verifyDataCleared();
    await duckAiDataClearing.waitForVerification('Verification complete: All data cleared');
});

/** @type {{ platform: 'ios' | 'macos' | 'windows', usesBulkClear: boolean }[]} */
const bulkClearExpectations = [
    { platform: 'ios', usesBulkClear: false },
    { platform: 'macos', usesBulkClear: false },
    { platform: 'windows', usesBulkClear: true },
];

for (const { platform, usesBulkClear } of bulkClearExpectations) {
    test(`duck-ai-data-clearing feature clears IndexedDB records holding Blob values on ${platform}`, async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withUserPreferences({
            messageSecret: 'ABC',
            javascriptInterface: 'javascriptInterface',
            messageCallback: 'messageCallback',
        });
        await collector.load(HTML, CONFIG, { name: platform });

        const duckAiDataClearing = new DuckAiDataClearingSpec(page);
        await duckAiDataClearing.setupBlobImages();
        await duckAiDataClearing.countBulkClearCalls();

        await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', {});

        const messages = await collector.waitForMessage('duckAiClearDataCompleted', 1);
        expect(messages).toHaveLength(1);

        await duckAiDataClearing.verifyDataCleared();
        await duckAiDataClearing.waitForVerification('Verification complete: All data cleared');
        expect((await duckAiDataClearing.bulkClearCallCount()) > 0).toBe(usesBulkClear);
    });
}

test('duck-ai-data-clearing feature handles IndexedDB errors gracefully', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    const duckAiDataClearing = new DuckAiDataClearingSpec(page);

    // Setup localStorage data only (no IndexedDB)
    await duckAiDataClearing.setupLocalStorageOnly();

    // Mock IndexedDB to fail
    await page.evaluate(() => {
        const originalOpen = window.indexedDB.open;
        window.indexedDB.open = function () {
            const request = originalOpen.call(window.indexedDB, 'nonexistent');
            // Immediately fire the error event
            setTimeout(() => {
                if (typeof request.onerror === 'function') {
                    // Create a fake event object
                    const event = new Event('error');
                    request.onerror(event);
                }
            }, 0);
            return request;
        };
    });

    // Trigger data clearing
    await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', {});

    // Should still get completion message (localStorage should clear successfully)
    const messages = await collector.waitForMessage('duckAiClearDataFailed', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataFailed');
});

test('duck-ai-data-clearing feature handles localStorage errors gracefully', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    // Mock localStorage to throw an error
    await page.evaluate(() => {
        Storage.prototype.removeItem = () => {
            throw new Error('Simulated localStorage error');
        };
    });

    // Trigger data clearing
    await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', {});

    // Should get failure message
    const messages = await collector.waitForMessage('duckAiClearDataFailed', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataFailed');
});

test('duck-ai-data-clearing feature succeeds when data collections do not exist or are empty', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    const duckAiDataClearing = new DuckAiDataClearingSpec(page);

    // Ensure localStorage item doesn't exist
    await page.evaluate(() => {
        localStorage.removeItem('savedAIChats');
    });

    // Ensure IndexedDB is clean (no existing database or object store)
    await page.evaluate(() => {
        return new Promise((resolve) => {
            const deleteRequest = indexedDB.deleteDatabase('savedAIChatData');
            deleteRequest.onsuccess = () => resolve(null);
            deleteRequest.onerror = () => resolve(null); // Continue even if delete fails
            deleteRequest.onblocked = () => resolve(null); // Continue even if blocked
        });
    });

    // Trigger data clearing on non-existent/empty data
    await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', {});

    // Should still get completion message since there's nothing to fail
    const messages = await collector.waitForMessage('duckAiClearDataCompleted', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataCompleted');

    // Verify that subsequent verification shows no data exists
    await duckAiDataClearing.verifyDataCleared();
    await duckAiDataClearing.waitForVerification('Verification complete: All data cleared');
});

test('duck-ai-data-clearing feature deletes a single chat by chatId', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    // Setup multiple chats in localStorage
    await page.evaluate(() => {
        const chatData = {
            version: '1',
            chats: [
                { chatId: 'chat-1', title: 'First Chat', lastEdit: Date.now() },
                { chatId: 'chat-2', title: 'Second Chat', lastEdit: Date.now() },
                { chatId: 'chat-3', title: 'Third Chat', lastEdit: Date.now() },
            ],
        };
        localStorage.setItem('savedAIChats', JSON.stringify(chatData));
    });

    // Trigger deletion of a single chat
    await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', { chatId: 'chat-2' });

    // Wait for completion message
    const messages = await collector.waitForMessage('duckAiClearDataCompleted', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataCompleted');

    // Verify only the specified chat was removed
    const remainingChats = await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('savedAIChats') || '{}');
        return data.chats || [];
    });

    expect(remainingChats).toHaveLength(2);
    expect(remainingChats.map((c) => c.chatId)).toEqual(['chat-1', 'chat-3']);
});

test('duck-ai-data-clearing feature handles deletion of non-existent chatId gracefully', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'ABC',
        javascriptInterface: 'javascriptInterface',
        messageCallback: 'messageCallback',
    });
    await collector.load(HTML, CONFIG);

    // Setup chats in localStorage
    await page.evaluate(() => {
        const chatData = {
            version: '1',
            chats: [
                { chatId: 'chat-1', title: 'First Chat', lastEdit: Date.now() },
                { chatId: 'chat-2', title: 'Second Chat', lastEdit: Date.now() },
            ],
        };
        localStorage.setItem('savedAIChats', JSON.stringify(chatData));
    });

    // Trigger deletion of a non-existent chat
    await collector.simulateSubscriptionMessage('duckAiDataClearing', 'duckAiClearData', { chatId: 'non-existent-chat' });

    // Should still get completion message
    const messages = await collector.waitForMessage('duckAiClearDataCompleted', 1);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.method).toBe('duckAiClearDataCompleted');

    // Verify all chats remain unchanged
    const remainingChats = await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('savedAIChats') || '{}');
        return data.chats || [];
    });

    expect(remainingChats).toHaveLength(2);
});

class DuckAiDataClearingSpec {
    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;
    }

    async setupTestData() {
        await this.page.click('#setup-data');
    }

    async setupLocalStorageOnly() {
        await this.page.evaluate(() => {
            localStorage.setItem('savedAIChats', JSON.stringify([{ id: 1, message: 'test chat 1' }]));
        });
    }

    async setupBlobImages() {
        await this.page.evaluate(
            () =>
                new Promise((resolve, reject) => {
                    const request = indexedDB.open('savedAIChatData', 1);
                    request.onupgradeneeded = () => request.result.createObjectStore('chat-images', { keyPath: 'id' });
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => {
                        const db = request.result;
                        const transaction = db.transaction(['chat-images'], 'readwrite');
                        const objectStore = transaction.objectStore('chat-images');
                        objectStore.add({ id: 1, chatId: 'chat-1', data: new Blob(['image-1'], { type: 'image/jpeg' }) });
                        objectStore.add({ id: 2, chatId: 'chat-2', data: new Blob(['image-2'], { type: 'image/jpeg' }) });
                        transaction.oncomplete = () => {
                            db.close();
                            resolve(undefined);
                        };
                        transaction.onerror = () => reject(transaction.error);
                    };
                }),
        );
    }

    async countBulkClearCalls() {
        await this.page.evaluate(() => {
            const counter = /** @type {{ bulkClearCalls: number }} */ (/** @type {unknown} */ (window));
            const originalClear = IDBObjectStore.prototype.clear;
            counter.bulkClearCalls = 0;
            IDBObjectStore.prototype.clear = function () {
                counter.bulkClearCalls++;
                return originalClear.call(this);
            };
        });
    }

    async bulkClearCallCount() {
        return await this.page.evaluate(() => /** @type {{ bulkClearCalls: number }} */ (/** @type {unknown} */ (window)).bulkClearCalls);
    }

    async waitForDataSetup() {
        await this.page.waitForFunction(
            () => {
                const status = document.getElementById('data-status');
                return status && status.textContent === 'Test data setup complete';
            },
            { timeout: 5000 },
        );
    }

    async verifyDataCleared() {
        await this.page.click('#verify-data');
    }

    async waitForVerification(expectedText) {
        await this.page.waitForFunction(
            (expected) => {
                const status = document.getElementById('verify-status');
                return status && status.textContent === expected;
            },
            expectedText,
            { timeout: 5000 },
        );
    }
}

export { DuckAiDataClearingSpec };
