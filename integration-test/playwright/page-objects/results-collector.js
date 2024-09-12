import { readFileSync } from 'fs'
import {
    mockAndroidMessaging,
    mockWebkitMessaging,
    mockWindowsMessaging,
    wrapWebkitScripts,
    wrapWindowsScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from '../type-helpers.mjs'

/**
 * This is designed to allow you to execute Playwright tests using the various
 * artifacts we produce. For example, on the `apple` target this can be used to ensure
 * your tests run against the *real* file that Apple platforms will use in production.
 *
 * It also handles injecting global variables (like those seen in the entry points within the 'inject' folder)
 *
 * ```js
 * test('testing against a built artifact and collecting results', async ({ page }, testInfo) => {
 *     const collector = ResultsCollector.create(page, testInfo)
 *     await collector.load(HTML_PATH, CONFIG_PATH);
 *
 *     const results = await collector.collectResultsFromPage();
 *
 *     expect(results).toStrictEqual({
 *         "has DDG signal": [{
 *             "name": "navigator.duckduckgo.isDuckDuckGo()",
 *             "result": "true",
 *             "expected": "true"
 *         }],
 *     })
 * })
 * ```
 *
 */
export class ResultsCollector {
    #userPreferences = {}
    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('../type-helpers.mjs').Build} build
     * @param {import('../type-helpers.mjs').PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
    }

    /**
     * @param {string} htmlPath
     * @param {string} configPath
     */
    async load (htmlPath, configPath) {
        const config = JSON.parse(readFileSync(configPath, 'utf8'))
        await this.setup({ config })
        await this.page.goto(htmlPath)
        return this
    }

    /**
     * @param {Record<string, any>} values
     */
    withUserPreferences (values) {
        this.#userPreferences = values
        return this
    }

    /**
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup (params) {
        const { config } = params

        const wrapFn = this.build.switch({
            'apple-isolated': () => wrapWebkitScripts,
            apple: () => wrapWebkitScripts,
            android: () => wrapWindowsScripts,
            windows: () => wrapWindowsScripts
        })

        // read the built file from disk and do replacements
        const injectedJS = wrapFn(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: this.platform.name },
                debug: true,
                ...this.#userPreferences
            }
        })

        const messagingMock = this.build.switch({
            apple: () => mockWebkitMessaging,
            'apple-isolated': () => mockWebkitMessaging,
            windows: () => mockWindowsMessaging,
            android: () => mockAndroidMessaging
        })

        await this.page.addInitScript(messagingMock, {
            messagingContext: {
                env: 'development',
                context: 'contentScopeScripts',
                featureName: 'n/a'
            },
            responses: {}
        })

        // attach the JS
        await this.page.addInitScript(injectedJS)
    }

    collectResultsFromPage () {
        return this.page.evaluate(() => {
            return new Promise(resolve => {
                // @ts-expect-error - this is added by the test framework
                if (window.results) return resolve(window.results)
                window.addEventListener('results-ready', () => {
                    // @ts-expect-error - this is added by the test framework
                    resolve(window.results)
                })
            })
        })
    }

    async runTests () {
        for (const button of await this.page.getByTestId('user-gesture-button').all()) {
            await button.click()
        }
        const resultsPromise = this.page.evaluate(() => {
            return new Promise(resolve => {
                window.addEventListener('results-ready', () => {
                    // @ts-expect-error - this is added by the test framework
                    resolve(window.results)
                })
            })
        })
        await this.page.getByTestId('render-results').click()
        return await resultsPromise
    }

    /**
     * Helper for creating an instance per platform
     * @param {import('@playwright/test').Page} page
     * @param {import('@playwright/test').TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const {
            platformInfo,
            build
        } = perPlatform(testInfo.project.use)
        return new ResultsCollector(page, build, platformInfo)
    }
}
