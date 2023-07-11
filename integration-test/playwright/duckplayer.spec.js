import { test } from '@playwright/test'
import { DuckplayerOverlays } from './page-objects/duckplayer-overlays.js'

test.describe('Duck Player Thumbnail Overlays on YouTube.com', () => {
    test('Overlays show on thumbnails when enabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is enabled
        await overlays.overlaysEnabled()
        await overlays.gotoThumbsPage()

        // When I hover any video thumbnail
        await overlays.hoverAThumbnail()

        // Then our overlay shows
        await overlays.isVisible()
    })
    test('Overlays never appear on "shorts"', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.overlaysEnabled()
        await overlays.gotoThumbsPage()

        // Ensure the hover works normally to prevent false positives
        await overlays.hoverAThumbnail()
        await overlays.isVisible()

        // now ensure the hover doesn't work on shorts
        await overlays.hoverShort()
        await overlays.overlaysDontShow()
    })
    /**
     * https://app.asana.com/0/1201048563534612/1204993915251837/f
     */
    test('Clicks are not intercepted on shorts when "enabled"', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.overlaysEnabled()
        await overlays.userSettingIs('enabled')
        await overlays.gotoThumbsPage()
        const navigation = overlays.requestWillFail()
        await overlays.clicksFirstShortsThumbnail()
        const url = await navigation
        await overlays.opensShort(url)
    })
    test('Overlays don\'t show on thumbnails when disabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is disabled
        await overlays.overlaysDisabled()
        await overlays.gotoThumbsPage()

        // Then our overlays never show
        await overlays.overlaysDontShow()
    })
    test('Overlays link to Duck Player', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is enabled
        await overlays.overlaysEnabled()
        await overlays.gotoThumbsPage()

        // When I click the DDG overlay
        await overlays.clickDDGOverlay()

        // Then our player loads for the correct video
        await overlays.playerLoadsForCorrectVideo()
    })
    test('Overlays dont show when user setting is "enabled"', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is enabled
        await overlays.overlaysEnabled()
        await overlays.userSettingIs('enabled')
        await overlays.gotoThumbsPage()
        await overlays.overlaysDontShow()
    })
    test('Overlays dont show when user setting is "disabled"', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is enabled
        await overlays.overlaysEnabled()
        await overlays.userSettingIs('disabled')
        await overlays.gotoThumbsPage()
        await overlays.overlaysDontShow()
    })
    test('Overlays appear when updated settings arrive', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is enabled
        await overlays.overlaysEnabled()
        await overlays.userSettingIs('disabled')
        await overlays.gotoThumbsPage()

        // Nothing shown initially
        await overlays.overlaysDontShow()

        // now receive an update
        await overlays.userChangedSettingTo('always ask')

        // overlays act as normal
        await overlays.hoverAThumbnail()
        await overlays.isVisible()
    })
    test('Overlays disappear when updated settings arrive', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given the "overlays" feature is enabled
        await overlays.overlaysEnabled()
        await overlays.userSettingIs('always ask')
        await overlays.gotoThumbsPage()

        // overlays act as normal initially
        await overlays.hoverAThumbnail()
        await overlays.isVisible()

        // now receive an update
        await overlays.userChangedSettingTo('disabled')

        // overlays should be removed
        await overlays.overlaysDontShow()
    })
})

test.describe('Duck Player Overlays on Video Player in YouTube.com', () => {
    test('Overlay blocks video from playing', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()

        // Then then the overlay shows and blocks the video from playing
        await overlays.overlayBlocksVideo()
    })
    test('Overlay blocks video from playing (supporting DOM appearing over time)', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage({ variant: 'incremental-dom' })

        // Then then the overlay shows and blocks the video from playing
        await overlays.overlayBlocksVideo()
    })
    test('Overlay is removed when new settings arrive', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()

        // then the overlay shows and blocks the video from playing
        await overlays.overlayBlocksVideo()

        // When the user changes settings though
        await overlays.userChangedSettingTo('disabled')

        // No small overlays
        await overlays.overlaysDontShow()
        // // No video overlay
        await overlays.videoOverlayDoesntShow()
    })
    test('Small overlay is displayed on video', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask remembered')
        await overlays.gotoPlayerPage()

        // Then then the overlay shows and blocks the video from playing
        await overlays.smallOverlayShows()
    })
    test('Small overlay is shown when setting is \'enabled\'', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('enabled')
        await overlays.gotoPlayerPage()

        // Then the overlay shows and blocks the video from playing
        await overlays.smallOverlayShows()
    })
    test('Overlays are not shown when setting is \'disabled\'', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('disabled')
        await overlays.gotoPlayerPage()

        // No small overlays
        await overlays.overlaysDontShow()
        // No video overlay
        await overlays.videoOverlayDoesntShow()
    })
    test('Selecting \'watch in duck player\'', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()

        await overlays.watchInDuckPlayer()
        await overlays.userSettingWasUpdatedTo('always ask') // not updated
    })
    test('Selecting \'watch in duck player\' + remember', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()

        await overlays.rememberMyChoice()
        await overlays.watchInDuckPlayer()
        await overlays.userSettingWasUpdatedTo('enabled') // updated
    })
    test('Selecting \'watch here\'', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()

        await overlays.watchHere()
    })
    test('Selecting \'watch here\' + remember', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)

        // Given overlays feature is enabled
        await overlays.overlaysEnabled()

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()

        await overlays.rememberMyChoice()
        await overlays.watchHere()
        await overlays.userSettingWasUpdatedTo('always ask remembered') // updated
    })
})

test.describe('serp proxy', () => {
    test('serp proxy is enabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.serpProxyEnabled()
        await overlays.gotoSerpProxyPage()
        await overlays.userValuesCallIsProxied()
    })
})
