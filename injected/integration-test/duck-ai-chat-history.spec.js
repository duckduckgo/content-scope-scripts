import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/duck-ai-chat-history/index.html';
const CONFIG = './integration-test/test-pages/duck-ai-chat-history/config/enabled.json';

test.describe('duck-ai-chat-history', () => {
    /** @type {ResultsCollector} */
    let collector;

    /**
     * Helper to request chats and get the result
     * @param {object} params
     */
    async function requestChats(params = {}) {
        await collector.simulateSubscriptionMessage('duckAiChatHistory', 'getDuckAiChats', params);
        const messages = await collector.waitForMessage('duckAiChatsResult', 1);
        expect(messages).toHaveLength(1);
        return messages[0].payload.params;
    }

    test.beforeEach(async ({ page }, testInfo) => {
        collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withUserPreferences({
            messageSecret: 'ABC',
            javascriptInterface: 'javascriptInterface',
            messageCallback: 'messageCallback',
        });
        await collector.load(HTML, CONFIG);
    });

    test('retrieves recent chats with default duration', async ({ page }) => {
        await page.click('#setup-data');

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(2);
    });

    test('filters chats by custom duration (7 days)', async ({ page }) => {
        await page.click('#setup-mixed-data');

        const result = await requestChats({ days: 7 });
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(1);
        expect(result.chats[0].chatId).toBe('chat-recent-1');
    });

    test('returns all chats within 14 days by default', async ({ page }) => {
        await page.click('#setup-mixed-data');

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(2);
    });

    test('handles empty localStorage gracefully', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('savedAIChats'));

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(0);
    });

    test('handles invalid JSON gracefully', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('savedAIChats', 'not valid json {{{'));

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(0);
    });

    test('handles large duration parameter (365 days)', async ({ page }) => {
        await page.click('#setup-mixed-data');

        const result = await requestChats({ days: 365 });
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(4);
    });
});
