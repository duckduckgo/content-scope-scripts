/**
 *  Tests for shared pages.
 *  Note: these only run in the extension setup for now.
 */
import { test as base, expect } from '@playwright/test';
import { testContextForExtension } from './helpers/harness.js';
import { ResultsCollector } from './page-objects/results-collector.js';

const test = testContextForExtension(base);

test.describe('Test integration pages', () => {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     * @param {string} html
     * @param {string} config
     */
    async function testPage(page, testInfo, html, config) {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(html, config);
        const results = await collector.results();
        for (const key in results) {
            for (const result of results[key]) {
                await test.step(`${key}:\n ${result.name}`, () => {
                    expect(result.result).toEqual(result.expected);
                });
            }
        }
    }

    test('Test manipulating APIs', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/api-manipulation/pages/apis.html',
            './integration-test/test-pages/api-manipulation/config/apis.json',
        );
    });

    test('Web compat shims correctness', async ({ page }, testInfo) => {
        // prettier-ignore
        await testPage(
            page,
            testInfo,
            'webcompat/pages/shims.html',
            `./integration-test/test-pages/webcompat/config/shims.json`,
        );
    });

    test('Properly modifies localStorage entries', async ({ page }, testInfo) => {
        // prettier-ignore
        await testPage(
            page,
            testInfo,
            'webcompat/pages/modify-localstorage.html',
            `./integration-test/test-pages/webcompat/config/modify-localstorage.json`,
        );
    });

    test('Properly modifies cookies', async ({ page }, testInfo) => {
        // prettier-ignore
        await testPage(
            page,
            testInfo,
            'webcompat/pages/modify-cookies.html',
            `./integration-test/test-pages/webcompat/config/modify-cookies.json`,
        );
    });
});
