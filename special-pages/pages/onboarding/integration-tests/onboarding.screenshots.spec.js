import { expect, test } from '@playwright/test';
import { OnboardingV1Page } from './onboarding.v1.page.js';
import { OnboardingV2Page } from './onboarding.v2.page.js';
import { OnboardingV3Page } from './onboarding.v3.page.js';

const maxDiffPixels = 20;
const maxDiffPixelsAnimated = 800; // Higher tolerance for pages with Rive animations

test.describe('onboarding v1 screenshots', { tag: ['@screenshots'] }, () => {
    test('v1-1-welcome', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'welcome' });
        await expect(page).toHaveScreenshot('v1-1-welcome.png', { maxDiffPixels });
    });

    test('v1-2-getStarted', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'getStarted' });
        await expect(page).toHaveScreenshot('v1-2-getStarted.png', { maxDiffPixels });
    });

    test('v1-3-privateByDefault', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'privateByDefault' });
        await expect(page).toHaveScreenshot('v1-3-privateByDefault.png', { maxDiffPixels });
    });

    test('v1-4-cleanerBrowsing', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'cleanerBrowsing' });
        await expect(page).toHaveScreenshot('v1-4-cleanerBrowsing.png', { maxDiffPixels });
    });

    test('v1-5-systemSettings', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'systemSettings' });
        // Step through all rows to show them all
        await onboarding.skippedCurrent(); // dock
        await onboarding.skippedCurrent(); // import
        await onboarding.skippedCurrent(); // default-browser
        await page.getByRole('button', { name: 'Next' }).waitFor();
        await expect(page).toHaveScreenshot('v1-5-systemSettings.png', { maxDiffPixels });
    });

    test('v1-6-customize', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'customize' });
        // Step through all rows to show them all
        await onboarding.skippedCurrent(); // bookmarks bar
        await onboarding.skippedCurrent(); // session restore
        await onboarding.skippedCurrent(); // home button
        await page.getByRole('button', { name: 'Next' }).waitFor();
        // Wait for all switches to be visible
        await expect(page.getByRole('switch', { name: 'Show Bookmarks Bar' })).toBeVisible();
        await expect(page.getByRole('switch', { name: 'Enable Session Restore' })).toBeVisible();
        await expect(page.getByRole('switch', { name: 'Show Home Button' })).toBeVisible();
        await expect(page).toHaveScreenshot('v1-6-customize.png', { maxDiffPixels });
    });

    test('v1-7-summary', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV1Page.create(page, workerInfo);
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'summary' });
        await expect(page).toHaveScreenshot('v1-7-summary.png', { maxDiffPixels });
    });
});

test.describe('onboarding v2 screenshots', { tag: ['@screenshots'] }, () => {
    test('v2-1-welcome', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'welcome' });
        await expect(page).toHaveScreenshot('v2-1-welcome.png', { maxDiffPixels });
    });

    test('v2-2-getStarted', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'getStarted' });
        await expect(page).toHaveScreenshot('v2-2-getStarted.png', { maxDiffPixels });
    });

    test('v2-3-privateByDefault', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'privateByDefault' });
        await expect(page).toHaveScreenshot('v2-3-privateByDefault.png', { maxDiffPixels });
    });

    test('v2-4-cleanerBrowsing', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'cleanerBrowsing' });
        await expect(page).toHaveScreenshot('v2-4-cleanerBrowsing.png', { maxDiffPixels });
    });

    test('v2-5-dockSingle', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'dockSingle' });
        // Mask the Rive animation canvas to avoid flaky comparisons due to animation frames
        await expect(page).toHaveScreenshot('v2-5-dockSingle.png', { maxDiffPixels, mask: [page.locator('canvas')] });
    });

    test('v2-6-importSingle', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'importSingle' });
        await expect(page).toHaveScreenshot('v2-6-importSingle.png', { maxDiffPixels: maxDiffPixelsAnimated });
    });

    test('v2-7-makeDefaultSingle', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'makeDefaultSingle' });
        await expect(page).toHaveScreenshot('v2-7-makeDefaultSingle.png', { maxDiffPixels: maxDiffPixelsAnimated });
    });

    test('v2-8-customize', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'customize' });
        // Step through all rows to show them all
        await onboarding.skippedCurrent(); // bookmarks bar
        await onboarding.skippedCurrent(); // session restore
        await onboarding.skippedCurrent(); // home button
        await page.getByRole('button', { name: 'Next' }).waitFor();
        // Wait for all switches to be visible
        await page.getByRole('switch', { name: 'Show Bookmarks Bar' }).waitFor();
        await page.getByRole('switch', { name: 'Enable Session Restore' }).waitFor();
        await page.getByRole('switch', { name: 'Show Home Button' }).waitFor();
        await expect(page).toHaveScreenshot('v2-8-customize.png', { maxDiffPixels });
    });

    test('v2-9-summary', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ debugState: false, page: 'summary' });
        await expect(page).toHaveScreenshot('v2-9-summary.png', { maxDiffPixels });
    });
});

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
