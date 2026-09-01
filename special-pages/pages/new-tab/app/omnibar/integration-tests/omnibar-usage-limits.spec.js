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
    test('stays hidden until native sends usageLimits', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'false' } });
        await omnibar.ready();

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

        await expect(omnibar.usageLimitsDrawer()).toBeVisible();
        await expect(omnibar.usageLimitsDrawer()).toContainText('75% of weekly limit');
    });

    test('hides when native pushes usageLimits null', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await expect(omnibar.usageLimitsDrawer()).toBeVisible();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, usageLimits: null });

        await expect(omnibar.usageLimitsDrawer()).toHaveCount(0);
    });

    test('dismiss notifies native', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.usageLimitsDismiss().click();
        await omnibar.expectMethodCalledWith('omnibar_dismissUsageLimits', {});
    });

    test('primary CTA notifies with primaryModelId', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

        await omnibar.usageLimitsDrawer().getByRole('button', { name: 'Switch to GPT-4o mini' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', { modelId: 'gpt-4o-mini' });
    });

    test('menu alternative notifies with the selected model id', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.usageLimits': 'approaching' } });
        await omnibar.ready();

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
});
