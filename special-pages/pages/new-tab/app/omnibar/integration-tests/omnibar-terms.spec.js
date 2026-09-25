import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

const requiresTerms = { 'omnibar.mode': 'ai', 'omnibar.requiresTermsAcceptance': 'true' };
const askDisclaimer = 'DuckDuckGo anonymizes your chats. By clicking ‘Ask’ you agree to our Privacy Policy & Terms of Service.';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

test.describe('omnibar terms disclaimer', () => {
    test('shows the disclaimer and an Ask button before acceptance', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toHaveText(askDisclaimer);

        await omnibar.chatInput().fill('pizza');
        await expect(omnibar.askButton()).toBeEnabled();
        await expect(omnibar.askButton()).toHaveAccessibleDescription(askDisclaimer);
        await expect(omnibar.chatSubmitButton()).toHaveCount(0);
    });

    test('shows the disclaimer and a disabled Ask button when the input is empty', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.askButton()).toBeDisabled();
    });

    test('keeps the widgets below clear of the disclaimer', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        const drawer = await omnibar.noticeDrawer().boundingBox();
        const favorites = await page.locator('[data-entry-point="favorites"]').boundingBox();
        expect(drawer && favorites && drawer.y + drawer.height <= favorites.y).toBe(true);
    });

    test('clicking Ask accepts the terms with the prompt', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await omnibar.chatInput().fill('pizza');
        await omnibar.askButton().click();

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'pizza', target: 'same-tab', termsAccepted: true });
    });

    test('pressing Enter submits without accepting the terms', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await omnibar.chatInput().fill('pizza');
        await omnibar.chatInput().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'pizza', target: 'same-tab' });
        await expect(omnibar.noticeDrawer()).toHaveText(askDisclaimer);
    });

    test('says Create in image generation mode', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { ...requiresTerms, 'omnibar.enableAiChatTools': 'true', 'omnibar.enableImageGeneration': 'true' },
        });
        await omnibar.ready();

        await omnibar.toolsMenuButton().click();
        await omnibar.createImageMenuItem().click();

        await expect(omnibar.noticeDrawer()).toHaveText(
            'DuckDuckGo anonymizes your chats. By clicking ‘Create’ you agree to our Privacy Policy & Terms of Service.',
        );

        await omnibar.imageGenerationInput().fill('a neon duck');
        await omnibar.createButton().click();

        await omnibar.expectMethodCalledWith('omnibar_submitChat', {
            chat: 'a neon duck',
            target: 'same-tab',
            mode: 'image-generation',
            termsAccepted: true,
        });
    });

    test('keeps the disclaimer after acceptance until native pushes the new config', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await omnibar.chatInput().fill('pizza');
        await omnibar.askButton().click({ modifiers: ['Meta'] });
        expect(await omnibar.lastSubmitChatParams()).toEqual({ chat: 'pizza', target: 'new-tab', termsAccepted: true });

        await expect(omnibar.noticeDrawer()).toHaveText(askDisclaimer);

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, requiresTermsAcceptance: false });
        await expect(omnibar.noticeDrawer()).toHaveCount(0);

        await omnibar.chatInput().fill('pasta');
        await omnibar.chatSubmitButton().click();
        expect(await omnibar.lastSubmitChatParams(2)).toEqual({ chat: 'pasta', target: 'same-tab' });
    });

    test('the link opens the Privacy Policy and Terms of Service', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await omnibar.termsLink().click();

        await omnibar.expectMethodCalledWith('omnibar_openPrivacyTerms', {});
        await omnibar.expectMethodNotCalled('omnibar_submitChat');
    });

    test('the voice button sends no acceptance', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { ...requiresTerms, 'omnibar.enableAiChatTools': 'true', 'omnibar.enableVoiceChatAccess': 'true' },
        });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.voiceChatButton().click();

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: '', target: 'same-tab', mode: 'voice-mode' });
        await expect(omnibar.noticeDrawer()).toBeVisible();
    });

    test('the Search tab Ask Duck.ai suggestion sends no acceptance', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.requiresTermsAcceptance': 'true' } });
        await omnibar.ready();

        await omnibar.searchInput().fill('pizza dough');
        await omnibar.expectSuggestionsCount(3);
        await omnibar.suggestions().filter({ hasText: 'Ask Duck.ai' }).click();

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'pizza dough', target: 'same-tab' });
    });

    test('takes priority over other notices', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: requiresTerms });
        await omnibar.ready();

        await omnibar.didReceiveConfig({
            mode: 'ai',
            enableAi: true,
            requiresTermsAcceptance: true,
            createImageModelSwitch: { message: 'Now using Luna', dismissible: true },
        });

        await expect(omnibar.noticeDrawer()).toHaveText(askDisclaimer);
    });

    test('shows nothing new when native sends no terms field', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toHaveCount(0);

        await omnibar.chatInput().fill('pizza');
        await expect(omnibar.askButton()).toHaveCount(0);
        await omnibar.chatSubmitButton().click();

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'pizza', target: 'same-tab' });
    });
});
