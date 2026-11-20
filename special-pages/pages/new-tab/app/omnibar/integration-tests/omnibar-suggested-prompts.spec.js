import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

const JOB_APPLICATION_PROMPT = /^Improve a job application\. If needed, ask me/;

/**
 * @param {NewtabPage} ntp
 * @param {Record<string, any>} [additional]
 */
async function openWithPrompts(ntp, additional = {}) {
    await ntp.reducedMotion();
    await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.showSuggestedPrompts': true, ...additional } });
}

/** @param {import('@playwright/test').Page} page */
const suggestionsTab = (page) => page.getByRole('tab', { name: 'Open chat suggestions' });

/**
 * Found by element: the previewed prompt is also the input's accessible name while it shows.
 * @param {import('@playwright/test').Page} page
 */
const composer = (page) => page.locator('[data-entry-point="omnibar"] textarea');

/**
 * @param {NewtabPage} ntp
 * @returns {Promise<any>}
 */
async function submittedChat(ntp) {
    const calls = await ntp.mocks.waitForCallCount({ method: 'omnibar_submitChat', count: 1 });
    return /** @type {any} */ (calls[0].payload).params;
}

test.describe('omnibar suggested prompts', () => {
    test('a chat suggestion is submitted with its ID', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();

        const params = await submittedChat(ntp);
        expect(params.chat).toMatch(JOB_APPLICATION_PROMPT);
        expect(params.suggestedPromptId).toBe('jobapplication');
    });

    test('double-clicking a suggestion sends it once', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).dblclick();

        await omnibar.expectExactMethodCallCount('omnibar_submitChat', 1);
    });

    test('sending a suggestion keeps the typed draft', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await omnibar.chatInput().fill('my draft');
        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click({ button: 'middle' });

        expect((await submittedChat(ntp)).chat).toMatch(JOB_APPLICATION_PROMPT);
        await expect(omnibar.chatInput()).toHaveValue('my draft');
    });

    test('hovering a suggestion previews it as a one-line placeholder', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        const input = composer(page);
        const oneLineHeight = await input.evaluate((el) => el.clientHeight);
        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).hover();

        await expect(input).toHaveAttribute('placeholder', /^Improve a job application\. .*…$/);
        await expect(input).toHaveValue('');
        expect(await input.evaluate((el) => el.clientHeight)).toBe(oneLineHeight);

        await suggestionsTab(page).hover();
        await expect(input).toHaveAttribute('placeholder', 'Ask anything privately');
    });

    test('focusing a suggestion previews it', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        const input = composer(page);
        await suggestionsTab(page).click();
        const prompt = page.getByRole('button', { name: 'Improve a job application' });
        await prompt.focus();
        await expect(input).toHaveAttribute('placeholder', /^Improve a job application\./);

        await prompt.blur();
        await expect(input).toHaveAttribute('placeholder', 'Ask anything privately');
    });

    test('a typed draft stays in place of the preview', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        const input = composer(page);
        await input.fill('my draft');
        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).hover();

        await expect(input).toHaveValue('my draft');
        expect(await input.evaluate((el) => el.matches(':placeholder-shown'))).toBe(false);
    });

    test('closing the panel under the pointer ends the preview', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        const input = composer(page);
        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).hover();
        await expect(input).toHaveAttribute('placeholder', /^Improve a job application\./);
        await page.keyboard.press('Escape');

        await expect(input).toHaveAttribute('placeholder', 'Ask anything privately');
    });

    test('a right-click on a suggestion does not send it; a middle-click opens it in a new tab', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await suggestionsTab(page).click();
        const prompt = page.getByRole('button', { name: 'Improve a job application' });
        await prompt.dispatchEvent('auxclick', { button: 2 });
        await omnibar.expectMethodNotCalled('omnibar_submitChat');

        await prompt.dispatchEvent('auxclick', { button: 1 });
        expect((await submittedChat(ntp)).target).toBe('new-tab');
    });

    test('a suggestion is submitted even before the terms are accepted, without accepting them', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.requiresAiTermsAcceptance': true });
        await omnibar.ready();

        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();

        const params = await submittedChat(ntp);
        expect(params.chat).toMatch(JOB_APPLICATION_PROMPT);
        expect(params.aiTermsAccepted).toBeUndefined();
    });

    test('an image suggestion is submitted with its ID', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.enableImageGeneration': true });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open create and edit images suggestions' }).click();
        await page.getByRole('button', { name: 'Create Comic' }).click();

        const params = await submittedChat(ntp);
        expect(params.chat).toMatch(/^Draw a comic-style illustration/);
        expect(params.suggestedPromptId).toBe('createcomic');
    });

    test('an image suggestion uses an image-capable model when the selected one cannot make images', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, {
            'omnibar.enableImageGeneration': true,
            'omnibar.enableUpdatedCreateImage': true,
            'omnibar.enableAiChatTools': true,
            'omnibar.selectedModelId': 'gpt-4o-mini',
        });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open create and edit images suggestions' }).click();
        await page.getByRole('button', { name: 'Create Comic' }).click();

        const params = await submittedChat(ntp);
        expect(params.toolChoice).toEqual(['GenerateImage']);
        expect(params.modelId).toBe('gpt-5-mini');
    });

    /** Native counts prompts from `omnibar_submitChat`; the page must not send a config change per prompt. */
    test('sending a prompt leaves the config alone', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await omnibar.chatInput().fill('pizza');
        await omnibar.chatInput().press('Enter');

        expect((await submittedChat(ntp)).suggestedPromptId).toBeUndefined();
        await omnibar.expectMethodNotCalled('omnibar_setConfig');
    });

    test('a drawer revealed on focus pushes the chips down instead of covering them', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.launcherPromo': true });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await expect(async () => {
            const drawer = await omnibar.noticeDrawer().boundingBox();
            const chips = await suggestionsTab(page).boundingBox();
            expect(drawer && chips && chips.y >= drawer.y + drawer.height).toBe(true);
        }).toPass();
    });

    test('clicking a chip while a revealed drawer is open keeps the drawer, so the chips do not move', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.launcherPromo': true });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        const before = await suggestionsTab(page).boundingBox();

        await suggestionsTab(page).click();

        await expect(page.getByRole('tabpanel')).toBeVisible();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        expect((await suggestionsTab(page).boundingBox())?.y).toBe(before?.y);
    });

    test('the chips hide when native turns them off', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();
        await expect(suggestionsTab(page)).toBeVisible();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, showSuggestedPrompts: false });

        await expect(suggestionsTab(page)).toBeHidden();
    });
});
