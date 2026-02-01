import { test } from '@playwright/test';
import { OnboardingV2Page } from './onboarding.v2.page.js';

test.describe('onboarding v2', () => {
    test('shows v2 flow', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    // this 'dock' is not part of the default
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome & Get Started
        await page.getByRole('button', { name: 'Get Started' }).click();
        await page.getByRole('button', { name: 'Got It' }).click();

        // Tracker Blocking
        await page.getByRole('button', { name: 'See With Tracker Blocking' }).click();
        await page.getByRole('button', { name: 'Got It' }).click();

        // Duck Player
        await page.getByRole('button', { name: 'See With Duck Player' }).click();
        await page.getByRole('button', { name: 'Got It' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Dock/Taskbar
        const dockTitle = onboarding.build.switch({
            windows: () => page.getByText('Keep DuckDuckGo in your Taskbar'),
            apple: () => page.getByText('Keep DuckDuckGo in your Dock'),
        });
        await dockTitle.waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Skip' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Import
        await page.getByText('Bring your stuff').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Skip' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Default browser
        await page.getByText('Switch your default browser').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Skip' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByLabel('Customize your experience').waitFor({ timeout: 1000 });
    });

    test('shows v2 flow without pinning step', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV2Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    // this 'dock' is not part of the default
                    rows: ['dock', 'import', 'default-browser'],
                },
            },
            env: 'development',
            order: 'v2',
            exclude: ['dockSingle'],
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome & Get Started
        await page.getByRole('button', { name: 'Get Started' }).click();
        await page.getByRole('button', { name: 'Got It' }).click();

        // Tracker Blocking
        await page.getByRole('button', { name: 'See With Tracker Blocking' }).click();
        await page.getByRole('button', { name: 'Got It' }).click();

        // Duck Player
        await page.getByRole('button', { name: 'See With Duck Player' }).click();
        await page.getByRole('button', { name: 'Got It' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Import (no dock step)
        await page.getByText('Bring your stuff').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Skip' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Default browser
        await page.getByText('Switch your default browser').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Skip' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByLabel('Customize your experience').waitFor({ timeout: 1000 });
    });
});
