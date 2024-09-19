import { Mocks } from './mocks.js'
import { perPlatform } from '../../../../integration-test/playwright/type-helpers.mjs'
import { join } from 'node:path'
import { expect } from '@playwright/test'

/**
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').Build} Build
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

export class NewtabPage {
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
            featureName: 'newTabPage',
            env: 'development'
        })
        this.page.on('console', console.log)
        // default mocks - just enough to render the first page without error
        this.mocks.defaultResponses({
            requestSetAsDefault: {},
            requestImport: {},
            /** @type {import('../../types/new-tab.js').InitialSetupResponse} */
            initialSetup: {
                env: 'development',
                layout: {
                    widgets: [
                        {
                            widgetName: 'Favorites',
                            visibility: 'visible',
                            expansion: 'expanded'
                        },
                        {
                            widgetName: 'PrivacyStats',
                            visibility: 'hidden',
                            expansion: 'collapsed'
                        }
                    ]
                },
                locale: 'en',
                platform: {
                    name: this.platform.name || 'windows'
                }
            }
        })
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     *
     * @param {Object} [params] - Optional parameters for opening the page.
     * @param {'debug' | 'production'} [params.mode] - Optional parameters for opening the page.
     * @param {boolean} [params.willThrow] - Optional flag to simulate an exception
     * @param {keyof typeof import("../../pages/new-tab/app/data").stats} [params.stats] - Optional flag to simulate an exception
     */
    async openPage ({ mode = 'debug', willThrow = false, stats = 'few' } = { }) {
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
        const searchParams = new URLSearchParams({ mode, stats, willThrow: String(willThrow) })
        await this.page.goto('/' + '?' + searchParams.toString())
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath () {
        return this.build.switch({
            windows: () => '../../build/windows/pages/new-tab'
        })
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new NewtabPage(page, build, platformInfo)
    }

    async reducedMotion () {
        await this.page.emulateMedia({ reducedMotion: 'reduce' })
    }

    async darkMode () {
        await this.page.emulateMedia({ colorScheme: 'dark' })
    }

    async screenshot (locator, name) {
        if (!process.env.CI) {
            await expect(locator).toHaveScreenshot(name)
        }
    }
}
