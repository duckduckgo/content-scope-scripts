import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/text-selection/index.html';
const CONFIG = './integration-test/test-pages/text-selection/config/text-selection.json';

/**
 * Runs the same expression native evaluates in the page content world to read a claimed frame.
 * @param {import('@playwright/test').Page} page
 */
function readSelection(page) {
    return page.evaluate(() => /** @type {any} */ (window).__ddgSelectionFrame.readSelection());
}

/**
 * @param {import('@playwright/test').Page} page
 */
function selectTarget(page) {
    return page.evaluate(() => {
        const target = document.getElementById('target');
        if (!target) throw new Error('Missing #target');
        window.getSelection()?.selectAllChildren(target);
    });
}

test.describe('textSelection in the page world', () => {
    test('reports a selection to the page-world handler without its text', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await selectTarget(page);
        const [message] = await collector.waitForMessage('selectionFrameChanged', 1);

        expect(message.payload.context).toBe('contentScopeScripts');
        expect(message.payload.featureName).toBe('textSelection');
        expect(message.payload.params).toEqual({ hasSelection: true, eventTimestamp: expect.any(Number) });
    });

    test('serves the claimed selection to the native reader', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await selectTarget(page);
        const [message] = await collector.waitForMessage('selectionFrameChanged', 1);

        expect(await readSelection(page)).toEqual({
            selectedText: 'Selected text',
            eventTimestamp: message.payload.params.eventTimestamp,
        });
    });

    test('ignores page overrides of the selection APIs', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.evaluate(() => {
            const target = document.getElementById('target');
            const selection = window.getSelection();
            if (!target || !selection) throw new Error('Missing selection fixture');
            window.getSelection = () => null;
            Selection.prototype.toString = () => 'Spoofed text';
            selection.selectAllChildren(target);
        });
        await collector.waitForMessage('selectionFrameChanged', 1);

        expect((await readSelection(page)).selectedText).toBe('Selected text');
    });

    test('does not let the page replace the reader', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const replaced = await page.evaluate(() => {
            const spoofed = { readSelection: () => ({ selectedText: 'Spoofed text', eventTimestamp: 0 }) };
            try {
                Object.defineProperty(window, '__ddgSelectionFrame', { value: spoofed });
            } catch {
                // Expected: the reader is non-configurable
            }
            /** @type {any} */ (window).__ddgSelectionFrame = spoofed;
            return /** @type {any} */ (window).__ddgSelectionFrame === spoofed;
        });
        await selectTarget(page);
        await collector.waitForMessage('selectionFrameChanged', 1);

        expect(replaced).toBe(false);
        expect((await readSelection(page)).selectedText).toBe('Selected text');
    });
});
