import { Mocks } from './mocks.js'
import { perPlatform } from '../../../../integration-test/playwright/type-helpers.mjs'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { defaultLoadData } from '../../pages/specialerrorpage/src/js/defaults'

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
            featureName: 'onboarding',
            env: 'development'
        })
        this.page.on('console', console.log)
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     */
    async openPage () {
        await this.mocks.install()
        await this.page.route('/**', (route, req) => {
            const url = new URL(req.url())
            // try to serve assets, but change `/` to 'index'
            let filepath = url.pathname
            if (filepath === '/') {
                filepath = 'index.html'
                const html = readFileSync(join(this.basePath, filepath), 'utf8')
                const next = html.replace('$LOAD_TIME_DATA$', JSON.stringify(defaultLoadData))
                return route.fulfill({
                    body: next,
                    status: 200,
                    contentType: 'text/html'
                })
            }
            return route.fulfill({
                status: 200,
                path: join(this.basePath, filepath)
            })
        })
        await this.page.goto('/')
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath () {
        return this.build.switch({
            apple: () => '../../Sources/ContentScopeScripts/dist/pages/specilalerrorpage'
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

    async darkMode () {
        await this.page.emulateMedia({ colorScheme: 'dark' })
    }

    async leavesSite () {
        await this.page.getByRole('button', { name: 'Leave This Site' }).click()
        await this.mocks.waitForCallCount({ method: 'leaveSite', count: 1 })
    }

    async visitsSite () {
        const { page } = this
        await page.pause()
        await page.getByRole('button', { name: 'Advanced...' }).click()
        await page.getByRole('button', { name: 'Accept Risk and Visit Site' }).click()
        await this.mocks.waitForCallCount({ method: 'visitSite', count: 1 })
    }
}
