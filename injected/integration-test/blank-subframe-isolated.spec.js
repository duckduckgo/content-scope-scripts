import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { blankFrame, frameMessages } from './helpers/blank-subframe.js';

const HTML = '/blank-subframe/pages/blank-subframe.html';
const CONFIG = './integration-test/test-pages/blank-subframe/config/blank-subframe-isolated.json';

/**
 * @param {import('@playwright/test').Frame} frame
 */
async function rightClickBody(frame) {
    await frame.evaluate(() => document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
}

test('blank-subframe (iOS): skips contextMenu in about:blank iframes', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG, { name: 'ios' });

    // Control: the main frame still reports context menu events.
    await rightClickBody(page.mainFrame());
    await collector.waitForMessage('contextMenuEvent', 1);

    const frame = blankFrame(page);
    await rightClickBody(frame);
    await page.waitForTimeout(300);
    expect(await frameMessages(frame, 'contextMenuEvent')).toEqual([]);
});

test('blank-subframe (iOS): keeps textSelection in about:blank iframes', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG, { name: 'ios' });

    const hasSelectionFrame = await blankFrame(page).evaluate(() => '__ddgSelectionFrame' in window);
    expect(hasSelectionFrame).toBe(true);
});

test('blank-subframe (macOS): loads every feature in about:blank iframes', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG, { name: 'macos' });

    const frame = blankFrame(page);
    await rightClickBody(frame);
    await expect.poll(() => frameMessages(frame, 'contextMenuEvent')).toHaveLength(1);
});
