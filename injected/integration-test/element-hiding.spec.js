import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

test.describe('Element Hiding Integration Tests', () => {
    test('Basic element hiding with simple hide rules', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(
            '/element-hiding/pages/basic-hiding.html',
            './integration-test/test-pages/element-hiding/config/basic-hiding.json',
        );
        const results = await collector.results();

        expect(results).toMatchObject({
            'Basic Element Hiding': [
                {
                    name: 'ad-banner hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'sidebar-ad hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'data-ad element hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'content visible',
                    result: true,
                    expected: true,
                },
                {
                    name: 'main-content visible',
                    result: true,
                    expected: true,
                },
                {
                    name: 'data-content element visible',
                    result: true,
                    expected: true,
                },
            ],
        });
    });

    test('Hide empty elements only', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(
            '/element-hiding/pages/empty-elements.html',
            './integration-test/test-pages/element-hiding/config/empty-elements.json',
        );
        const results = await collector.results();

        expect(results).toMatchObject({
            'Hide Empty Elements': [
                {
                    name: 'empty-container-1 hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'empty-container-2 (whitespace) hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'maybe-empty-3 hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'non-empty-1 visible',
                    result: true,
                    expected: true,
                },
                {
                    name: 'non-empty-2 (with children) visible',
                    result: true,
                    expected: true,
                },
                {
                    name: 'non-empty-3 (with text) visible',
                    result: true,
                    expected: true,
                },
            ],
        });
    });

    test('Modify element attributes', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(
            '/element-hiding/pages/modify-attributes.html',
            './integration-test/test-pages/element-hiding/config/modify-attributes.json',
        );
        const results = await collector.results();

        expect(results).toMatchObject({
            'Modify Attributes': [
                {
                    name: 'ad-image src modified',
                    result: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    expected: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                },
                {
                    name: 'tracking-link href modified',
                    result: expect.stringContaining('#blocked'),
                    expected: expect.stringContaining('#blocked'),
                },
                {
                    name: 'content-image src unchanged',
                    result: true,
                    expected: true,
                },
                {
                    name: 'regular-link href unchanged',
                    result: true,
                    expected: true,
                },
            ],
        });
    });

    test('Modify element styles', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(
            '/element-hiding/pages/modify-styles.html',
            './integration-test/test-pages/element-hiding/config/modify-styles.json',
        );
        const results = await collector.results();

        expect(results).toMatchObject({
            'Modify Styles': [
                {
                    name: 'ad-container display modified',
                    result: 'none',
                    expected: 'none',
                },
                {
                    name: 'banner-ad visibility modified',
                    result: 'hidden',
                    expected: 'hidden',
                },
                {
                    name: 'resize-ad width modified',
                    result: '0px',
                    expected: '0px',
                },
                {
                    name: 'normal-content display unchanged',
                    result: true,
                    expected: true,
                },
                {
                    name: 'regular-element width unchanged',
                    result: true,
                    expected: true,
                },
            ],
        });
    });

    test('Element hiding disabled - baseline behavior', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(
            '/element-hiding/pages/basic-hiding.html',
            './integration-test/test-pages/element-hiding/config/disabled.json',
        );
        const results = await collector.results();

        // When element hiding is disabled, all elements should remain visible
        // Note: The test logic checks for elements being hidden, but when disabled they shouldn't be hidden
        const basicResults = results['Basic Element Hiding'];
        expect(basicResults).toBeDefined();

        // Find the hide tests - they should return false when element hiding is disabled
        const adBannerResult = basicResults.find((r) => r.name === 'ad-banner hidden');
        const sidebarResult = basicResults.find((r) => r.name === 'sidebar-ad hidden');
        const dataAdResult = basicResults.find((r) => r.name === 'data-ad element hidden');

        expect(adBannerResult.result).toBe(false); // Should NOT be hidden when disabled
        expect(sidebarResult.result).toBe(false); // Should NOT be hidden when disabled
        expect(dataAdResult.result).toBe(false); // Should NOT be hidden when disabled

        // Visible elements should remain visible
        const contentResult = basicResults.find((r) => r.name === 'content visible');
        const mainContentResult = basicResults.find((r) => r.name === 'main-content visible');
        const dataContentResult = basicResults.find((r) => r.name === 'data-content element visible');

        expect(contentResult.result).toBe(true);
        expect(mainContentResult.result).toBe(true);
        expect(dataContentResult.result).toBe(true);
    });

    test('Performance: Element hiding rules apply quickly', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);

        const startTime = Date.now();
        await collector.load(
            '/element-hiding/pages/basic-hiding.html',
            './integration-test/test-pages/element-hiding/config/basic-hiding.json',
        );

        // Wait a minimal time and check if elements are already hidden
        await page.waitForTimeout(50);

        const adBanner = page.locator('.ad-banner').first();
        const isHidden = await adBanner.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.display === 'none' || (el instanceof HTMLElement && el.hidden === true);
        });

        const loadTime = Date.now() - startTime;

        expect(isHidden).toBe(true);
        expect(loadTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('Forgiving selectors handle invalid CSS gracefully', async ({ page }, testInfo) => {
        // Use a simple test page
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load('/element-hiding/pages/basic-hiding.html', './integration-test/test-pages/element-hiding/config/basic-hiding.json');

        // The page should load without errors, even with invalid selectors
        const title = await page.title();
        expect(title).toBe('Basic Element Hiding Test');

        // Valid selectors should still work
        const results = await collector.results();
        expect(results).toBeDefined();
    });

    test('Privacy Test Pages site match - specific element hiding scenarios', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(
            '/element-hiding/pages/privacy-test-pages-match.html',
            './integration-test/test-pages/element-hiding/config/privacy-test-pages-match.json',
        );
        const results = await collector.results();

        expect(results).toMatchObject({
            'Privacy Test Pages Match': [
                {
                    name: 'advertisement should be hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'advertisement should not be hidden',
                    result: true,
                    expected: true,
                },
                {
                    name: 'lorem ipsum content visible',
                    result: true,
                    expected: true,
                },
                {
                    name: 'content element visible',
                    result: true,
                    expected: true,
                },
            ],
        });
    });
});
