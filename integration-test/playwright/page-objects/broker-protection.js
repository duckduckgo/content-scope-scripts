import { expect } from '@playwright/test'
import { readFileSync } from 'fs'
import {
    mockWebkitMessaging,
    readOutgoingMessages,
    waitForCallCount,
    wrapWebkitScripts,
    simulateSubscriptionMessage,
    wrapWindowsScripts,
    mockWindowsMessaging
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from '../type-helpers.mjs'

export class BrokerProtectionPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../type-helpers.mjs").Build} build
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
    }

    // Given the "overlays" feature is enabled
    async enabled () {
        await this.setup({ config: loadConfig('enabled') })
    }

    /**
     * @param {string} page - add more pages here as you need them
     * @return {Promise<void>}
     */
    async navigatesTo (page) {
        await this.page.goto('/broker-protection/pages/' + page)
    }

    /**
     * @param {string} selector
     */
    async elementIsAbsent (selector) {
        // control - ensure the element isn't there first
        const e = await this.page.$(selector)
        expect(e).toBeNull()
    }

    /**
     * @return {Promise<void>}
     */
    async isFormFilled () {
        await expect(this.page.getByLabel('First Name:', { exact: true })).toHaveValue('John')
        await expect(this.page.getByLabel('Last Name:', { exact: true })).toHaveValue('Smith')
        await expect(this.page.getByLabel('Phone Number:', { exact: true })).toHaveValue(/^\d{10}$/)
        await expect(this.page.getByLabel('Street Address:', { exact: true })).toHaveValue(/^\d+ [A-Za-z]+(?: [A-Za-z]+)?$/)
        await expect(this.page.getByLabel('State:', { exact: true })).toHaveValue('IL')
        await expect(this.page.getByLabel('Zip Code:', { exact: true })).toHaveValue(/^\d{5}$/)
        await expect(this.page.getByLabel('City / State:', { exact: true })).toHaveValue(/^[A-Za-z\s\-]+, [A-Z]{2}$/)

        const randomValue = await this.page.getByLabel('Random number between 5 and 15:').inputValue()
        const randomValueInt = parseInt(randomValue)

        expect(Number.isInteger(randomValueInt)).toBe(true)
        expect(randomValueInt).toBeGreaterThanOrEqual(5)
        expect(randomValueInt).toBeLessThanOrEqual(15)
    }

    /**
     * @return {Promise<void>}
     */
    async isCaptchaTokenFilled () {
        const captchaTextArea = await this.page.$('#g-recaptcha-response')
        const captchaToken = await captchaTextArea?.evaluate((element) => element.innerHTML)
        expect(captchaToken).toBe('test_token')
    }

    /**
     * @return {void}
     */
    isExtractMatch (response, person) {
        expect(person).toMatchObject(response)
    }

    /**
     * @return {void}
     */
    isUrlMatch (response) {
        expect(response.url).toBe('https://www.verecor.com/profile/search?fname=Ben&lname=Smith&state=fl&city=New-York&fage=41-50')
    }

    /**
     * @return {void}
     */
    isCaptchaMatch (response) {
        expect(response).toStrictEqual({
            siteKey: '6LeCl8UUAAAAAGssOpatU5nzFXH2D7UZEYelSLTn',
            url: 'http://localhost:3220/broker-protection/pages/captcha.html',
            type: 'recaptcha2'
        })
    }

    /**
     * @return {void}
     */
    isHCaptchaMatch (response) {
        expect(response).toStrictEqual({
            siteKey: '6LeCl8UUAAAAAGssOpatU5nzFXH2D7UZEYelSLTn',
            url: 'http://localhost:3220/broker-protection/pages/captcha2.html',
            type: 'hcaptcha'
        })
    }

    /**
     * @return {void}
     */
    isQueryParamRemoved (response) {
        const url = new URL(response.url)
        expect(url.searchParams.toString()).toBe('')
    }

    /**
     * @param meta
     */
    responseContainsMetadata (meta) {
        expect(meta.extractResults).toHaveLength(10)
        expect(meta.extractResults.filter(x => x.result === true)).toHaveLength(1)
        expect(meta.extractResults.filter(x => x.result === false)).toHaveLength(9)
        const match = meta.extractResults.find(x => x.result === true)
        expect(match.matchedFields).toMatchObject(['name', 'age', 'addressCityStateList'])
        expect(match.element).toBe(undefined)
        expect(match.score).toBe(3)
    }

    /**
     * Simulate the native-side pushing an action into the client-side JS
     *
     * @param {string} action
     * @return {Promise<void>}
     */
    async receivesAction (action) {
        const actionJson = JSON.parse(readFileSync('./integration-test/test-pages/broker-protection/actions/' + action, 'utf8'))
        await this.simulateSubscriptionMessage('onActionReceived', actionJson)
    }

    /**
     * @param {{state: {action: Record<string, any>}}} action
     * @return {Promise<void>}
     */
    async receivesInlineAction (action) {
        await this.simulateSubscriptionMessage('onActionReceived', action)
    }

    /**
     * Simulate the native-side pushing an action into the client-side JS
     *
     * @param {'init-data.json'} action - add more action types here
     * @return {Promise<void>}
     */
    async receivesData (action) {
        const actionJson = JSON.parse(readFileSync('./integration-test/test-pages/broker-protection/data/' + action, 'utf8'))
        await this.simulateSubscriptionMessage('onInit', actionJson)
    }

    async sendsReadyNotification () {
        const calls = await this.waitForMessage('ready')
        expect(calls).toMatchObject([
            {
                payload: {
                    context: this.messagingContext.context,
                    featureName: 'brokerProtection',
                    method: 'ready',
                    params: {}
                }
            }
        ])
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} payload
     */
    async simulateSubscriptionMessage (name, payload) {
        await this.page.evaluate(simulateSubscriptionMessage, {
            messagingContext: this.messagingContext,
            name,
            payload,
            injectName: this.build.name
        })
    }

    /**
     * @return {import("@duckduckgo/messaging").MessagingContext}
     */
    get messagingContext () {
        const context = this.build.name === 'apple-isolated'
            ? 'contentScopeScriptsIsolated'
            : 'contentScopeScripts'
        return {
            context,
            featureName: 'brokerProtection',
            env: 'development'
        }
    }

    /**
     * This is a bit involved, but verifies that the built artefact behaves as expected
     * given a mocked messaging implementation
     *
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup (params) {
        const { config } = params

        // read the built file from disk and do replacements
        const wrapFn = this.build.switch({
            'apple-isolated': () => wrapWebkitScripts,
            windows: () => wrapWindowsScripts
        })

        const injectedJS = wrapFn(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: this.platform.name },
                debug: true
            }
        })

        const mockMessaging = this.build.switch({
            'apple-isolated': () => mockWebkitMessaging,
            windows: () => mockWindowsMessaging
        })

        await this.page.addInitScript(mockMessaging, {
            messagingContext: this.messagingContext,
            responses: {
                ready: {}
            }
        })

        // attach the JS
        await this.page.addInitScript(injectedJS)
    }

    /**
     * @param {string} method
     * @return {Promise<object>}
     */
    async waitForMessage (method) {
        await this.page.waitForFunction(waitForCallCount, {
            method,
            count: 1
        }, { timeout: 5000, polling: 100 })
        const calls = await this.page.evaluate(readOutgoingMessages)
        return calls.filter(v => v.payload.method === method)
    }

    /**
     * @param {object} response
     */
    isErrorMessage (response) {
        expect('error' in response[0].payload?.params?.result).toBe(true)
    }

    isSuccessMessage (response) {
        expect('success' in response[0].payload?.params?.result).toBe(true)
    }

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new BrokerProtectionPage(page, build, platformInfo)
    }
}

/**
 * @param {"enabled"} name
 * @return {Record<string, any>}
 */
function loadConfig (name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/broker-protection/config/${name}.json`, 'utf8'))
}
