import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/selection-tools/pages/index.html';
const CONFIG = './integration-test/test-pages/selection-tools/config/config.json';
const DISABLED_CONFIG = './integration-test/test-pages/selection-tools/config/disabled.json';

const ACTIONS = [
    {
        id: 'explain',
        label: 'Explain',
        icon: [{ d: 'M2 2h12v12H2z' }, { d: 'M4 4h8v8H4z', fillRule: 'evenodd' }],
        selectionTypes: ['code', 'text', 'long'],
    },
    // An icon in older native's form, a single stroked path: the default icon stands in.
    { id: 'summarize', label: 'Summarize', icon: 'M2 8h12', selectionTypes: ['text', 'long'] },
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
    test('adds nothing to the page and asks native nothing until text is selected', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await page.locator('#english').click();
        await expect(host(page)).toHaveCount(0);
        expect(await sent(collector, 'initialSetup')).toEqual([]);

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

    test('a top-level remote config entry still acts as a kill switch', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ initialSetup: selectionToolsConfig() });
        await collector.load(HTML, DISABLED_CONFIG);
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect(host(page)).toHaveCount(0);
        expect(await sent(collector, 'initialSetup')).toEqual([]);
        expect(await sent(collector, 'contextMenuOpened')).toEqual([]);
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

        // The same config again changes nothing.
        await collector.simulateSubscriptionMessage('selectionTools', 'selectionToolsConfigChanged', selectionToolsConfig());
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

    test('Ask shows the Duck.ai logo for the colour scheme', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await selectParagraph(page, '#english');
        const ask = selectionToolbar(page).getByRole('button', { name: 'Ask Duck.ai…' });
        await expect(ask.locator('svg.logo-light')).toBeVisible();
        await expect(ask.locator('svg.logo-dark')).toBeHidden();

        await page.emulateMedia({ colorScheme: 'dark' });
        await expect(ask.locator('svg.logo-dark')).toBeVisible();
        await expect(ask.locator('svg.logo-light')).toBeHidden();
        await expect(ask.locator('svg.logo-dark linearGradient')).toHaveCount(3);
    });

    test('leaves Ask out when native says it is unavailable', async ({ page }, testInfo) => {
        await setup(page, testInfo, { askAvailable: false });
        await selectParagraph(page, '#english');
        await expect(selectionToolbar(page).getByRole('button')).toHaveText(['Explain', 'Summarize', 'Translate', 'Change tone', '']);
        // The logo still leads, as a mark the chip can collapse to.
        await expect(selectionToolbar(page).locator('.mark svg.logo-light')).toBeVisible();
    });

    test('shows nothing without Ask or a fitting action', async ({ page }, testInfo) => {
        await setup(page, testInfo, { askAvailable: false, actions: ACTIONS.filter((action) => action.id === 'define') });
        await selectParagraph(page, '#english');
        await page.locator('#english').click({ button: 'right' });
        await expect(host(page)).toHaveCount(0);
    });

    test('draws native glyphs filled, and the default icon for anything else', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await selectParagraph(page, '#english');
        const explain = selectionToolbar(page).getByRole('button', { name: 'Explain' }).locator('path');
        await expect(explain).toHaveCount(2);
        await expect(explain.nth(0)).toHaveAttribute('fill', 'currentColor');
        await expect(explain.nth(0)).not.toHaveAttribute('fill-rule', /.*/);
        await expect(explain.nth(1)).toHaveAttribute('fill-rule', 'evenodd');
        const summarize = selectionToolbar(page).getByRole('button', { name: 'Summarize' }).locator('path');
        await expect(summarize).toHaveCount(1);
        await expect(summarize).toHaveAttribute('d', /^M6\.81286 1\.53649/);
    });

    test('an action with choices swaps its icon for a chevron while they are open', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await selectParagraph(page, '#english');
        const translate = selectionToolbar(page).getByRole('button', { name: 'Translate' });
        await expect(translate.locator('svg.when-closed')).toBeVisible();
        await expect(translate.locator('svg.when-open')).toBeHidden();
        await expect(translate.locator('svg')).toHaveCount(2);

        await translate.hover();
        await expect(host(page).getByRole('menu')).toBeVisible();
        await expect(translate).toHaveClass('action active');
        await expect(translate.locator('svg.when-open')).toBeVisible();
        await expect(translate.locator('svg.when-closed')).toBeHidden();
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
