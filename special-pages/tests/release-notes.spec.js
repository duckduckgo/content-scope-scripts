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
        await releaseNotes.releaseNotesLoading()
        await releaseNotes.didShowLoadingState()
    })

    test('shows up-to-date state without Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesLoaded()
        await releaseNotes.didShowUpToDateState()
        await releaseNotes.didShowReleaseNotesList()
    })

    test('shows up-to-date state with Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesLoadedWithPrivacyPro()
        await releaseNotes.didShowUpToDateState()
        await releaseNotes.didShowReleaseNotesListWithPrivacyPro()
    })

    test('shows update-ready state without Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesUpdateReady()
        await releaseNotes.didShowUpdateReadyState()
        await releaseNotes.didShowReleaseNotesList()
    })

    test('shows update-ready state with Privacy Pro notes', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesUpdateReadyWithPrivacyPro()
        await releaseNotes.didShowUpdateReadyState()
        await releaseNotes.didShowReleaseNotesListWithPrivacyPro()
    })

    test('sends restart click to browser', async ({ page }, workerInfo) => {
        const releaseNotes = ReleaseNotesPage.create(page, workerInfo)
        await releaseNotes.reducedMotion()
        await releaseNotes.openPage({ env: 'app' })
        await releaseNotes.releaseNotesUpdateReady()
        await releaseNotes.didRequestRestart()
    })
})
