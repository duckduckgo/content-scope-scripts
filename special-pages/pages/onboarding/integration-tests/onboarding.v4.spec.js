import { test, expect } from '@playwright/test';
import { OnboardingV4Page } from './onboarding.v4.page.js';

test.describe('onboarding v4', () => {
    test('stepCompleted includes the next step id', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV4Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
        });
        await onboarding.reducedMotion();
        await onboarding.openPage({ env: 'app', page: 'getStarted' });
        await page.getByRole('button', { name: 'Let’s get started!' }).click();
        await page.getByRole('heading', { name: 'Protections activated' }).waitFor({ timeout: 1000 });

        await onboarding.didFireStepCompleted({ id: 'getStarted', next: 'makeDefaultSingle' });
    });

    test.describe('Given I am on the make default step', () => {
        test('Then "Play YouTube videos without ads" appears when ad blocking is enabled (placebo variant)', async ({
            page,
        }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
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

        test('When I click the toggle button, it sends a telemetryEvent', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'duckPlayerSingle' });

            await page.getByRole('button', { name: 'See Without Duck Player' }).click();

            await onboarding.didFireTelemetryEvents([{ name: 'duck_player_toggled' }]);
        });

        test('When I click the toggle button twice, it sends two telemetryEvents', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'duckPlayerSingle' });

            await page.getByRole('button', { name: 'See Without Duck Player' }).click();
            await page.getByRole('button', { name: 'See With Duck Player' }).click();

            await onboarding.didFireTelemetryEvents([{ name: 'duck_player_toggled' }, { name: 'duck_player_toggled' }]);
        });

        test('Mid-playback toggle queues reverse video', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
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
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').waitFor({ timeout: 1000 });

        // Get started (welcome auto-advances after ~3.7s animation)
        await page.getByRole('heading', { name: 'Hi there' }).waitFor({ timeout: 5000 });
        await page.getByRole('button', { name: 'Let’s get started!' }).click();

        // Make default
        await page.getByRole('heading', { name: 'Protections activated' }).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByRole('heading', { name: 'Let\u2019s get you set up!' }).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Duckplayer
        await page.getByRole('heading', { name: 'Drowning in ads' }).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'See Without Duck Player' }).click();
        await page.getByRole('button', { name: 'See With Duck Player' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByRole('heading', { name: 'Let\u2019s customize a few things' }).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test.describe('init.steps', () => {
        test('Without steps, addressBarMode is the last step and searchOrChat never shows', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({ stepDefinitions: null, exclude: [] });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'addressBarMode' });
            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
            await onboarding.startBrowsing();
            await expect(page.getByRole('heading', { name: 'Try a search or AI chat' })).toHaveCount(0);
        });

        test('With searchOrChat in steps, addressBarMode advances to it and it ends onboarding', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                steps: ['welcome', 'getStarted', 'makeDefaultSingle', 'systemSettings', 'customize', 'addressBarMode', 'searchOrChat'],
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'addressBarMode' });
            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            // the counter skips searchOrChat, which has none
            await expect(page.getByText('4 of 4')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Start Browsing' })).toHaveCount(0);
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('heading', { name: 'Try a search or AI chat' }).waitFor({ timeout: 1000 });
            await expect(page.getByText(/\d of \d/)).toHaveCount(0);
            await onboarding.didFireStepCompleted({ id: 'addressBarMode', next: 'searchOrChat' });
            await expect(page.getByRole('button', { name: 'Start Browsing' })).toHaveCount(0);
        });

        test('When a config update removes searchOrChat, addressBarMode goes back to Start Browsing', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                steps: ['welcome', 'getStarted', 'addressBarMode', 'searchOrChat'],
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'addressBarMode' });
            await page.getByRole('button', { name: 'Next' }).waitFor({ timeout: 1000 });

            await onboarding.pushConfigUpdate({ exclude: ['searchOrChat'] });
            await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
            await onboarding.startBrowsing();
        });

        test('When Duck.ai is off and native leaves out addressBarMode and searchOrChat, customize ends onboarding', async ({
            page,
        }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                steps: ['welcome', 'getStarted', 'makeDefaultSingle', 'systemSettings', 'customize'],
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();
            await onboarding.skippedShowHomeButton();
            await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
            await onboarding.startBrowsing();
        });

        test('Without steps, customize advances to addressBarMode and the picker never shows', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({ stepDefinitions: null, exclude: [] });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();
            await onboarding.skippedShowHomeButton();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'addressBarMode' });
        });

        test('With picker in steps, customize advances to the picker', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                steps: ['welcome', 'getStarted', 'customize', 'picker', 'addressBarMode'],
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();
            await onboarding.skippedShowHomeButton();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('button', { name: 'Skip' }).waitFor({ timeout: 1000 });
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'picker' });
        });

        test('Shows only the listed steps in the page order, ignoring unknown entries and exclude', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                steps: ['searchOrChat', 'notAStep', 'addressBarMode', 'getStarted'],
                exclude: ['addressBarMode'],
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });
            await page.getByRole('button', { name: 'Let’s get started!' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            // counts only the listed steps
            await expect(page.getByText('1 of 1')).toBeVisible();
            await onboarding.didFireStepCompleted({ id: 'getStarted', next: 'addressBarMode' });
        });
    });

    test.describe('Given I am on the picker step', () => {
        const gmail = { id: 'gmail', url: 'https://mail.google.com', title: 'Gmail' };
        const outlook = { id: 'outlook', url: 'https://outlook.live.com', title: 'Outlook' };
        const youtube = { id: 'youtube', url: 'https://www.youtube.com', title: 'YouTube' };
        const wikipedia = { id: 'wikipedia', url: 'https://en.wikipedia.org', title: 'Wikipedia' };

        test('Add sends the toggled sites', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await page.getByRole('switch', { name: 'Gmail', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            // in list order, not click order
            await onboarding.didAddFavorites([gmail, youtube]);
            await onboarding.didFireStepCompleted({ id: 'picker', next: 'addressBarMode' });
        });

        test('The primary button comes first on Windows and last on macOS', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            const add = await page.getByRole('button', { name: 'Add to Favorites' }).boundingBox();
            const skip = await page.getByRole('button', { name: 'Skip' }).boundingBox();
            if (!add || !skip) throw new Error('picker buttons not rendered');
            if (workerInfo.project.name === 'windows') {
                expect(add.x).toBeLessThan(skip.x);
            } else {
                expect(add.x).toBeGreaterThan(skip.x);
            }
        });

        test('Add is disabled until a site is toggled', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await expect(page.getByRole('button', { name: 'Add to Favorites' })).toBeDisabled();
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Add to Favorites' })).toBeEnabled();
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Add to Favorites' })).toBeDisabled();
        });

        test('Several email providers can be picked, next to a locked one', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await onboarding.pushConfigUpdate({ stepDefinitions: { picker: { existingFavorites: ['https://mail.yahoo.com'] } } });
            await page.getByRole('switch', { name: 'Gmail', exact: true }).click();
            await page.getByRole('switch', { name: 'Outlook', exact: true }).click();
            for (const name of ['Gmail', 'Outlook', 'Yahoo Mail']) {
                await expect(page.getByRole('switch', { name, exact: true })).toHaveAttribute('aria-checked', 'true');
            }
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([gmail, outlook]);
        });

        test('Double click on Add sends one addFavorites', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).dblclick();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await onboarding.didAddFavorites([youtube]);
            // The second click can land on the next step's address bar options, which must ignore it. Leaving the
            // step first means any message the click caused has been sent before we check.
            await page.getByRole('button', { name: 'Start Browsing' }).click();
            await onboarding.mocks.waitForCallCount({ method: 'dismissToAddressBar', count: 1 });
            expect(await onboarding.mocks.outgoing({ names: ['setDuckAiInAddressBar'] })).toHaveLength(0);
        });

        test('During the exit fade, a second Add or a late Skip does nothing', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker({ reducedMotion: false });
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            const add = page.getByRole('button', { name: 'Add to Favorites' });
            await add.click();
            // the step is still mounted while it fades out, so every control must already be off
            await expect(add).toBeDisabled();
            await expect(page.getByRole('button', { name: 'Skip' })).toBeDisabled();
            await expect(page.getByRole('switch', { name: 'Gmail', exact: true })).toBeDisabled();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 2000 });
            await onboarding.didAddFavorites([youtube]);
        });

        test('Skip during the exit fade keeps Add from sending', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker({ reducedMotion: false });
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await page.getByRole('button', { name: 'Skip' }).click();
            await expect(page.getByRole('button', { name: 'Add to Favorites' })).toBeDisabled();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 2000 });
            await onboarding.didNotAddFavorites();
        });

        test('Excluding the picker while it is shown still moves on to the next step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await onboarding.pushConfigUpdate({ exclude: ['picker'] });
            await page.getByRole('button', { name: 'Skip' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await onboarding.didFireStepCompleted({ id: 'picker', next: 'addressBarMode' });
        });

        test('existingFavorites: null shows every site instead of breaking the page', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await onboarding.pushConfigUpdate({ stepDefinitions: { picker: { existingFavorites: null } } });

            await expect(page.getByRole('switch', { name: 'YouTube', exact: true })).toBeVisible();
            await expect(page.getByRole('switch', { name: 'Gmail', exact: true })).toBeVisible();
        });

        test('Skip sends no addFavorites', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await page.getByRole('button', { name: 'Skip' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await onboarding.didFireStepCompleted({ id: 'picker', next: 'addressBarMode' });
            await onboarding.didNotAddFavorites();
        });

        test('Existing favorites show as picked and locked, and the rest stay open', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await onboarding.pushConfigUpdate({ stepDefinitions: { picker: { existingFavorites: ['https://youtube.com/feed'] } } });

            const youtubeSwitch = page.getByRole('switch', { name: 'YouTube', exact: true });
            await expect(youtubeSwitch).toHaveAttribute('aria-checked', 'true');
            await expect(youtubeSwitch).toBeDisabled();
            // only existingFavorites was sent, so the default sites survive the merge
            for (const name of ['Gmail', 'Outlook', 'Yahoo Mail', 'Wikipedia']) {
                await expect(page.getByRole('switch', { name, exact: true })).toHaveAttribute('aria-checked', 'false');
                await expect(page.getByRole('switch', { name, exact: true })).toBeEnabled();
            }
            // an existing favorite alone is not a pick
            await expect(page.getByRole('button', { name: 'Add to Favorites' })).toBeDisabled();
        });

        test('Add leaves existing favorites out of addFavorites', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await onboarding.pushConfigUpdate({ stepDefinitions: { picker: { existingFavorites: ['https://www.youtube.com'] } } });
            await page.getByRole('switch', { name: 'Wikipedia', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([wikipedia]);
        });

        test('A late update locks a toggled site and drops it from the picks', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await page.getByRole('switch', { name: 'YouTube', exact: true }).click();
            await page.getByRole('switch', { name: 'Gmail', exact: true }).click();
            await onboarding.pushConfigUpdate({ stepDefinitions: { picker: { existingFavorites: ['https://www.youtube.com'] } } });
            await expect(page.getByRole('switch', { name: 'YouTube', exact: true })).toBeDisabled();
            await expect(page.getByRole('switch', { name: 'YouTube', exact: true })).toHaveAttribute('aria-checked', 'true');
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([gmail]);
        });

        test('Amazon points at the store for init.region', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker({ init: { region: 'GB' } });
            await page.getByRole('switch', { name: 'Amazon', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([{ id: 'amazon', url: 'https://www.amazon.co.uk', title: 'Amazon' }]);
        });

        test('Amazon falls back to amazon.com without a region', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await page.getByRole('switch', { name: 'Amazon', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([{ id: 'amazon', url: 'https://www.amazon.com', title: 'Amazon' }]);
        });

        test('A site list from native is resolved by its urlByRegion', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            const amazon = {
                id: 'amazon',
                url: 'https://www.amazon.com',
                urlByRegion: { GB: 'https://www.amazon.co.uk' },
                title: 'Amazon',
                section: 'popular',
            };
            await onboarding.goToPicker({ init: { region: 'GB', stepDefinitions: { picker: { sites: [amazon] } } } });
            await page.getByRole('switch', { name: 'Amazon', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([{ id: 'amazon', url: 'https://www.amazon.co.uk', title: 'Amazon' }]);
        });

        test('A site from native without urlByRegion keeps its URL', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            const amazon = { id: 'amazon', url: 'https://www.amazon.com', title: 'Amazon', section: 'popular' };
            await onboarding.goToPicker({ init: { region: 'GB', stepDefinitions: { picker: { sites: [amazon] } } } });
            await page.getByRole('switch', { name: 'Amazon', exact: true }).click();
            await page.getByRole('button', { name: 'Add to Favorites' }).click();

            await onboarding.didAddFavorites([{ id: 'amazon', url: 'https://www.amazon.com', title: 'Amazon' }]);
        });

        test('A section with every site already a favorite keeps its heading', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToPicker();
            await onboarding.pushConfigUpdate({
                stepDefinitions: {
                    picker: { existingFavorites: ['https://mail.google.com', 'https://outlook.live.com', 'https://mail.yahoo.com'] },
                },
            });

            await expect(page.getByRole('heading', { name: 'Email' })).toBeVisible();
            for (const name of ['Gmail', 'Outlook', 'Yahoo Mail']) {
                await expect(page.getByRole('switch', { name, exact: true })).toBeDisabled();
            }
        });

        test('exclude removes the picker mid-flow', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({ stepDefinitions: null, steps: ['welcome', 'getStarted', 'customize', 'picker', 'addressBarMode'] });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await expect(page.getByText('1 of 3')).toBeVisible();

            await onboarding.pushConfigUpdate({ exclude: ['picker'] });
            await expect(page.getByText('1 of 2')).toBeVisible();
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();
            await onboarding.skippedShowHomeButton();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'addressBarMode' });
        });
    });

    test.describe('Given I am leaving the step before the picker', () => {
        test('A yes shows the picker with the existing favorites locked', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withPickerAnswer({ show: true, existingFavorites: ['https://www.youtube.com'] });
            await onboarding.goToStepBeforePicker();
            await expect(page.getByText('1 of 3')).toBeVisible();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('button', { name: 'Skip' }).waitFor({ timeout: 1000 });
            await expect(page.getByText('2 of 3')).toBeVisible();
            await expect(page.getByRole('switch', { name: 'YouTube', exact: true })).toBeDisabled();
            await expect(page.getByRole('switch', { name: 'YouTube', exact: true })).toHaveAttribute('aria-checked', 'true');
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'picker' });
        });

        test('A no skips the picker and shrinks the counter', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withPickerAnswer({ show: false });
            await onboarding.goToStepBeforePicker();
            await expect(page.getByText('1 of 3')).toBeVisible();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await expect(page.getByText('2 of 2')).toBeVisible();
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'addressBarMode' });
        });

        test('An answer without show skips the picker', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withPickerAnswer({});
            await onboarding.goToStepBeforePicker();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 1000 });
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'addressBarMode' });
        });

        test('No answer skips the picker after the timeout', async ({ page }, workerInfo) => {
            test.skip(workerInfo.project.name !== 'windows', 'holdRequests works on the Windows transport only');
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.holdRequests(['shouldShowTopSitesPicker']);
            await onboarding.goToStepBeforePicker();
            await page.getByRole('button', { name: 'Next' }).click();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 4000 });
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'addressBarMode' });
        });

        test('Double click on Next asks native once', async ({ page }, workerInfo) => {
            test.skip(workerInfo.project.name !== 'windows', 'holdRequests works on the Windows transport only');
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            // Held, so the second click lands while the page still waits rather than on the picker
            onboarding.holdRequests(['shouldShowTopSitesPicker']);
            await onboarding.goToStepBeforePicker();
            await page.getByRole('button', { name: 'Next' }).dblclick();

            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 4000 });
            expect(await onboarding.mocks.outgoing({ names: ['shouldShowTopSitesPicker'] })).toHaveLength(1);
        });

        test('The step stays inert while the page waits for the answer', async ({ page }, workerInfo) => {
            test.skip(workerInfo.project.name !== 'windows', 'holdRequests works on the Windows transport only');
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.holdRequests(['shouldShowTopSitesPicker']);
            await onboarding.goToStepBeforePicker();
            await page.getByRole('button', { name: 'Next' }).click();

            await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
            await expect(page.getByRole('switch', { name: 'Show Bookmarks Bar' })).toBeDisabled();
            await page.getByRole('heading', { name: 'Want easy access to private AI Chat?' }).waitFor({ timeout: 4000 });
            await onboarding.didFireStepCompleted({ id: 'customize', next: 'addressBarMode' });
        });
    });

    test.describe('Given I am on the searchOrChat step', () => {
        test('Search is selected by default and a suggestion sends it as a search', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToSearchOrChat();
            await expect(page.getByRole('heading', { name: 'Ready to get started? Try a search or AI chat!' })).toBeVisible();
            await expect(page.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'true');
            await expect(page.getByPlaceholder('Search Privately')).toBeFocused();
            await expect(page.getByRole('button', { name: 'Mighty ducks cast' })).toBeVisible();

            await page.getByRole('button', { name: 'How to say "duck" in spanish' }).click();
            await onboarding.didSubmitQuery({ mode: 'search', query: 'How to say "duck" in spanish', source: 'suggestion' });
        });

        test('Surprise me! sends an image search', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToSearchOrChat();
            await page.getByRole('button', { name: 'Surprise me!' }).click();
            await onboarding.didSubmitQuery({ mode: 'search', query: '!image baby ducklings', source: 'suggestion' });
        });

        test('Ask AI swaps the placeholder and suggestions, and Surprise me! sends a prompt', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToSearchOrChat();
            await page.getByRole('tab', { name: 'Ask AI' }).click();
            await expect(page.getByRole('tab', { name: 'Ask AI' })).toHaveAttribute('aria-selected', 'true');
            await expect(page.getByPlaceholder('Ask anything privately')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Explain the stock market like I’m 10' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Plan a perfect day in London' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Mighty ducks cast' })).toHaveCount(0);

            await page.getByRole('button', { name: 'Surprise me!' }).click();
            await onboarding.didSubmitQuery({
                mode: 'duckAi',
                query: 'What are 10 fascinating facts across science, nature, and history?',
                source: 'suggestion',
            });
        });

        test('Enter submits the typed text in the selected mode, and blank text sends nothing', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToSearchOrChat();
            const input = page.getByRole('textbox');
            await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
            await input.fill('   ');
            await input.press('Enter');
            expect(await onboarding.mocks.outgoing({ names: ['submitQuery'] })).toHaveLength(0);

            await page.getByRole('tab', { name: 'Ask AI' }).click();
            await input.fill('  what is a duck?  ');
            await input.press('Enter');
            await onboarding.didSubmitQuery({ mode: 'duckAi', query: 'what is a duck?', source: 'typed' });
            await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
        });

        test('After Search Only on addressBarMode, it offers search alone', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.goToSearchOrChat({ searchOnly: true });
            await expect(page.getByRole('heading', { name: 'Now, try a private search!' })).toBeVisible();
            await expect(page.getByRole('tablist')).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'What’s "duck" in 10 languages' })).toBeVisible();

            await page.getByRole('textbox').fill('ducks');
            await page.getByRole('button', { name: 'Submit' }).click();
            await onboarding.didSubmitQuery({ mode: 'search', query: 'ducks', source: 'typed' });
        });
    });

    test.describe('Given I am on the settings step with dock-instructions variant', () => {
        test('When I advance to the settings step, it sends row_shown for the first row', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
                exclude: ['makeDefaultSingle'],
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });

            await page.getByRole('button', { name: 'Let’s get started!' }).click();

            await onboarding.didFireTelemetryEvents([{ name: 'row_shown', value: 'dock-instructions' }]);
        });

        test('When I click Show Me How, it shows dock instructions overlay', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.showDockInstructions();

            await expect(page.getByText('Hold control and click the DuckDuckGo app icon')).toBeVisible();
            await expect(page.getByText('Options')).toBeVisible();
            await expect(page.getByText('Keep in Dock')).toBeVisible();
        });

        test('When I click Show Me How, it sends telemetryEvents', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.showDockInstructions();

            await onboarding.didFireTelemetryEvents([{ name: 'dock_instructions_shown' }]);
        });

        test('When I click Show Me How then Next, it sends row_shown for import', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.showDockInstructions();
            await onboarding.dismissDockInstructions();

            await onboarding.didFireTelemetryEvents([{ name: 'dock_instructions_shown' }, { name: 'row_shown', value: 'import' }]);
        });

        test('When I skip dock-instructions, it sends row_shown for import', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.skippedCurrent();

            await onboarding.didFireTelemetryEvents([
                { name: 'row_skipped', value: 'dock-instructions' },
                { name: 'row_shown', value: 'import' },
            ]);
        });

        test('When I skip dock-instructions, it does not send dock_instructions_shown', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.skippedCurrent();
            await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();

            await onboarding.didNotFireTelemetryEvent({ name: 'dock_instructions_shown' });
        });

        test('When I click Show Me How then Next, it advances to the next row', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
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
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            await onboarding.skippedCurrent();

            await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
        });
    });

    test.describe('Given I am on the import row', () => {
        test('When I skip import, it sends row_skipped', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // Skip dock-instructions to get to import
            await onboarding.skippedCurrent();
            await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();

            // Skip import
            await onboarding.skippedCurrent();

            await onboarding.didFireTelemetryEvents([
                { name: 'row_skipped', value: 'dock-instructions' },
                { name: 'row_shown', value: 'import' },
                { name: 'row_skipped', value: 'import' },
            ]);
        });

        test('When I accept import, it does not send row_skipped', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock-instructions', 'import'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // Skip dock-instructions to get to import
            await onboarding.skippedCurrent();
            await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();

            // Accept import
            await onboarding.importUserData();

            await onboarding.didNotFireTelemetryEvent({ name: 'row_skipped', value: 'import' });
        });
    });

    test.describe('Given I am on the settings step', () => {
        test('When I have choosen to add to dock/taskbar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
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
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.hasAdditionalInformationV4();
        });

        test('When I choose to show the bookmarks bar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
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

        test('falls back to ErrorEvent.message when event.error is null', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.evaluate(() => {
                window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.', error: null }));
            });

            const calls = await onboarding.mocks.waitForCallCount({ method: 'reportInitException', count: 1 });
            expect(calls).toMatchObject([
                {
                    payload: {
                        params: { message: '[uncaught] Script error.' },
                    },
                },
            ]);
        });

        test("falls back to 'unknown error' when ErrorEvent has neither error nor message", async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.evaluate(() => {
                window.dispatchEvent(new ErrorEvent('error', { error: null }));
            });

            const calls = await onboarding.mocks.waitForCallCount({ method: 'reportInitException', count: 1 });
            expect(calls).toMatchObject([
                {
                    payload: {
                        params: { message: '[uncaught] unknown error' },
                    },
                },
            ]);
        });

        test('stringifies a thrown non-Error value', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.evaluate(() => {
                setTimeout(() => {
                    // eslint-disable-next-line no-throw-literal -- intentional: a non-Error throw surfaces via event.error
                    throw 'raw string';
                }, 0);
            });

            const calls = await onboarding.mocks.waitForCallCount({ method: 'reportInitException', count: 1 });
            expect(calls).toMatchObject([
                {
                    payload: {
                        params: { message: '[uncaught] raw string' },
                    },
                },
            ]);
        });

        test('reports primitive and nullish rejection reasons distinctly', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app' });

            await page.evaluate(() => {
                /* eslint-disable prefer-promise-reject-errors -- intentional: testing non-Error rejection reasons */
                setTimeout(() => Promise.reject(undefined), 0);
                setTimeout(() => Promise.reject(null), 0);
                setTimeout(() => Promise.reject(0), 0);
                /* eslint-enable prefer-promise-reject-errors */
            });

            const calls = await onboarding.mocks.waitForCallCount({ method: 'reportInitException', count: 3 });
            const messages = calls.map((c) => c.payload.params.message);
            expect(messages).toEqual(
                expect.arrayContaining(['[unhandledrejection] undefined', '[unhandledrejection] null', '[unhandledrejection] 0']),
            );
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

    test.describe('Chrome extension checkbox on getStarted step', () => {
        test('checkbox is NOT shown by default', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });
            await expect(page.getByRole('checkbox', { name: 'Also install our Chrome search extension' })).not.toBeVisible();
        });

        test('checkbox IS shown when stepDefinitions include chrome-extension-install option', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    getStarted: {
                        options: ['chrome-extension-install'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });
            await expect(page.getByRole('checkbox', { name: 'Also install our Chrome search extension' })).toBeVisible();
        });

        test('advancing with checkbox checked sends requestChromeExtensionInstall', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    getStarted: {
                        options: ['chrome-extension-install'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });

            await page.getByRole('checkbox', { name: 'Also install our Chrome search extension' }).check();
            await page.getByRole('button', { name: 'Start Browser Setup' }).click();

            const calls = await onboarding.mocks.outgoing({ names: ['requestChromeExtensionInstall'] });
            expect(calls).toMatchObject([
                {
                    payload: {
                        context: 'specialPages',
                        featureName: 'onboarding',
                        method: 'requestChromeExtensionInstall',
                        params: {},
                    },
                },
            ]);
        });

        test('advancing with checkbox unchecked does NOT send requestChromeExtensionInstall', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    getStarted: {
                        options: ['chrome-extension-install'],
                    },
                },
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });

            await page.getByRole('button', { name: 'Start Browser Setup' }).click();

            const calls = await onboarding.mocks.outgoing({ names: ['requestChromeExtensionInstall'] });
            expect(calls).toHaveLength(0);
        });
    });

    test.describe('Windows installation checkboxes on getStarted step', () => {
        const extensionLabel = 'Install our extension to search privately in other browsers';
        const startupLabel = 'Open DuckDuckGo when your computer starts up';

        for (const showExtensions of [false, true]) {
            for (const showStartup of [false, true]) {
                test(`visibility and optional payload: extensions=${showExtensions}, startup=${showStartup}`, async ({
                    page,
                }, workerInfo) => {
                    const onboarding = OnboardingV4Page.create(page, workerInfo);
                    const options = [];
                    if (showExtensions) options.push('sideload-extensions');
                    if (showStartup) options.push('open-at-startup');
                    onboarding.withInitData({ stepDefinitions: { getStarted: { options } } });
                    await onboarding.reducedMotion();
                    await onboarding.openPage({ env: 'app', page: 'getStarted' });

                    const isWindows = workerInfo.project.name === 'windows';
                    const extensions = page.getByRole('checkbox', { name: extensionLabel });
                    const startup = page.getByRole('checkbox', { name: startupLabel });
                    if (showExtensions) {
                        await expect(extensions).toBeVisible();
                        await expect(extensions).not.toBeChecked();
                    } else {
                        await expect(extensions).not.toBeVisible();
                    }
                    if (showStartup) {
                        await expect(startup).toBeVisible();
                        await expect(startup).toBeChecked();
                    } else {
                        await expect(startup).not.toBeVisible();
                    }

                    await page.getByRole('button', { name: options.length ? 'Start Browser Setup' : 'Let’s get started!' }).click();
                    await expect(page.getByRole('heading', { name: 'Protections activated' })).toBeVisible();
                    const calls = await onboarding.mocks.outgoing({ names: ['setOnboardingInstallOptions'] });
                    expect(calls).toHaveLength(isWindows ? 1 : 0);
                    if (isWindows) {
                        expect(calls[0].payload.params).toEqual({
                            ...(showExtensions ? { sideloadExtensions: false } : {}),
                            ...(showStartup ? { openAtStartup: true } : {}),
                        });
                    }
                });
            }
        }

        test('missing native options keep both Windows controls hidden', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({ stepDefinitions: {} });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });
            await expect(page.getByRole('checkbox', { name: extensionLabel })).not.toBeVisible();
            await expect(page.getByRole('checkbox', { name: startupLabel })).not.toBeVisible();
        });

        for (const sideloadExtensions of [false, true]) {
            for (const openAtStartup of [false, true]) {
                test(`submits choices: extensions=${sideloadExtensions}, startup=${openAtStartup}`, async ({ page }, workerInfo) => {
                    test.skip(workerInfo.project.name !== 'windows', 'Installation choices are offered on Windows only');
                    const onboarding = OnboardingV4Page.create(page, workerInfo);
                    onboarding.withInitData({ stepDefinitions: { getStarted: { options: ['sideload-extensions', 'open-at-startup'] } } });
                    await onboarding.reducedMotion();
                    await onboarding.openPage({ env: 'app', page: 'getStarted' });

                    await page.getByRole('checkbox', { name: extensionLabel }).setChecked(sideloadExtensions);
                    await page.getByRole('checkbox', { name: startupLabel }).setChecked(openAtStartup);
                    expect(await onboarding.mocks.outgoing({ names: ['setOnboardingInstallOptions'] })).toHaveLength(0);
                    await page.getByRole('button', { name: 'Start Browser Setup' }).click();
                    await expect(page.getByRole('heading', { name: 'Protections activated' })).toBeVisible();

                    const calls = await onboarding.mocks.outgoing({ names: ['setOnboardingInstallOptions'] });
                    expect(calls).toHaveLength(1);
                    expect(calls[0].payload).toMatchObject({
                        context: 'specialPages',
                        featureName: 'onboarding',
                        method: 'setOnboardingInstallOptions',
                        params: { sideloadExtensions, openAtStartup },
                    });
                    const messages = await onboarding.mocks.outgoing({ names: ['setOnboardingInstallOptions', 'stepCompleted'] });
                    const choicesIndex = messages.findIndex((message) => message.payload.method === 'setOnboardingInstallOptions');
                    const completedIndex = messages.findIndex(
                        (message) => message.payload.method === 'stepCompleted' && message.payload.params.id === 'getStarted',
                    );
                    expect(choicesIndex).toBeGreaterThanOrEqual(0);
                    expect(completedIndex).toBeGreaterThan(choicesIndex);
                    expect(
                        await onboarding.mocks.outgoing({
                            names: ['requestChromeExtensionInstall', 'reportPageException', 'reportInitException'],
                        }),
                    ).toHaveLength(0);
                });
            }
        }

        test('choices can be toggled and submitted with the keyboard', async ({ page }, workerInfo) => {
            test.skip(workerInfo.project.name !== 'windows', 'Installation choices are offered on Windows only');
            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({ stepDefinitions: { getStarted: { options: ['sideload-extensions', 'open-at-startup'] } } });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'getStarted' });

            const button = page.getByRole('button', { name: 'Start Browser Setup' });
            await button.focus();
            await page.keyboard.press('Tab');
            const startup = page.getByRole('checkbox', { name: startupLabel });
            await expect(startup).toBeFocused();
            await page.keyboard.press('Space');
            await expect(startup).not.toBeChecked();
            await page.keyboard.press('Tab');
            const extensions = page.getByRole('checkbox', { name: extensionLabel });
            await expect(extensions).toBeFocused();
            await page.keyboard.press('Space');
            await expect(extensions).toBeChecked();
            await button.focus();
            await page.keyboard.press('Enter');
            await expect(page.getByRole('heading', { name: 'Protections activated' })).toBeVisible();

            const calls = await onboarding.mocks.outgoing({ names: ['setOnboardingInstallOptions'] });
            expect(calls).toHaveLength(1);
            expect(calls[0].payload.params).toEqual({ sideloadExtensions: true, openAtStartup: false });
        });

        for (const colorScheme of /** @type {const} */ (['light', 'dark'])) {
            for (const height of [768, 500]) {
                test(`layout in ${colorScheme} mode at height ${height}`, async ({ page }, workerInfo) => {
                    test.skip(workerInfo.project.name !== 'windows', 'Installation choices are offered on Windows only');
                    const onboarding = OnboardingV4Page.create(page, workerInfo);
                    onboarding.withInitData({ stepDefinitions: { getStarted: { options: ['sideload-extensions', 'open-at-startup'] } } });
                    await page.emulateMedia({ colorScheme });
                    await page.setViewportSize({ width: 1024, height });
                    await onboarding.reducedMotion();
                    await onboarding.openPage({ env: 'app', page: 'getStarted' });

                    const button = page.getByRole('button', { name: 'Start Browser Setup' });
                    const extensions = page.getByRole('checkbox', { name: extensionLabel });
                    const startup = page.getByRole('checkbox', { name: startupLabel });
                    await expect(button).toBeInViewport();
                    await expect(extensions).toBeInViewport();
                    await expect(startup).toBeInViewport();
                    const buttonBox = await button.boundingBox();
                    const extensionBox = await extensions.boundingBox();
                    const startupBox = await startup.boundingBox();
                    expect(startupBox?.y).toBeGreaterThanOrEqual((buttonBox?.y ?? 0) + (buttonBox?.height ?? 0));
                    expect(extensionBox?.y).toBeGreaterThan((startupBox?.y ?? 0) + (startupBox?.height ?? 0));
                    await page.screenshot({ path: workerInfo.outputPath('install-options.png') });

                    await page.getByLabel('More information').hover();
                    await expect(page.getByRole('tooltip')).toHaveText(
                        'Set DuckDuckGo as your default search engine to search online without being tracked',
                    );
                    await expect(page.getByRole('tooltip')).toBeInViewport();
                });
            }
        }
    });

    test.describe('Given a settings update is in flight', () => {
        test('Then a control on another row cannot start a second update', async ({ page }, workerInfo) => {
            test.skip(workerInfo.project.name !== 'windows', 'holdRequests patches the Windows transport only');

            const onboarding = OnboardingV4Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import'],
                    },
                },
            });
            // The native import window holds the request open for as long as the user needs.
            onboarding.holdRequests(['requestImport']);
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // Skip the taskbar row. It keeps a live button, and the import row appears.
            await onboarding.skippedCurrent();
            const taskbar = page.getByRole('button', { name: 'Pin to Taskbar' });
            await taskbar.waitFor();

            await page.getByRole('button', { name: 'Import Now' }).click();
            await onboarding.mocks.waitForCallCount({ method: 'requestImport', count: 1 });

            // The reducer has no transition for a second action, so the click must not reach it.
            const names = ['reportInitException', 'reportPageException'];
            const before = await onboarding.mocks.outgoing({ names });
            await taskbar.click({ force: true });
            const after = await onboarding.mocks.outgoing({ names });
            expect(after).toHaveLength(before.length);

            await expect(taskbar).toBeDisabled();
        });
    });
});
