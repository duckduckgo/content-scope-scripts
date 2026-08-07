import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';

test.describe('newtab NextStepsList widget', () => {
    test('fetches config + next steps data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'emailProtection' });
        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'nextSteps_getData', count: 1 });
        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
    });

    test('renders the card with correct title and description', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'emailProtection' });
        await page.getByText('Protect Your Email Address and Block Trackers').waitFor();
        await page.getByText('Hide your email with our forwarding service').waitFor();
    });

    test('renders primary action button and triggers nextSteps_action', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'emailProtection' });
        await page.getByRole('button', { name: 'Get Email Protection' }).click();
        await ntp.mocks.waitForCallCount({ method: 'nextSteps_action', count: 1 });
    });

    test('renders secondary button and triggers nextSteps_dismiss', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'emailProtection' });
        await page.getByRole('button', { name: 'No Thanks' }).click();
        await ntp.mocks.waitForCallCount({ method: 'nextSteps_dismiss', count: 1 });
    });

    test('renders different variants correctly', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        // Test duckplayer variant
        await ntp.openPage({ nextStepsList: 'duckplayer' });
        await page.getByText('YouTube with Fewer Ads').waitFor();
        await page.getByRole('button', { name: 'Try Duck Player' }).waitFor();

        // Test defaultApp variant
        await ntp.openPage({ nextStepsList: 'defaultApp' });
        await page.getByText('Open Links in DuckDuckGo').first().waitFor();
        await page.getByRole('button', { name: 'Open Links in DuckDuckGo' }).waitFor();

        // Test bringStuff variant
        await ntp.openPage({ nextStepsList: 'bringStuff' });
        await page.getByText('Import Your Bookmarks and Passwords to DuckDuckGo').waitFor();
        await page.getByRole('button', { name: 'Import Now' }).waitFor();
    });

    test('shows stacked cards when multiple steps exist', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: ['emailProtection', 'duckplayer', 'defaultApp'] });

        // Should show the front card (emailProtection)
        await page.getByText('Protect Your Email Address and Block Trackers').waitFor();

        // Should also show the back card content (duckplayer)
        await page.getByText('YouTube with Fewer Ads').waitFor();
    });

    test('hides back card when only one step remains', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'emailProtection' });

        // Should show the front card
        await page.getByText('Protect Your Email Address and Block Trackers').waitFor();

        // The duckplayer content should not be visible (no back card)
        await expect(page.getByText('YouTube with Fewer Ads')).not.toBeVisible();
    });

    test('uses correct icon for each variant', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'emailProtection' });

        // Check that the image is loaded (checking for the img element)
        const img = page.locator('[data-entry-point="nextStepsList"] img');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('src', /email-protection/);
    });

    // Rebrand artwork is platform-specific for the dock/taskbar step: the correct
    // Mac vs Windows asset is selected via the variant ID (native sends the
    // platform-appropriate one), not via a platform check in the component. These
    // guard against regressing back to a macOS-only gate on the rebrand icons.
    test('uses Windows rebrand icon for the taskbar variant', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'pinAppToTaskbarWindows', additional: { rebrand: 'enabled' }, platformName: 'windows' });

        const img = page.locator('[data-entry-point="nextStepsList"] img');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('src', /Dock-Add-Windows/);
    });

    test('uses Mac rebrand icon for the dock variant', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: 'addAppToDockMac', additional: { rebrand: 'enabled' }, platformName: 'macos' });

        const img = page.locator('[data-entry-point="nextStepsList"] img');
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('src', /Dock-Add-Mac/);
    });

    // The empty "peek" shell behind the front card is a rebrand-only treatment. With rebrand
    // disabled the stacked back card must still render the next step's content (see the
    // "shows stacked cards" test above); this guards against the empty shell leaking to every user.
    test('rebrand: back card is an empty peek shell without next step content', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextStepsList: ['emailProtection', 'duckplayer', 'defaultApp'], additional: { rebrand: 'enabled' } });

        // Front card still renders its content
        await page.getByText('Protect Your Email Address and Block Trackers').waitFor();

        // The next step's content is not rendered in the peek shell under rebrand
        await expect(page.getByText('YouTube with Fewer Ads')).not.toBeVisible();
    });
});
