import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

test.describe('omnibar usage limits drawer', () => {
    test('stays hidden until native sends usageLimits and the input is focused', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'false' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.usageLimitsDrawer()).toHaveCount(0);

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
        await expect(omnibar.usageLimitsDrawer()).toBeVisible();
        await expect(omnibar.usageLimitsDrawer()).toContainText('75% of weekly limit');
    });

    test('is hidden when the AI input is not focused', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await expect(omnibar.usageLimitsDrawer()).toBeHidden();

        await omnibar.focusChatInput();
        await expect(omnibar.usageLimitsDrawer()).toBeVisible();

        await omnibar.chatInput().evaluate((el) => el.blur());
        await expect(omnibar.usageLimitsDrawer()).toBeHidden();
    });

    test('hides when native pushes usageLimits null', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.usageLimitsDrawer()).toBeVisible();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, usageLimits: null });

        await expect(omnibar.usageLimitsDrawer()).toHaveCount(0);
    });

    test('dismiss notifies native', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.usageLimitsDismiss().click();
        await omnibar.expectMethodCalledWith('omnibar_dismissUsageLimits', {});
    });

    test('primary CTA notifies with primaryModelId', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.usageLimitsDrawer().getByRole('button', { name: 'Switch to GPT-4o mini' }).click();
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
        await omnibar.usageLimitsDrawer().getByRole('button', { name: 'Try DuckDuckGo Subscription' }).click();
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

        await omnibar.usageLimitsDrawer().getByRole('button', { name: 'Switch to free model' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', { modelId: 'gpt-4o-mini' });
    });
});
