import { test } from '@playwright/test'
import { DuckPlayerPage } from './page-objects/duck-player.js'

test.describe('duckplayer iframe', () => {
    test('loads the iframe src without a timestamp', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
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
})

test.describe('duckplayer toolbar', () => {
    test('hides toolbar based on user activity', async ({ page }, workerInfo) => {
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
    test('tooltip shown on hover', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()

        // 1. Show tooltip on hover of info icon
        await duckplayer.hoverInfoIcon()
        await duckplayer.infoTooltipIsShown()

        // 2. Hide tooltip when mouse leaves
        await page.mouse.move(1, 1)
        await duckplayer.infoTooltipIsHidden()
    })
    test('clicking on cog icon opens settings', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()

        await page.mouse.move(1, 1)
        await duckplayer.opensSettingsInNewTab()
    })
    test('opening in youtube', async ({ page }, workerInfo) => {
        const duckplayer = DuckPlayerPage.create(page, workerInfo)
        await duckplayer.openWithVideoID()
        await duckplayer.hasLoadedIframe()
        await duckplayer.opensInYoutube()
    })
})

test.describe('duckplayer settings', () => {
    test.skip('always open setting', async ({ page }, workerInfo) => {
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
    test.skip('when a new value arrives via subscription', async ({ page }, workerInfo) => {
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
