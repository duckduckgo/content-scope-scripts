import { test } from '@playwright/test'
import { ReleaseNotesPage } from './page-objects/release-notes.js'

test.describe('release-notes', () => {
    test('initial handshake', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.darkMode()
        await releaseNotes.openPage()
        await releaseNotes.didSendInitialHandshake()
    })

    test('exception handling', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app', willThrow: true })
        await releaseNotes.handlesFatalException()
    })

    test('shows loading state', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('loading')
        await releaseNotes.didShowLoadingState()
    })

    test('shows up-to-date state', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('loaded')
        await releaseNotes.didShowUpToDateState()
    })

    test('shows update-ready state', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('updateReady')
        await releaseNotes.didShowUpdateReadyState()
    })

    test('sends restart click to browser', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('updateReady')
        await releaseNotes.didRequestRestart()
    })
})
