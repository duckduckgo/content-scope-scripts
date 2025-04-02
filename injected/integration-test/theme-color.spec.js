import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/theme-color/index.html';
const CONFIG = './integration-test/test-pages/theme-color/config/theme-color-enabled.json';

test('theme-color feature absent', async ({ page }, testInfo) => {
    const CONFIG = './integration-test/test-pages/theme-color/config/theme-color-absent.json';
    const themeColor = ResultsCollector.create(page, testInfo.project.use);
    await themeColor.load(HTML, CONFIG);

    const messages = await themeColor.waitForMessage('themeColorFound', 1);

    expect(messages[0].payload.params).toStrictEqual({
        themeColor: '#ff0000',
        documentUrl: 'http://localhost:3220/theme-color/index.html',
    });
});

test('theme-color (no theme color)', async ({ page }, testInfo) => {
    const HTML = '/theme-color/no-theme-color.html';
    const themeColor = ResultsCollector.create(page, testInfo.project.use);
    await themeColor.load(HTML, CONFIG);

    const messages = await themeColor.waitForMessage('themeColorFound', 1);

    expect(messages[0].payload.params).toStrictEqual({
        themeColor: null,
        documentUrl: 'http://localhost:3220/theme-color/no-theme-color.html',
    });
});

test('theme-color (viewport media query)', async ({ page }, testInfo) => {
    // Use a desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    const HTML = '/theme-color/media-queries.html';
    const themeColor = ResultsCollector.create(page, testInfo.project.use);
    await themeColor.load(HTML, CONFIG);

    const messages = await themeColor.waitForMessage('themeColorFound', 1);

    expect(messages[0].payload.params).toStrictEqual({
        themeColor: '#00ff00',
        documentUrl: 'http://localhost:3220/theme-color/media-queries.html',
    });
});

test('theme-color (color scheme media query)', async ({ page }, testInfo) => {
    // Use a dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });

    const HTML = '/theme-color/media-queries.html';
    const themeColor = ResultsCollector.create(page, testInfo.project.use);
    await themeColor.load(HTML, CONFIG);

    const messages = await themeColor.waitForMessage('themeColorFound', 1);

    expect(messages[0].payload.params).toStrictEqual({
        themeColor: '#0000ff',
        documentUrl: 'http://localhost:3220/theme-color/media-queries.html',
    });
});

test('theme-color feature disabled completely', async ({ page }, testInfo) => {
    const CONFIG = './integration-test/test-pages/theme-color/config/theme-color-disabled.json';
    const themeColor = ResultsCollector.create(page, testInfo.project.use);
    await themeColor.load(HTML, CONFIG);

    // this is here purely to guard against a false positive in this test.
    // without this manual `wait`, it might be possible for the following assertion to
    // pass, but just because it was too quick (eg: the first message wasn't sent yet)
    await page.waitForTimeout(100);

    const messages = await themeColor.outgoingMessages();
    expect(messages).toHaveLength(0);
});
