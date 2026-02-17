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

test('contextMenu sends image metadata when right-clicking an image', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#image').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.imageSrc).toContain('test-image.png');
    expect(params.imageAlt).toBe('Test image description');
    expect(params.linkUrl).toBeNull();
    expect(params.elementTag).toBe('img');
});

test('contextMenu sends both link and image metadata for a linked image', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.locator('#linked-image').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.linkUrl).toBe('https://example.com/gallery');
    expect(params.imageSrc).toContain('linked-photo.jpg');
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
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    });

    await page.locator('#selectable').click({ button: 'right' });

    const messages = await collector.waitForMessage('contextMenuEvent', 1);
    const params = messages[0].payload.params;

    expect(params.selectedText).toBe('Select this text for testing');
});

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
