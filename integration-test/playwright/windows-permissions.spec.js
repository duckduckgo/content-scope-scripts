import { test, expect } from '@playwright/test'
import { ResultsCollector } from "./page-objects/results-collector.js";
import { windowsGlobalPolyfills } from "./shared.mjs";

test('Windows Permissions Usage', async ({ page }, testInfo) => {
    const htmlPage = '/permissions/index.html'
    const config = './integration-test/test-pages/permissions/config/permissions.json'

    // windows polyfills first
    await page.addInitScript(windowsGlobalPolyfills)

    const collector = ResultsCollector.create(page, testInfo)
    await collector.load(htmlPage, config)

    const results = await collector.collectResultsFromPage();

    for (const result of results['Disabled Windows Permissions']) {
        expect(result.result).toEqual(result.expected)
    }
})
