import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import {
    mockAndroidMessaging,
    wrapWebkitScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from './type-helpers.mjs'

test('Password import feature', async ({ page }, testInfo) => {
    const passwordImportFeature = PasswordImportSpec.create(page, testInfo)
    await passwordImportFeature.enabled()
    await passwordImportFeature.navigate()
    await passwordImportFeature.clickOnElement('Home page')
    await passwordImportFeature.assertElementIsAnimating('a[aria-label="Password options"')

    await passwordImportFeature.clickOnElement('Signin page')
    await passwordImportFeature.assertElementIsAnimating('a[aria-label="Sign in"')

    await passwordImportFeature.clickOnElement('Export page')
    await passwordImportFeature.assertElementIsAnimating('button[aria-label="Export"')
})

export class PasswordImportSpec {
    htmlPage = '/password-import/index.html'
    config = './integration-test/test-pages/password-import/config/config.json'
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
        const config = JSON.parse(readFileSync(this.config, 'utf8'))
        await this.setup({ config })
    }

    async navigate () {
        await this.page.goto(this.htmlPage)
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
                platform: { name: 'android' },
                debug: true,
                javascriptInterface: '',
                messageCallback: '',
                sessionKey: ''
            }
        })

        await this.page.addInitScript(mockAndroidMessaging, {
            messagingContext: {
                env: 'development',
                context: 'contentScopeScripts',
                featureName: 'n/a'
            },
            responses: {},
            messageCallback: ''
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
        return new PasswordImportSpec(page, build, platformInfo)
    }

    /**
     * Helper to assert that an element is animating
     * @param {string} selector
     */
    async assertElementIsAnimating (selector) {
        const isAnimating = await this.page.evaluate((selector) => {
            const el = document.querySelector(selector)
            if (el != null) {
                return el.getAnimations().some((animation) => animation.playState === 'running')
            } else {
                return false
            }
        }, selector)
        expect(isAnimating).toBe(true)
    }

    /**
     * Helper to click on a button accessed via the aria-label attrbitue
     * @param {string} text
     */
    async clickOnElement (text) {
        const element = await this.page.getByText(text)
        await element.click()
    }
}
