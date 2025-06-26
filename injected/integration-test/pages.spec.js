/**
 *  Tests for shared pages.
 *  Note: these only run in the extension setup for now.
 */
import { test as base, expect } from '@playwright/test';
import { testContextForExtension } from './helpers/harness.js';
import { ResultsCollector } from './page-objects/results-collector.js';

const test = testContextForExtension(base);
/**
 * @typedef {import('../../injected/src/utils.js').Platform} Platform
 */

test.describe('Test integration pages', () => {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     * @param {string} html
     * @param {string} config
     * @param {Partial<Platform>} [platform]
     */
    async function testPage(page, testInfo, html, config, platform = {}) {
        const collector = ResultsCollector.create(page, testInfo?.project?.use);
        await collector.load(html, config, platform);
        const results = await collector.results();
        for (const key in results) {
            for (const result of results[key]) {
                await test.step(`${key}: ${result.name}`, () => {
                    expect(result.result).toEqual(result.expected);
                });
            }
        }
    }

    test('Test infra', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/conditional-matching.html',
            './integration-test/test-pages/infra/config/conditional-matching.json',
        );
    });

    test('Test infra with experiments', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/conditional-matching-experiments.html',
            './integration-test/test-pages/infra/config/conditional-matching-experiments.json',
        );
    });

    test('Test infra fallback', async ({ page }, testInfo) => {
        await page.addInitScript(() => {
            // This ensures that our fallback code applies and so we simulate other platforms than Chromium.
            delete globalThis.navigation;
        });
        await testPage(
            page,
            testInfo,
            '/infra/pages/conditional-matching.html',
            './integration-test/test-pages/infra/config/conditional-matching.json',
        );
    });

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

    test('minSupportedVersion (string)', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/min-supported-version-string.html',
            './integration-test/test-pages/infra/config/min-supported-version-string.json',
            { version: '1.0.0' },
        );
    });

    test('minSupportedVersion (int)', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/min-supported-version-int.html',
            './integration-test/test-pages/infra/config/min-supported-version-int.json',
            { version: 99 },
        );
    });
});
