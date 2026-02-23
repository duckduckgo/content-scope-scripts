import { expect, test } from '@playwright/test';
import { OnboardingV3Page } from './onboarding.v3.page.js';

const maxDiffPixels = 20;

test.describe('onboarding v3 screenshots', { tag: ['@screenshots'] }, () => {
    test('v3-1-welcome', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'welcome' });
        await expect(page).toHaveScreenshot('v3-1-welcome.png', { maxDiffPixels });
    });

    test('v3-2-getStarted', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'getStarted' });
        await expect(page).toHaveScreenshot('v3-2-getStarted.png', { maxDiffPixels });
    });

    test('v3-3-makeDefaultSingle', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'makeDefaultSingle' });
        await expect(page).toHaveScreenshot('v3-3-makeDefaultSingle.png', { maxDiffPixels });
    });

    test('v3-4-systemSettings', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'systemSettings' });
        // Step through all rows to show them all
        await onboarding.skippedCurrent(); // dock
        await onboarding.skippedCurrent(); // import
        await page.getByRole('button', { name: 'Next' }).waitFor();
        await expect(page).toHaveScreenshot('v3-4-systemSettings.png', { maxDiffPixels });
    });

    test('v3-5-duckPlayerSingle', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'duckPlayerSingle' });
        // Mask the Rive animation canvas to avoid flaky comparisons due to animation frames
        await expect(page).toHaveScreenshot('v3-5-duckPlayerSingle.png', { maxDiffPixels, mask: [page.locator('canvas')] });
    });

    test('v3-6-customize', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'customize' });
        // Step through all rows to show them all
        await onboarding.skippedCurrent(); // bookmarks
        await onboarding.skippedCurrent(); // session-restore
        await onboarding.skippedCurrent(); // home-shortcut
        await page.getByRole('button', { name: 'Next' }).waitFor();
        // Wait for all switches to be visible
        await page.getByRole('switch', { name: 'Show Bookmarks Bar' }).waitFor();
        await page.getByRole('switch', { name: 'Enable Session Restore' }).waitFor();
        await page.getByRole('switch', { name: 'Show Home Button' }).waitFor();
        await expect(page).toHaveScreenshot('v3-6-customize.png', { maxDiffPixels });
    });

    test('v3-7-addressBarMode', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'addressBarMode' });
        await expect(page).toHaveScreenshot('v3-7-addressBarMode.png', { maxDiffPixels });
    });
});
