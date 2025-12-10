import { expect, test } from '@playwright/test';
import { NewtabPage } from './new-tab.page.js';
import { ActivityPage } from '../app/activity/integration-tests/activity.page.js';
import { PrivacyStatsPage } from '../app/privacy-stats/integration-tests/privacy-stats.page.js';
import { OmnibarPage } from '../app/omnibar/integration-tests/omnibar.page.js';

const maxDiffPixels = 20;

/** @type {{name: string, width: number, height: number}[]} */
const viewports = [
    { name: 'wide', width: 1000, height: 1500 },
    // { name: 'narrow', width: 800, height: 1500 },
];

/** @type {{name: string, dark: boolean}[]} */
const themes = [
    { name: 'light', dark: false },
    { name: 'dark', dark: true },
];

/**
 * Generate screenshot filename with variant suffixes
 * @param {string} base - Base filename without extension
 * @param {{name: string}} viewport
 * @param {{name: string, dark: boolean}} theme
 * @returns {string}
 */
function screenshotName(base, viewport, theme) {
    const parts = [base];
    if (viewport.name === 'narrow') parts.push('narrow');
    if (theme.dark) parts.push('dark');
    return parts.join('-') + '.png';
}

test.describe('NTP screenshots', { tag: ['@screenshots'] }, () => {
    viewports.forEach((viewport) => {
        themes.forEach((theme) => {
            test.describe(`${viewport.name} ${theme.name}`, () => {
                test.use({ viewport: { width: viewport.width, height: viewport.height } });

                test.describe('privacy stats', () => {
                    test('with dataset "few"', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const stats = new PrivacyStatsPage(page, ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { stats: 'few' } });
                        await stats.hasRows(4);
                        await expect(page).toHaveScreenshot(screenshotName('stats-few', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('activity widget', () => {
                    test('default', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const ap = new ActivityPage(page, ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'protections.feed': 'activity' } });
                        await ap.didRender();
                        await expect(page).toHaveScreenshot(screenshotName('activity-default', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('empty', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const ap = new ActivityPage(page, ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'protections.feed': 'activity', activity: 'empty' } });
                        await ap.ready();
                        await expect(page).toHaveScreenshot(screenshotName('activity-empty', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('omnibar widget', () => {
                    test('search rest', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage();
                        await omnibar.ready();
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-search-rest', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('search suggestions', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage();
                        await omnibar.ready();
                        await omnibar.searchInput().fill('pizza');
                        await omnibar.waitForSuggestions();
                        await page.keyboard.press('ArrowDown');
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-search-suggestions', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('ai rest', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
                        await omnibar.ready();
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-ai-rest', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('search focused', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage();
                        await omnibar.ready();
                        await omnibar.searchInput().click();
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-search-focused', viewport, theme), { maxDiffPixels });
                    });

                    test('ai focused', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
                        await omnibar.ready();
                        await omnibar.chatInput().click();
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-ai-focused', viewport, theme), { maxDiffPixels });
                    });

                    test('ai expanded', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
                        await omnibar.ready();
                        const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
                        await omnibar.chatInput().fill(multilineText);
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-ai-expanded', viewport, theme), { maxDiffPixels });
                    });

                    test('ai overflow', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'omnibar.mode': 'ai' } });
                        await omnibar.ready();
                        const longText = Array.from({ length: 15 }, (_, i) => `Line ${i + 1}`).join('\n');
                        await omnibar.chatInput().fill(longText);
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-ai-overflow', viewport, theme), { maxDiffPixels });
                    });

                    test('customize popover', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        const omnibar = new OmnibarPage(ntp);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'omnibar.showCustomizePopover': 'true' } });
                        await omnibar.ready();
                        await expect(page).toHaveScreenshot(screenshotName('omnibar-customize-popover', viewport, theme), { maxDiffPixels });
                    });
                });

                // Only test drawer in wide viewport
                if (viewport.name === 'wide') {
                    test.describe('customizer drawer', () => {
                        test('sidebar ai enabled', async ({ page }, workerInfo) => {
                            const ntp = NewtabPage.create(page, workerInfo);
                            const omnibar = new OmnibarPage(ntp);
                            await ntp.reducedMotion();
                            if (theme.dark) await ntp.darkMode();
                            await ntp.openPage();
                            await omnibar.ready();
                            await omnibar.customizeButton().click();
                            await expect(page).toHaveScreenshot(screenshotName('omnibar-sidebar-ai-enabled', viewport, theme), { maxDiffPixels });
                        });

                        test('sidebar ai disabled', async ({ page }, workerInfo) => {
                            const ntp = NewtabPage.create(page, workerInfo);
                            const omnibar = new OmnibarPage(ntp);
                            await ntp.reducedMotion();
                            if (theme.dark) await ntp.darkMode();
                            await ntp.openPage({ additional: { 'omnibar.enableAi': 'false' } });
                            await omnibar.ready();
                            await omnibar.customizeButton().click();
                            await expect(page).toHaveScreenshot(screenshotName('omnibar-sidebar-ai-disabled', viewport, theme), { maxDiffPixels });
                        });

                        test('sidebar hide ai setting', async ({ page }, workerInfo) => {
                            const ntp = NewtabPage.create(page, workerInfo);
                            const omnibar = new OmnibarPage(ntp);
                            await ntp.reducedMotion();
                            if (theme.dark) await ntp.darkMode();
                            await ntp.openPage({ additional: { 'omnibar.showAiSetting': 'false' } });
                            await omnibar.ready();
                            await omnibar.customizeButton().click();
                            await expect(page).toHaveScreenshot(screenshotName('omnibar-sidebar-hide-ai-setting', viewport, theme), { maxDiffPixels });
                        });
                    });
                }

                test.describe('favorites widget', () => {
                    test('many collapsed', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { favorites: 'many' } });
                        await page.locator('[data-entry-point="favorites"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('favorites-many-collapsed', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('many expanded', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { favorites: 'many', 'favorites.config.expansion': 'expanded' } });
                        await page.locator('[data-entry-point="favorites"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('favorites-many-expanded', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('single', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { favorites: 'single' } });
                        await page.locator('[data-entry-point="favorites"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('favorites-single', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('empty', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { favorites: 'none' } });
                        await page.locator('[data-entry-point="favorites"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('favorites-empty', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('update notification', () => {
                    test('empty', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'update-notification': 'empty' } });
                        await page.locator('[data-entry-point="updateNotification"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('update-notification-empty', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('populated', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'update-notification': 'populated' } });
                        await page.locator('[data-entry-point="updateNotification"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('update-notification-populated', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('remote messaging framework', () => {
                    test('small', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { rmf: 'small' } });
                        await page.locator('[data-entry-point="rmf"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('rmf-small', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('medium', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { rmf: 'medium' } });
                        await page.locator('[data-entry-point="rmf"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('rmf-medium', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('big single action', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { rmf: 'big_single_action' } });
                        await page.locator('[data-entry-point="rmf"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('rmf-big-single-action', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('big two action', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { rmf: 'big_two_action' } });
                        await page.locator('[data-entry-point="rmf"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('rmf-big-two-action', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('next steps', () => {
                    test('two cards', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { 'next-steps': ['bringStuff', 'defaultApp'] } });
                        await page.locator('[data-entry-point="nextSteps"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('next-steps-two', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('freemium PIR banner', () => {
                    test('onboarding', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { pir: 'onboarding' } });
                        await page.locator('[data-entry-point="freemiumPIRBanner"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('pir-onboarding', viewport, theme), {
                            maxDiffPixels,
                        });
                    });

                    test('scan results', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { pir: 'scan_results' } });
                        await page.locator('[data-entry-point="freemiumPIRBanner"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('pir-scan-results', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });

                test.describe('subscription winback banner', () => {
                    test('last day', async ({ page }, workerInfo) => {
                        const ntp = NewtabPage.create(page, workerInfo);
                        await ntp.reducedMotion();
                        if (theme.dark) await ntp.darkMode();
                        await ntp.openPage({ additional: { winback: 'winback_last_day' } });
                        await page.locator('[data-entry-point="subscriptionWinBackBanner"]').waitFor();
                        await expect(page).toHaveScreenshot(screenshotName('winback-last-day', viewport, theme), {
                            maxDiffPixels,
                        });
                    });
                });
            });
        });
    });
});
