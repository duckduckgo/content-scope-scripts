import { Mocks } from './mocks.js'
import { perPlatform } from '../../../../integration-test/playwright/type-helpers.mjs'
import { join } from 'node:path'
import { expect } from '@playwright/test'
import { DEFAULT_ORDER } from '../../pages/onboarding/app/types'

/**
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').Build} Build
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

export class OnboardingPage {
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
            featureName: 'onboarding',
            env: 'development'
        })
        this.page.on('console', console.log)
        // default mocks - just enough to render the first page without error
        this.mocks.defaultResponses({
            requestSetAsDefault: {},
            requestImport: {},
            stepCompleted: {},
            reportPageException: {},
            init: {
                stepDefinitions: {
                    systemSettings: {
                        // this 'dock' is not part of the default
                        rows: ['dock', 'import', 'default-browser']
                    }
                },
                order: DEFAULT_ORDER,
                env: 'development'
            }
        })
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     *
     * @param {Object} [params] - Optional parameters for opening the page.
     * @param {'app' | 'components'} [params.env] - Optional parameters for opening the page.
     * @param {import('../../pages/onboarding/app/types.js').Step['id']} [params.page] - Optional start page
     * @param {boolean} [params.willThrow] - Optional flag to simulate an exception
     */
    async openPage ({ env = 'app', page = 'welcome', willThrow = false } = { }) {
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
        const searchParams = new URLSearchParams({ env, page, debugState: 'true', willThrow: String(willThrow) })
        await this.page.goto('/' + '?' + searchParams.toString())
    }

    async skipsOnboarding () {
        await this.page.getByTestId('skip').click({
            clickCount: 5
        })
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath () {
        return this.build.switch({
            windows: () => '../../build/windows/pages/onboarding',
            apple: () => '../../Sources/ContentScopeScripts/dist/pages/onboarding'
        })
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new OnboardingPage(page, build, platformInfo)
    }

    async reducedMotion () {
        await this.page.emulateMedia({ reducedMotion: 'reduce' })
    }

    async darkMode () {
        await this.page.emulateMedia({ colorScheme: 'dark' })
    }

    async didSendStepCompletedMessages () {
        const calls = await this.mocks.outgoing({ names: ['stepCompleted'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'stepCompleted',
                    params: { id: 'welcome' }
                }
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'stepCompleted',
                    params: { id: 'getStarted' }
                }
            }
        ])
    }

    async choseToStartBrowsing () {
        await this.page.getByRole('button', { name: 'Start Browsing' }).click()
    }

    async didDismissToSearch () {
        await this.mocks.waitForCallCount({ method: 'dismissToAddressBar', count: 1, timeout: 500 })
    }

    async didDismissToSettings () {
        await this.page.getByRole('link', { name: 'Settings' }).click()
        await this.mocks.waitForCallCount({ method: 'dismissToSettings', count: 1, timeout: 500 })
    }

    async skippedCurrent () {
        await this.page.getByRole('button', { name: 'Skip' }).click()
    }

    async showBookmarksBar () {
        const { page } = this
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click()
        await page.getByRole('img', { name: 'Completed Action' }).waitFor()
        const calls = await this.mocks.outgoing({ names: ['setBookmarksBar'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: true }
                }
            }
        ])
    }

    async skippedBookmarksBar () {
        await this.skippedCurrent()
    }

    async canToggleBookmarksBar () {
        const { page } = this
        const input = page.getByLabel('Bookmarks Bar')

        // control: ensure we're starting in the 'off' state
        expect(await input.isChecked()).toBe(false)

        // now turn it on
        await input.click()
        await page.waitForTimeout(100)
        expect(await input.isChecked()).toBe(true)

        // and then back off
        await input.click()
        await page.waitForTimeout(100)
        expect(await input.isChecked()).toBe(false)

        // now check the outgoing messages
        const calls = await this.mocks.outgoing({ names: ['setBookmarksBar'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: true }
                }
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: false }
                }
            }
        ])
    }

    async canToggleHomeButton () {
        const { page } = this
        const input = page.getByLabel('Home Button')

        // control: ensure we're starting in the 'off' state
        expect(await input.isChecked()).toBe(false)

        // now turn it on
        await input.click()
        await page.waitForTimeout(100)
        expect(await input.isChecked()).toBe(true)

        // and then back off
        await input.click()
        await page.waitForTimeout(100)
        expect(await input.isChecked()).toBe(false)

        // now check the outgoing messages
        const calls = await this.mocks.outgoing({ names: ['setShowHomeButton'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: true }
                }
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: false }
                }
            }
        ])
    }

    async showHomeButton () {
        const { page } = this
        await page.getByRole('button', { name: 'Show Home Button' }).click()
        await expect(page.getByRole('img', { name: 'Completed Action' })).toBeVisible()
        const calls = await this.mocks.outgoing({ names: ['setShowHomeButton'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: true }
                }
            }
        ])
    }

    async hasAdditionalInformation () {
        const { page } = this
        await expect(page.locator('h2')).toContainText('Make DuckDuckGo work just the way you want.')
    }

    async handlesFatalException () {
        const { page } = this
        await expect(page.getByRole('heading')).toContainText('Something went wrong')
        const calls = await this.mocks.waitForCallCount({ method: 'reportPageException', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'reportPageException',
                    params: {
                        message: 'Simulated Exception',
                        id: 'welcome'
                    }
                }
            }
        ])
    }

    async getStarted () {
        const { page } = this
        await page.getByRole('button', { name: 'Get Started' }).click()
        await expect(page.getByLabel('Unlike other browsers,')).toContainText('Unlike other browsers, DuckDuckGo comes with privacy by default')
    }

    async didSendInitialHandshake () {
        const calls = await this.mocks.outgoing({ names: ['init'] })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'init'
                }
            }
        ])
    }

    async keepInTaskbar () {
        const { page } = this
        await page.getByRole('button', { name: 'Pin to Taskbar' }).click()
        const calls = await this.mocks.waitForCallCount({ method: 'requestDockOptIn', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'requestDockOptIn'
                }
            }
        ])
    }
}
