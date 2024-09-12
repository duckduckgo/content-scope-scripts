import { test, expect } from '@playwright/test'
import {
    readOutgoingMessages, simulateSubscriptionMessage, waitForCallCount
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { ResultsCollector } from './page-objects/results-collector.js'

test('Breakage Reporting Feature', async ({ page }, testInfo) => {
    const htmlPage = '/breakage-reporting/index.html'
    const config = './integration-test/test-pages/breakage-reporting/config/config.json'

    const collector = ResultsCollector.create(page, testInfo)
    await collector.load(htmlPage, config)

    const feature = new BreakageFeatureSpec(page)
    await feature.navigate()

    await page.evaluate(simulateSubscriptionMessage, {
        messagingContext: {
            context: 'contentScopeScripts',
            featureName: 'breakageReporting',
            env: 'development'
        },
        name: 'getBreakageReportValues',
        payload: {},
        injectName: collector.build.name
    })

    await page.waitForFunction(waitForCallCount, {
        method: 'breakageReportResult',
        count: 1
    }, { timeout: 5000, polling: 100 })
    const calls = await page.evaluate(readOutgoingMessages)
    expect(calls.length).toBe(1)

    const result = calls[0].payload.params
    expect(result.jsPerformance.length).toBe(1)
    expect(result.jsPerformance[0]).toBeGreaterThan(0)
    expect(result.referrer).toBe('http://localhost:3220/breakage-reporting/index.html')
})

export class BreakageFeatureSpec {
    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor (page) {
        this.page = page
    }

    async navigate () {
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
}
