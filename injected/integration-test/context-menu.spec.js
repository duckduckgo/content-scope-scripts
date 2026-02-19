import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/context-menu/index.html';
const CONFIG = './integration-test/test-pages/context-menu/config/context-menu-enabled.json';

test('contextMenu sends metadata when right-clicking a plain text element', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#plain-text').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.linkUrl).toBeNull();
    expect(params.imageSrc).toBeNull();
    expect(params.elementTag).toBe('p');
});

test('contextMenu sends href when right-clicking a link', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#link').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.linkUrl).toBe('https://example.com/page');
    expect(params.elementTag).toBe('a');
});

test('contextMenu sends href when right-clicking a nested element inside a link', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#link-inner').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.linkUrl).toBe('https://example.com/titled');
    expect(params.title).toBe('Link tooltip');
    expect(params.elementTag).toBe('span');
});

test('contextMenu sends image metadata with absolute src when right-clicking an image', async ({ page, baseURL }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#image').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    const expectedSrc = new URL('/context-menu/test-image.png', baseURL).href;
    expect(params.imageSrc).toBe(expectedSrc);
    expect(params.imageAlt).toBe('Test image description');
    expect(params.linkUrl).toBeNull();
    expect(params.elementTag).toBe('img');
});

test('contextMenu sends both link and image metadata for a linked image', async ({ page, baseURL }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#linked-image').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    const expectedSrc = new URL('/context-menu/linked-photo.jpg', baseURL).href;
    expect(params.linkUrl).toBe('https://example.com/gallery');
    expect(params.imageSrc).toBe(expectedSrc);
    expect(params.imageAlt).toBe('Linked photo');
    expect(params.elementTag).toBe('img');
});

test('contextMenu sends title from ancestor element', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#titled-child').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.title).toBe('Div tooltip');
    expect(params.elementTag).toBe('span');
});

test('contextMenu includes selected text when text is selected', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    // Select text in the #selectable paragraph
    await page.evaluate(() => {
        const el = document.getElementById('selectable');
        if (!el) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        sel.addRange(range);
    });

    await page.locator('#selectable').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.selectedText).toBe('Select this text for testing');
});

test('contextMenu sends video src when right-clicking a video element', async ({ page, baseURL }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#video').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    const expectedSrc = new URL('/context-menu/clip.mp4', baseURL).href;
    expect(params.imageSrc).toBe(expectedSrc);
    expect(params.elementTag).toBe('video');
    expect(params.linkUrl).toBeNull();
});

// Iframe test (section 9) is manual-only: the Playwright harness does not
// inject C-S-S into srcdoc iframes the way WebKit's WKUserContentController
// does in production. Verify iframe behavior via the test page in a real browser.

test('contextMenu sends no messages when feature is disabled', async ({ page }, testInfo) => {
    const DISABLED_CONFIG = './integration-test/test-pages/context-menu/config/context-menu-disabled.json';
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, DISABLED_CONFIG);

    await page.locator('#link').click({ button: 'right' });

    // Allow time for any message to be sent
    await page.waitForTimeout(200);

    const messages = await collector.outgoingMessages();
    const contextMenuMessages = messages.filter((m) => m.payload.featureName === 'contextMenu');
    expect(contextMenuMessages).toHaveLength(0);
});
