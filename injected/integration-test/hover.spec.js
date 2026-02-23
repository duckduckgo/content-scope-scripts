import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/hover/index.html';
const CONFIG = './integration-test/test-pages/hover/config/hover-enabled.json';

/**
 * Filter outgoing messages to only include hover feature messages.
 * @param {ResultsCollector} collector
 */
async function hoverMessages(collector) {
    return (await collector.outgoingMessages()).filter((m) => m.payload.featureName === 'hover');
}

test('hover sends hoverChanged when hovering a link', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.hover('#link1');

    const messages = await hoverMessages(collector);
    const hoverMsgs = messages.filter((m) => /** @type {{method: string}} */ (m.payload).method === 'hoverChanged');
    expect(hoverMsgs.length).toBeGreaterThanOrEqual(1);

    const last = hoverMsgs[hoverMsgs.length - 1];
    expect(/** @type {{params: any}} */ (last.payload).params).toStrictEqual({
        href: 'https://example.com/page1',
    });
});

test('hover sends null href when moving off a link', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.hover('#link1');
    await page.hover('#nolink');

    const messages = await hoverMessages(collector);
    const hoverMsgs = messages.filter((m) => /** @type {{method: string}} */ (m.payload).method === 'hoverChanged');
    expect(hoverMsgs.length).toBeGreaterThanOrEqual(2);

    const last = hoverMsgs[hoverMsgs.length - 1];
    expect(/** @type {{params: any}} */ (last.payload).params).toStrictEqual({
        href: null,
    });
});

test('hover sends different hrefs for different links', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.hover('#link1');
    await page.hover('#link2');

    const messages = await hoverMessages(collector);
    const hoverMsgs = messages.filter((m) => /** @type {{method: string}} */ (m.payload).method === 'hoverChanged');

    const hrefs = hoverMsgs.map((m) => /** @type {{params: any}} */ (m.payload).params.href);
    expect(hrefs).toContain('https://example.com/page1');
    expect(hrefs).toContain('https://example.com/page2');
});

test('hover does not send when feature is disabled', async ({ page }, testInfo) => {
    const DISABLED_CONFIG = './integration-test/test-pages/hover/config/hover-disabled.json';
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, DISABLED_CONFIG);

    await page.hover('#link1');
    await page.waitForTimeout(200);

    const messages = await hoverMessages(collector);
    expect(messages).toHaveLength(0);
});
