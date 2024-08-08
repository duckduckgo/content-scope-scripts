import { Mocks } from './mocks.js'
import { expect } from '@playwright/test'
import { perPlatform } from '../../../../integration-test/playwright/type-helpers.mjs'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { sampleData } from '../../pages/special-error/src/js/sampleData'

/**
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').Build} Build
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

export class SpecialErrorPage {
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
            featureName: 'special-error',
            env: 'development'
        })
        this.page.on('console', console.log)

        // default mocks - just enough to render the first page without error
        this.mocks.defaultResponses({
            initialSetup: {
                env: 'development',
                locale: 'en',
                platform: {
                    name: 'macos'
                },
                errorData: sampleData.phishing.data
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
]    * @param {keyof sampleData} [params.errorId] - ID of the error to be mocked (see sampleData.js)
     * @param {'macos'|'ios'} [params.platformName] - platform name
     */
    async openPage ({ env = 'app', willThrow = false, errorId = 'ssl.expired', platformName = 'macos' } = { }) {
        // this.mocks.defaultResponses({
        //     initialSetup: {
        //         env: 'development',
        //         locale: 'en',
        //         platform: {
        //             name: platformName
        //         },
        //         errorData: sampleData[errorId].data
        //     }
        // })

        await this.mocks.install()
        await this.page.pause()
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
            apple: () => '../../Sources/ContentScopeScripts/dist/pages/special-error'
        })
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new SpecialErrorPage(page, build, platformInfo)
    }

    async reducedMotion () {
        await this.page.emulateMedia({ reducedMotion: 'reduce' })
    }

    async darkMode () {
        await this.page.emulateMedia({ colorScheme: 'dark' })
    }

    async leavesSite () {
        await this.page.getByRole('button', { name: 'Leave This Site' }).click()
        const calls = await this.mocks.waitForCallCount({ method: 'leaveSite', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'special-error',
                    method: 'leaveSite',
                    params: {}
                }
            }
        ])
    }

    async visitsSite () {
        const { page } = this
        this.showsAdvancedInfo()
        await page.getByText('Accept Risk and Visit Site').click()
        const calls = await this.mocks.waitForCallCount({ method: 'visitSite', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'special-error',
                    method: 'visitSite',
                    params: {}
                }
            }
        ])
    }

    /**
     * Clicks on advanced link to show expanded info
     */
    async showsAdvancedInfo () {
        const { page } = this
        await page.pause()
        await page.getByRole('button', { name: 'Advanced...' }).click()
    }

    /**
     * Clicks on link and expects it to open a URL in a new window
     *
     * @param {string} linkName
     * @param {string} newPageURL
    */
    async opensNewPage (linkName, newPageURL) {
        const { page } = this
        const newPagePromise = page.waitForEvent('popup')

        await page.pause()
        await expect(page.getByRole('link', { name: linkName })).toBeVisible()
        await page.getByRole('link', { name: linkName }).click()

        const newPage = await newPagePromise
        await expect(newPage).toHaveURL(newPageURL)
        await newPage.close()
    }

    async handlesFatalException () {
        const { page } = this
        await expect(page.getByRole('heading')).toContainText('Something went wrong')
        const calls = await this.mocks.waitForCallCount({ method: 'reportPageException', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'special-error',
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
                    featureName: 'special-error',
                    method: 'initialSetup'
                }
            }
        ])
    }
}