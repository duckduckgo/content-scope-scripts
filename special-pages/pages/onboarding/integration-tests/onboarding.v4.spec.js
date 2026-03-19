import { test, expect } from '@playwright/test';
import { OnboardingV4Page } from './onboarding.v4.page.js';

test.describe('onboarding v4', () => {
    test.describe('Given I am on the make default step', () => {
        test('Then "Play YouTube without targeted ads" appears when ad blocking is enabled (placebo variant)', async ({
            page,
        }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'makeDefaultSingle' });
            await onboarding.checkYouTubeText(false);
        });

        test('Then "Watch YouTube ad-free" appears when ad blocking is enabled (aggressive variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'aggressive-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'makeDefaultSingle' });
            await onboarding.checkYouTubeText(true);
        });

        test('Then "Watch YouTube ad-free" appears when ad blocking is enabled (YouTube variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'youtube-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'makeDefaultSingle' });
            await onboarding.checkYouTubeText(true);
        });
    });

    test.describe('Given I am on the system settings step', () => {
        test('Then I can turn on ad blocking (placebo variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.enableEnhancedAdBlocking();
        });

        test('Then I can skip ad blocking (placebo variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.skipAdBlocking();
        });

        test('Then I can turn on ad blocking (aggressive variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'aggressive-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.enableEnhancedAdBlocking();
        });

        test('Then I can skip ad blocking (aggresive variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'aggressive-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.skipAdBlocking();
        });

        test('Then I can turn on ad blocking (YouTube variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'youtube-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.enableYouTubeAdBlocking();
        });

        test('Then I can skip ad blocking (YouTube variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'youtube-ad-blocking'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.skipYouTubeAdBlocking();
        });
    });

    test.describe('Given I am on the duck player step with ad-free variant', () => {
        test('Then it shows ad-free copy and hides the toggle button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    duckPlayerSingle: {
                        variant: 'ad-free',
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'duckPlayerSingle' });

            // Ad-free title and subtitle are shown
            await expect(page.getByRole('heading', { name: 'Watch YouTube ad-free!', level: 2 })).toBeVisible();
            await expect(page.getByText(/No need for a premium subscription/)).toBeVisible();

            // Toggle button is hidden
            await expect(page.getByRole('button', { name: 'See Without Duck Player' })).not.toBeVisible();
            await expect(page.getByRole('button', { name: 'See With Duck Player' })).not.toBeVisible();

            // Can advance past the step
            await page.getByRole('button', { name: 'Next' }).click();
        });
    });

    test.describe('Given I am on the duck player step without ad-free variant', () => {
        test('Then it shows default copy and the toggle button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'duckPlayerSingle' });

            // Default title and subtitle are shown
            await expect(page.getByRole('heading', { name: /Drowning in ads/, level: 2 })).toBeVisible();
            await expect(page.getByText(/No targeted ads/)).toBeVisible();

            // Toggle button is visible
            await expect(page.getByRole('button', { name: 'See Without Duck Player' })).toBeVisible();

            // Can toggle
            await page.getByRole('button', { name: 'See Without Duck Player' }).click();
            await expect(page.getByRole('button', { name: 'See With Duck Player' })).toBeVisible();

            // Can advance past the step
            await page.getByRole('button', { name: 'Next' }).click();
        });

        test('Mid-playback toggle queues reverse video', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'duckPlayerSingle' });
            // Disable reduced motion so that playVideo() calls video.play()
            // instead of seeking to duration (which fires 'ended' immediately in WebKit).
            await page.emulateMedia({ reducedMotion: 'no-preference' });

            const enabledVideo = page.locator('video[src*="enabled"]');
            const disabledVideo = page.locator('video[src*="disabled"]');

            // End the autoPlay video to reach withDuckPlayer
            await enabledVideo.dispatchEvent('ended');

            // Toggle → toWithoutDuckPlayer (disabled video "plays")
            await page.getByRole('button', { name: 'See Without Duck Player' }).click();
            await expect(page.getByRole('button', { name: 'See With Duck Player' })).toBeVisible();

            // Toggle mid-playback → toWithoutDuckPlayerThenReverse
            // Button changes instantly; disabled video stays visible (current clip finishes)
            await page.getByRole('button', { name: 'See With Duck Player' }).click();
            await expect(page.getByRole('button', { name: 'See Without Duck Player' })).toBeVisible();
            await expect(disabledVideo).toBeVisible();

            // Simulate disabled video ending → reducer plays enabled video (toWithDuckPlayer)
            await disabledVideo.dispatchEvent('ended');
            await expect(enabledVideo).toBeVisible();
            await expect(disabledVideo).toHaveCSS('opacity', '0');
            await expect(page.getByRole('button', { name: 'See Without Duck Player' })).toBeVisible();

            // Simulate enabled video ending → withDuckPlayer
            await enabledVideo.dispatchEvent('ended');
            await expect(page.getByRole('button', { name: 'See Without Duck Player' })).toBeVisible();
        });

        test('Double toggle during playback cancels the reverse', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'duckPlayerSingle' });
            await page.emulateMedia({ reducedMotion: 'no-preference' });

            const enabledVideo = page.locator('video[src*="enabled"]');
            const disabledVideo = page.locator('video[src*="disabled"]');

            // End the autoPlay video to reach withDuckPlayer
            await enabledVideo.dispatchEvent('ended');

            // Toggle → toWithoutDuckPlayer
            await page.getByRole('button', { name: 'See Without Duck Player' }).click();
            await expect(page.getByRole('button', { name: 'See With Duck Player' })).toBeVisible();

            // Toggle mid-playback → toWithoutDuckPlayerThenReverse
            await page.getByRole('button', { name: 'See With Duck Player' }).click();
            await expect(page.getByRole('button', { name: 'See Without Duck Player' })).toBeVisible();

            // Toggle again → back to toWithoutDuckPlayer (reverse cancelled)
            await page.getByRole('button', { name: 'See Without Duck Player' }).click();
            await expect(page.getByRole('button', { name: 'See With Duck Player' })).toBeVisible();

            // Video ends normally → withoutDuckPlayer (no reverse plays)
            await disabledVideo.dispatchEvent('ended');
            await expect(page.getByRole('button', { name: 'See With Duck Player' })).toBeVisible();
        });
    });

    test('shows v4 flow', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV4Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v4',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').waitFor({ timeout: 1000 });

        // Get started (welcome auto-advances after ~3.7s animation)
        await page.getByText('Hi there').waitFor({ timeout: 5000 });
        await page.getByRole('button', { name: 'Let\u2019s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let\u2019s get you set up!').waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Duckplayer
        await page.getByText('Drowning in ads').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'See Without Duck Player' }).click();
        await page.getByRole('button', { name: 'See With Duck Player' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByText('Let\u2019s customize a few things').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test.describe('Given I am on the settings step with dock-instructions variant', () => {
        test('When I click Show Me How, it shows dock instructions overlay', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.showDockInstructions();

            await expect(page.getByText('Hold control and click the DuckDuckGo app icon')).toBeVisible();
            await expect(page.getByText('Options')).toBeVisible();
            await expect(page.getByText('Keep in Dock')).toBeVisible();
        });

        test('When I click Show Me How then Next, it advances to the next row', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.showDockInstructions();
            await onboarding.dismissDockInstructions();

            await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
        });

        test('When I skip dock-instructions, it advances to the next row', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.skippedCurrent();

            await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
        });
    });

    test.describe('Given I am on the settings step', () => {
        test('When I have choosen to add to dock/taskbar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // ▶️ Then I can add to dock/taskbar
            await onboarding.keepInTaskbar();
        });

        test('When I have skipped add to dock/taskbar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // And I have skipped that step
            await onboarding.skippedCurrent();

            // ▶️ Then I can add it afterwards
            await onboarding.keepInTaskbar();
        });

        test('When I choose to import bookmarks and passwords', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();

            // ▶️ Then I can import the data
            await onboarding.importUserData();
        });

        test('When I have skipped import on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();

            // And I have skipped that step
            await onboarding.skippedCurrent();

            // ▶️ Then I can choose to import afterwards
            await onboarding.importUserData();
        });

        test('When the import step has failed on macOS', async ({ page }, workerInfo) => {
            test.skip(workerInfo.project.name !== 'macos');

            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withMockData({
                init: {
                    stepDefinitions: null,
                    order: 'v4',
                },
                requestImport: { enabled: false },
            });

            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();

            // ▶️ Then I can still see the import button
            await onboarding.importUserDataFailedGracefully();
        });
    });

    test.describe('Given I am on the customize step', () => {
        test('Then I can see additional information about the steps', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.hasAdditionalInformationV4();
        });

        test('When I choose to show the bookmarks bar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });

            // ▶️ Then the bookmarks bar shows
            await onboarding.showBookmarksBar();
        });

        test('When I have skipped bookmarks on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();

            // ▶️ Then I can toggle it afterward
            await onboarding.canToggleBookmarksBar();
        });

        test('When I choose to restore previous session', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();

            // ▶️ Then the restore session bar shows
            await onboarding.restoreSession();
        });

        test('When I have skipped restore session on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();

            // ▶️ Then I can toggle it afterward
            await onboarding.canToggleRestoreSession();
        });

        test('When I have choosen to show the home button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });

            // skipped first 2
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();

            // ▶️ Then the home button bar shows
            await onboarding.showHomeButton();
        });

        test('When I have skipped home button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });

            // skipped all
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();
            await onboarding.skippedShowHomeButton();

            // ▶️ Then I can toggle it afterward
            await onboarding.canToggleHomeButton();
        });

        test('I can start browsing', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v4',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'addressBarMode' });

            // ▶️ Then I can toggle it afterward
            await onboarding.startBrowsing();
        });

        test.describe('Given onConfigUpdate behavior', () => {
            test('When config update has reduced customize rows (no bookmarks), only those rows are shown', async ({
                page,
            }, workerInfo) => {
                const onboarding = OnboardingV4Page.create(page, workerInfo);
                onboarding.withInitData({
                    order: 'v4',
                    stepDefinitions: { systemSettings: { rows: ['dock', 'import', 'default-browser'] } },
                });
                await onboarding.reducedMotion();
                await onboarding.openPage({ env: 'app', page: 'customize' });
                // before push - default rows include bookmarks
                await page.getByRole('button', { name: 'Show Bookmarks Bar' }).waitFor({ timeout: 10000 });
                await expect(page.getByRole('button', { name: 'Show Bookmarks Bar' })).toBeVisible();
                // push config update removing bookmarks
                await onboarding.pushConfigUpdate({ stepDefinitions: { customize: { rows: ['session-restore', 'home-shortcut'] } } });
                // after push - bookmarks gone
                await page.getByRole('button', { name: 'Enable Session Restore' }).waitFor({ timeout: 10000 });
                await expect(page.getByRole('button', { name: 'Show Bookmarks Bar' })).not.toBeVisible();
                await expect(page.getByRole('button', { name: 'Enable Session Restore' })).toBeVisible();
            });
        });
    });

    test.describe('global error listeners', () => {
        test('reports uncaught errors via reportInitException', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.evaluate(() => {
                setTimeout(() => {
                    throw new Error('test uncaught error');
                }, 0);
            });

            const calls = await onboarding.mocks.waitForCallCount({ method: 'reportInitException', count: 1 });
            expect(calls).toMatchObject([
                {
                    payload: {
                        context: 'specialPages',
                        featureName: 'onboarding',
                        method: 'reportInitException',
                        params: { message: '[uncaught] test uncaught error' },
                    },
                },
            ]);
        });

        test('reports unhandled rejections via reportInitException', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.evaluate(() => {
                Promise.reject(new Error('test unhandled rejection'));
            });

            const calls = await onboarding.mocks.waitForCallCount({ method: 'reportInitException', count: 1 });
            expect(calls).toMatchObject([
                {
                    payload: {
                        context: 'specialPages',
                        featureName: 'onboarding',
                        method: 'reportInitException',
                        params: { message: '[unhandledrejection] test unhandled rejection' },
                    },
                },
            ]);
        });

        test('does not fire reportInitException during normal page load', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.waitForTimeout(200);
            const calls = await onboarding.mocks.outgoing({ names: ['reportInitException'] });
            expect(calls).toHaveLength(0);
        });
    });
});
