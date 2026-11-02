import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { ResultsCollector } from './page-objects/results-collector.js';

const PAGES = './integration-test/test-pages/sponsor-block';
const CONFIG = `${PAGES}/config/sponsor-block-enabled.json`;
const CONFIG_SELECTOR_MISS = `${PAGES}/config/sponsor-block-selector-miss.json`;
const WATCH_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const EMBED_URL = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

const OVERLAY = '.ddg-sponsorblock-overlay';
const MARKER = `${OVERLAY} > div`;
const SKIP_BUTTON = '.ddg-sponsorblock-skip';

const CONFIG_MANUAL = { enabled: true, skipMode: 'manual', version: 1 };
const CONFIG_AUTO = { enabled: true, skipMode: 'auto', version: 1 };
/** The clip is 12s long. The second segment was submitted against a 40s cut, so it must be ignored. */
const SEGMENTS = {
    segments: [
        { start: 2, end: 5, category: 'sponsor', actionType: 'skip', uuid: 'a', videoDuration: 12 },
        { start: 8, end: 10, category: 'sponsor', actionType: 'skip', uuid: 'stale', videoDuration: 40 },
    ],
};

/**
 * Serves the clip with byte-range support. Without it Chromium treats the media as unseekable and ignores
 * `currentTime` writes, which the tests rely on.
 * @param {import('@playwright/test').Route} route
 */
function fulfillVideo(route) {
    const file = readFileSync(`${PAGES}/video.webm`);
    const range = route
        .request()
        .headers()
        .range?.match(/bytes=(\d+)-(\d*)/);
    if (!range) {
        return route.fulfill({ body: file, contentType: 'video/webm', headers: { 'Accept-Ranges': 'bytes' } });
    }
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : file.length - 1;
    return route.fulfill({
        status: 206,
        body: file.subarray(start, end + 1),
        contentType: 'video/webm',
        headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${file.length}` },
    });
}

/**
 * The feature only acts on YouTube hosts, so the fake player page and its clip are served from youtube.com and
 * youtube-nocookie.com URLs. Everything else under those hosts gets the player page too.
 * @param {import('@playwright/test').Page} page
 */
async function routeYouTube(page) {
    await page.route(/^https:\/\/www\.youtube(-nocookie)?\.com\//, (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname.endsWith('/video.webm')) return fulfillVideo(route);
        return route.fulfill({ body: readFileSync(`${PAGES}/index.html`, 'utf8'), contentType: 'text/html' });
    });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {{ config?: string, responses?: Record<string, any>, url?: string, framedBy?: string }} [options]
 *   `framedBy` loads that URL as a page that embeds the player in an iframe instead of the player itself.
 */
async function loadPlayer(page, testInfo, { config = CONFIG, responses = {}, url = WATCH_URL, framedBy } = {}) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withMockResponse({ getConfig: CONFIG_MANUAL, getSegments: SEGMENTS, ...responses });
    await routeYouTube(page);
    if (framedBy) {
        // Registered after routeYouTube: Playwright tries the most recently registered route first.
        await page.route(framedBy, (route) =>
            route.fulfill({ body: `<iframe src="${url}" width="320" height="180"></iframe>`, contentType: 'text/html' }),
        );
    }
    await collector.setup({ config });
    await page.goto(framedBy ?? url);
    return collector;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} seconds
 */
async function seekTo(page, seconds) {
    await page.evaluate((t) => {
        const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
        video.currentTime = t;
    }, seconds);
}

/** @param {import('@playwright/test').Page} page */
function currentTime(page) {
    return page.evaluate(() => /** @type {HTMLVideoElement} */ (document.querySelector('video')).currentTime);
}

/**
 * @param {ResultsCollector} collector
 * @param {string} method
 */
async function requestsFor(collector, method) {
    const messages = await collector.outgoingMessages();
    return messages.filter((m) => m.payload.featureName === 'sponsorBlock' && /** @type {any} */ (m.payload).method === method);
}

test.describe('SponsorBlock', () => {
    test('asks for config before segments and draws only segments matching the video duration', async ({ page }, testInfo) => {
        const collector = await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);
        // 2s of 12s from the left, 7s of 12s from the right.
        await expect(page.locator(MARKER)).toHaveCSS('left', /^53\.3/);
        await expect(page.locator(MARKER)).toHaveCSS('right', /^186\.6/);

        const methods = (await collector.outgoingMessages())
            .filter((m) => m.payload.featureName === 'sponsorBlock')
            .map((m) => /** @type {any} */ (m.payload).method);
        expect(methods).toEqual(['getConfig', 'getSegments']);
        expect(/** @type {any} */ ((await requestsFor(collector, 'getSegments'))[0].payload).params).toEqual({ videoID: 'dQw4w9WgXcQ' });
    });

    test('manual mode: shows the skip button inside a segment and seeks to its end on click', async ({ page }, testInfo) => {
        await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);

        await seekTo(page, 3);
        await expect(page.locator(`#movie_player > ${SKIP_BUTTON}`)).toBeVisible();

        await page.locator(SKIP_BUTTON).click();
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(await currentTime(page)).toBeCloseTo(5, 1);
    });

    test('auto mode: seeks past the segment without showing a button', async ({ page }, testInfo) => {
        await loadPlayer(page, testInfo, { responses: { getConfig: CONFIG_AUTO } });
        await expect(page.locator(MARKER)).toHaveCount(1);

        await seekTo(page, 3);
        await expect.poll(() => currentTime(page)).toBeCloseTo(5, 1);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
    });

    test('onConfigChanged switches mode for the segment in progress and disables the feature', async ({ page }, testInfo) => {
        const collector = await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        await collector.simulateSubscriptionMessage('sponsorBlock', 'onConfigChanged', { enabled: true, skipMode: 'auto' });
        await expect.poll(() => currentTime(page)).toBeCloseTo(5, 1);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(await requestsFor(collector, 'getSegments')).toHaveLength(1);

        await collector.simulateSubscriptionMessage('sponsorBlock', 'onConfigChanged', { enabled: false, skipMode: 'auto' });
        await expect(page.locator(OVERLAY)).toHaveCount(0);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(await currentTime(page)).toBeCloseTo(3, 1);

        await collector.simulateSubscriptionMessage('sponsorBlock', 'onConfigChanged', { enabled: true, skipMode: 'manual' });
        await expect(page.locator(MARKER)).toHaveCount(1);
        expect(await requestsFor(collector, 'getSegments')).toHaveLength(2);
    });

    test('does nothing when getConfig says disabled', async ({ page }, testInfo) => {
        const collector = await loadPlayer(page, testInfo, { responses: { getConfig: { ...CONFIG_MANUAL, enabled: false } } });
        await expect(page.locator('video')).toHaveJSProperty('readyState', 4);
        await seekTo(page, 3);
        await expect(page.locator(OVERLAY)).toHaveCount(0);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(await requestsFor(collector, 'getSegments')).toHaveLength(0);
    });

    test('nothing happens while an ad is showing', async ({ page }, testInfo) => {
        await loadPlayer(page, testInfo, { responses: { getConfig: CONFIG_AUTO } });
        await expect(page.locator(MARKER)).toHaveCount(1);

        await page.evaluate(() => document.querySelector('#movie_player')?.classList.add('ad-showing'));
        await seekTo(page, 3);
        await expect(page.locator(OVERLAY)).toHaveCount(0);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(await currentTime(page)).toBeCloseTo(3, 1);

        await page.evaluate(() => document.querySelector('#movie_player')?.classList.remove('ad-showing'));
        await seekTo(page, 3.5);
        await expect.poll(() => currentTime(page)).toBeCloseTo(5, 1);
        await expect(page.locator(MARKER)).toHaveCount(1);
    });

    test('clears the UI when the page navigates away from the video', async ({ page }, testInfo) => {
        await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        await page.evaluate(() => history.pushState({}, '', '/results?search_query=ducks'));
        await expect(page.locator(OVERLAY)).toHaveCount(0);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
    });

    test('selector miss: no UI and no errors', async ({ page }, testInfo) => {
        /** @type {Error[]} */
        const errors = [];
        page.on('pageerror', (e) => errors.push(e));
        const collector = await loadPlayer(page, testInfo, { config: CONFIG_SELECTOR_MISS });
        await expect.poll(() => requestsFor(collector, 'getSegments')).toHaveLength(1);
        await expect(page.locator('video')).toHaveJSProperty('readyState', 4);
        await seekTo(page, 3);
        await expect(page.locator(OVERLAY)).toHaveCount(0);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(errors).toEqual([]);
    });

    test.describe('frame rules', () => {
        test('activates in a top-frame nocookie embed (iOS Duck Player) and mounts the button above the controls layer', async ({
            page,
        }, testInfo) => {
            const collector = await loadPlayer(page, testInfo, { url: EMBED_URL });
            await expect(page.locator(MARKER)).toHaveCount(1);
            expect(await requestsFor(collector, 'getConfig')).toHaveLength(1);

            await seekTo(page, 3);
            await expect(page.locator(`#player-controls > ${SKIP_BUTTON}`)).toBeVisible();
            // Fails with "intercepts pointer events" if the layer sits over the button.
            await page.locator(SKIP_BUTTON).click();
            expect(await currentTime(page)).toBeCloseTo(5, 1);
        });

        test('activates in a nocookie embed framed by a nocookie page (macOS Duck Player)', async ({ page }, testInfo) => {
            await loadPlayer(page, testInfo, { url: EMBED_URL, framedBy: 'https://www.youtube-nocookie.com/player' });
            await expect(page.frameLocator('iframe').locator(MARKER)).toHaveCount(1);
        });

        test('stays inactive in an embed on a third-party site', async ({ page }, testInfo) => {
            await loadPlayer(page, testInfo, { url: EMBED_URL, framedBy: 'https://example.com/' });
            const frame = page.frameLocator('iframe');
            await expect(frame.locator('video')).toHaveJSProperty('readyState', 4);
            await expect(frame.locator(OVERLAY)).toHaveCount(0);
            const outgoing = await page.frames()[1].evaluate(() => /** @type {any} */ (window).__playwright_01?.mocks.outgoing ?? []);
            expect(outgoing.filter((/** @type {any} */ m) => m.payload.featureName === 'sponsorBlock')).toEqual([]);
        });
    });
});
