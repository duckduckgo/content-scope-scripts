import { expect, test } from '@playwright/test'
import { ReleaseNotesPage } from './page-objects/release-notes.js'

test.describe('screenshots @screenshots', () => {
    test('loading', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesLoading()
        await expect(page).toHaveScreenshot('loading.png', { maxDiffPixels: 20 })
    })

    test('release notes without privacy pro', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesLoaded()
        await expect(page).toHaveScreenshot('loaded.png', { maxDiffPixels: 20 })
    })

    test('release notes with privacy pro', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesLoadedWithPrivacyPro()
        await expect(page).toHaveScreenshot('loaded-privacy-pro.png', { maxDiffPixels: 20 })
    })

    test('update ready without privacy pro', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesUpdateReady()
        await expect(page).toHaveScreenshot('update-ready.png', { maxDiffPixels: 20 })
    })

    test('update ready with privacy pro', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesUpdateReadyWithPrivacyPro()
        await expect(page).toHaveScreenshot('update-ready-privacy-pro.png', { maxDiffPixels: 20 })
    })
})
