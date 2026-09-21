import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

test.describe('omnibar notice drawer', () => {
    test('stays hidden until native sends usageLimits and the input is focused', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'false' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toHaveCount(0);

        await omnibar.didReceiveConfig({
            mode: 'ai',
            enableAi: true,
            usageLimits: {
                message: '75% of weekly limit',
                dismissible: true,
                icon: 'info',
            },
        });

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).toContainText('75% of weekly limit');
    });

    test('is hidden when the AI input is not focused', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toBeHidden();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.chatInput().evaluate((el) => el.blur());
        await expect(omnibar.noticeDrawer()).toBeHidden();
    });

    test('keeps the drawer and chats list open while focus moves into the drawer', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: {
                'omnibar.mode': 'ai',
                'omnibar.usageLimits': 'approaching',
                'omnibar.enableAi': true,
                'omnibar.enableRecentAiChats': true,
            },
        });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.aiChats().first()).toBeVisible();

        // The drawer renders outside the composer, so focusing its CTA must not read as leaving the omnibar.
        await omnibar.usageLimitsCtaMenuButton().focus();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.aiChats().first()).toBeVisible();

        await omnibar.customizeButton().focus();
        await expect(omnibar.noticeDrawer()).toBeHidden();
    });

    test('shows Create Image model switch without focusing the AI input', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'false' } });
        await omnibar.ready();

        await omnibar.didReceiveConfig({
            mode: 'ai',
            enableAi: true,
            createImageModelSwitch: {
                message: 'Now using Luna',
                secondaryText: "Gemma can't create images.",
                dismissible: true,
            },
        });

        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).toContainText('Now using Luna');
    });

    test('keeps usage-limit blocking while Create Image takes visual priority and dismisses independently', async ({
        page,
    }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'false' } });
        await omnibar.ready();

        await omnibar.didReceiveConfig({
            mode: 'ai',
            enableAi: true,
            createImageModelSwitch: {
                message: 'Now using Luna',
                dismissible: true,
            },
            usageLimits: {
                message: 'Weekly limit reached',
                blocksPrompt: true,
                dismissible: true,
            },
        });

        await expect(omnibar.noticeDrawer()).toContainText('Now using Luna');
        await expect(omnibar.noticeDrawer()).not.toContainText('Weekly limit reached');
        await expect(omnibar.chatInput()).toHaveAttribute('readonly');

        await omnibar.noticeDismiss().click();
        await omnibar.expectMethodCalledWith('omnibar_dismissCreateImageModelSwitch', {});

        await omnibar.didReceiveConfig({
            mode: 'ai',
            enableAi: true,
            createImageModelSwitch: null,
            usageLimits: {
                message: 'Weekly limit reached',
                blocksPrompt: true,
                dismissible: true,
            },
        });
        await omnibar.chatInput().evaluate((element) => element.focus());
        await expect(omnibar.noticeDrawer()).toContainText('Weekly limit reached');
    });

    test('hides when native pushes usageLimits null', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, usageLimits: null });

        await expect(omnibar.noticeDrawer()).toHaveCount(0);
    });

    test('dismiss notifies native', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.noticeDismiss().click();
        await omnibar.expectMethodCalledWith('omnibar_dismissUsageLimits', {});
    });

    test('primary CTA notifies with primaryModelId', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.noticeDrawer().getByRole('button', { name: 'Switch to GPT-4o mini' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', { modelId: 'gpt-4o-mini' });
    });

    test('menu alternative notifies with the selected model id', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.usageLimitsCtaMenuButton().click();
        await expect(omnibar.usageLimitsCtaMenu()).toBeVisible();
        await expect(omnibar.usageLimitsCtaMenu()).toContainText('Switch to a more efficient model');
        await omnibar.usageLimitsCtaMenu().getByRole('menuitem', { name: 'GPT-5 mini' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', { modelId: 'gpt-5-mini' });
    });

    test('non-model CTA notifies without modelId', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'reached' } });
        await omnibar.ready();

        // blocksPrompt marks the composer aria-disabled; focus still reveals the drawer.
        await omnibar.chatInput().evaluate((el) => el.focus());
        await omnibar.noticeDrawer().getByRole('button', { name: 'Try DuckDuckGo Subscription' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', {});
    });

    test('blocksPrompt freezes the AI composer', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'reached' } });
        await omnibar.ready();

        await expect(omnibar.chatInput()).toHaveAttribute('readonly');
        await expect(omnibar.chatInput()).toHaveAttribute('aria-disabled', 'true');
    });

    test('blocksPrompt disables the AI composer toolbar', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: {
                'omnibar.mode': 'ai',
                'omnibar.usageLimits': 'reached',
                'omnibar.enableAiChatTools': 'true',
                'omnibar.enableWebSearch': 'true',
                'omnibar.enableImageGeneration': 'true',
                'omnibar.enableVoiceChatAccess': 'true',
                'omnibar.selectedModelId': 'gpt-5-mini',
            },
        });
        await omnibar.ready();

        await expect(omnibar.directFileButton()).toBeDisabled();
        await expect(omnibar.toolsMenuButton()).toBeDisabled();
        await expect(omnibar.reasoningPickerButton()).toBeDisabled();
        await expect(omnibar.modelSelectorButton()).toBeDisabled();
        await expect(omnibar.voiceChatButton()).toBeDisabled();
    });

    test('reached-switch CTA notifies with primaryModelId and has no menu header', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'reached-switch' } });
        await omnibar.ready();

        await omnibar.chatInput().evaluate((el) => el.focus());
        await omnibar.usageLimitsCtaMenuButton().click();

        const menu = page.getByRole('menu', { name: 'Switch model' });
        await expect(menu).toBeVisible();
        await expect(menu.getByText('Switch to a more efficient model')).toHaveCount(0);

        await omnibar.noticeDrawer().getByRole('button', { name: 'Switch to free model' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', { modelId: 'gpt-4o-mini' });
    });
});
