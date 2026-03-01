import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const CONFIG = './integration-test/test-pages/browser-ui-lock/config/browser-ui-lock.json';

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
function createCollector(page, testInfo) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({
        messageSecret: 'duckduckgo-android-messaging-secret',
        javascriptInterface: 'contentScopeScripts',
        messageCallback: 'messageCallback',
    });
    return collector;
}

/**
 * @param {import('./page-objects/results-collector.js').ResultsCollector} collector
 */
async function uiLockMessages(collector) {
    const all = await collector.outgoingMessages();
    return all.filter((m) => /** @type {{method: string}} */ (m.payload).method === 'uiLockChanged');
}

/**
 * Returns the locked value from the last uiLockChanged message, or null if none.
 * @param {any[]} messages
 * @returns {boolean | null}
 */
function lastLockState(messages) {
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    const payload = /** @type {import("@duckduckgo/messaging").NotificationMessage} */ (last.payload);
    return /** @type {boolean} */ (payload.params?.locked);
}

test.describe('Browser UI Lock', () => {
    test('normal scrollable page should settle to unlocked', async ({ page }, testInfo) => {
        const collector = createCollector(page, testInfo);
        await collector.load('/browser-ui-lock/pages/normal-page.html', CONFIG);
        await page.waitForTimeout(800);

        const messages = await uiLockMessages(collector);
        const state = lastLockState(messages);
        // Either no messages (never locked) or last message is unlocked
        expect(state === null || state === false).toBe(true);
    });

    test('fullscreen app page should lock', async ({ page }, testInfo) => {
        const collector = createCollector(page, testInfo);
        await collector.load('/browser-ui-lock/pages/fullscreen-app.html', CONFIG);
        await page.waitForTimeout(800);

        const messages = await uiLockMessages(collector);
        expect(lastLockState(messages)).toBe(true);
    });

    test('SPA style change should toggle lock state', async ({ page }, testInfo) => {
        const collector = createCollector(page, testInfo);
        await collector.load('/browser-ui-lock/pages/spa-style-change.html', CONFIG);

        // Wait for initial evaluation to settle
        await page.waitForTimeout(1000);

        const initial = await uiLockMessages(collector);
        const initialState = lastLockState(initial);
        // After settling, a tall scrollable page should be unlocked
        expect(initialState === null || initialState === false).toBe(true);

        // Toggle locked class on html — sets overflow: hidden on both html and body
        await page.click('#toggle-btn');
        await page.waitForTimeout(800);

        const afterLock = await uiLockMessages(collector);
        expect(lastLockState(afterLock)).toBe(true);

        // Toggle again to unlock
        await page.click('#toggle-btn');
        await page.waitForTimeout(800);

        const afterUnlock = await uiLockMessages(collector);
        expect(lastLockState(afterUnlock)).toBe(false);
    });
});
