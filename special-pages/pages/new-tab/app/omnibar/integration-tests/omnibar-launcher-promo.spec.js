import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

test.describe('omnibar launcher promo', () => {
    test('shows on focus', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true } });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toBeHidden();
        await omnibar.expectMethodNotCalled('omnibar_launcherPromoShown');

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).toContainText('Chat privately outside the browser • Add Duck.ai to your menu bar');
        await omnibar.expectMethodCalledWith('omnibar_launcherPromoShown', {});
    });

    test('shown is sent once per page load', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.chatInput().evaluate((el) => el.blur());
        await expect(omnibar.noticeDrawer()).toBeHidden();
        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.expectExactMethodCallCount('omnibar_launcherPromoShown', 1);
    });

    test('Try Now notifies native', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.noticeDrawer().getByRole('button', { name: 'Try Now' }).click();

        await omnibar.expectMethodCalledWith('omnibar_selectLauncherPromoCta', {});
    });

    test('dismiss notifies native', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.noticeDismiss().click();

        await omnibar.expectMethodCalledWith('omnibar_dismissLauncherPromo', {});
    });

    test('native pushing null hides the promo', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, launcherPromo: null });
        await expect(omnibar.noticeDrawer()).toHaveCount(0);
    });

    test('ranks below usage limits', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true, 'omnibar.usageLimits': 'approaching' },
        });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).not.toContainText('Chat privately outside the browser');
        await omnibar.expectMethodNotCalled('omnibar_launcherPromoShown');
    });

    test('a prompt sent while the promo is on screen says so', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true } });
        await omnibar.ready();

        await omnibar.chatInput().fill('hello');
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.chatInput().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'hello', target: 'same-tab', launcherPromoVisible: true });
    });

    test('a prompt sent while another notice takes the drawer omits the promo', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': true, 'omnibar.usageLimits': 'approaching' },
        });
        await omnibar.ready();

        await omnibar.chatInput().fill('hello');
        await omnibar.chatInput().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'hello', target: 'same-tab' });
    });
});
