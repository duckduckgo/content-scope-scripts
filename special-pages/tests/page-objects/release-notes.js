import { Mocks } from './mocks.js'
import { perPlatform } from '../../../injected/integration-test/type-helpers.mjs'
import { join } from 'node:path'
import { expect } from '@playwright/test'
import { sampleData } from '../../pages/release-notes/app/sampleData.js'

/**
 * @typedef {import('../../../injected/integration-test/type-helpers.mjs').Build} Build
 * @typedef {import('../../../injected/integration-test/type-helpers.mjs').PlatformInfo} PlatformInfo
 * @typedef {import('../../types/release-notes').UpdateMessage} UpdateMessage
 */

export class ReleaseNotesPage {
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
            featureName: 'release-notes',
            env: 'development'
        })
        this.page.on('console', console.log)
        // default mocks - just enough to render the first page without error
        this.mocks.defaultResponses({
            initialSetup: {
                env: 'development',
                locale: 'en'
            }
        })
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     *
     * @param {Object} [params] - Optional parameters for opening the page.
     * @param {'app'|'components'} [params.env] - Optional parameters for opening the page.
     * @param {boolean} [params.willThrow] - Optional flag to simulate an exception
     */
    async openPage ({ env = 'app', willThrow = false } = { }) {
        await this.mocks.install()
        await this.page.route('/**', (route, req) => {
            const url = new URL(req.url())
            // try to serve assets, but change `/` to 'index'
            let filepath = url.pathname
            if (filepath === '/') filepath = 'index.html'

            return route.fulfill({
                status: 200,
                path: join(this.basePath, filepath)
            })
        })
        const searchParams = new URLSearchParams({ env, debugState: 'true', willThrow: String(willThrow) })
        await this.page.goto('/' + '?' + searchParams.toString())
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath () {
        return this.build.switch({
            // windows: () => '../../build/windows/pages/release-notes',
            apple: () => '../Sources/ContentScopeScripts/dist/pages/release-notes'
        })
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new ReleaseNotesPage(page, build, platformInfo)
    }

    async reducedMotion () {
        await this.page.emulateMedia({ reducedMotion: 'reduce' })
    }

    async darkMode () {
        await this.page.emulateMedia({ colorScheme: 'dark' })
    }

    /**
     * @param {UpdateMessage['status']} messageType
     * @param {Object} [options]
     * @param {boolean} [options.privacyPro]
     */
    async sendSubscriptionMessage (messageType, options) {
        // Wait for the subscription handler to appear before trying to simulate push events.
        // This prevents a race condition where playwright is sending data before `.subscribe` was called
        await this.page.waitForFunction(() => 'onUpdate' in window && typeof window.onUpdate === 'function')

        const data = options?.privacyPro
            ? { ...sampleData[messageType] }
            : { ...sampleData[messageType], releaseNotesPrivacyPro: null }

        await this.mocks.simulateSubscriptionMessage('onUpdate', data)
    }

    async releaseNotesLoading () {
        await this.sendSubscriptionMessage('loading')
    }

    async releaseNotesLoaded () {
        await this.sendSubscriptionMessage('loaded')
    }

    async releaseNotesLoadedWithPrivacyPro () {
        await this.sendSubscriptionMessage('loaded', { privacyPro: true })
    }

    async releaseNotesUpdateReady () {
        await this.sendSubscriptionMessage('updateReady')
    }

    async releaseNotesUpdateReadyWithPrivacyPro () {
        await this.sendSubscriptionMessage('updateReady', { privacyPro: true })
    }

    async handlesFatalException () {
        const { page } = this
        await expect(page.getByRole('heading')).toContainText('Something went wrong')
        const calls = await this.mocks.waitForCallCount({ method: 'reportPageException', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'release-notes',
                    method: 'reportPageException',
                    params: {
                        message: 'unknown'
                    }
                }
            }
        ])
    }

    async didSendInitialHandshake () {
        const calls = await this.mocks.outgoing({ names: ['initialSetup'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'release-notes',
                    method: 'initialSetup'
                }
            }
        ])
    }

    async didShowLoadingState () {
        const { page } = this
        await expect(page.getByRole('heading', { name: 'Browser Release Notes' })).toBeVisible()
        await expect(page.getByText('Last checked: Yesterday')).toBeVisible()
        await expect(page.getByText('Version 1.0.1 — Checking for update')).toBeVisible()
        await expect(page.getByTestId('placeholder')).toBeVisible()

        await expect(page.getByRole('heading', { name: 'May 20 2024 New' })).not.toBeVisible()
        await expect(page.getByRole('heading', { name: 'For Privacy Pro Subscribers' })).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Restart to Update' })).not.toBeVisible()
    }

    async didShowUpToDateState () {
        const { page } = this
        await expect(page.getByRole('heading', { name: 'Browser Release Notes' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'May 20 2024', exact: true })).toBeVisible()

        await expect(page.getByText('Last checked: Today')).toBeVisible()
        await expect(page.getByText('Version 1.0.1 — DuckDuckGo is up to date')).toBeVisible()
        await expect(page.getByText('Version 1.0.1', { exact: true })).toBeVisible()

        await expect(page.getByTestId('placeholder')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Restart to Update' })).not.toBeVisible()
    }

    async didShowUpdateReadyState () {
        const { page } = this
        await expect(page.getByRole('heading', { name: 'Browser Release Notes' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'June 20 2024 New', exact: true })).toBeVisible()

        await expect(page.getByText('Last checked: Today')).toBeVisible()
        await expect(page.getByText('Version 1.0.1 — A newer version of the browser is available')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Restart to Update' })).toBeVisible()
        await expect(page.getByText('Version 1.2.0', { exact: true })).toBeVisible()

        await expect(page.getByTestId('placeholder')).not.toBeVisible()
    }

    async didShowReleaseNotesList () {
        const { page } = this

        await expect(page.getByText('Startup Boost Enabled! DuckDuckGo will now run a background task whenever you startup your computer to help it launch faster.')).toBeVisible()
        await expect(page.getByText('Fixed an issue where Microsoft Teams links wouldn\'t open the Teams app.')).toBeVisible()
        await expect(page.getByText('Improved credential autofill on websites in Dutch, French, German, Italian, Spanish, and Swedish.')).toBeVisible()

        await expect(page.getByText('Personal Information Removal update! The list of data broker sites we can scan and remove your info from is growing.')).not.toBeVisible()
        await expect(page.getByText('Privacy Pro is currently available to U.S. residents only')).not.toBeVisible()

        await expect(page.getByRole('heading', { name: 'For Privacy Pro Subscribers' })).not.toBeVisible()
        await expect(page.getByRole('link', { name: 'duckduckgo.com/pro' })).not.toBeVisible()
    }

    async didShowReleaseNotesListWithPrivacyPro () {
        const { page } = this

        await expect(page.getByRole('heading', { name: 'For Privacy Pro Subscribers' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'duckduckgo.com/pro' })).toBeVisible()

        await expect(page.getByText('Startup Boost Enabled! DuckDuckGo will now run a background task whenever you startup your computer to help it launch faster.')).toBeVisible()
        await expect(page.getByText('Fixed an issue where Microsoft Teams links wouldn\'t open the Teams app.')).toBeVisible()
        await expect(page.getByText('Improved credential autofill on websites in Dutch, French, German, Italian, Spanish, and Swedish.')).toBeVisible()

        await expect(page.getByText('Personal Information Removal update! The list of data broker sites we can scan and remove your info from is growing.')).toBeVisible()
        await expect(page.getByText('Privacy Pro is currently available to U.S. residents only')).toBeVisible()
        await expect(page.getByText('Not subscribed? Find out more at duckduckgo.com/pro')).toBeVisible()
    }

    async didRequestRestart () {
        const { page } = this
        page.getByRole('button', { name: 'Restart to Update' }).click()
        const calls = await this.mocks.waitForCallCount({ method: 'browserRestart', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'release-notes',
                    method: 'browserRestart',
                    params: {}
                }
            }
        ])
    }
}
