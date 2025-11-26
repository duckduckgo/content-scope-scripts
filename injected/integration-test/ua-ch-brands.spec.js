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

test('UA CH Brands domain-specific brand override', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/domain-brand-override.html',
        './integration-test/test-pages/ua-ch-brands/config/domain-brand-override.json',
    );

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

    await test.step('brands: does not contain Microsoft Edge', () => {
        const edgeTest = results.find((r) => r.test === 'brands-no-edge');
        expect(edgeTest.result).toBe('PASS');
    });

    await test.step('brands: does not contain Microsoft Edge WebView2', () => {
        const webview2Test = results.find((r) => r.test === 'brands-no-webview2');
        expect(webview2Test.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: contains Netscape Navigator', () => {
        const netscapeTest = results.find((r) => r.test === 'getHighEntropyValues-brands-contains-netscape');
        expect(netscapeTest.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: does not contain DuckDuckGo', () => {
        const ddgTest = results.find((r) => r.test === 'getHighEntropyValues-brands-no-duckduckgo');
        expect(ddgTest.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: does not contain Microsoft Edge', () => {
        const edgeTest = results.find((r) => r.test === 'getHighEntropyValues-brands-no-edge');
        expect(edgeTest.result).toBe('PASS');
    });

    await test.step('getHighEntropyValues brands: does not contain Microsoft Edge WebView2', () => {
        const webview2Test = results.find((r) => r.test === 'getHighEntropyValues-brands-no-webview2');
        expect(webview2Test.result).toBe('PASS');
    });

    await test.step('fullVersionList: contains Netscape Navigator', () => {
        const fvlNetscapeTest = results.find((r) => r.test === 'fullVersionList-contains-netscape');
        expect(fvlNetscapeTest.result).toBe('PASS');
    });

    await test.step('fullVersionList: does not contain DuckDuckGo', () => {
        const fvlDdgTest = results.find((r) => r.test === 'fullVersionList-no-duckduckgo');
        expect(fvlDdgTest.result).toBe('PASS');
    });

    await test.step('fullVersionList: does not contain Microsoft Edge', () => {
        const fvlEdgeTest = results.find((r) => r.test === 'fullVersionList-no-edge');
        expect(fvlEdgeTest.result).toBe('PASS');
    });

    await test.step('fullVersionList: does not contain Microsoft Edge WebView2', () => {
        const fvlWebview2Test = results.find((r) => r.test === 'fullVersionList-no-webview2');
        expect(fvlWebview2Test.result).toBe('PASS');
    });
});
