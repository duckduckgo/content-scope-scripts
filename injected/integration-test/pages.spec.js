/**
 *  Tests for shared pages
 */
import * as fs from 'fs';
import { test as base, expect } from '@playwright/test';
import { processConfig } from '../src/utils.js';
import polyfillProcessGlobals from '../unit-test/helpers/pollyfil-for-process-globals.js';
import { gotoAndWait, testContextForExtension } from './helpers/harness.js';

const test = testContextForExtension(base);

test.describe('Test integration pages', () => {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {string} pageName
     * @param {string} configPath
     * @param {string} [evalBeforeInit]
     */
    async function testPage(page, pageName, configPath, evalBeforeInit) {
        const res = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(res.toString());
        polyfillProcessGlobals();

        /** @type {import('../src/utils.js').UserPreferences} */
        const userPreferences = {
            platform: {
                name: 'extension',
            },
            sessionKey: 'test',
        };
        const processedConfig = processConfig(
            config,
            /* userList */ [],
            /* preferences */ userPreferences /*, platformSpecificFeatures = [] */,
        );

        await gotoAndWait(page, `/${pageName}?automation=true`, processedConfig, evalBeforeInit);
        // Check page results
        const pageResults = await page.evaluate(() => {
            let res;
            const promise = new Promise((resolve) => {
                res = resolve;
            });
            // @ts-expect-error - results is not defined in the type definition
            if (window.results) {
                // @ts-expect-error - results is not defined in the type definition
                res(window.results);
            } else {
                window.addEventListener('results-ready', (e) => {
                    // @ts-expect-error - e.detail is not defined in the type definition
                    res(e.detail);
                });
            }
            return promise;
        });
        for (const key in pageResults) {
            for (const result of pageResults[key]) {
                await test.step(`${key}:\n ${result.name}`, () => {
                    expect(result.result).toEqual(result.expected);
                });
            }
        }
    }

    test.only('Test manipulating APIs', async ({ page }) => {
        await testPage(
            page,
            'api-manipulation/pages/apis.html',
            `${process.cwd()}/integration-test/test-pages/api-manipulation/config/apis.json`,
        );
    });

    test('Web compat shims correctness', async ({ page }) => {
        await testPage(page, 'webcompat/pages/shims.html', `${process.cwd()}/integration-test/test-pages/webcompat/config/shims.json`);
    });

    test('Properly modifies localStorage entries', async ({ page }) => {
        await testPage(
            page,
            'webcompat/pages/modify-localstorage.html',
            `${process.cwd()}/integration-test/test-pages/webcompat/config/modify-localstorage.json`,
        );
    });
});
