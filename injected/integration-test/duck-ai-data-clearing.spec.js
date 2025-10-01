import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/duck-ai-data-clearing/index.html';
const CONFIG = './integration-test/test-pages/duck-ai-data-clearing/config/enabled.json';

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
        window.indexedDB.open = () => {
            const request = originalOpen.call(window.indexedDB, 'nonexistent');
            // Simulate an error
            setTimeout(() => {
                if (request.onerror) {
                    request.onerror(new Error('Simulated IndexedDB error'));
                }
            }, 10);
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
        const originalRemoveItem = Storage.prototype.removeItem;
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
            localStorage.setItem('savedAIChats', JSON.stringify([
                { id: 1, message: 'test chat 1' }
            ]));
        });
    }

    async waitForDataSetup() {
        await this.page.waitForFunction(() => {
            const status = document.getElementById('data-status');
            return status && status.textContent === 'Test data setup complete';
        }, { timeout: 5000 });
    }

    async verifyDataCleared() {
        await this.page.click('#verify-data');
    }

    async waitForVerification(expectedText) {
        await this.page.waitForFunction((expected) => {
            const status = document.getElementById('verify-status');
            return status && status.textContent === expected;
        }, expectedText, { timeout: 5000 });
    }
}

export { DuckAiDataClearingSpec };
