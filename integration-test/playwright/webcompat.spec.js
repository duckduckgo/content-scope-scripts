import { test, expect } from '@playwright/test'
import { ResultsCollector } from "./page-objects/results-collector.js";

test('web compat', async ({ page }, testInfo) => {
    const htmlPage = '/webcompat/index.html'
    const config = './integration-test/test-pages/webcompat/config/message-handlers.json'

    const collector = ResultsCollector.create(page, testInfo)
    await collector.load(htmlPage, config)

    const results = await collector.collectResultsFromPage()
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
