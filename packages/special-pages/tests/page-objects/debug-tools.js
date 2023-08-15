import { expect } from '@playwright/test'
import { Mocks } from './mocks.js'
import { perPlatform } from '../../../../integration-test/playwright/type-helpers.mjs'
import { mockErrors, mockResponses, simulateSubscriptionMessage } from '@duckduckgo/messaging/lib/test-utils.mjs'
import { readFileSync } from 'node:fs'
import jsonpatch from 'fast-json-patch'
import { ResourcePatches, STORAGE_KEY } from '../../pages/debug-tools/src/js/remote-resources/patches-machine'

/**
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').Build} Build
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').PlatformInfo} PlatformInfo
 * @typedef {import('../../pages/debug-tools/src/js/remote-resources/remote-resources.machine').EditorKind} EditorKind
 * @typedef {import('../../pages/debug-tools/schema/__generated__/schema.types').GetFeaturesResponse} GetFeaturesResponse
 * @typedef {import('../../pages/debug-tools/schema/__generated__/schema.types').GetTabsResponse} GetTabsResponse
 * @typedef {import('../../pages/debug-tools/schema/__generated__/schema.types').RemoteResource} RemoteResource
 */

export class DebugToolsPage {
    get remoteResources () {
        return {
            macos: () => readFileSync('./pages/debug-tools/schema/__fixtures__/macos-config.json', 'utf8'),
            /**
             * @return {{current: {contents: string, source: {remote: {fetchedAt: string, url: string}}, contentType: string}, name: string, id: string, url: string}}
             */
            privacyConfig: (contents = this.remoteResources.macos()) => {
                return {
                    id: 'privacy-configuration',
                    url: 'https://example.com/macos-config.json',
                    name: 'Privacy Config',
                    current: {
                        source: {
                            remote: {
                                url: 'https://example.com/macos-config.json',
                                fetchedAt: '2023-07-05T12:34:56Z'
                            }
                        },
                        contents,
                        contentType: 'application/json'
                    }
                }
            }
        }
    }

    get locators () {
        const page = this.page
        return {
            loaded: () => page.locator('[data-loaded="true"]'),
            remoteFormInput: () => page.getByPlaceholder('enter a url'),
            remoteFormCancel: () => page.getByRole('button', { name: 'Cancel' }),
            copyOverridePatch: () => page.getByRole('button', { name: 'Copy as Patch' }),
            remoteFormRefresh: () => page.getByRole('button', { name: 'Refresh 🔄' }),
            remoteFormOverride: () => page.getByRole('button', { name: 'Override ✏️' }),
            remoteFormCopy: () => page.getByRole('button', { name: 'Copy 📄' }),
            remoteFormSave: () => page.getByRole('button', { name: 'Save', exact: true }),
            editorSave: () => page.getByRole('button', { name: 'Save + Apply' }),
            errorDismiss: () => page.getByRole('button', { name: '↩️ Dismiss' }),
            diffEditorModified: () => page.locator('.editor.modified'),
            inlineEditor: () => page.locator('.monaco-editor'),
            editorToggle: () => page.getByLabel('Editor kind:'),
            togglesSwitcher: () => page.getByLabel('Editor kind:'),
            togglesEditor: () => page.getByTestId('TogglesEditor'),
            patchesScreen: () => page.getByTestId('PatchesEditor'),
            globalToggleList: () => page.getByTestId('FeatureToggleListGlobal'),
            featureToggle: (named) => page.getByLabel('toggle ' + named),
            domainExceptionAddButton: () => page.getByRole('button', { name: 'Add a domain' }),
            domainExceptionInput: () => page.getByPlaceholder('enter a domain'),
            domainExceptionUpdate: () => page.getByTestId('DomainForm').getByRole('button', { name: 'Save' }),
            domainExceptionEdit: () => page.getByRole('button', { name: 'Edit' }),
            domainExceptionNew: () => page.getByRole('button', { name: 'New' }),
            domainExceptionToggles: () => page.getByTestId('domain-exceptions'),
            domainExceptionsTab: () => page.locator('label').filter({ hasText: 'Domain Exceptions' }),
            domainExceptionsAddForFeature: (featureName) => page.getByTestId('add-exception-' + featureName),
            tabSelector: () => page.locator('[name="tab-select"]'),
            singleTabButton: () => page.getByLabel('Use open tab domain:'),
            domainFormShowing: () => page.getByTestId('DomainForm.showing')
        }
    }

    get values () {
        const page = this.page
        return {
            editorValue: () => page.evaluate(() => window._test_editor_value())
        }
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {Build} build
     * @param {PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
        this.mocks = new Mocks(page, build, platform, {
            context: 'specialPages',
            featureName: 'debugToolsPage',
            env: 'development'
        })

        // default mocks - just enough to render the first page without error
        /** @type {RemoteResource} */
        const resource = this.remoteResources.privacyConfig()
        /** @type {RemoteResource} */
        const updatedResource = DebugToolsPage.updatedResource(resource)

        /** @type {GetFeaturesResponse} */
        const getFeatures = {
            features: {
                remoteResources: {
                    resources: [resource]
                }
            }
        }

        /** @type {GetTabsResponse} */
        const getTabs = {
            tabs: []
        }

        this.mocks.defaultResponses({
            getFeatures,
            getTabs,
            updateResource: updatedResource
        })

        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
    }

    /**
     * @param {RemoteResource} resource
     * @param {string} contents
     * @return {RemoteResource}
     */
    static updatedResource (resource, contents = '{ "updated": true }') {
        /** @type {RemoteResource} */
        return {
            ...resource,
            current: {
                source: {
                    debugTools: {
                        modifiedAt: '2023-07-05T12:34:56Z'
                    }
                },
                contents,
                contentType: 'application/json'
            }
        }
    }

    /**
     * This ensures we can choose when to apply mocks based on the platform
     * @param {URLSearchParams} urlParams
     * @return {Promise<void>}
     */
    async openPage (urlParams) {
        const url = this.basePath + '#?' + urlParams.toString()
        await this.page.goto(url)
    }

    /**
     * Used later if/when we might want to simulate fetching remote config
     * @return {Promise<void>}
     */
    async installRemoteMocks () {
        // default: https://staticcdn.duckduckgo.com/trackerblocking/config/v2/macos-config.json
        await this.page.route('https://example.com/**', (route, req) => {
            const url = new URL(req.url())
            if (url.pathname === '/override.json') {
                return route.fulfill({
                    status: 200,
                    json: {}
                })
            }
            return route.continue()
        })
    }

    /**
     * @returns {Promise<void>}
     */
    async openRemoteResourceEditor () {
        const params = new URLSearchParams({})
        await this.openPage(params)
    }

    /**
     * @param {object} [params]
     * @param {string} [params.currentDomain]
     */
    async openDomainExceptions (params) {
        const hashParams = new URLSearchParams({
            toggleKind: 'domain-exceptions',
            editorKind: 'toggles',
            ...params
        })
        await this.openPage(hashParams)
    }

    /**
     * @returns {Promise<void>}
     */
    async hasLoaded () {
        await this.locators.loaded().waitFor()
    }

    /**
     *
     */
    async editsPreview (value = '{ "foo": "baz" }') {
        // this makes sure the JS is compiled/loaded
        await this.page.evaluate(({ value }) => window._test_editor_set_value(value), { value })
    }

    /**
     * Before we save in the editor, we want to be sure the response is going to be correct
     */
    async submitsEditorSave () {
        // ensure the saved result->response is correct
        const string = await this.page.evaluate(() => window._test_editor_value())
        const resource = DebugToolsPage.updatedResource(this.remoteResources.privacyConfig(), string)

        await this.page.evaluate(mockResponses, {
            responses: {
                updateResource: resource
            }
        })

        // actually save
        await this.locators.editorSave().click()
        await this.mocks.waitForCallCount({ method: 'updateResource', count: 1 })
    }

    async saves () {
        await this.submitsEditorSave()
        const calls = await this.mocks.waitForCallCount({ method: 'updateResource', count: 1 })
        expect(calls[0].payload.params).toMatchObject({
            id: 'privacy-configuration',
            source: {
                debugTools: {
                    content: '{ "foo": "baz" }'
                }
            }
        })
        const expected = '{\n    "updated": true\n}'
        await this.waitForEditorToHaveValue(expected)
    }

    async savedWithValue () {
        const calls = await this.mocks.waitForCallCount({ method: 'updateResource', count: 1 })
        expect(calls.length).toBe(1)
        return calls[0].payload.params
    }

    async clickToOverride () {
        await this.locators.remoteFormOverride().click()
    }

    async overrideRemoteUrl () {
        await this.clickToOverride()
        await this.locators.remoteFormCopy().click()
        await this.locators.remoteFormInput().fill('https://example.com/override.json')
    }

    async submitRemoteUrlForm () {
        await this.locators.remoteFormSave().click()
    }

    async refreshedRemote () {
        const calls = await this.mocks.waitForCallCount({ method: 'updateResource', count: 1 })
        expect(calls[0].payload.params).toMatchObject({
            id: 'privacy-configuration',
            source: {
                remote: {
                    url: 'https://example.com/macos-config.json' // <-- this is the same as the current!
                }
            }
        })
        const expected = '{\n    "updated": true\n}'
        await this.waitForEditorToHaveValue(expected)
    }

    async savedNewRemoteUrl () {
        const calls = await this.mocks.waitForCallCount({ method: 'updateResource', count: 1 })
        expect(calls[0].payload.params).toMatchObject({
            id: 'privacy-configuration',
            source: {
                remote: {
                    url: 'https://example.com/override.json'
                }
            }
        })
        const expected = '{\n    "updated": true\n}'
        await this.waitForEditorToHaveValue(expected)
    }

    async waitForEditorToHaveValue (value) {
        await this.page.waitForFunction(({ value }) => {
            // keep trying the editor, value may be set asyncronously
            // this will timeout after 1000ms
            return window._test_editor_value() === value
        }, { value })
    }

    /**
     * @param {string} msg
     */
    async showsErrorText (msg) {
        await this.page.getByText(msg).waitFor()
    }

    async dismissesError () {
        await this.locators.errorDismiss().click()
    }

    async errorWasDismissed () {
        const matches = await this.locators.errorDismiss().count()
        expect(matches).toBe(0)
    }

    /**
     * @param {object} params
     * @param {string} params.method
     * @param {string} params.message
     */
    async willReceiveError (params) {
        const { method, message } = params
        await this.page.evaluate(mockErrors, {
            errors: {
                [method]: {
                    message
                }
            }
        })
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath () {
        return this.build.switch({
            windows: () => '../../build/windows/pages/debug-tools/index.html',
            apple: () => '../../Sources/ContentScopeScripts/dist/pages/debug-tools/index.html'
        })
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new DebugToolsPage(page, build, platformInfo)
    }

    /**
     * @param {EditorKind} kind
     * @return {Promise<void>}
     */
    // eslint-disable-next-line require-await
    async switchesTo (kind) {
        if (kind === 'diff') {
            await this.locators.editorToggle().selectOption('diff')
            await this.locators.diffEditorModified().waitFor()
        } else if (kind === 'inline') {
            await this.locators.editorToggle().selectOption('inline')
            await this.locators.inlineEditor().waitFor()
        } else if (kind === 'toggles') {
            await this.locators.editorToggle().selectOption('toggles')
            await this.locators.togglesEditor().waitFor()
        } else if (kind === 'patches') {
            await this.locators.editorToggle().selectOption('patches')
            await this.locators.patchesScreen().waitFor()
        }
    }

    /**
     * @param {'global' | 'domain-exceptions'} kind
     * @return {Promise<void>}
     */
    // eslint-disable-next-line require-await
    async switchesTogglesTo (kind) {
        if (kind === 'global') {
            await this.locators.editorToggle().selectOption('diff')
            await this.locators.diffEditorModified().waitFor()
        } else if (kind === 'domain-exceptions') {
            await this.locators.editorToggle().selectOption('toggles')
            await this.locators.domainExceptionsTab().click()
            await this.locators.domainExceptionToggles().waitFor()
        } else {
            throw new Error('unreachable')
        }
    }

    async stillHasEditedValue (expected = '{ "foo": "baz" }') {
        const actual = await this.values.editorValue()
        expect(actual).toBe(expected)
    }

    async refreshesCurrentResource () {
        await this.locators.remoteFormRefresh().click()
    }

    async cancelOverride () {
        await this.locators.remoteFormCancel().click()
    }

    async formIshidden () {
        await this.locators.remoteFormInput().waitFor({ state: 'detached' })
    }

    /**
     * @param {string} featureName
     */
    async togglesGlobally (featureName) {
        // toggle inside the 'global part'
        const element = this.locators.globalToggleList().locator(this.locators.featureToggle(featureName))

        // control -> ensure we're testing what we think
        expect(await element.getAttribute('data-state')).toBe('on')

        // now perform the toggle
        await element.click()

        // ensure the local state is updated, this is just a sanity check
        expect(await element.getAttribute('data-state')).toBe('off')
    }

    /**
     * @param {string | Record<string, any>} contents
     * @param {string} featureName
     */
    featureWasDisabledGlobally (contents, featureName) {
        const json = typeof contents === 'string' ? JSON.parse(contents) : contents
        expect(json.features[featureName].state).toBe('disabled')
    }

    /**
     * @param {string | Record<string, any>} contents
     * @param {string} featureName
     */
    featureWasEnabledGlobally (contents, featureName) {
        const json = typeof contents === 'string' ? JSON.parse(contents) : contents
        expect(json.features[featureName].state).toBe('enabled')
    }

    /**
     * @param {string} featureName
     * @param {string} domain
     */
    async togglesDomainException (featureName, domain) {
        await this.locators.domainExceptionInput().fill(domain)
        await this.locators.domainExceptionUpdate().click()

        // now click the toggle for this feature
        await this.locators.domainExceptionsAddForFeature(featureName).click()
    }

    /**
     * @param {string} contents
     * @param {string} featureName
     * @param {string} domain
     */
    featureWasDisabledForDomain (contents, featureName, domain) {
        const json = typeof contents === 'string' ? JSON.parse(contents) : contents
        const exception = json.features[featureName].exceptions.find(x => x.domain === domain)
        expect(exception.reason).toBe('debug tools')
    }

    async addFirstDomain () {
        await this.locators.domainExceptionAddButton().click()
    }

    /**
     * @param {GetTabsResponse} params
     */
    async withTabsResponse (params) {
        await this.page.addInitScript(mockResponses, {
            responses: {
                getTabs: params
            }
        })
    }

    async withEditedPrivacyConfig (params) {
        const jsonString = JSON.stringify(params, null, 2)

        /** @type {RemoteResource} */
        const resource = DebugToolsPage.updatedResource(this.remoteResources.privacyConfig(), jsonString)

        /** @type {GetFeaturesResponse} */
        const getFeatures = {
            features: {
                remoteResources: {
                    resources: [resource]
                }
            }
        }

        await this.page.addInitScript(mockResponses, {
            responses: {
                getFeatures
            }
        })
    }

    /**
     * @param {Record<string, any>} params
     */
    async withPrivacyConfig (params) {
        const jsonString = JSON.stringify(params, null, 2)

        /** @type {RemoteResource} */
        const resource = this.remoteResources.privacyConfig(jsonString)

        /** @type {GetFeaturesResponse} */
        const getFeatures = {
            features: {
                remoteResources: {
                    resources: [resource]
                }
            }
        }

        await this.page.addInitScript(mockResponses, {
            responses: {
                getFeatures
            }
        })
    }

    /**
     * @param {GetTabsResponse} params
     */
    async receivesNewTabs (params) {
        await this.page.evaluate(simulateSubscriptionMessage, {
            messagingContext: {
                context: 'specialPages',
                featureName: 'debugToolsPage',
                env: 'development'
            },
            name: 'onTabsUpdated',
            payload: params,
            injectName: this.build.name
        })
    }

    async enabled () {
        await this.installRemoteMocks()
        await this.mocks.install()
    }

    /**
     * @param {string} domain
     */
    async selectTab (domain) {
        await this.locators.tabSelector().selectOption(domain)
    }

    async chooseTheOnlyOpenTab () {
        await this.locators.singleTabButton().click()
    }

    /**
     * @param {string} domain
     */
    async currentDomainIsStoredInUrl (domain) {
        await this.page.waitForFunction(({ expected }) => {
            const hash = new URL(window.location.href).hash
            const [, search] = hash.split('?')
            const params = new URLSearchParams(search)
            const currentDomain = params.get('currentDomain')
            return currentDomain === expected
        }, { expected: domain })
    }

    /**
     * @param {string} domain
     */
    async exceptionsShownFor (domain) {
        await this.locators.domainFormShowing().filter({ hasText: domain }).waitFor({ timeout: 5000 })
    }

    /**
     * @param {object} params
     * @param {string} params.from
     * @param {string} params.to
     */
    async editCurrentDomain ({ from, to }) {
        await this.locators.domainExceptionEdit().click()
        expect(await this.locators.domainExceptionInput().inputValue()).toBe(from)
        await this.locators.domainExceptionInput().fill(to)
        await this.locators.domainExceptionUpdate().click()
    }

    /**
     * @param {string} domain
     */
    async addNewDomain (domain) {
        await this.locators.domainExceptionNew().click()
        expect(await this.locators.domainExceptionInput().inputValue()).toBe('')
        await this.locators.domainExceptionInput().fill(domain)
        await this.locators.domainExceptionUpdate().click()
    }

    async showsEmptyStateForDomainExceptions (msg) {
        // message is there
        await this.locators.domainExceptionToggles()
            .locator(this.page.getByText(msg)).waitFor()

        expect(await this.page.getByText('Current Exceptions', { exact: true }).count())
            .toBe(0)
    }

    /**
     * @param {Record<string, any>} before
     * @param {Record<string, any>} after
     */
    async copyPatchFromOverride (before, after) {
        await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
        await this.locators.copyOverridePatch().click()
        const clipboardPatches = await this.page.evaluate(() => navigator.clipboard.readText())
        const patches = jsonpatch.compare(before, after)
        expect(JSON.parse(clipboardPatches)).toEqual(patches)
    }

    /**
     * @param {string} resourceId
     * @param {Record<string, any>} before
     * @param {Record<string, any>} after
     */
    async patchIsStoredInLocalStorage (resourceId, before, after) {
        const json = await this.page.evaluate(({ STORAGE_KEY }) => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'), { STORAGE_KEY })
        const actual = ResourcePatches.parse(json)
        const matching = actual[resourceId]
        const expected = jsonpatch.compare(before, after)
        expect(matching[0].patches).toEqual(expected)
    }

    async withExistingPatches () {
        /** @type {ResourcePatches} */
        const value = {
            'privacy-configuration': [{
                createdAt: '2023-08-15T20:41:34.385Z',
                resourceId: 'privacy-configuration',
                kind: 'json-fast-patch',
                patches: [{ path: '/features/abc/settings/d', op: 'add', value: { e: 'f' } }]
            }]
        }
        await this.page.addInitScript(({ key, value }) => {
            window.localStorage.setItem(key, value)
        }, { key: STORAGE_KEY, value: JSON.stringify(value) })
    }
}
