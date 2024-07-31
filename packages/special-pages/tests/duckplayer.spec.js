import { expect, test } from '@playwright/test'
import { DuckPlayerPage } from './page-objects/duck-player.js'

test.describe('duckplayer iframe', () => {
    test('loads the iframe src without a timestamp', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.videoHasFocus()
    })
    test('only accepts first 11 chars of an id', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID('this_has_too_many_chars')
        await duckplayer.hasLoadedIframe('this_has_to')
    })
    test('reflects title from embed', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasTheSameTitleAsEmbed()
    })
    test('loads the iframe src with a timestamp', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithTimestamp('2h3m1s')
        await duckplayer.videoStartsAtTimestamp('7381')
    })
    test('ignores the timestamp when the format is invalid', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithTimestamp('aaaqkw')
        await duckplayer.hasLoadedIframe()
    })
    test('shows error message when video id is invalid', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID('€%dd#"')
        await duckplayer.hasShownErrorMessage()
        await duckplayer.hasNotAddedIframe()
    })
    test('supports "watch on youtube" for unsupported videos', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID('UNSUPPORTED')
        await duckplayer.opensInYoutubeFromError({ videoID: 'UNSUPPORTED' })
    })
    test('clears storage', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.withStorageValues()
        await duckplayer.storageClearedAfterReload()
    })
    test('allows popups from embed', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.allowsPopups()
    })
    test('pip setting', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        duckplayer.pipSettingIs({ state: 'enabled' })
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.hasPipButton()
    })
    test('pip setting disabled', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        duckplayer.pipSettingIs({ state: 'disabled' })
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.pipButtonIsAbsent()
    })
})

test.describe('duckplayer toolbar', () => {
    test('hides toolbar based on user activity', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()

        // 1. Expect toolbar to be visible at page load
        await duckplayer.toolbarIsVisible()

        // 2. Expect it to be hidden after 2 seconds of inactivity
        await duckplayer.toolbarIsHidden()

        // 3. Expect it to be shown if there is mouse activity
        await page.mouse.move(10, 10)
        await duckplayer.toolbarIsVisible()
    })
    test('clicking on cog icon opens settings', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.opensSettingsInNewTab()
    })
    test('opening in youtube', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.opensInYoutube()
    })
})

test.describe('duckplayer mobile settings', () => {
    test('open setting on tap', async ({ page }, workerInfo) => {
        test.skip(isDesktop(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.openSettings()
        await duckplayer.didOpenMobileSettings()
    })
    test('open info modal on tap', async ({ page }, workerInfo) => {
        test.skip(isDesktop(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.openInfo()
        await duckplayer.didOpenInfo()
    })
    test('open on Youtube on tap', async ({ page }, workerInfo) => {
        test.skip(isDesktop(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.watchOnYoutube()
        await duckplayer.didWatchOnYoutube()
    })
    test('toggles the switch', async ({ page }, workerInfo) => {
        test.skip(isDesktop(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.reducedMotion()
        await page.getByLabel('Keep Duck Player turned on').click() // can't 'check' here
        await page.getByLabel('Keep Duck Player turned on').waitFor({ state: 'hidden' })
        await duckplayer.sentUpdatedSettings()
    })
})

test.describe('duckplayer desktop settings', () => {
    test('always open setting', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()

        // wait for settings to have arrived
        await duckplayer.didReceiveFirstSettingsUpdate()
        await duckplayer.settingsAreVisible()

        await page.mouse.move(1, 1)
        await page.mouse.move(10, 10)
        // now toggle and assert we send the message to native
        await duckplayer.toggleAlwaysOpenSetting()
        await duckplayer.sentUpdatedSettings()
    })
    test('when a new value arrives via subscription', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()

        // wait for settings to have arrived
        await duckplayer.didReceiveFirstSettingsUpdate()
        await duckplayer.settingsAreVisible()

        // now simulate the user enabling the player in settings
        await duckplayer.enabledViaSettings()
        await duckplayer.checkboxWasChecked()
    })
})

test.describe('screenshots @screenshots', () => {
    test('regular layout', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await expect(page).toHaveScreenshot('regular-layout.png', { maxDiffPixels: 50 })
    })
    test('layout when enabled', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        duckplayer.playerIsEnabled()
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.didReceiveFirstSettingsUpdate()
        await expect(page).toHaveScreenshot('enabled-layout.png', { maxDiffPixels: 50 })
    })
    test('player error', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID('€%dd#"')
        await duckplayer.hasShownErrorMessage()
        await expect(page).toHaveScreenshot('error-layout.png', { maxDiffPixels: 50 })
    })
    test('tooltip shown on hover', async ({ page }, workerInfo) => {
        test.skip(isMobile(workerInfo))
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithoutFocusMode()
        await duckplayer.hasLoadedIframe()

        await duckplayer.infoTooltipIsShowsOnFocus()
        await expect(page).toHaveScreenshot('tooltip.png', { maxDiffPixels: 50 })
        await duckplayer.infoTooltipHides()
    })
})

test.describe('reporting exceptions', () => {
    test('regular layout', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        // load as normal
        await duckplayer.openWithException()
        await duckplayer.showsErrorMessage()
    })
})

/**
 * @param {import("@playwright/test").TestInfo} testInfo
 */
function isMobile (testInfo) {
    const u = /** @type {any} */(testInfo.project.use)
    return u?.platform === 'android' || u?.platform === 'ios'
}
/**
 * @param {import("@playwright/test").TestInfo} testInfo
 */
function isDesktop (testInfo) {
    return !isMobile(testInfo)
}
