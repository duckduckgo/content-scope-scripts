import { test } from '@playwright/test'
import { DebugToolsPage } from './page-objects/debug-tools'

test.describe.only('debug tools', () => {
    test.describe('navigation', () => {
        test('loads the application, defaults to remote resource editor', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
        })
    })

    test.describe('remote url', () => {
        test('refreshes current resource', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.refreshesCurrentResource()
            await dt.refreshedRemote()
        })
        test('sets a new remote url', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
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
            await dt.enabled()
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
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTo('inline')
            await dt.editsPreview()
            await dt.saves()
        })
        test('handles when input cannot be used with toggles (because of edits)', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTo('inline')
            await dt.editsPreview('[]') // <- completely invalid type for this resource
            await dt.switchesTo('toggles')
            await dt.showsErrorText('Cannot use toggles because the format was invalidated (probably because of edits)')
        })
        test('handles when a global toggle is clicked', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()

            await test.step('toggles a feature globally', async () => {
                await dt.togglesGlobally('autofill')
            })

            await test.step('switches to diff view + saves', async () => {
                await dt.switchesTo('diff')
                await dt.submitsEditorSave()
                const saved = await dt.savedWithValue()
                dt.featureWasDisabledGlobally(saved.source.debugTools.content, 'autofill')
            })
        })
        test('handles adding a first domain exception', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()

            await test.step('switching to domain exceptions', async () => {
                await dt.switchesTogglesTo('domain-exceptions')
            })

            await test.step('toggles a feature for example.com', async () => {
                // click add, because empty initially
                await dt.addFirstDomain()

                // This will enter `example.com` and then click the 'autofill' button
                await dt.togglesDomainException('autofill', 'example.com')

                // save it
                await dt.submitsEditorSave()

                // ensure we saved the correctly modified JSON
                const saved = await dt.savedWithValue()
                dt.featureWasDisabledForDomain(saved.source.debugTools.content, 'autofill', 'example.com')
                await page.pause()
            })
        })
        test('edits the current domain in domain exceptions', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openDomainExceptions({
                currentDomain: 'example.com'
            })

            // control, to ensure we're starting in the correct state
            await dt.exceptionsShownFor('example.com')

            // change it with the 'edit' button
            await dt.editCurrentDomain({ from: 'example.com', to: 'example.ca' })

            // now assert it's changed in URL + page
            await dt.exceptionsShownFor('example.ca')
            await dt.currentDomainIsStoredInUrl('example.ca')
        })
        test('adds a new domain when one already exists', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()

            await dt.openDomainExceptions({
                currentDomain: 'example.com'
            })

            // control, to ensure we're starting in the correct state
            await dt.exceptionsShownFor('example.com')

            // adding new domain, by clicking 'new'
            await dt.addNewDomain('example.ca')

            // now assert it's changed in URL + page
            await dt.exceptionsShownFor('example.ca')
            await dt.currentDomainIsStoredInUrl('example.ca')
        })
        test('handles tabs arriving after page load', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTogglesTo('domain-exceptions')
            await dt.receivesNewTabs({ tabs: [{ url: 'https://example.com/123/abc' }, { url: 'https://duckduckgo.com/?q=123' }] })
            await dt.selectTab('duckduckgo.com')
            await dt.currentDomainIsStoredInUrl('duckduckgo.com')
            await dt.exceptionsShownFor('duckduckgo.com')
        })
        test('handles choosing an open tab from many', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.withTabsResponse({ tabs: [{ url: 'https://example.com/123/abc' }, { url: 'https://duckduckgo.com/?q=123' }] })
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTogglesTo('domain-exceptions')
            await dt.selectTab('duckduckgo.com')
            await dt.currentDomainIsStoredInUrl('duckduckgo.com')
            await dt.exceptionsShownFor('duckduckgo.com')
        })
        test('handles choosing an open tab from single', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
            await dt.withTabsResponse({ tabs: [{ url: 'https://example.com/123/abc' }] })
            await dt.openRemoteResourceEditor()
            await dt.hasLoaded()
            await dt.switchesTogglesTo('domain-exceptions')
            await dt.chooseTheOnlyOpenTab()
            await dt.currentDomainIsStoredInUrl('example.com')
            await dt.exceptionsShownFor('example.com')
        })
        test('switches editor kind', async ({ page }, workerInfo) => {
            const dt = DebugToolsPage.create(page, workerInfo)
            await dt.enabled()
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
