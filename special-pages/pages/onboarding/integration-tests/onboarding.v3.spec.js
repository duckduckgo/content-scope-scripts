import { test, expect } from '@playwright/test';
import { OnboardingV3Page } from './onboarding.v3.page.js';

test.describe('onboarding v3', () => {
    test.describe('Given I am on the make default step', () => {
        test('Then "Play YouTube without targeted ads" appears when ad blocking is enabled (placebo variant)', async ({
            page,
        }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'makeDefaultSingle' });
            await onboarding.checkYouTubeText(false);
        });

        test('Then "Watch YouTube ad-free" appears when ad blocking is enabled (aggressive variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'aggressive-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'makeDefaultSingle' });
            await onboarding.checkYouTubeText(true);
        });

        test('Then "Watch YouTube ad-free" appears when ad blocking is enabled (YouTube variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'youtube-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'makeDefaultSingle' });
            await onboarding.checkYouTubeText(true);
        });
    });

    test.describe('Given I am on the system settings step', () => {
        test('Then I can turn on ad blocking (placebo variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.enableEnhancedAdBlocking();
        });

        test('Then I can skip ad blocking (placebo variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'placebo-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.skipAdBlocking();
        });

        test('Then I can turn on ad blocking (aggressive variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'aggressive-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.enableEnhancedAdBlocking();
        });

        test('Then I can skip ad blocking (aggresive variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'aggressive-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.skipAdBlocking();
        });

        test('Then I can turn on ad blocking (YouTube variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'youtube-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.enableYouTubeAdBlocking();
        });

        test('Then I can skip ad blocking (YouTube variant)', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        rows: ['dock', 'import', 'youtube-ad-blocking'],
                    },
                },
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();
            await onboarding.skippedCurrent();
            await onboarding.skipYouTubeAdBlocking();
        });
    });

    test('shows v3 flow', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let’s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let’s get you set up!').nth(1).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Duckplayer
        await page.getByText('Drowning in ads').nth(1).waitFor({ timeout: 1000 });
        await page.getByLabel('See Without Duck Player').click();
        await page.getByLabel('See With Duck Player').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByText('Let’s customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test('shows v3 flow without system settings step', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: null,
            order: 'v3',
            exclude: ['systemSettings'],
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let’s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // Duckplayer (no system settings step)
        await page.getByText('Drowning in ads').nth(1).waitFor({ timeout: 1000 });
        await page.getByLabel('See Without Duck Player').click();
        await page.getByLabel('See With Duck Player').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByText('Let’s customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test('shows v3 flow with newDuckPlayerScreen (no toggle button)', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                duckPlayerSingle: {
                    newDuckPlayerScreen: true,
                },
            },
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let's Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let's get you set up!').nth(1).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Duckplayer - toggle button should NOT be present
        await page.getByText('Drowning in ads').nth(1).waitFor({ timeout: 1000 });
        await expect(page.getByLabel('See Without Duck Player')).toBeHidden();
        await expect(page.getByLabel('See With Duck Player')).toBeHidden();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByText('Let's customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test('shows v3 flow with ad blocking', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'aggressive-ad-blocking'],
                },
            },
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let’s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let’s get you set up!').nth(1).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import Now', exact: true }).click();
        await page.getByRole('button', { name: 'Turn on Enhanced Ad Blocking', exact: true }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // No Duck Player step as ad blocking was enabled

        // Customize
        await page.getByText('Let’s customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test('shows v3 flow with ad blocking disabled', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'aggressive-ad-blocking'],
                },
            },
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let’s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let’s get you set up!').nth(1).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import Now', exact: true }).click();
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Duck Player
        await page.getByText('Drowning in ads').nth(1).waitFor({ timeout: 1000 });
        await page.getByLabel('See Without Duck Player').click();
        await page.getByLabel('See With Duck Player').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByText('Let’s customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test('shows v3 flow with ad blocking (YouTube variant)', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'youtube-ad-blocking'],
                },
            },
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let’s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let’s get you set up!').nth(1).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import Now', exact: true }).click();
        await page.getByRole('button', { name: 'Block Ads', exact: true }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // No Duck Player step as ad blocking was enabled

        // Customize
        await page.getByText('Let’s customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test('shows v3 flow with ad blocking disabled (YouTube variant)', async ({ page }, workerInfo) => {
        const onboarding = OnboardingV3Page.create(page, workerInfo);
        onboarding.withInitData({
            stepDefinitions: {
                systemSettings: {
                    rows: ['dock', 'import', 'youtube-ad-blocking'],
                },
            },
            order: 'v3',
        });
        await onboarding.reducedMotion();
        await onboarding.darkMode();
        await onboarding.openPage();

        // Welcome
        await page.getByText('Welcome to DuckDuckGo').nth(1).waitFor({ timeout: 1000 });

        // Get started
        await page.getByText('Hi there').nth(1).waitFor({ timeout: 1500 });
        await page.getByRole('button', { name: 'Let’s Do It' }).click();

        // Make default
        await page.getByText('Protections activated').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Make DuckDuckGo Your Default' }).click();
        await page.getByText('Excellent!').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Next' }).click();

        // System settings
        await page.getByText('Let’s get you set up!').nth(1).waitFor({ timeout: 1000 });
        const dockButton = onboarding.build.switch({
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
        });
        await dockButton.click();
        await page.getByRole('button', { name: 'Import Now', exact: true }).click();
        await page.getByRole('button', { name: 'Skip', exact: true }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Duck Player
        await page.getByText('Drowning in ads').nth(1).waitFor({ timeout: 1000 });
        await page.getByLabel('See Without Duck Player').click();
        await page.getByLabel('See With Duck Player').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Customize
        await page.getByText('Let’s customize a few things').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Address bar mode
        await page.getByText('Want easy access to private AI Chat?').nth(1).waitFor({ timeout: 1000 });
        await page.getByRole('button', { name: 'Search & Duck.ai' }).click();
        await page.getByRole('button', { name: 'Search Only' }).click();
        await onboarding.startBrowsing();
    });

    test.describe('Given I am on the settings step', () => {
        test('When I have choosen to add to dock/taskbar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // ▶️ Then I can add to dock/taskbar
            await onboarding.keepInTaskbar();
        });

        test('When I have skipped add to dock/taskbar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });

            // And I have skipped that step
            await onboarding.skippedCurrent();

            // ▶️ Then I can add it afterwards
            await onboarding.keepInTaskbar();
        });

        test('When I choose to import bookmarks and passwords', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'systemSettings' });
            await onboarding.skippedCurrent();

            // ▶️ Then I can import the data
            await onboarding.importUserData();
        });

        test('When I have skipped import on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
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

            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withMockData({
                init: {
                    stepDefinitions: null,
                    order: 'v3',
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
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.hasAdditionalInformationV3();
        });

        test('When I choose to show the bookmarks bar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });

            // ▶️ Then the bookmarks bar shows
            await onboarding.showBookmarksBar();
        });

        test('When I have skipped bookmarks on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();

            // ▶️ Then I can toggle it afterward
            await onboarding.canToggleBookmarksBar();
        });

        test('When I choose to restore previous session', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();

            // ▶️ Then the restore session bar shows
            await onboarding.restoreSession();
        });

        test('When I have skipped restore session on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'customize' });
            await onboarding.skippedBookmarksBar();
            await onboarding.skippedSessionRestore();

            // ▶️ Then I can toggle it afterward
            await onboarding.canToggleRestoreSession();
        });

        test('When I have choosen to show the home button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
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
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
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
            const onboarding = OnboardingV3Page.create(page, workerInfo);
            onboarding.withInitData({
                stepDefinitions: null,
                order: 'v3',
            });
            await onboarding.reducedMotion();
            await onboarding.openPage({ env: 'app', page: 'addressBarMode' });

            // ▶️ Then I can toggle it afterward
            await onboarding.startBrowsing();
        });
    });
});
