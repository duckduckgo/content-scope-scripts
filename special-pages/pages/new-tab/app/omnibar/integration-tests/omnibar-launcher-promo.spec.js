import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

const HINT = 'Ask privately (⌥ Space opens Duck.ai anywhere)';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

test.describe('omnibar launcher promo', () => {
    test('promo drawer shows on focus', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo' } });
        await omnibar.ready();

        await expect(omnibar.noticeDrawer()).toBeHidden();
        await omnibar.expectMethodNotCalled('omnibar_launcherPromoShown');

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).toContainText('Chat privately outside the browser • Add Duck.ai to your menu bar');
        await omnibar.expectMethodCalledWith('omnibar_launcherPromoShown', { kind: 'promo' });
    });

    test('shown is sent once per kind per page load', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.chatInput().evaluate((el) => el.blur());
        await expect(omnibar.noticeDrawer()).toBeHidden();
        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.expectExactMethodCallCount('omnibar_launcherPromoShown', 1);
    });

    test('Try Now notifies native and the hint replaces the promo without reload', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.noticeDrawer().getByRole('button', { name: 'Try Now' }).click();

        await omnibar.expectMethodCalledWith('omnibar_selectLauncherPromoCta', { kind: 'promo' });

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, launcherPromo: { kind: 'shortcutHint', placeholder: HINT } });
        await expect(omnibar.noticeDrawer()).toHaveCount(0);
        await expect(omnibar.chatTextarea()).toHaveAttribute('placeholder', HINT);
        const shownCalls = await ntp.mocks.waitForCallCount({ method: 'omnibar_launcherPromoShown', count: 2 });
        expect(shownCalls.map((call) => call.payload.params)).toEqual([{ kind: 'promo' }, { kind: 'shortcutHint' }]);
    });

    test('dismiss notifies native and hides the promo', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await omnibar.noticeDismiss().click();

        await omnibar.expectMethodCalledWith('omnibar_dismissLauncherPromo', { kind: 'promo' });
    });

    test('ranks below usage limits', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo', 'omnibar.usageLimits': 'approaching' },
        });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).not.toContainText('Chat privately outside the browser');
        await omnibar.expectMethodNotCalled('omnibar_launcherPromoShown');
    });

    test('shortcut hint is the placeholder and hides once the user types', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'shortcutHint' } });
        await omnibar.ready();

        await expect(omnibar.chatTextarea()).toHaveAttribute('placeholder', HINT);
        await expect(omnibar.chatTextarea()).toHaveAttribute('aria-label', HINT);
        await omnibar.expectMethodCalledWith('omnibar_launcherPromoShown', { kind: 'shortcutHint' });

        await omnibar.chatTextarea().click();
        await expect(omnibar.noticeDrawer()).toHaveCount(0);
    });

    test('shortcut nudge CTA notifies native with its kind', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'shortcutNudge' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer().locator('kbd')).toHaveText('⌥ Space');
        await expect(omnibar.noticeDismiss()).toHaveCount(0);
        await omnibar.noticeDrawer().getByRole('button', { name: 'Turn On' }).click();

        await omnibar.expectMethodCalledWith('omnibar_selectLauncherPromoCta', { kind: 'shortcutNudge' });
    });

    test('a prompt sent while the promo is on screen carries its kind', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo' } });
        await omnibar.ready();

        await omnibar.chatTextarea().fill('hello');
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.chatTextarea().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'hello', target: 'same-tab', launcherPromoKind: 'promo' });
    });

    test('a prompt sent while another notice takes the drawer omits the launcher promo', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo', 'omnibar.usageLimits': 'approaching' },
        });
        await omnibar.ready();

        await omnibar.chatTextarea().fill('hello');
        await omnibar.chatTextarea().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'hello', target: 'same-tab' });
    });

    test('a prompt sent with only the shortcut hint omits the launcher promo', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'shortcutHint' } });
        await omnibar.ready();

        await omnibar.chatTextarea().fill('hello');
        await omnibar.chatTextarea().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', { chat: 'hello', target: 'same-tab' });
    });

    test('native pushing null hides the promo', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'omnibar.mode': 'ai', 'omnibar.launcherPromo': 'promo' } });
        await omnibar.ready();

        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.didReceiveConfig({ mode: 'ai', enableAi: true, launcherPromo: null });
        await expect(omnibar.noticeDrawer()).toHaveCount(0);
    });
});
