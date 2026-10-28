import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/selection-tools/pages/index.html';
const CONFIG = './integration-test/test-pages/selection-tools/config/config.json';
const DISABLED_CONFIG = './integration-test/test-pages/selection-tools/config/disabled.json';
const ENGLISH = 'The quick brown fox';

const ACTIONS = [
    {
        id: 'explain',
        label: 'Explain',
        icon: [{ d: 'M2 2h12v12H2z' }, { d: 'M4 4h8v8H4z', fillRule: 'evenodd' }],
        selectionTypes: ['code', 'text', 'long'],
    },
    { id: 'summarize', label: 'Summarize', selectionTypes: ['text', 'long'] },
    {
        id: 'translate',
        label: 'Translate',
        parameter: {
            kind: 'language',
            options: [
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
            ],
        },
    },
    { id: 'define', label: 'Define', selectionTypes: ['word'] },
    { id: 'fixGrammar', label: 'Fix grammar', editable: true },
    {
        id: 'tone',
        label: 'Change tone',
        parameter: {
            kind: 'choice',
            options: [
                { value: 'formal', label: 'Formal' },
                { value: 'casual', label: 'Casual' },
            ],
        },
    },
    { id: 'rewrite', label: 'Rewrite' },
];

/**
 * @param {Record<string, unknown>} [overrides]
 */
function selectionToolsConfig(overrides = {}) {
    return { enabled: true, showToolbar: true, userLanguage: 'en-US', actions: ACTIONS, ...overrides };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {Record<string, unknown>} [overrides]
 */
async function setup(page, testInfo, overrides) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withMockResponse({ initialSetup: selectionToolsConfig(overrides) });
    await collector.load(HTML, CONFIG);
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

/**
 * @param {{ actions: { id: string }[] }} params
 */
function actionIds(params) {
    return params.actions.map((action) => action.id);
}

test.describe('selectionTools', () => {
    test('sends nothing and asks native nothing until text is selected', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#english').click();
        await settle(page);
        expect(await sent(collector, 'initialSetup')).toEqual([]);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
        expect(await sent(collector, 'selectionCleared')).toEqual([]);
    });

    test('reports a selected paragraph with its actions and where it is', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        const params = await reportedWith(collector, ENGLISH);

        expect(params).toEqual({
            text: expect.stringContaining(ENGLISH),
            editable: false,
            selectionType: 'text',
            // The page is marked as English.
            sourceLanguage: 'en',
            actions: [
                { id: 'explain' },
                { id: 'summarize' },
                { id: 'translate', options: ['es', 'fr'] },
                { id: 'tone', options: ['formal', 'casual'] },
                { id: 'rewrite' },
            ],
            rect: { left: expect.any(Number), top: expect.any(Number), right: expect.any(Number), bottom: expect.any(Number) },
            devicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
            maxVisibleActions: 5,
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
        expect(await sent(collector, 'initialSetup')).toHaveLength(1);
    });

    test('translates foreign text into the user language straight away', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#spanish');
        const params = await reportedWith(collector, 'El perro');

        expect(params).toMatchObject({
            selectionType: 'text',
            sourceLanguage: 'es',
            // Translation leads for foreign text.
            actions: [
                { id: 'translate', parameter: 'en' },
                { id: 'explain' },
                { id: 'summarize' },
                { id: 'tone', options: ['formal', 'casual'] },
                { id: 'rewrite' },
            ],
        });
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
        expect(params.actions).toContainEqual({ id: 'fixGrammar' });
        const field = await boxOf(page, '#field');
        expect(params.rect.left).toBeGreaterThanOrEqual(field.left);
        expect(params.rect.top).toBeGreaterThanOrEqual(field.top);
        expect(params.rect.right).toBeLessThanOrEqual(field.right);
        expect(params.rect.bottom).toBeLessThanOrEqual(field.bottom);
        expect(params.rect.right).toBeGreaterThan(params.rect.left);
        expect(params.rect.bottom).toBeGreaterThan(params.rect.top);
        await expect(page.locator('ddg-selection-tools')).toHaveCount(0);
    });

    test('reports editing actions for select-all in an editable region', async ({ page }, testInfo) => {
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
        const [params] = await sent(collector, 'selectionChanged');
        expect(params).toMatchObject({ editable: true });
        expect(params.actions).toContainEqual({ id: 'fixGrammar' });
    });

    test('fits actions to the selection', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#word').dblclick();
        expect(await reportedWith(collector, 'serendipity')).toMatchObject({
            selectionType: 'word',
            actions: [
                { id: 'translate', options: ['es', 'fr'] },
                { id: 'define' },
                { id: 'tone', options: ['formal', 'casual'] },
                { id: 'rewrite' },
            ],
        });

        await selectParagraph(page, '#code');
        const code = await reportedWith(collector, 'const answer');
        expect(code.selectionType).toBe('code');
        expect(actionIds(code)).toContain('explain');
        expect(actionIds(code)).not.toContain('summarize');
    });

    test('reports even when no action fits', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { actions: ACTIONS.filter((action) => action.id === 'define') });
        await selectParagraph(page, '#english');
        expect((await reportedWith(collector, ENGLISH)).actions).toEqual([]);
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
        expect(await sent(collector, 'initialSetup')).toEqual([]);

        await page.locator('#open-dialog').click();
        await selectParagraph(page, '#in-dialog');
        await expect(page.locator('#dialog')).toBeVisible();
        await expect.poll(() => sent(collector, 'initialSetup')).toHaveLength(1);
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
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

    test('reports the fitting actions when the context menu opens', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#spanish');
        await reportedWith(collector, 'El perro');
        const clears = (await sent(collector, 'selectionCleared')).length;
        await page.locator('#spanish').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);

        const [params] = await sent(collector, 'contextMenuOpened');
        expect(params).toEqual({
            text: expect.stringContaining('El perro'),
            sourceLanguage: 'es',
            selectionType: 'text',
            editable: false,
            actions: [
                { id: 'translate', parameter: 'en' },
                { id: 'explain' },
                { id: 'summarize' },
                { id: 'tone', options: ['formal', 'casual'] },
                { id: 'rewrite' },
            ],
        });
        // Native hides its own toolbar for the menu, so the right-click leaves the report alone, and reports the menu's
        // selection for the chip native shows once the menu closes.
        await settle(page);
        expect(await sent(collector, 'selectionCleared')).toHaveLength(clears);
        const forMenu = (await sent(collector, 'selectionChanged')).filter((report) => report.contextMenu);
        expect(forMenu).toEqual([expect.objectContaining({ text: expect.stringContaining('El perro'), contextMenu: true })]);
    });

    test('reports an empty context menu after an earlier report, and nothing before one', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('body').click({ button: 'right', position: { x: 5, y: 5 } });
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
        expect(await sent(collector, 'initialSetup')).toEqual([]);

        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);
        await page.mouse.click(5, 5);
        await page.locator('body').click({ button: 'right', position: { x: 5, y: 5 } });
        const reports = await sent(collector, 'contextMenuOpened');
        expect(reports).toHaveLength(2);
        expect(reports[1]).toEqual({ text: '', actions: [] });
    });

    test('sends no selections with the toolbar turned off, but still reports the context menu', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { showToolbar: false });
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'contextMenuOpened')).toHaveLength(1);
        const [params] = await sent(collector, 'contextMenuOpened');
        expect(actionIds(params)).toEqual(['explain', 'summarize', 'translate', 'tone', 'rewrite']);
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
    });

    test('a top-level remote config entry still acts as a kill switch', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ initialSetup: selectionToolsConfig() });
        await collector.load(HTML, DISABLED_CONFIG);
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await settle(page);
        expect(await sent(collector, 'initialSetup')).toEqual([]);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
    });

    test('does nothing while disabled', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { enabled: false, showToolbar: false, userLanguage: undefined, actions: [] });
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect.poll(() => sent(collector, 'initialSetup')).toHaveLength(1);
        await settle(page);
        expect(await sent(collector, 'selectionChanged')).toEqual([]);
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
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

        const fewerActions = ACTIONS.filter((action) => action.id !== 'explain');
        await collector.simulateSubscriptionMessage(
            'selectionTools',
            'selectionToolsConfigChanged',
            selectionToolsConfig({ actions: fewerActions }),
        );
        await page.keyboard.press('Control+A');
        await expect.poll(() => sent(collector, 'selectionChanged')).toHaveLength(2);
        expect(actionIds(await lastSent(collector, 'selectionChanged'))).toEqual([
            'summarize',
            'translate',
            'fixGrammar',
            'tone',
            'rewrite',
        ]);
        expect(await sent(collector, 'initialSetup')).toHaveLength(1);
    });
});
