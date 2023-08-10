import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { mockWindowsMessaging, wrapWindowsScripts } from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from './type-helpers.mjs'
import { windowsGlobalPolyfills } from './shared.mjs'

test('Windows Permissions Usage', async ({ page }, testInfo) => {
    const perms = WindowsPermissionsSpec.create(page, testInfo)
    await perms.enabled()
    const results = await page.evaluate(() => {
        // @ts-expect-error - this is added by the test framework
        return window.results['Disabled Windows Permissions']
    })

    for (const result of results) {
        expect(result.result).toEqual(result.expected)
    }
})

export class WindowsPermissionsSpec {
    htmlPage = '/permissions/index.html'
    config = './integration-test/test-pages/permissions/config/permissions.json'
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("./type-helpers.mjs").Build} build
     * @param {import("./type-helpers.mjs").PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
    }

    async enabled () {
        await this.installPolyfills()
        const config = JSON.parse(readFileSync(this.config, 'utf8'))
        await this.setup({ config })
        await this.page.goto(this.htmlPage)
    }

    /**
     * In CI, the global objects such as USB might not be installed on the
     * version of chromium running there.
     */
    async installPolyfills () {
        await this.page.addInitScript(windowsGlobalPolyfills)
    }

    /**
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup (params) {
        const { config } = params

        // read the built file from disk and do replacements
        const injectedJS = wrapWindowsScripts(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: 'windows' },
                debug: true
            }
        })

        await this.page.addInitScript(mockWindowsMessaging, {
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
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new WindowsPermissionsSpec(page, build, platformInfo)
    }
}
