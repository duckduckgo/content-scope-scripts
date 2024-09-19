import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import {
    mockWebkitMessaging,
    wrapWebkitScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from './type-helpers.mjs'

const pages = {
    'webcompat/index.html': 'webcompat/config/message-handlers.json',
    'runtime-checks/pages/basic-run.html': 'runtime-checks/config/basic-run.json'
    /*
    'runtime-checks/pages/replace-element.html': 'runtime-checks/config/replace-element.json',
    'runtime-checks/pages/filter-props.html': 'runtime-checks/config/filter-props.json',
    'runtime-checks/pages/shadow-dom.html': 'runtime-checks/config/shadow-dom.json',
    'runtime-checks/pages/script-overload.html': 'runtime-checks/config/script-overload.json',
    'runtime-checks/pages/generic-overload.html': 'runtime-checks/config/generic-overload.json'
    */
}

for (const pageName in pages) {
    test(pageName, async ({ page }, testInfo) => {
        const configName = pages[pageName]
        const webcompat = TestPage.create(pageName, configName, page, testInfo)
        await webcompat.enabled()
        const results = await webcompat.collectResults()
        expect(results.result).toEqual(results.expected)
    })
}

export class TestPage {
    htmlPage = ''
    config = ''

    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('./type-helpers.mjs').Build} build
     * @param {import('./type-helpers.mjs').PlatformInfo} platform
     */
    constructor (htmlPage, config, page, build, platform) {
        this.htmlPage = htmlPage
        this.config = config
        this.page = page
        this.build = build
        this.platform = platform
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
    }

    async enabled () {
        const config = JSON.parse(readFileSync('./integration-test/test-pages/' + this.config, 'utf8'))
        await this.setup({ config })
        await this.page.goto('/' + this.htmlPage)
    }

    collectResults () {
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

    /**
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup (params) {
        const { config } = params

        // read the built file from disk and do replacements
        const injectedJS = wrapWebkitScripts(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: 'windows' },
                debug: true
            }
        })

        await this.page.addInitScript(mockWebkitMessaging, {
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

    /**
     * Helper for creating an instance per platform
     * @param {import('@playwright/test').Page} page
     * @param {import('@playwright/test').TestInfo} testInfo
     */
    static create (htmlPage, config, page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const {
            platformInfo,
            build
        } = perPlatform(testInfo.project.use)
        return new TestPage(htmlPage, config, page, build, platformInfo)
    }
}
