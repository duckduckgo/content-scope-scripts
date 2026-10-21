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
const hideButton = (page) => page.getByRole('button', { name: 'Hide suggestions' });

/** @param {import('@playwright/test').Page} page */
const suggestionsTab = (page) => page.getByRole('tab', { name: 'Open chat suggestions' });

/**
 * @param {NewtabPage} ntp
 * @returns {Promise<number | undefined>}
 */
async function lastSubmitCount(ntp) {
    await ntp.mocks.waitForCallCount({ method: 'omnibar_setConfig', count: 1 });
    const calls = await ntp.mocks.outgoing({ names: ['omnibar_setConfig'] });
    return /** @type {any} */ (calls[calls.length - 1].payload).params.suggestedPromptsSubmitCount;
}

/**
 * @param {NewtabPage} ntp
 * @returns {Promise<any>}
 */
async function submittedChat(ntp) {
    const calls = await ntp.mocks.waitForCallCount({ method: 'omnibar_submitChat', count: 1 });
    return /** @type {any} */ (calls[0].payload).params;
}

test.describe('omnibar suggested prompts', () => {
    test('the X hides the chips and saves the dismissal to native config', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await hideButton(page).click();

        await expect(suggestionsTab(page)).toBeHidden();
        await expect(hideButton(page)).toBeHidden();
        const calls = await ntp.mocks.waitForCallCount({ method: 'omnibar_setConfig', count: 1 });
        expect(/** @type {any} */ (calls[0].payload).params.suggestedPromptsDismissed).toBe(true);
    });

    test('the chips stay hidden when native config says they were dismissed', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, showSuggestedPrompts: true, suggestedPromptsDismissed: true });

        await expect(suggestionsTab(page)).toBeHidden();
    });

    test('a chat suggestion is submitted with its ID and counted', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();

        const params = await submittedChat(ntp);
        expect(params.chat).toMatch(JOB_APPLICATION_PROMPT);
        expect(params.suggestedPromptId).toBe('jobapplication');
        expect(await lastSubmitCount(ntp)).toBe(1);
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

    test('an image suggestion is submitted and counted', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.enableImageGeneration': true });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open create and edit images suggestions' }).click();
        await page.getByRole('button', { name: 'Create Comic' }).click();

        const params = await submittedChat(ntp);
        expect(params.chat).toMatch(/^Draw a comic-style illustration/);
        expect(params.suggestedPromptId).toBe('createcomic');
        expect(await lastSubmitCount(ntp)).toBe(1);
    });

    test('the fifth submission hides the chips', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.suggestedPromptsSubmitCount': 4 });
        await omnibar.ready();

        await suggestionsTab(page).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();

        expect(await lastSubmitCount(ntp)).toBe(5);
        await expect(suggestionsTab(page)).toBeHidden();
        await expect(hideButton(page)).toBeHidden();
    });

    test('the chips stay hidden once 5 prompts were submitted', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.suggestedPromptsSubmitCount': 5 });
        await omnibar.ready();

        await expect(omnibar.chatInput()).toBeVisible();
        await expect(suggestionsTab(page)).toBeHidden();
    });
});
