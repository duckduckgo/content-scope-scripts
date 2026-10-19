import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/selection-tools/pages/index.html';
const CONFIG = './integration-test/test-pages/selection-tools/config/config.json';

const ACTIONS = [
    { id: 'explain', label: 'Explain', selectionTypes: ['code', 'text', 'long'] },
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
    await collector.waitForMessage('initialSetup');
    return collector;
}

/** @param {import('@playwright/test').Page} page */
function host(page) {
    return page.locator('ddg-selection-tools');
}

/** @param {import('@playwright/test').Page} page */
function selectionToolbar(page) {
    return host(page).getByRole('toolbar');
}

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 */
async function sent(collector, method) {
    const messages = await collector.outgoingMessages();
    return messages.flatMap(({ payload }) =>
        'method' in payload && payload.method === method && 'params' in payload ? [payload.params] : [],
    );
}

/**
 * Triple-click selects the paragraph with a real, trusted mouse.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function selectParagraph(page, selector) {
    await page.locator(selector).click({ clickCount: 3 });
}

test.describe('selectionTools', () => {
    test('adds nothing to the page until text is selected, and removes it again', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.locator('#english').click();
        await expect(host(page)).toHaveCount(0);

        await selectParagraph(page, '#english');
        await expect(selectionToolbar(page)).toBeVisible();
        const buttons = selectionToolbar(page).getByRole('button');
        await expect(buttons).toHaveText(['Ask Duck.ai…', 'Explain', 'Summarize', 'Translate', 'Change tone', '']);
        await expect(selectionToolbar(page).getByRole('button', { name: 'More Duck.ai actions' })).toBeVisible();

        await page.mouse.click(5, 5);
        await expect(host(page)).toHaveCount(0);
    });

    test('sends the selection for a clicked action', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await selectionToolbar(page).getByRole('button', { name: 'Explain' }).click();

        const [params] = await sent(collector, 'actionRequested');
        expect(params).toEqual({ actionId: 'explain', text: expect.stringContaining('The quick brown fox') });
        await expect(selectionToolbar(page).getByText('Sent to Duck.ai')).toBeVisible();
    });

    test('Ask attaches the selection without an action', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await selectionToolbar(page).getByRole('button', { name: 'Ask Duck.ai…' }).click();

        const [params] = await sent(collector, 'actionRequested');
        expect(params).toEqual({ actionId: 'ask', text: expect.stringContaining('The quick brown fox') });
    });

    test('translates foreign text into the user language straight away', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#spanish');
        // Translation leads for foreign text.
        await expect(selectionToolbar(page).getByRole('button').nth(1)).toHaveText('Translate');
        await selectionToolbar(page).getByRole('button', { name: 'Translate' }).click();

        const [params] = await sent(collector, 'actionRequested');
        expect(params).toEqual({
            actionId: 'translate',
            text: expect.stringContaining('El perro'),
            parameter: 'en',
            sourceLanguage: 'es',
        });
    });

    test('offers other languages for text in the user language', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await selectionToolbar(page).getByRole('button', { name: 'Translate' }).hover();

        const menu = host(page).getByRole('menu');
        await expect(menu.getByRole('menuitem')).toHaveText(['Spanish', 'French']);
        await menu.getByRole('menuitem', { name: 'Spanish' }).click();

        const [params] = await sent(collector, 'actionRequested');
        expect(params).toMatchObject({ actionId: 'translate', parameter: 'es', sourceLanguage: 'en' });
    });

    test('the more menu holds the overflow and the toolbar options', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await selectionToolbar(page).getByRole('button', { name: 'More Duck.ai actions' }).click();

        const menu = host(page).getByRole('menu');
        await expect(menu.getByRole('menuitem')).toHaveText(['Rewrite', 'Hide selection tools', 'Open AI Settings']);
        await menu.getByRole('menuitem', { name: 'Open AI Settings' }).click();
        expect(await sent(collector, 'openAiSettings')).toEqual([{}]);
    });

    test('hiding the tools turns the toolbar off', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await selectionToolbar(page).getByRole('button', { name: 'More Duck.ai actions' }).click();
        await host(page).getByRole('menuitem', { name: 'Hide selection tools' }).click();

        expect(await sent(collector, 'hideSelectionTools')).toEqual([{}]);
        await expect(host(page)).toHaveCount(0);
        await selectParagraph(page, '#spanish');
        await expect(host(page)).toHaveCount(0);
    });

    test('fits actions to the selection', async ({ page }, testInfo) => {
        await setup(page, testInfo);

        await page.locator('#word').dblclick();
        await expect(selectionToolbar(page).getByRole('button', { name: 'Define' })).toBeVisible();
        await expect(selectionToolbar(page).getByRole('button', { name: 'Explain' })).toHaveCount(0);

        await selectParagraph(page, '#code');
        await expect(selectionToolbar(page).getByRole('button', { name: 'Explain' })).toBeVisible();
        await expect(selectionToolbar(page).getByRole('button', { name: 'Summarize' })).toHaveCount(0);
    });

    test('offers editing actions in text fields, and leaves password fields alone', async ({ page }, testInfo) => {
        await setup(page, testInfo);

        await page.locator('#field').focus();
        await page.keyboard.press('Control+A');
        await expect(selectionToolbar(page).getByRole('button', { name: 'Fix grammar' })).toBeVisible();

        await page.locator('#password').focus();
        await page.keyboard.press('Control+A');
        await expect(host(page)).toHaveCount(0);
    });

    test('shows nothing for selections in a modal dialog', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.locator('#open-dialog').click();
        await selectParagraph(page, '#in-dialog');
        await expect(page.locator('#dialog')).toBeVisible();
        await expect(host(page)).toHaveCount(0);
    });

    test('reports the fitting actions when the context menu opens, and keeps the chip', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#spanish');
        await page.locator('#spanish').click({ button: 'right' });

        const [params] = await sent(collector, 'contextMenuOpened');
        expect(params).toEqual({
            text: expect.stringContaining('El perro'),
            sourceLanguage: 'es',
            actions: [
                { id: 'translate', parameter: 'en' },
                { id: 'explain' },
                { id: 'summarize' },
                { id: 'tone', options: ['formal', 'casual'] },
                { id: 'rewrite' },
            ],
        });
        await expect(selectionToolbar(page)).toBeVisible();
    });

    test('reports an empty context menu without a selection', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('body').click({ button: 'right', position: { x: 5, y: 5 } });
        expect(await sent(collector, 'contextMenuOpened')).toEqual([{ text: '', actions: [] }]);
    });

    test('still reports context menu actions with the toolbar turned off', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { showToolbar: false });
        await selectParagraph(page, '#english');
        await expect(host(page)).toHaveCount(0);
        await page.locator('#english').click({ button: 'right' });
        const [params] = await sent(collector, 'contextMenuOpened');
        expect(params?.actions.map((/** @type {{ id: string }} */ action) => action.id)).toEqual([
            'explain',
            'summarize',
            'translate',
            'tone',
            'rewrite',
        ]);
        await expect(host(page)).toHaveCount(0);
    });

    test('does nothing while disabled', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { enabled: false, showToolbar: false, userLanguage: undefined, actions: [] });
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect(host(page)).toHaveCount(0);
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
    });

    test('follows config pushed by native', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await expect(selectionToolbar(page)).toBeVisible();

        await collector.simulateSubscriptionMessage(
            'selectionTools',
            'selectionToolsConfigChanged',
            selectionToolsConfig({ showToolbar: false }),
        );
        await expect(host(page)).toHaveCount(0);

        const fewerActions = ACTIONS.filter((action) => action.id !== 'explain');
        await collector.simulateSubscriptionMessage(
            'selectionTools',
            'selectionToolsConfigChanged',
            selectionToolsConfig({ actions: fewerActions }),
        );
        await selectParagraph(page, '#english');
        await expect(selectionToolbar(page).getByRole('button')).toHaveText([
            'Ask Duck.ai…',
            'Summarize',
            'Translate',
            'Change tone',
            'Rewrite',
            '',
        ]);
        expect(await sent(collector, 'initialSetup')).toHaveLength(1);
    });

    test('ignores clicks made by page script', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await selectParagraph(page, '#english');
        await expect(selectionToolbar(page)).toBeVisible();

        // The shadow root is only open in test builds; a page can't reach it in production.
        await page.evaluate(() => {
            for (const button of document.querySelector('ddg-selection-tools')?.shadowRoot?.querySelectorAll('button') ?? []) {
                /** @type {HTMLElement} */ (button).click();
            }
        });
        expect(await sent(collector, 'actionRequested')).toEqual([]);
    });
});
