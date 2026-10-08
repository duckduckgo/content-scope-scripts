import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const PAGES = '/page-context/pages/root-selection';
const CONFIG = './integration-test/test-pages/page-context/config/page-context.json';

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} html
 */
async function collect(page, testInfo, html) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(html, CONFIG);
    const [message] = await collector.waitForMessage('collectionResult', 1);
    const params = /** @type {{ serializedPageData: string }} */ (message.payload.params);
    return JSON.parse(params.serializedPageData);
}

test.describe('page-context root selection', () => {
    test('keeps main on a normal article page', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/clean-article.html`);
        expect(result.content).toContain('Scientists map the deep ocean floor');
        expect(result.content).not.toContain('Politics');
        expect(result.content).not.toContain('Privacy policy');
    });

    test('keeps the first match even when a later match has more text', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/related-feed.html`);
        expect(result.content).toContain('Town replaces its last coal boiler');
        expect(result.content).toContain('first full year of running costs');
        expect(result.content).not.toContain('Harbour reopens after storm repairs');
    });

    test('treats a display: contents main as rendered', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/display-contents.html`);
        expect(result.content).toContain('Element: checkVisibility() method');
        expect(result.content).not.toContain('Guides');
    });

    test('picks the story over an earlier teaser article', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/teaser-article.html`);
        expect(result.content).toContain('Court hears music advertising case');
        expect(result.content).toContain('A ruling is expected before the end of the year.');
        expect(result.content).not.toContain('Council approves new bike lanes');
    });

    test('skips a first match inside a hidden menu', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/hidden-drawer.html`);
        expect(result.content).toContain('River clean-up removes ten tonnes of rubbish');
        expect(result.content).not.toContain('Weather');
    });

    test('skips a content widget and a hidden drawer before main', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/hidden-content.html`);
        expect(result.content).toContain('Ombudsman joins music advertising case');
        expect(result.content).toContain('expected to rule before the end of the year');
        expect(result.content).not.toContain('Adjust appearance');
        expect(result.content).not.toContain('Annual reports');
    });

    test('uses the body for a list of small cards', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/card-list.html`);
        expect(result.content).toContain('Website design services');
        expect(result.content).toContain('Custom WordPress website');
        expect(result.content).toContain('Speed optimisation audit');
    });

    test('uses the body when main holds only part of the content', async ({ page }, testInfo) => {
        const result = await collect(page, testInfo, `${PAGES}/partial-main.html`);
        expect(result.content).toContain('City opens new public library');
        expect(result.content).toContain('two more branches in the northern districts');
    });
});
