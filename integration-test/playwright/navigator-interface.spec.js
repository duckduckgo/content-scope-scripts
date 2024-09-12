import { expect, test } from '@playwright/test'
import { ResultsCollector } from './page-objects/results-collector.js'

const HTML_PATH = '/navigator-interface/index.html'
const NON_PRIVILEGED_CONFIG = './integration-test/test-pages/navigator-interface/config/navigator-interface.json'
const PRIVILEGED_CONFIG = './integration-test/test-pages/navigator-interface/config/navigator-interface-privileged.json'

test('navigator interface - DDG signal', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo)
    await collector.load(HTML_PATH, NON_PRIVILEGED_CONFIG)

    const results = await collector.collectResultsFromPage()
    expect(results).toStrictEqual({
        'has DDG signal': [{
            name: 'navigator.duckduckgo.isDuckDuckGo()',
            result: 'true',
            expected: 'true'
        }]
    })
})

test('navigator interface - appends privileged data', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo)

    await collector
        .withUserPreferences({ isSubscribed: true })
        .load(HTML_PATH, PRIVILEGED_CONFIG)

    const value = await page.evaluate(() => navigator.duckduckgo?.privileged)
    expect(value).toStrictEqual({ isSubscribed: true })
})

test('navigator interface - does not append privileged data in a non-privileged domain', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo)

    await collector
        .withUserPreferences({ isSubscribed: true })
        .load(HTML_PATH, NON_PRIVILEGED_CONFIG)

    const value = await page.evaluate(() => navigator.duckduckgo?.privileged)
    expect(value).toBeUndefined()
})
