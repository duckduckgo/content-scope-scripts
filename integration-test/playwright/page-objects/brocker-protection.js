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
     * @param {'results.html' | 'results-multiple.html' | 'results-alt.html' | 'results-irregular1.html' |  'results-irregular2.html' |  'results-irregular3.html' | 'results-4.html' | 'results-5.html' | 'form.html' | 'empty-form.html' | 'captcha.html' | 'captcha.html?fname=john&lname=smith'} page - add more pages here as you need them
     * @return {Promise<void>}
     */
    async navigatesTo (page) {
        await this.page.goto('/broker-protection/pages/' + page)
    }

    /**
     * @return {Promise<void>}
     */
    async isFormFilled () {
        expect(await this.page.getByLabel('First Name:').inputValue()).toBe('John')
        expect(await this.page.getByLabel('Last Name:').inputValue()).toBe('Smith')
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
        if (person.name) { expect(response[0]?.name).toBe(person.name) }
        if (person.alternativeNames) { expect(response[0]?.alternativeNames).toStrictEqual(person.alternativeNames) }
        if (person.age) { expect(response[0]?.age).toBe(person.age) }
        if (person.addresses) { expect(response[0]?.addresses).toStrictEqual(person.addresses) }
        if (person.relatives) { expect(response[0]?.relatives).toStrictEqual(person.relatives) }
        if (person.phoneNumbers) { expect(response[0]?.phoneNumbers).toStrictEqual(person.phoneNumbers) }
        if (person.profileUrl) { expect(response[0]?.profileUrl).toContain(person.profileUrl) }
    }

    /**
     * @return {void}
     */
    isMultiple (response) {
        expect(response.length).toBeGreaterThan(1)
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
    isQueryParamRemoved (response) {
        const url = new URL(response.url)
        expect(url.searchParams.toString()).toBe('')
    }

    /**
     * Simulate the native-side pushing an action into the client-side JS
     *
     * @param {'extract.json' | 'extract2.json' | 'extract3.json' | 'extract4.json' | 'extract5.json' | 'extract-irregular1.json' | 'extract-irregular2.json' | 'extract-irregular3.json' | 'results2.json' | 'navigate.json' | 'fill-form.json' | 'click.json' | 'expectation.json' | 'get-captcha.json' | 'solve-captcha.json' | 'action-not-found.json'} action - add more action types here
     * @return {Promise<void>}
     */
    async receivesAction (action) {
        const actionJson = JSON.parse(readFileSync('./integration-test/test-pages/broker-protection/actions/' + action, 'utf8'))
        await this.simulateSubscriptionMessage('onActionReceived', actionJson)
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
     * @return {boolean}
     */
    isErrorMessage (response) {
        return !!response[0].payload?.params?.result?.error
    }

    isSuccessMessage (response) {
        return !!response[0].payload?.params?.result?.sucesss
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
