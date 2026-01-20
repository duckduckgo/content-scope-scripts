import { expect, test } from '@playwright/test';
import { NewtabPage } from './new-tab.page.js';
import { ActivityPage } from '../app/activity/integration-tests/activity.page.js';
import { PrivacyStatsPage } from '../app/privacy-stats/integration-tests/privacy-stats.page.js';
import { OmnibarPage } from '../app/omnibar/integration-tests/omnibar.page.js';

const maxDiffPixels = 20;

test.describe('NTP screenshots', { tag: ['@screenshots'] }, () => {
    test.describe('privacy stats', () => {
        test('with dataset "few"', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const stats = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'few' } });
            await stats.hasRows(4);
            await expect(page).toHaveScreenshot('stats-few.png', { maxDiffPixels });
        });

        test('cpm', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const stats = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'few', cpm: 'true' } });
            await stats.hasRows(4);
            await expect(page).toHaveScreenshot('stats-cpm.png', { maxDiffPixels });
        });
    });

    test.describe('activity widget', () => {
        test('default', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity' } });
            await ap.didRender();
            await expect(page).toHaveScreenshot('activity-default.png', { maxDiffPixels });
        });

        test('empty', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity', activity: 'empty' } });
            await ap.ready();
            await expect(page).toHaveScreenshot('activity-empty.png', { maxDiffPixels });
        });
    });

    test.describe('omnibar widget', () => {
        test('search rest', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage();
            await omnibar.ready();
            await expect(page).toHaveScreenshot('omnibar-search-rest.png', { maxDiffPixels });
        });

        test('search suggestions', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage();
            await omnibar.ready();
            await omnibar.searchInput().fill('pizza');
            await omnibar.waitForSuggestions();
            await page.keyboard.press('ArrowDown');
            await expect(page).toHaveScreenshot('omnibar-search-suggestions.png', { maxDiffPixels });
        });

        test('ai rest', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
            await omnibar.ready();
            await expect(page).toHaveScreenshot('omnibar-ai-rest.png', { maxDiffPixels });
        });

        test('search focused', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage();
            await omnibar.ready();
            await omnibar.searchInput().click();
            await expect(page).toHaveScreenshot('omnibar-search-focused.png', { maxDiffPixels });
        });

        test('ai focused', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
            await omnibar.ready();
            await omnibar.chatInput().click();
            await expect(page).toHaveScreenshot('omnibar-ai-focused.png', { maxDiffPixels });
        });

        test('ai expanded', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
            await omnibar.ready();
            const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
            await omnibar.chatInput().fill(multilineText);
            await expect(page).toHaveScreenshot('omnibar-ai-expanded.png', { maxDiffPixels });
        });

        test('ai overflow', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
            await omnibar.ready();
            const longText = Array.from({ length: 15 }, (_, i) => `Line ${i + 1}`).join('\n');
            await omnibar.chatInput().fill(longText);
            await expect(page).toHaveScreenshot('omnibar-ai-overflow.png', { maxDiffPixels });
        });

        test('customize popover', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.showCustomizePopover': 'true' } });
            await omnibar.ready();
            await expect(page).toHaveScreenshot('omnibar-customize-popover.png', { maxDiffPixels });
        });
    });

    test.describe('customizer drawer', () => {
        test('sidebar ai enabled', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage();
            await omnibar.ready();
            await omnibar.customizeButton().click();
            await expect(page).toHaveScreenshot('omnibar-sidebar-ai-enabled.png', { maxDiffPixels });
        });

        test('sidebar ai disabled', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.enableAi': 'false' } });
            await omnibar.ready();
            await omnibar.customizeButton().click();
            await expect(page).toHaveScreenshot('omnibar-sidebar-ai-disabled.png', { maxDiffPixels });
        });

        test('sidebar hide ai setting', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const omnibar = new OmnibarPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'omnibar.showAiSetting': 'false' } });
            await omnibar.ready();
            await omnibar.customizeButton().click();
            await expect(page).toHaveScreenshot('omnibar-sidebar-hide-ai-setting.png', { maxDiffPixels });
        });

        test('theme section', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { themeVariant: 'default', autoOpen: 'true' } });
            await page.getByRole('heading', { name: 'Customize' }).waitFor();
            await expect(page).toHaveScreenshot('customizer-theme-section.png', { maxDiffPixels });
        });

        test('theme section with long strings', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { themeVariant: 'default', autoOpen: 'true', locale: 'pl' } });
            await page.getByRole('heading', { name: 'Dostosuj' }).waitFor();
            await expect(page).toHaveScreenshot('customizer-theme-section-long-strings.png', { maxDiffPixels });
        });

        test('theme variant popover', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': 'true', themeVariant: 'default' } });
            await page.getByRole('dialog', { name: 'Pick a color theme that suits you' }).waitFor();
            await expect(page).toHaveScreenshot('customizer-theme-variant-popover.png', { maxDiffPixels });
        });
    });

    test.describe('favorites widget', () => {
        test('many collapsed', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { favorites: 'many' } });
            await page.locator('[data-entry-point="favorites"]').waitFor();
            await expect(page).toHaveScreenshot('favorites-many-collapsed.png', { maxDiffPixels });
        });

        test('many expanded', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { favorites: 'many', 'favorites.config.expansion': 'expanded' } });
            await page.locator('[data-entry-point="favorites"]').waitFor();
            await expect(page).toHaveScreenshot('favorites-many-expanded.png', { maxDiffPixels });
        });

        test('single', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { favorites: 'single' } });
            await page.locator('[data-entry-point="favorites"]').waitFor();
            await expect(page).toHaveScreenshot('favorites-single.png', { maxDiffPixels });
        });

        test('empty', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { favorites: 'none' } });
            await page.locator('[data-entry-point="favorites"]').waitFor();
            await expect(page).toHaveScreenshot('favorites-empty.png', { maxDiffPixels });
        });
    });

    test.describe('update notification', () => {
        test('empty', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'update-notification': 'empty' } });
            await page.locator('[data-entry-point="updateNotification"]').waitFor();
            await expect(page).toHaveScreenshot('update-notification-empty.png', { maxDiffPixels });
        });

        test('populated', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'update-notification': 'populated' } });
            await page.locator('[data-entry-point="updateNotification"]').waitFor();
            await expect(page).toHaveScreenshot('update-notification-populated.png', { maxDiffPixels });
        });
    });

    test.describe('remote messaging framework', () => {
        test('small', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { rmf: 'small' } });
            await page.locator('[data-entry-point="rmf"]').waitFor();
            await expect(page).toHaveScreenshot('rmf-small.png', { maxDiffPixels });
        });

        test('medium', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { rmf: 'medium' } });
            await page.locator('[data-entry-point="rmf"]').waitFor();
            await expect(page).toHaveScreenshot('rmf-medium.png', { maxDiffPixels });
        });

        test('big single action', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { rmf: 'big_single_action' } });
            await page.locator('[data-entry-point="rmf"]').waitFor();
            await expect(page).toHaveScreenshot('rmf-big-single-action.png', { maxDiffPixels });
        });

        test('big two action', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { rmf: 'big_two_action' } });
            await page.locator('[data-entry-point="rmf"]').waitFor();
            await expect(page).toHaveScreenshot('rmf-big-two-action.png', { maxDiffPixels });
        });
    });

    test.describe('next steps', () => {
        test('two cards', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'next-steps': ['bringStuff', 'defaultApp'] } });
            await page.locator('[data-entry-point="nextSteps"]').waitFor();
            await expect(page).toHaveScreenshot('next-steps-two.png', { maxDiffPixels });
        });
    });

    test.describe('freemium PIR banner', () => {
        test('onboarding', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { pir: 'onboarding' } });
            await page.locator('[data-entry-point="freemiumPIRBanner"]').waitFor();
            await expect(page).toHaveScreenshot('pir-onboarding.png', { maxDiffPixels });
        });

        test('scan results', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { pir: 'scan_results' } });
            await page.locator('[data-entry-point="freemiumPIRBanner"]').waitFor();
            await expect(page).toHaveScreenshot('pir-scan-results.png', { maxDiffPixels });
        });
    });

    test.describe('subscription winback banner', () => {
        test('last day', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { winback: 'winback_last_day' } });
            await page.locator('[data-entry-point="subscriptionWinBackBanner"]').waitFor();
            await expect(page).toHaveScreenshot('winback-last-day.png', { maxDiffPixels });
        });
    });
});
