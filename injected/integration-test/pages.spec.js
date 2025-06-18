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

    // Scriptlet integration page tests
    test('Set Cookie Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/set-cookie.html',
            './integration-test/test-pages/scriptlets/config/set-cookie.json',
        );
    });

    test('Set Local Storage Item Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/set-local-storage-item.html',
            './integration-test/test-pages/scriptlets/config/set-local-storage-item.json',
        );
    });

    test('Set Constant Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/set-constant.html',
            './integration-test/test-pages/scriptlets/config/set-constant.json',
        );
    });

    test('Trusted Set Cookie Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/trusted-set-cookie.html',
            './integration-test/test-pages/scriptlets/config/trusted-set-cookie.json',
        );
    });

    test('Remove Cookie Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/remove-cookie.html',
            './integration-test/test-pages/scriptlets/config/remove-cookie.json',
        );
    });

    test('Abort on Property Read Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/abort-on-property-read.html',
            './integration-test/test-pages/scriptlets/config/abort-on-property-read.json',
        );
    });

    test('Abort on Property Write Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/abort-on-property-write.html',
            './integration-test/test-pages/scriptlets/config/abort-on-property-write.json',
        );
    });

    test('Prevent Add Event Listener Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/prevent-addEventListener.html',
            './integration-test/test-pages/scriptlets/config/prevent-addEventListener.json',
        );
    });

    test('Prevent Set Timeout Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/prevent-setTimeout.html',
            './integration-test/test-pages/scriptlets/config/prevent-setTimeout.json',
        );
    });

    test('Prevent Window Open Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/prevent-window-open.html',
            './integration-test/test-pages/scriptlets/config/prevent-window-open.json',
        );
    });

    test('Prevent Fetch Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/prevent-fetch.html',
            './integration-test/test-pages/scriptlets/config/prevent-fetch.json',
        );
    });

    test('Remove Node Text Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/remove-node-text.html',
            './integration-test/test-pages/scriptlets/config/remove-node-text.json',
        );
    });

    test('Abort Current Inline Script Scriptlet', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'scriptlets/pages/abort-current-inline-script.html',
            './integration-test/test-pages/scriptlets/config/abort-current-inline-script.json',
        );
    });
});
