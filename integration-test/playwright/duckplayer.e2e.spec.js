import { test } from '@playwright/test'
import { DuckplayerOverlays } from './page-objects/duckplayer-overlays.js'

test.describe('e2e: Duck Player Thumbnail Overlays on YouTube.com', () => {
    test('e2e: Overlays never appear on "shorts"', async ({ page }, workerInfo) => {
        // @ts-expect-error - TS doesn't know about the "use.e2e" property
        workerInfo.skip(!workerInfo.project.use?.e2e)

        const overlays = DuckplayerOverlays.create(page, workerInfo)

        await overlays.overlaysEnabled({ json: 'overlays-live' })
        await overlays.gotoYoutubeHomepage()

        // Ensure the hover works normally to prevent false positives
        await overlays.hoverAYouTubeThumbnail()
        await overlays.isVisible()

        // now ensure the hover doesn't work on shorts
        await overlays.hoverShort()
        await overlays.overlaysDontShow()
    })
    test('control (without our script): clicking on a short loads correctly', async ({ page }, workerInfo) => {
        // @ts-expect-error - TS doesn't know about the "use.e2e" property
        workerInfo.skip(!workerInfo.project.use?.e2e)
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.gotoYoutubeHomepage()
        await page.waitForTimeout(2000)
        await overlays.clicksFirstShortsThumbnail()
        await overlays.showsShortsPage()
    })
    test('e2e: when enabled, clicking shorts has no impact', async ({ page }, workerInfo) => {
        // @ts-expect-error - TS doesn't know about the "use.e2e" property
        workerInfo.skip(!workerInfo.project.use?.e2e)
        const overlays = DuckplayerOverlays.create(page, workerInfo)
        await overlays.overlaysEnabled({ json: 'overlays-live' })
        await overlays.userSettingIs('enabled')
        await overlays.gotoYoutubeHomepage()
        await page.waitForTimeout(2000)
        await overlays.clicksFirstShortsThumbnail()
        await overlays.showsShortsPage()
    })
})
