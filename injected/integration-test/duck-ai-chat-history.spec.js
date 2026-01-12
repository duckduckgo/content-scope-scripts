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

    test('retrieves all chats separated by pinned status', async ({ page }) => {
        await page.click('#setup-data');

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(1);
        expect(result.chats).toHaveLength(1);
        expect(result.pinnedChats[0].pinned).toBe(true);
        expect(result.chats[0].pinned).toBe(false);
    });

    test('strips messages from chat objects', async ({ page }) => {
        await page.click('#setup-data');

        const result = await requestChats();
        expect(result.success).toBe(true);
        // Verify messages are not included in the response
        expect(result.pinnedChats[0].messages).toBeUndefined();
        expect(result.chats[0].messages).toBeUndefined();
        // But other properties should still be present
        expect(result.pinnedChats[0].title).toBeDefined();
        expect(result.pinnedChats[0].chatId).toBeDefined();
    });

    test('filters chats by title query', async ({ page }) => {
        await page.click('#setup-data');

        const result = await requestChats({ query: 'Pinned chat' });
        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(1);
        expect(result.chats).toHaveLength(0);
    });

    test('search is case insensitive', async ({ page }) => {
        await page.click('#setup-data');

        const result = await requestChats({ query: 'CHAT' });
        expect(result.success).toBe(true);
        expect(result.pinnedChats.length + result.chats.length).toBe(2);
    });

    test('returns empty arrays when no matches found', async ({ page }) => {
        await page.click('#setup-data');

        const result = await requestChats({ query: 'nonexistent query xyz' });
        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(0);
        expect(result.chats).toHaveLength(0);
    });

    test('handles empty localStorage gracefully', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('savedAIChats'));

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(0);
        expect(result.chats).toHaveLength(0);
    });

    test('handles invalid JSON gracefully', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('savedAIChats', 'not valid json {{{'));

        const result = await requestChats();
        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(0);
        expect(result.chats).toHaveLength(0);
    });
});
