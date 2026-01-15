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

    /**
     * Helper to setup many chats in localStorage
     * @param {import('@playwright/test').Page} page
     * @param {number} pinnedCount
     * @param {number} unpinnedCount
     */
    async function setupManyChats(page, pinnedCount, unpinnedCount) {
        await page.evaluate(
            ({ pinned, unpinned }) => {
                const chats = [];
                for (let i = 0; i < pinned; i++) {
                    chats.push({
                        chatId: `chat-pinned-${i}`,
                        title: `Pinned chat ${i}`,
                        model: 'gpt-4.1-internal',
                        messages: [{ content: 'test', role: 'user' }],
                        lastEdit: new Date().toISOString(),
                        pinned: true,
                    });
                }
                for (let i = 0; i < unpinned; i++) {
                    chats.push({
                        chatId: `chat-unpinned-${i}`,
                        title: `Regular chat ${i}`,
                        model: 'gpt-4.1-internal',
                        messages: [{ content: 'test', role: 'user' }],
                        lastEdit: new Date().toISOString(),
                        pinned: false,
                    });
                }
                localStorage.setItem('savedAIChats', JSON.stringify({ version: '0.7', chats }));
            },
            { pinned: pinnedCount, unpinned: unpinnedCount },
        );
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

    test('handles non-string title values gracefully during search', async ({ page }) => {
        await page.evaluate(() => {
            const chats = [
                {
                    chatId: 'number-title',
                    title: 12345,
                    messages: [],
                    pinned: false,
                },
                {
                    chatId: 'object-title',
                    title: { foo: 'bar' },
                    messages: [],
                    pinned: false,
                },
                {
                    chatId: 'valid-title',
                    title: 'Valid chat title',
                    messages: [],
                    pinned: false,
                },
            ];
            localStorage.setItem('savedAIChats', JSON.stringify({ version: '0.7', chats }));
        });

        // Search should not throw and should still find the valid chat
        const result = await requestChats({ query: 'Valid' });
        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(1);
        expect(result.chats[0].chatId).toBe('valid-title');
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

    test('limits unpinned chats by default max_chats (30)', async ({ page }) => {
        // Setup 5 pinned and 50 unpinned chats
        await setupManyChats(page, 5, 50);

        const result = await requestChats();
        expect(result.success).toBe(true);
        // All pinned chats returned (no limit)
        expect(result.pinnedChats).toHaveLength(5);
        // Unpinned limited to default 30
        expect(result.chats).toHaveLength(30);
    });

    test('respects custom max_chats parameter for unpinned chats', async ({ page }) => {
        // Setup 3 pinned and 20 unpinned chats
        await setupManyChats(page, 3, 20);

        const result = await requestChats({ max_chats: 10 });
        expect(result.success).toBe(true);
        // All pinned chats returned (no limit)
        expect(result.pinnedChats).toHaveLength(3);
        // Unpinned limited to 10
        expect(result.chats).toHaveLength(10);
    });

    test('returns all unpinned chats when max_chats exceeds available', async ({ page }) => {
        // Setup 2 pinned and 5 unpinned chats
        await setupManyChats(page, 2, 5);

        const result = await requestChats({ max_chats: 100 });
        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(2);
        expect(result.chats).toHaveLength(5);
    });

    test('pinned chats have no limit regardless of max_chats', async ({ page }) => {
        // Setup 50 pinned and 10 unpinned chats
        await setupManyChats(page, 50, 10);

        const result = await requestChats({ max_chats: 5 });
        expect(result.success).toBe(true);
        // All 50 pinned chats returned
        expect(result.pinnedChats).toHaveLength(50);
        // Unpinned limited to 5
        expect(result.chats).toHaveLength(5);
    });

    test('filters chats by since timestamp', async ({ page }) => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

        // Setup chats with different timestamps
        await page.evaluate(
            ({ recent, old }) => {
                const chats = [
                    {
                        chatId: 'recent-chat',
                        title: 'Recent chat',
                        model: 'gpt-4.1-internal',
                        messages: [],
                        lastEdit: new Date(recent).toISOString(),
                        pinned: false,
                    },
                    {
                        chatId: 'old-chat',
                        title: 'Old chat',
                        model: 'gpt-4.1-internal',
                        messages: [],
                        lastEdit: new Date(old).toISOString(),
                        pinned: false,
                    },
                ];
                localStorage.setItem('savedAIChats', JSON.stringify({ version: '0.7', chats }));
            },
            { recent: oneHourAgo, old: twoDaysAgo },
        );

        // Query with since = 1 day ago (should only return recent chat)
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const result = await requestChats({ since: oneDayAgo });

        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(1);
        expect(result.chats[0].chatId).toBe('recent-chat');
    });

    test('since filter applies to both pinned and unpinned chats', async ({ page }) => {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

        await page.evaluate(
            ({ recent, old }) => {
                const chats = [
                    {
                        chatId: 'recent-pinned',
                        title: 'Recent pinned',
                        messages: [],
                        lastEdit: new Date(recent).toISOString(),
                        pinned: true,
                    },
                    {
                        chatId: 'old-pinned',
                        title: 'Old pinned',
                        messages: [],
                        lastEdit: new Date(old).toISOString(),
                        pinned: true,
                    },
                    {
                        chatId: 'recent-unpinned',
                        title: 'Recent unpinned',
                        messages: [],
                        lastEdit: new Date(recent).toISOString(),
                        pinned: false,
                    },
                    {
                        chatId: 'old-unpinned',
                        title: 'Old unpinned',
                        messages: [],
                        lastEdit: new Date(old).toISOString(),
                        pinned: false,
                    },
                ];
                localStorage.setItem('savedAIChats', JSON.stringify({ version: '0.7', chats }));
            },
            { recent: oneHourAgo, old: twoDaysAgo },
        );

        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const result = await requestChats({ since: oneDayAgo });

        expect(result.success).toBe(true);
        expect(result.pinnedChats).toHaveLength(1);
        expect(result.pinnedChats[0].chatId).toBe('recent-pinned');
        expect(result.chats).toHaveLength(1);
        expect(result.chats[0].chatId).toBe('recent-unpinned');
    });

    test('returns all chats when since is not provided', async ({ page }) => {
        const now = Date.now();
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

        await page.evaluate(
            ({ old }) => {
                const chats = [
                    {
                        chatId: 'old-chat',
                        title: 'Very old chat',
                        messages: [],
                        lastEdit: new Date(old).toISOString(),
                        pinned: false,
                    },
                ];
                localStorage.setItem('savedAIChats', JSON.stringify({ version: '0.7', chats }));
            },
            { old: oneYearAgo },
        );

        // No since parameter - should return all chats regardless of age
        const result = await requestChats();

        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(1);
        expect(result.chats[0].chatId).toBe('old-chat');
    });

    test('includes chats with missing or malformed lastEdit when using since filter', async ({ page }) => {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        await page.evaluate(() => {
            const chats = [
                {
                    chatId: 'no-lastedit',
                    title: 'Chat without lastEdit',
                    messages: [],
                    pinned: false,
                },
                {
                    chatId: 'malformed-lastedit',
                    title: 'Chat with malformed lastEdit',
                    messages: [],
                    lastEdit: 'not-a-valid-date',
                    pinned: false,
                },
                {
                    chatId: 'empty-lastedit',
                    title: 'Chat with empty lastEdit',
                    messages: [],
                    lastEdit: '',
                    pinned: false,
                },
            ];
            localStorage.setItem('savedAIChats', JSON.stringify({ version: '0.7', chats }));
        });

        // Even with since filter, chats with missing/malformed lastEdit should be included (permissive)
        const result = await requestChats({ since: oneDayAgo });

        expect(result.success).toBe(true);
        expect(result.chats).toHaveLength(3);
    });
});
