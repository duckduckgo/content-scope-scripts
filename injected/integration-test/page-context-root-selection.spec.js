import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const PAGES = '/page-context/pages/root-selection';
const LARGEST_VISIBLE_CONFIG = './integration-test/test-pages/page-context/config/root-selection.json';
const DEFAULT_CONFIG = './integration-test/test-pages/page-context/config/page-context.json';

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} html
 * @param {string} config
 */
async function collect(page, testInfo, html, config) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(html, config);
    const [message] = await collector.waitForMessage('collectionResult', 1);
    const params = /** @type {{ serializedPageData: string }} */ (message.payload.params);
    return JSON.parse(params.serializedPageData);
}

test.describe('page-context root selection: largestVisible', () => {
    test('picks the story over an earlier teaser article', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/teaser-article.html`, LARGEST_VISIBLE_CONFIG);
        expect(result.content).toContain('Court hears music advertising case');
        expect(result.content).toContain('A ruling is expected before the end of the year.');
        expect(result.content).not.toContain('Council approves new bike lanes');
        expect(result.usedBodyFallback).toBe(false);
    });

    test('skips a content widget and a hidden drawer before main', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/hidden-content.html`, LARGEST_VISIBLE_CONFIG);
        expect(result.content).toContain('Ombudsman joins music advertising case');
        expect(result.content).toContain('expected to rule before the end of the year');
        expect(result.content).not.toContain('Adjust appearance');
        expect(result.content).not.toContain('Annual reports');
        expect(result.usedBodyFallback).toBe(false);
    });

    test('uses the body for a list of small cards', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/card-list.html`, LARGEST_VISIBLE_CONFIG);
        expect(result.content).toContain('Website design services');
        expect(result.content).toContain('Custom WordPress website');
        expect(result.content).toContain('Speed optimisation audit');
        expect(result.usedBodyFallback).toBe(true);
    });

    test('uses the body when main holds only part of the content', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/partial-main.html`, LARGEST_VISIBLE_CONFIG);
        expect(result.content).toContain('City opens new public library');
        expect(result.content).toContain('two more branches in the northern districts');
        expect(result.usedBodyFallback).toBe(true);
    });

    test('treats a display: contents main as rendered', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/display-contents.html`, LARGEST_VISIBLE_CONFIG);
        expect(result.content).toContain('Element: checkVisibility() method');
        expect(result.content).not.toContain('Guides');
        expect(result.usedBodyFallback).toBe(false);
    });

    test('keeps main on a normal article page', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/clean-article.html`, LARGEST_VISIBLE_CONFIG);
        expect(result.content).toContain('Scientists map the deep ocean floor');
        expect(result.content).not.toContain('Politics');
        expect(result.content).not.toContain('Privacy policy');
        expect(result).toMatchObject({
            rootSelection: 'largestVisible',
            usedBodyFallback: false,
            truncated: false,
        });
        expect(result.bodyTextLength).toBeGreaterThan(0);
    });
});

test.describe('page-context root selection: default', () => {
    test('keeps the first match when rootSelection is not set', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/teaser-article.html`, DEFAULT_CONFIG);
        expect(result.content).toContain('Council approves new bike lanes');
        expect(result.content).not.toContain('Court hears music advertising case');
        expect(result).toMatchObject({ rootSelection: 'firstMatch', usedBodyFallback: false, truncated: false });
        expect(result.bodyTextLength).toBeGreaterThan(0);
    });
});
