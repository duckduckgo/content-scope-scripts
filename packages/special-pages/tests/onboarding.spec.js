import { test } from '@playwright/test'
import { OnboardingPage } from './page-objects/onboarding.js'

test.describe('onboarding', () => {
    test('initial handshake', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.reducedMotion()
        await onboarding.darkMode()
        await onboarding.openPage()
        await onboarding.didSendInitialHandshake()
    })
    test('can be skipped in development', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.reducedMotion()
        await onboarding.darkMode()
        await onboarding.openPage()
        await onboarding.skipsOnboarding()
        await onboarding.didDismissToSearch()
    })
    test('step pixels', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.reducedMotion()
        await onboarding.darkMode()
        await onboarding.openPage()
        await onboarding.getStarted()
        await onboarding.didSendStepCompletedMessages()
    })
    test('exception handling', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.reducedMotion()
        await onboarding.openPage({ env: 'app', page: 'welcome', willThrow: true })
        await onboarding.handlesFatalException()
    })
    test.describe('Given I am on the summary step', () => {
        test('Then I can exit to search', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'summary' })
            await onboarding.choseToStartBrowsing()
            await onboarding.didDismissToSearch()
        })
        test('Then I can open settings', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'summary' })
            await onboarding.didDismissToSettings()
        })
    })
    test.describe('Given I am on the system settings step', () => {
        test('Then I can pin DuckDuckGo to my taskbar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'systemSettings' })
            await onboarding.keepInTaskbar()
        })
        test('The I can skip all', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'systemSettings' })
            await onboarding.skippedCurrent()
            await onboarding.skippedCurrent()
            await onboarding.skippedCurrent()
            await page.getByRole('button', { name: 'Next' }).click()
            await page.getByRole('heading', { name: 'Customize your experience' }).waitFor()
        })
    })
    test.describe('Given I am on the customize step', () => {
        test('Then I can see additional information about the steps', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'customize' })
            await onboarding.hasAdditionalInformation()
        })
        test('When I choose to show the bookmarks bar', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'customize' })

            // ▶️ Then the bookmarks bar shows
            await onboarding.showBookmarksBar()
        })
        test('When I have skipped bookmarks on the customize step', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'customize' })
            await onboarding.skippedBookmarksBar()

            // ▶️ Then I can toggle it afterward
            await onboarding.canToggleBookmarksBar()
        })
        test('When I have choosen to show the home button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'customize' })

            // skipped first 2
            await onboarding.skippedCurrent()
            await onboarding.skippedCurrent()

            await onboarding.showHomeButton()
        })
        test('When I have skipped home button', async ({ page }, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.reducedMotion()
            await onboarding.openPage({ env: 'app', page: 'customize' })

            // skipped all
            await onboarding.skippedCurrent()
            await onboarding.skippedCurrent()
            await onboarding.skippedCurrent()

            await onboarding.canToggleHomeButton()
        })
    })
    test.describe('v2', () => {
        test('shows v2 flow', async ({page}, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        // this 'dock' is not part of the default
                        rows: ['dock', 'import', 'default-browser']
                    }
                },
                env: 'development',
                order: 'v2'
            })
            await onboarding.reducedMotion()
            await onboarding.darkMode()
            await onboarding.openPage()
            await onboarding.completesOrderV2()
        })
        test('shows v2 flow without pinning step', async ({page}, workerInfo) => {
            const onboarding = OnboardingPage.create(page, workerInfo)
            await onboarding.withInitData({
                stepDefinitions: {
                    systemSettings: {
                        // this 'dock' is not part of the default
                        rows: ['dock', 'import', 'default-browser']
                    }
                },
                env: 'development',
                order: 'v2',
                exclude: ['dockSingle']
            })
            await onboarding.reducedMotion()
            await onboarding.darkMode()
            await onboarding.openPage()
            await onboarding.completesOrderV2WithoutDock()
        })
    })
})
