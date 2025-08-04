import { expect, test } from '@playwright/test';
import { NewtabPage } from './new-tab.page.js';
import { ActivityPage } from '../app/activity/integration-tests/activity.page.js';
import { CustomizerPage } from '../app/customizer/integration-tests/customizer.page.js';
import { PrivacyStatsPage } from '../app/privacy-stats/integration-tests/privacy-stats.page.js';
import { OmnibarPage } from '../app/omnibar/integration-tests/omnibar.page.js';

const maxDiffPixels = 20;

test.describe('NTP screenshots', { tag: ['@screenshots'] }, () => {
    test.describe('feed = privacy stats', () => {
        test.use({ viewport: { width: 1000, height: 600 } });
        test('with dataset "few"', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const stats = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();

            // see privacy-stats.mocks.js
            await ntp.openPage({ additional: { stats: 'few' } });

            // make sure we're screenshotting when data is showing
            await stats.hasRows(4);
            await expect(page).toHaveScreenshot('stats-few.png', { maxDiffPixels });
        });
        test('with dataset "few" (dark)', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const stats = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.darkMode();

            // see privacy-stats.mocks.js
            await ntp.openPage({ additional: { stats: 'few' } });

            // make sure we're screenshotting when data is showing
            await stats.hasRows(4);
            await expect(page).toHaveScreenshot('stats-few-dark.png', { maxDiffPixels });
        });
    });

    test.describe('activity widget screenshots narrow', () => {
        test.use({ viewport: { width: 800, height: 800 } });
        test('default', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity' } });
            await ap.didRender();
            await expect(page).toHaveScreenshot('narrow-default.png', { maxDiffPixels });
        });
        test('empty', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity', activity: 'empty' } });
            await ap.ready();
            await expect(page).toHaveScreenshot('narrow-empty.png', { maxDiffPixels });
        });
    });

    test.describe('activity widget screenshots wide', () => {
        test.use({ viewport: { width: 1000, height: 800 } });
        test('default', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity' } });
            await ap.didRender();
            await expect(page).toHaveScreenshot('wide-default.png', { maxDiffPixels });
        });
        test('empty', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity', activity: 'empty' } });
            await ap.ready();
            await expect(page).toHaveScreenshot('wide-empty.png', { maxDiffPixels });
        });
        test('with drawer', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            const customizer = new CustomizerPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { 'protections.feed': 'activity' } });
            await ap.didRender();
            await customizer.opensCustomizer();
            await expect(page).toHaveScreenshot('wide-default-drawer.png', { maxDiffPixels });
        });
    });

    test.describe('omnibar widget screenshots', () => {
        // Extra tall viewport so that all of the suggestions list is visible
        test.use({ viewport: { width: 1000, height: 1000 } });

        test.describe('search tab', () => {
            test('rest', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true' } });
                await omnibar.ready();
                await expect(page).toHaveScreenshot('omnibar-search-rest.png', { maxDiffPixels });
            });

            test('focused', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true' } });
                await omnibar.ready();
                await omnibar.searchInput().click();
                await expect(page).toHaveScreenshot('omnibar-search-focused.png', { maxDiffPixels });
            });

            test('suggestions', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true' } });
                await omnibar.ready();
                await omnibar.searchInput().fill('pizza');
                await omnibar.waitForSuggestions();
                await page.keyboard.press('ArrowDown');
                await expect(page).toHaveScreenshot('omnibar-search-suggestions.png', { maxDiffPixels });
            });
        });

        test.describe('ai tab', () => {
            test('rest', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true', 'omnibar.mode': 'ai' } });
                await omnibar.ready();
                await expect(page).toHaveScreenshot('omnibar-ai-rest.png', { maxDiffPixels });
            });

            test('focused', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true', 'omnibar.mode': 'ai' } });
                await omnibar.ready();
                await omnibar.chatInput().click();
                await expect(page).toHaveScreenshot('omnibar-ai-focused.png', { maxDiffPixels });
            });

            test('expanded', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true', 'omnibar.mode': 'ai' } });
                await omnibar.ready();
                const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
                await omnibar.chatInput().fill(multilineText);
                await expect(page).toHaveScreenshot('omnibar-ai-expanded.png', { maxDiffPixels });
            });

            test('overflow', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true', 'omnibar.mode': 'ai' } });
                await omnibar.ready();
                const longText = Array.from({ length: 15 }, (_, i) => `Line ${i + 1}`).join('\n');
                await omnibar.chatInput().fill(longText);
                await expect(page).toHaveScreenshot('omnibar-ai-overflow.png', { maxDiffPixels });
            });
        });

        test.describe('sidebar', () => {
            test('ai enabled', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true' } });
                await omnibar.ready();
                await omnibar.customizeButton().click();
                await expect(page).toHaveScreenshot('omnibar-sidebar-ai-enabled.png', { maxDiffPixels });
            });

            test('ai disabled', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true', 'omnibar.enableAi': 'false' } });
                await omnibar.ready();
                await omnibar.customizeButton().click();
                await expect(page).toHaveScreenshot('omnibar-sidebar-ai-disabled.png', { maxDiffPixels });
            });

            test('hide ai setting', async ({ page }, workerInfo) => {
                const ntp = NewtabPage.create(page, workerInfo);
                const omnibar = new OmnibarPage(ntp);
                await ntp.reducedMotion();
                await ntp.openPage({ additional: { omnibar: 'true', 'omnibar.showAiSetting': 'false' } });
                await omnibar.ready();
                await omnibar.customizeButton().click();
                await expect(page).toHaveScreenshot('omnibar-sidebar-hide-ai-setting.png', { maxDiffPixels });
            });
        });
    });
});
