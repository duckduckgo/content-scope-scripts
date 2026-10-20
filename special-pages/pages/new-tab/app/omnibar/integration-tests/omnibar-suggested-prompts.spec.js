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
const promptButtons = (page) => page.getByRole('tabpanel').getByRole('listitem').getByRole('button');

/**
 * @param {NewtabPage} ntp
 * @returns {Promise<string[] | undefined>}
 */
async function lastSubmittedIds(ntp) {
    await ntp.mocks.waitForCallCount({ method: 'omnibar_setConfig', count: 1 });
    const calls = await ntp.mocks.outgoing({ names: ['omnibar_setConfig'] });
    return /** @type {any} */ (calls.at(-1)?.payload).params.submittedSuggestedPromptIds;
}

test.describe('omnibar suggested prompts', () => {
    test('the X notifies native, and native hiding them removes the chips', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await hideButton(page).click();
        await omnibar.expectMethodCalledWith('omnibar_dismissSuggestedPrompts', {});

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, showSuggestedPrompts: false });
        await expect(page.getByRole('tab', { name: 'Open chat suggestions' })).toBeHidden();
        await expect(hideButton(page)).toBeHidden();
    });

    test('with the terms accepted, a chat suggestion is submitted and moves last', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp);
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open chat suggestions' }).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();

        const calls = await ntp.mocks.waitForCallCount({ method: 'omnibar_submitChat', count: 1 });
        expect(/** @type {any} */ (calls[0].payload).params.chat).toMatch(JOB_APPLICATION_PROMPT);
        expect(await lastSubmittedIds(ntp)).toEqual(['jobapplication']);
    });

    test('before the terms are accepted, a chat suggestion fills the input, and sending it moves it last', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.requiresAiTermsAcceptance': true });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open chat suggestions' }).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();

        await expect(omnibar.chatInput()).toHaveValue(JOB_APPLICATION_PROMPT);
        await expect(omnibar.chatInput()).toBeFocused();
        await expect(page.getByRole('tabpanel')).toBeHidden();
        await omnibar.expectMethodNotCalled('omnibar_submitChat');

        await omnibar.askButton().click();

        const calls = await ntp.mocks.waitForCallCount({ method: 'omnibar_submitChat', count: 1 });
        expect(/** @type {any} */ (calls[0].payload).params).toMatchObject({
            chat: expect.stringMatching(JOB_APPLICATION_PROMPT),
            aiTermsAccepted: true,
        });
        expect(await lastSubmittedIds(ntp)).toEqual(['jobapplication']);
    });

    test('an edited suggestion does not move', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.requiresAiTermsAcceptance': true });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open chat suggestions' }).click();
        await page.getByRole('button', { name: 'Improve a job application' }).click();
        await omnibar.chatInput().press('End');
        await omnibar.chatInput().pressSequentially(' Thanks!');
        await omnibar.askButton().click();

        await omnibar.expectMethodCallCount('omnibar_submitChat', 1);
        const calls = await ntp.mocks.outgoing({ names: ['omnibar_setConfig'] });
        expect(calls.some((call) => /** @type {any} */ (call.payload).params.submittedSuggestedPromptIds?.length)).toBe(false);
    });

    test('before the terms are accepted, an image suggestion fills the input in Create Image mode without reordering', async ({
        page,
    }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.requiresAiTermsAcceptance': true, 'omnibar.enableImageGeneration': true });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open create and edit images suggestions' }).click();
        await page.getByRole('button', { name: 'Create Comic' }).click();

        await expect(omnibar.imageGenerationInput()).toHaveValue(/^Draw a comic-style illustration/);
        await omnibar.expectMethodNotCalled('omnibar_submitChat');

        await omnibar.createButton().click();
        await omnibar.expectMethodCallCount('omnibar_submitChat', 1);
        const calls = await ntp.mocks.outgoing({ names: ['omnibar_setConfig'] });
        expect(calls.some((call) => /** @type {any} */ (call.payload).params.submittedSuggestedPromptIds?.length)).toBe(false);
    });

    test('previously submitted chat suggestions are listed last, oldest first', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await openWithPrompts(ntp, { 'omnibar.submittedSuggestedPromptIds': 'homefix,jobapplication' });
        await omnibar.ready();

        await page.getByRole('tab', { name: 'Open chat suggestions' }).click();
        await expect(promptButtons(page).first()).toHaveText('Understand common financial terms');

        await page.getByRole('button', { name: 'Show next suggestions' }).click();
        await page.getByRole('button', { name: 'Show next suggestions' }).click();
        await expect(promptButtons(page)).toHaveText([
            'Develop better money habits',
            'Improve my sleep',
            'Fix something in my home',
            'Improve a job application',
        ]);
    });
});
