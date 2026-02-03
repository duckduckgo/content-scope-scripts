import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

test('UA CH Brands override', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/brand-override.html',
        './integration-test/test-pages/ua-ch-brands/config/brand-override.json',
    );
    const results = await collector.results();

    for (const key in results) {
        for (const result of results[key]) {
            await test.step(`${key}: ${result.name}`, () => {
                expect(result.result).toEqual(result.expected);
            });
        }
    }
});

/**
 * Verifies domain-specific brand override results
 * @param {import('@playwright/test').Page} page
 */
async function verifyDomainBrandOverrideResults(page) {
    await page.waitForFunction(() => {
        // @ts-expect-error - results is set by the test framework
        return window.results && window.results.length > 0;
    });

    // @ts-expect-error - results is set by the test framework
    const results = await page.evaluate(() => window.results);

    await test.step('brands: contains Netscape Navigator', () => {
        const netscapeTest = results.find((r) => r.test === 'brands-contains-netscape');
        expect(netscapeTest.result).toBe('PASS');
    });

    await test.step('brands: does not contain DuckDuckGo', () => {
        const ddgTest = results.find((r) => r.test === 'brands-no-duckduckgo');
        expect(ddgTest.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: contains Netscape Navigator', () => {
        const netscapeTest = results.find((r) => r.test === 'getHighEntropyValues-brands-contains-netscape');
        expect(netscapeTest.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: does not contain DuckDuckGo', () => {
        const ddgTest = results.find((r) => r.test === 'getHighEntropyValues-brands-no-duckduckgo');
        expect(ddgTest.result).toBe('PASS');
    });

    await test.step('fullVersionList: contains Netscape Navigator', () => {
        const fvlNetscapeTest = results.find((r) => r.test === 'fullVersionList-contains-netscape');
        expect(fvlNetscapeTest.result).toBe('PASS');
    });

    await test.step('fullVersionList: does not contain DuckDuckGo', () => {
        const fvlDdgTest = results.find((r) => r.test === 'fullVersionList-no-duckduckgo');
        expect(fvlDdgTest.result).toBe('PASS');
    });
}

test('UA CH Brands domain-specific brand override (legacy format)', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/domain-brand-override.html',
        './integration-test/test-pages/ua-ch-brands/config/domain-brand-override-legacy.json',
    );
    await verifyDomainBrandOverrideResults(page);
});

test('UA CH Brands domain-specific brand override', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/domain-brand-override.html',
        './integration-test/test-pages/ua-ch-brands/config/domain-brand-override.json',
    );
    await verifyDomainBrandOverrideResults(page);
});

test('UA CH Brands with overrideEdge disabled', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/override-edge-disabled.html',
        './integration-test/test-pages/ua-ch-brands/config/override-edge-disabled.json',
    );

    await page.waitForFunction(() => {
        // @ts-expect-error - results is set by the test framework
        return window.results && window.results.length > 0;
    });

    // @ts-expect-error - results is set by the test framework
    const results = await page.evaluate(() => window.results);

    await test.step('brands: does not contain DuckDuckGo', () => {
        const ddgTest = results.find((r) => r.test === 'brands-no-duckduckgo');
        expect(ddgTest.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: does not contain DuckDuckGo', () => {
        const ddgTest = results.find((r) => r.test === 'getHighEntropyValues-brands-no-duckduckgo');
        expect(ddgTest.result).toBe('PASS');
    });

    await test.step('fullVersionList: does not contain DuckDuckGo', () => {
        const fvlDdgTest = results.find((r) => r.test === 'fullVersionList-no-duckduckgo');
        expect(fvlDdgTest.result).toBe('PASS');
    });
});
