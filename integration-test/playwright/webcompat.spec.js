import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import {
    mockWebkitMessaging,
    wrapWebkitScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from './type-helpers.mjs'

test('web compat', async ({ page }, testInfo) => {
    const webcompat = WebcompatSpec.create(page, testInfo)
    await webcompat.enabled()
    const results = await webcompat.collectResults()
    expect(results).toMatchObject({
        'webkit.messageHandlers - polyfill prevents throw': [{
            name: 'Error not thrown polyfil',
            result: true,
            expected: true
        }],
        'webkit.messageHandlers - undefined should throw': [{
            name: 'undefined handler should throw',
            result: true,
            expected: true
        }],
        'webkit.messageHandlers - reflected message': [{
            name: 'reflected message should pass through',
            result: 'test',
            expected: 'test'
        }]
    })
})

export class WebcompatSpec {
    htmlPage = '/webcompat/index.html'
    config = './integration-test/test-pages/webcompat/config/message-handlers.json'

    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('./type-helpers.mjs').Build} build
     * @param {import('./type-helpers.mjs').PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
    }

    async enabled () {
        const config = JSON.parse(readFileSync(this.config, 'utf8'))
        await this.setup({ config })
        await this.page.goto(this.htmlPage)
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
            responses: {},
            errors: {}
        })

        // attach the JS
        await this.page.addInitScript(injectedJS)
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
        return new WebcompatSpec(page, build, platformInfo)
    }
}
