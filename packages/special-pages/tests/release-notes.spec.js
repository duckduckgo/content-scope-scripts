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

    test('shows up-to-date state with Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('loaded')
        await releaseNotes.didShowUpToDateState()
        await releaseNotes.didShowReleaseNotesList({
            listCount: 2,
            listItemCount: 6,
            privacyPro: true,
        })
    })

    test('shows up-to-date state without Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('loaded', { excludePrivacyProNotes: true })
        await releaseNotes.didShowUpToDateState()
        await releaseNotes.didShowReleaseNotesList({
            listCount: 1,
            listItemCount: 3,
            privacyPro: false,
        })
    })

    test('shows update-ready state with Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('updateReady')
        await releaseNotes.didShowUpdateReadyState()
        await releaseNotes.didShowReleaseNotesList({
            listCount: 2,
            listItemCount: 6,
            privacyPro: true,
        })
    })

    test('shows update-ready state without Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('updateReady', { excludePrivacyProNotes: true })
        await releaseNotes.didShowUpdateReadyState()
        await releaseNotes.didShowReleaseNotesList({
            listCount: 1,
            listItemCount: 3,
            privacyPro: false,
        })
    })

    test('sends restart click to browser', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.sendSubscriptionMessage('updateReady')
        await releaseNotes.didRequestRestart()
    })
})
