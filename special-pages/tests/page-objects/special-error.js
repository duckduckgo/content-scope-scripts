import { Mocks } from './mocks.js'
import { expect } from '@playwright/test'
import { perPlatform } from '../../../injected/integration-test/playwright/type-helpers.mjs'
import { join } from 'node:path'
import { sampleData } from '../../pages/special-error/src/js/sampleData'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(import.meta.url)

/**
 * @typedef {import('../../../injected/integration-test/playwright/type-helpers.mjs').Build} Build
 * @typedef {import('../../../injected/integration-test/playwright/type-helpers.mjs').PlatformInfo} PlatformInfo
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
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     *
     * @param {Object} [params] - Optional parameters for opening the page.
     * @param {'app'|'components'} [params.env] - Optional parameters for opening the page.
     * @param {boolean} [params.willThrow] - Optional flag to simulate an exception
     * @param {keyof sampleData} [params.errorId] - ID of the error to be mocked (see sampleData.js)
     * @param {'macos'|'ios'} [params.platformName] - platform name
     * @param {string} [params.locale] - locale
     */
    async openPage ({ env = 'app', willThrow = false, errorId = 'ssl.expired', platformName = 'macos', locale } = { }) {
        /** @type {import('../../types/special-error.js').InitialSetupResponse} */
        const initialSetup = {
            env: 'development',
            locale: 'en',
            platform: {
                name: platformName
            },
            errorData: sampleData[errorId].data
        }

        /**
         * This is here to mimic the logic that will occur in the native layer.
         * A JSON file will be selected based on the user's locale setting and will be delivered as a string
         *
         * NOTE: this will throw an execution if the file is absent, but I am deliberately not
         * catching it here and letting it bubble up to fail the playwright test in question.
         */
        if (locale && locale.length === 2) {
            const localeStrings = readFileSync(require.resolve(`../../pages/special-error/src/locales/${locale}/special-error.json`), 'utf8')
            initialSetup.localeStrings = localeStrings
            initialSetup.locale = locale
        }

        this.mocks.defaultResponses({
            initialSetup
        })

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
            apple: () => '../Sources/ContentScopeScripts/dist/pages/special-error'
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

    async showsExpiredPage () {
        const { page } = this
        await expect(page.getByText('Warning: This site may be insecure', { exact: true })).toBeVisible()
        await expect(page.getByText('The certificate for this site is invalid. You might be connecting to a server that is pretending to be example.com which could put your confidential information at risk.', { exact: true })).toBeVisible()
        await this.showsAdvancedInfo()
        await expect(page.getByText('DuckDuckGo warns you when a website has an invalid certificate.', { exact: true })).toBeVisible()
        await expect(page.getByText('The security certificate for example.com is expired. It’s possible that the website is misconfigured, that an attacker has compromised your connection, or that your system clock is incorrect.', { exact: true })).toBeVisible()
    }

    async showsExpiredPageInPolish () {
        const { page } = this
        await expect(page.getByRole('heading')).toContainText('Ostrzeżenie: ta witryna może być niebezpieczna')
    }

    async showsInvalidPage () {
        const { page } = this
        await expect(page.getByText('Warning: This site may be insecure', { exact: true })).toBeVisible()
        await expect(page.getByText('The certificate for this site is invalid. You might be connecting to a server that is pretending to be example.com which could put your confidential information at risk.', { exact: true })).toBeVisible()
        await this.showsAdvancedInfo()
        await expect(page.getByText('DuckDuckGo warns you when a website has an invalid certificate.', { exact: true })).toBeVisible()
        await expect(page.getByText('The security certificate for example.com is not trusted by your device’s operating system. It’s possible that the website is misconfigured or that an attacker has compromised your connection.', { exact: true })).toBeVisible()
    }

    async showsSelfSignedPage () {
        const { page } = this
        await expect(page.getByText('Warning: This site may be insecure', { exact: true })).toBeVisible()
        await expect(page.getByText('The certificate for this site is invalid. You might be connecting to a server that is pretending to be example.com which could put your confidential information at risk.', { exact: true })).toBeVisible()
        await this.showsAdvancedInfo()
        await expect(page.getByText('DuckDuckGo warns you when a website has an invalid certificate.', { exact: true })).toBeVisible()
        await expect(page.getByText('The security certificate for example.com is not trusted by your device’s operating system. It’s possible that the website is misconfigured or that an attacker has compromised your connection.', { exact: true })).toBeVisible()
    }

    async showsWrongHostPage () {
        const { page } = this
        await expect(page.getByText('Warning: This site may be insecure', { exact: true })).toBeVisible()
        await expect(page.getByText('The certificate for this site is invalid. You might be connecting to a server that is pretending to be example.com which could put your confidential information at risk.', { exact: true })).toBeVisible()
        await this.showsAdvancedInfo()
        await expect(page.getByText('DuckDuckGo warns you when a website has an invalid certificate.', { exact: true })).toBeVisible()
        await expect(page.getByText('The security certificate for example.com does not match *.anothersite.com. It’s possible that the website is misconfigured or that an attacker has compromised your connection.', { exact: true })).toBeVisible()
    }

    async showsPhishingPage () {
        const { page } = this
        await expect(page.getByText('Warning: This site puts your personal information at risk', { exact: true })).toBeVisible()
        await expect(page.getByText('This website may be impersonating a legitimate site in order to trick you into providing personal information, such as passwords or credit card numbers. Learn more', { exact: true })).toBeVisible()
        await this.showsAdvancedInfo()
        await expect(page.getByText('DuckDuckGo warns you when a website has been flagged as malicious.', { exact: true })).toBeVisible()
        await expect(page.getByText('Warnings are shown for websites that have been reported to be deceptive. Deceptive websites try to trick you into believing they are legitimate websites you trust. If you understand the risks involved, you can continue anyway.', { exact: true })).toBeVisible()
        await expect(page.getByText('See our Phishing and Malware Protection help page for more information.', { exact: true })).toBeVisible()
    }

    /**
     * Clicks on advanced link to show expanded info
     */
    async showsAdvancedInfo () {
        const { page } = this
        await page.getByRole('button', { name: 'Advanced...' }).click()
        const calls = await this.mocks.waitForCallCount({ method: 'advancedInfo', count: 1 })
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'special-error',
                    method: 'advancedInfo',
                    params: {}
                }
            }
        ])
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
