import { test } from '@playwright/test'
import { DuckplayerOverlays } from './page-objects/duckplayer-overlays.js'

test.describe('Remote config', () => {
    test('feature: disabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.withRemoteConfig({ json: 'disabled.json' })
        await overlays.gotoThumbsPage()
        await overlays.overlaysDontShow()
    })
    test('thumbnailOverlays: disabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.withRemoteConfig({ json: 'thumbnail-overlays-disabled.json' })
        await overlays.gotoThumbsPage()
        await overlays.overlaysDontShow()
    })
    test('clickInterception: disabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.withRemoteConfig({ json: 'click-interceptions-disabled.json' })
        await overlays.userSettingIs('enabled')
        await overlays.gotoThumbsPage()
        const navigation = overlays.requestWillFail()
        await overlays.clicksFirstThumbnail()
        await navigation
    })
    test('videoOverlays: disabled', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.withRemoteConfig({ json: 'video-overlays-disabled.json' })
        await overlays.userSettingIs('always ask')
        await overlays.gotoPlayerPage()
        await page.waitForTimeout(1000) // <-- We need to prove the overlay doesn't show.
        await overlays.videoOverlayDoesntShow()
    })
    test('excludedRegions: CSS selectors on video page', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.withRemoteConfig({ json: 'overlays.json' })
        await overlays.gotoPlayerPage()
        await overlays.overlayBlocksVideo()
        await overlays.hoverAThumbnailInExcludedRegion('#playlist')
        await overlays.overlaysDontShow()
    })
})
