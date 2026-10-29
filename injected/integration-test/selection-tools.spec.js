import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { selectedTextKey } from '../src/features/selection-tools/text-key.js';

const HTML = '/selection-tools/pages/index.html';
const CONFIG = './integration-test/test-pages/selection-tools/config/config.json';
const DISABLED_CONFIG = './integration-test/test-pages/selection-tools/config/disabled.json';
const TOOLBAR_OFF_CONFIG = './integration-test/test-pages/selection-tools/config/toolbar-off.json';
const ENGLISH = 'The quick brown fox';

/**
 * A selectionToolsConfigChanged push.
 * @param {Record<string, unknown>} [overrides]
 */
function selectionToolsConfig(overrides = {}) {
    return { enabled: true, showToolbar: true, ...overrides };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} [config]
 */
async function setup(page, testInfo, config = CONFIG) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, config);
    return collector;
}

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 * @returns {Promise<any[]>}
 */
async function sent(collector, method) {
    const messages = await collector.outgoingMessages();
    return messages.flatMap(({ payload }) =>
        'method' in payload && payload.method === method && 'params' in payload ? [payload.params] : [],
    );
}

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 */
async function lastSent(collector, method) {
    const messages = await sent(collector, method);
    return messages[messages.length - 1];
}

/**
 * Triple-click selects the paragraph with a real, trusted mouse. Its second click can report the word under the
 * pointer on the way, so tests wait for the paragraph's report.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function selectParagraph(page, selector) {
    await page.locator(selector).click({ clickCount: 3 });
}

/**
 * Waits until the last selectionChanged among those after the first `after` is for text containing `text`.
 * @param {ResultsCollector} collector
 * @param {string} text
 * @param {number} [after]
 */
async function reportedWith(collector, text, after = 0) {
    await expect.poll(async () => (await sent(collector, 'selectionChanged')).slice(after).pop()?.text ?? '').toContain(text);
    return lastSent(collector, 'selectionChanged');
}

/**
 * Lets selection checks scheduled for the next task, and any report coalesced to an animation frame, run before
 * asserting that something wasn't sent.
 * @param {import('@playwright/test').Page} page
 */
async function settle(page) {
    await page.evaluate(
        () =>
            new Promise((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
            }),
    );
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
function boxOf(page, selector) {
    return page.locator(selector).evaluate((element) => {
        const { left, top, right, bottom } = element.getBoundingClientRect();
        return { left, top, right, bottom };
    });
}

const anyRect = { left: expect.any(Number), top: expect.any(Number), right: expect.any(Number), bottom: expect.any(Number) };

test.describe('selectionTools', () => {
    test('sends nothing until text is selected', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#english').click();
        await settle(page);
        expect(await collector.outgoingMessages()).toEqual([]);
    });

    test('reports a selected paragraph, what kind of text it is and where it is', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        const params = await reportedWith(collector, ENGLISH);

        expect(params).toEqual({
            text: expect.stringContaining(ENGLISH),
            editable: false,
            selectionType: 'text',
            // Detected from its words; the page is marked as English too.
            language: 'en',
            rect: anyRect,
            devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
        });
        // The text's own boxes, which sit a little inside the paragraph's line boxes.
        const paragraph = await boxOf(page, '#english');
        expect(params.rect.left).toBeCloseTo(paragraph.left, 0);
        expect(params.rect.top).toBeGreaterThanOrEqual(paragraph.top);
        expect(params.rect.top).toBeLessThan(paragraph.top + 8);
        expect(params.rect.right).toBeGreaterThan(params.rect.left);
        expect(params.rect.right).toBeLessThanOrEqual(paragraph.right);
        expect(params.rect.bottom).toBeGreaterThan(params.rect.top);
        expect(params.rect.bottom).toBeLessThanOrEqual(paragraph.bottom);
    });

    test('reports the language of foreign text', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#spanish');
        expect(await reportedWith(collector, 'El perro')).toMatchObject({ selectionType: 'text', language: 'es' });
    });

    test('reports a text field selected with Ctrl+A as editable, measured without leaving anything in the page', async ({
        page,
    }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#field').focus();
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(1);

        const [params] = await sent(collector, 'selectionChanged');
        expect(params).toMatchObject({ text: 'This sentence have a grammar mistake in it.', editable: true, selectionType: 'text' });
        const field = await boxOf(page, '#field');
        expect(params.rect.left).toBeGreaterThanOrEqual(field.left);
        expect(params.rect.top).toBeGreaterThanOrEqual(field.top);
        expect(params.rect.right).toBeLessThanOrEqual(field.right);
        expect(params.rect.bottom).toBeLessThanOrEqual(field.bottom);
        expect(params.rect.right).toBeGreaterThan(params.rect.left);
        expect(params.rect.bottom).toBeGreaterThan(params.rect.top);
        await expect(page.locator('ddg-selection-tools')).toHaveCount(0);
    });

    test('reports select-all in an editable region as editable', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.evaluate(() => {
            const editable = document.createElement('div');
            editable.id = 'editable';
            editable.contentEditable = 'true';
            editable.textContent = 'This sentence have a grammar mistake in it.';
            document.body.append(editable);
        });
        await page.locator('#editable').focus();
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(1);
        expect((await sent(collector, 'selectionChanged'))[0]).toMatchObject({ editable: true });
    });

    test('classifies words and code', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#word').dblclick();
        expect((await reportedWith(collector, 'serendipity')).selectionType).toBe('word');

        await selectParagraph(page, '#code');
        expect((await reportedWith(collector, 'const answer')).selectionType).toBe('code');
    });

    test('leaves text the user cannot see out of the report', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        // A triple-click stops at the clipped text, which is positioned out of the line, so select the whole paragraph
        // and let a real key press report it.
        await page.evaluate(() =>
            window.getSelection()?.selectAllChildren(/** @type {Element} */ (document.getElementById('hidden-text'))),
        );
        await page.keyboard.press('Shift');
        const { text } = await reportedWith(collector, 'Seen first');
        expect(text.replace(/\s+/g, ' ').trim()).toBe('Seen first then and last. Gradient words stay.');

        // Native pairs the menu report with its own event by the browser's text, hidden parts included.
        const browserText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
        expect(browserText).toContain('secret');
        await page.locator('#hidden-text').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);
        const menu = await lastSent(collector, 'contextMenuOpened');
        expect(menu.text).not.toContain('secret');
        expect(menu.selectedTextKey).toBe(selectedTextKey(browserText));
    });

    test('reports text inside an ancestor with display: contents', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#in-contents');
        const { text } = await reportedWith(collector, 'A wrapper with no box');
        expect(text.trim()).toBe('A wrapper with no box of its own keeps this paragraph on the page.');
    });

    test('reports a selection inside an open shadow root', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        const code = page.locator('#shadow-code-text');
        await code.click({ clickCount: 3 });
        const params = await reportedWith(collector, 'const shadow');
        expect(params.selectionType).toBe('code');
        const box = await code.evaluate((element) => {
            const { left, top, right, bottom } = element.getBoundingClientRect();
            return { left, top, right, bottom };
        });
        expect(params.rect.left).toBeCloseTo(box.left, 0);
        expect(params.rect.top).toBeGreaterThanOrEqual(box.top - 1);
        expect(params.rect.bottom).toBeLessThanOrEqual(box.bottom + 1);
        // The document sees the selection as collapsed at the host, which mustn't clear the report.
        await settle(page);
        expect(await sent(collector, 'selectionCleared')).toEqual([]);

        const browserText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
        await code.click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);
        const menu = await lastSent(collector, 'contextMenuOpened');
        expect(menu).toMatchObject({ text: expect.stringContaining('const shadow'), selectionType: 'code' });
        expect(menu.selectedTextKey).toBe(selectedTextKey(browserText));
    });

    test('ignores selections and context menus fired from page script', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.evaluate(() => {
            const paragraph = /** @type {Element} */ (document.getElementById('english'));
            window.getSelection()?.selectAllChildren(paragraph);
            paragraph.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
            paragraph.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Shift', shiftKey: true }));
            paragraph.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 }));
        });
        await settle(page);
        expect(await collector.outgoingMessages()).toEqual([]);
    });

    test('reports nothing without user activation, but still clears', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await reportedWith(collector, ENGLISH);
        const reports = (await sent(collector, 'selectionChanged')).length;

        // As when the page has used up the gesture, or it expired before the event.
        await page.evaluate(() =>
            Object.defineProperty(Navigator.prototype, 'userActivation', { get: () => ({ isActive: false, hasBeenActive: true }) }),
        );
        await page.locator('#english').click({ button: 'right' });
        await selectParagraph(page, '#spanish');
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toHaveLength(reports);
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
        // Clearing never needs a gesture: the click that started the new selection cleared the old report.
        expect(await sent(collector, 'selectionCleared')).toEqual([{}]);
    });

    test('reports the same selection again, for native to drop', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#field').focus();
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(1);
        await page.keyboard.press('Shift');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(2);
        const [first, second] = await sent(collector, 'selectionChanged');
        expect(second).toEqual(first);
    });

    test('sends nothing for password fields or selections in a modal dialog', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#password').focus();
        await page.keyboard.press('Control+A');
        await settle(page);
        expect(await collector.outgoingMessages()).toEqual([]);

        await page.locator('#open-dialog').click();
        await selectParagraph(page, '#in-dialog');
        await expect(page.locator('#dialog')).toBeVisible();
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);

        // The menu still gets its report, but without a rect: no toolbar behind the dialog.
        await page.locator('#in-dialog').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);
        const menu = await lastSent(collector, 'contextMenuOpened');
        expect(menu.text).toContain('Text inside a modal dialog');
        expect(menu.rect).toBeUndefined();
    });

    test('clears the report for page-wide select-all and for clicking away, but only after a report', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.keyboard.press('Control+A');
        await page.mouse.click(5, 5);
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
        expect(await sent(collector, 'selectionCleared')).toEqual([]);

        await selectParagraph(page, '#english');
        await reportedWith(collector, ENGLISH);
        let reports = (await sent(collector, 'selectionChanged')).length;
        let clears = (await sent(collector, 'selectionCleared')).length;
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionCleared')).toHaveLength(clears + 1);
        expect(await lastSent(collector, 'selectionCleared')).toEqual({});
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toHaveLength(reports);

        await selectParagraph(page, '#english');
        await reportedWith(collector, ENGLISH, reports);
        reports = (await sent(collector, 'selectionChanged')).length;
        clears = (await sent(collector, 'selectionCleared')).length;
        await page.mouse.click(5, 5);
        await expect.poll(() => sent(collector, 'selectionCleared')).toHaveLength(clears + 1);
        // The collapsing selection and the click's release find nothing reported, so they send nothing more.
        await settle(page);
        expect(await sent(collector, 'selectionCleared')).toHaveLength(clears + 1);
        expect(await sent(collector, 'selectionChanged')).toHaveLength(reports);
    });

    test('clears the report on Escape', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#field').focus();
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(1);
        await page.keyboard.press('Escape');
        await expect.poll(() => sent(collector, 'selectionCleared')).toEqual([{}]);
    });

    test('reports where the selection moves while it is reported', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.evaluate(() => {
            const spacer = document.createElement('div');
            spacer.style.height = '3000px';
            document.body.append(spacer);
        });
        await selectParagraph(page, '#english');
        const { rect } = await reportedWith(collector, ENGLISH);

        await page.evaluate(() => window.scrollBy(0, 100));
        await expect.poll(async () => (await sent(collector, 'selectionMoved')).length).toBeGreaterThan(0);
        const moved = await lastSent(collector, 'selectionMoved');
        expect(moved).toEqual({
            rect: { left: rect.left, top: expect.any(Number), right: rect.right, bottom: expect.any(Number) },
            devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
        });
        expect(moved.rect.top).toBeCloseTo(rect.top - 100, 0);

        await page.keyboard.press('Escape');
        await expect.poll(async () => (await sent(collector, 'selectionCleared')).length).toBeGreaterThan(0);
        const moves = (await sent(collector, 'selectionMoved')).length;
        await page.evaluate(() => window.scrollBy(0, 100));
        await settle(page);
        expect(await sent(collector, 'selectionMoved')).toHaveLength(moves);
    });

    test('reports the selection once when the context menu opens', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#spanish');
        await reportedWith(collector, 'El perro');
        const reports = (await sent(collector, 'selectionChanged')).length;
        const clears = (await sent(collector, 'selectionCleared')).length;
        await page.locator('#spanish').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);

        const [params] = await sent(collector, 'contextMenuOpened');
        expect(params).toEqual({
            text: expect.stringContaining('El perro'),
            selectedTextKey: selectedTextKey(params.text),
            editable: false,
            selectionType: 'text',
            language: 'es',
            // For the toolbar native shows, collapsed, once the menu closes.
            rect: anyRect,
            devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
        });
        // Native hides its own toolbar for the menu, so the right-click leaves the report in place and sends no other.
        await settle(page);
        expect(await sent(collector, 'selectionCleared')).toHaveLength(clears);
        expect(await sent(collector, 'selectionChanged')).toHaveLength(reports);
    });

    test('reports a context menu with no selection as empty', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('body').click({ button: 'right', position: { x: 5, y: 5 } });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toEqual([{ text: '' }]);
    });

    test('reports the context menu without a rect while the toolbar is off, and no selections', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, TOOLBAR_OFF_CONFIG);
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);
        const [params] = await sent(collector, 'contextMenuOpened');
        expect(params).toMatchObject({ text: expect.stringContaining(ENGLISH), selectionType: 'text' });
        expect(params.rect).toBeUndefined();
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
        expect(await sent(collector, 'selectionCleared')).toEqual([]);
    });

    test('a top-level remote config entry still acts as a kill switch', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, DISABLED_CONFIG);
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await settle(page);
        expect(await collector.outgoingMessages()).toEqual([]);
    });

    test('stops reporting, context menus included, when native turns the tools off', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await reportedWith(collector, ENGLISH);
        const reports = (await sent(collector, 'selectionChanged')).length;

        await collector.simulateSubscriptionMessage(
            'selectionTools',
            'selectionToolsConfigChanged',
            selectionToolsConfig({ enabled: false }),
        );
        await expect.poll(() => sent(collector, 'selectionCleared')).toEqual([{}]);
        await selectParagraph(page, '#spanish');
        await page.locator('#spanish').click({ button: 'right' });
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toHaveLength(reports);
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
    });

    test('turns the toolbar on for an open page that loaded with it off', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, TOOLBAR_OFF_CONFIG);
        await collector.simulateSubscriptionMessage('selectionTools', 'selectionToolsConfigChanged', selectionToolsConfig());
        await selectParagraph(page, '#english');
        await reportedWith(collector, ENGLISH);
    });

    test('follows config pushed by native', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#field').focus();
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(1);

        // The same config again changes nothing.
        await collector.simulateSubscriptionMessage('selectionTools', 'selectionToolsConfigChanged', selectionToolsConfig());
        await settle(page);
        expect(await sent(collector, 'selectionCleared')).toEqual([]);

        await collector.simulateSubscriptionMessage(
            'selectionTools',
            'selectionToolsConfigChanged',
            selectionToolsConfig({ showToolbar: false }),
        );
        await expect.poll(() => sent(collector, 'selectionCleared')).toEqual([{}]);
        await page.keyboard.press('Control+A');
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toHaveLength(1);

        await collector.simulateSubscriptionMessage('selectionTools', 'selectionToolsConfigChanged', selectionToolsConfig());
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(2);
    });
});
