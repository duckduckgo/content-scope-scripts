import { test } from '@playwright/test'
import { DebugToolsPage } from './page-objects/debug-tools'

test.describe('debug tools', () => {
    test.describe('navigation', () => {
        test('loads the application, defaults to remote resource editor', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
        })
    })

    test.describe('remote url', () => {
        test('refreshes current resource', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.refreshesCurrentResource()
            await dt.refreshedRemote()
        })
        test('sets a new remote url', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.overrideRemoteUrl()
            await dt.submitRemoteUrlForm()
            await dt.savedNewRemoteUrl()

            await test.step('cancel hides form', async () => {
                await dt.clickToOverride()
                await dt.cancelOverride()
                await dt.formIshidden()
            })
        })
        test('shows an error on updating a resource', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()

            const error = 'TEST oops! TEST'

            await test.step('submitting the form', async () => {
                await dt.overrideRemoteUrl()
                await dt.willReceiveError({ message: error, method: 'updateResource' })
                await dt.submitRemoteUrlForm()
                await dt.showsErrorText(error)
            })

            await test.step('dismisses the error', async () => {
                await dt.dismissesError()
                await dt.errorWasDismissed()
            })
        })
    })

    test.describe('editor', () => {
        test('updates a resource', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTo('inline')
            await dt.editsPreview()
            await dt.saves()
        })
        test('handles when input cannot be used with toggles (because of edits)', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTo('inline')
            await dt.editsPreview('[]') // <- completely invalid type for this resource
            await dt.switchesTo('toggles')
            await dt.showsErrorText('Cannot use toggles because the format was invalidated (probably because of edits)')
        })
        test('handles when a global toggle is clicked', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()

            await test.step('toggles a feature globally', async () => {
                await dt.togglesGlobally('✅ autofill', '❌ autofill')
            })

            await test.step('switches to diff view + saves', async () => {
                await dt.switchesTo('diff')
                await dt.submitsEditorSave()
                const saved = await dt.savedWithValue()
                dt.featureWasDisabledGlobally(saved.source.debugTools.content, 'autofill')
            })
        })
        test.only('handles adding domain exception', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()

            await test.step('toggles a feature for example.com', async () => {
                await dt.togglesDomainException('autofill', 'example.com')
            })
        })
        test('switches editor kind', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTo('inline')
            await dt.editsPreview()

            await test.step('switches to diff view + makes an edit', async () => {
                await dt.switchesTo('diff')
                await dt.editsPreview('[]')
            })

            await test.step('switches back to inline view, edits should remain', async () => {
                await dt.switchesTo('inline')
                await dt.stillHasEditedValue('[]')
            })
        })
    })
})
