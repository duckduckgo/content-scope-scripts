import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import {
    mockWindowsMessaging,
    readOutgoingMessages,
    simulateSubscriptionMessage,
    waitForCallCount,
    wrapWindowsScripts,
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { perPlatform } from './type-helpers.mjs'

test('Breakage Reporting Feature', async ({ page }, testInfo) => {
    const breakageFeature = BreakageReportingSpec.create(page, testInfo)
    await breakageFeature.enabled()
    await breakageFeature.navigate()

    await page.evaluate(simulateSubscriptionMessage, {
        messagingContext: {
            context: 'contentScopeScripts',
            featureName: 'breakageReporting',
            env: 'development',
        },
        name: 'getBreakageReportValues',
        payload: {},
        injectName: breakageFeature.build.name,
    })

    await page.waitForFunction(
        waitForCallCount,
        {
            method: 'breakageReportResult',
            count: 1,
        },
        { timeout: 5000, polling: 100 },
    )
    const calls = await page.evaluate(readOutgoingMessages)
    expect(calls.length).toBe(1)

    const result = calls[0].payload.params
    expect(result.jsPerformance.length).toBe(1)
    expect(result.jsPerformance[0]).toBeGreaterThan(0)
    expect(result.referrer).toBe('http://localhost:3220/breakage-reporting/index.html')
})

export class BreakageReportingSpec {
    htmlPage = '/breakage-reporting/index.html'
    config = './integration-test/test-pages/breakage-reporting/config/config.json'
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("./type-helpers.mjs").Build} build
     * @param {import("./type-helpers.mjs").PlatformInfo} platform
     */
    constructor(page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
    }

    async enabled() {
        const config = JSON.parse(readFileSync(this.config, 'utf8'))
        await this.setup({ config })
    }

    async navigate() {
        await this.page.goto(this.htmlPage)

        await this.page.evaluate(() => {
            window.location.href = '/breakage-reporting/pages/ref.html'
        })
        await this.page.waitForURL('**/ref.html')

        // Wait for first paint event to ensure we can get the performance metrics
        await this.page.evaluate(() => {
            const response = new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.name === 'first-paint') {
                            observer.disconnect()
                            // @ts-expect-error - error TS2810: Expected 1 argument, but got 0. 'new Promise()' needs a JSDoc hint to produce a 'resolve' that can be called without arguments.
                            resolve()
                        }
                    })
                })

                observer.observe({ type: 'paint', buffered: true })
            })
            return response
        })
    }

    /**
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup(params) {
        const { config } = params

        // read the built file from disk and do replacements
        const injectedJS = wrapWindowsScripts(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: 'windows' },
                debug: true,
            },
        })

        await this.page.addInitScript(mockWindowsMessaging, {
            messagingContext: {
                env: 'development',
                context: 'contentScopeScripts',
                featureName: 'n/a',
            },
            responses: {},
        })

        // attach the JS
        await this.page.addInitScript(injectedJS)
    }

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new BreakageReportingSpec(page, build, platformInfo)
    }
}
