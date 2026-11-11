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
        // YouTube enforces Trusted Types, so assigning a plain string to innerHTML throws there.
        return route.fulfill({
            body: readFileSync(`${PAGES}/index.html`, 'utf8'),
            contentType: 'text/html',
            headers: { 'Content-Security-Policy': "require-trusted-types-for 'script'" },
        });
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
    // Android messaging needs its interface names; the other platforms ignore them.
    collector.withUserPreferences({
        messageSecret: 'duckduckgo-android-messaging-secret',
        javascriptInterface: 'contentScopeScripts',
        messageCallback: 'messageCallback',
    });
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

/**
 * Plays the video and resolves once it is actually playing.
 * @param {import('@playwright/test').Page} page
 * @param {number} [playbackRate]
 */
async function play(page, playbackRate = 1) {
    await page.evaluate(async (rate) => {
        const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
        video.playbackRate = rate;
        const playing = new Promise((resolve) => video.addEventListener('playing', resolve, { once: true }));
        await video.play();
        await playing;
    }, playbackRate);
}

/** @param {import('@playwright/test').Page} page */
async function pause(page) {
    await page.evaluate(() => /** @type {HTMLVideoElement} */ (document.querySelector('video')).pause());
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

    test('manual mode: hides the skip button after 8 seconds of playback until playback leaves the segment', async ({ page }, testInfo) => {
        await page.clock.install();
        await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);

        // While paused, the button stays up however long it waits.
        await seekTo(page, 2);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
        await page.clock.runFor(10000);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        // Playback counts. The countdown runs on the page's fake clock, the video on the real one, slowed down so it stays
        // inside the segment for the whole test.
        await play(page, 0.1);
        await page.clock.runFor(4000);
        // A pause stops the countdown, and playing again resumes it where it was.
        await pause(page);
        await page.clock.runFor(10000);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
        await play(page, 0.1);
        await page.clock.runFor(3000);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
        await page.clock.runFor(1000);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        await pause(page);

        // A seek within the same segment keeps it hidden.
        await page.evaluate(() => {
            const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
            const seeked = new Promise((resolve) => video.addEventListener('seeked', resolve, { once: true }));
            video.currentTime = 4;
            return seeked;
        });
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);

        // Leaving the segment and coming back shows it again.
        await seekTo(page, 6);
        await expect.poll(() => currentTime(page)).toBeCloseTo(6, 1);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        // So does leaving it through the button.
        await page.locator(SKIP_BUTTON).click();
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        // And playing past its end.
        await play(page, 0.1);
        await page.clock.runFor(8000);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        await page.evaluate(() => {
            /** @type {HTMLVideoElement} */ (document.querySelector('video')).playbackRate = 1;
        });
        await expect.poll(() => currentTime(page)).toBeGreaterThan(5.3);
        await pause(page);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
    });

    test('auto mode: skips a segment that playback enters naturally, without showing a button', async ({ page }, testInfo) => {
        await loadPlayer(page, testInfo, { responses: { getConfig: CONFIG_AUTO } });
        await expect(page.locator(MARKER)).toHaveCount(1);

        await seekTo(page, 1.5);
        await page.evaluate(() => /** @type {HTMLVideoElement} */ (document.querySelector('video')).play());
        // Playing through the segment would take 3.5s; reaching its end sooner proves the skip.
        await expect.poll(() => currentTime(page), { timeout: 2500 }).toBeGreaterThanOrEqual(5);
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
    });

    test('auto mode: a seek into a segment shows the button instead of skipping', async ({ page }, testInfo) => {
        await loadPlayer(page, testInfo, { responses: { getConfig: CONFIG_AUTO } });
        await expect(page.locator(MARKER)).toHaveCount(1);

        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
        expect(await currentTime(page)).toBeCloseTo(3, 1);

        await page.locator(SKIP_BUTTON).click();
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
        expect(await currentTime(page)).toBeCloseTo(5, 1);
    });

    test('a segment ending past the video end leaves no button once the skip reaches the end', async ({ page }, testInfo) => {
        // The seek to 13s is clamped to the 12s clip end, which is still before the segment end.
        const segments = [{ start: 10, end: 13, category: 'sponsor', actionType: 'skip', uuid: 'outro', videoDuration: 12 }];
        await loadPlayer(page, testInfo, { responses: { getSegments: { segments } } });
        await expect(page.locator(MARKER)).toHaveCount(1);

        await seekTo(page, 11);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        const seekedToEnd = page.evaluate(() => {
            const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
            return new Promise((resolve) => video.addEventListener('seeked', () => video.currentTime > 11.5 && resolve(true)));
        });
        await page.locator(SKIP_BUTTON).click();
        await seekedToEnd;
        await expect(page.locator(SKIP_BUTTON)).toHaveCount(0);
    });

    test('onConfigChanged switches mode without refetching and disables the feature', async ({ page }, testInfo) => {
        const collector = await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);
        await seekTo(page, 3);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();

        // The user seeked into this segment, so switching to auto keeps the button rather than jumping.
        await collector.simulateSubscriptionMessage('sponsorBlock', 'onConfigChanged', { enabled: true, skipMode: 'auto' });
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
        expect(await currentTime(page)).toBeCloseTo(3, 1);
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
        await expect(page.locator(MARKER)).toHaveCount(1);
        await expect(page.locator(SKIP_BUTTON)).toBeVisible();
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

    test('discards a segments response that arrives after the user left the video', async ({ page }, testInfo) => {
        const collector = await loadPlayer(page, testInfo);
        await expect(page.locator(MARKER)).toHaveCount(1);

        // The mock answers one timer tick after the request, so leaving the video synchronously after requesting it
        // makes that answer stale. A synthetic loadstart makes the feature re-read the URL right away.
        const markers = await page.evaluate(async () => {
            const video = /** @type {HTMLVideoElement} */ (document.querySelector('video'));
            const navigate = (/** @type {string} */ path) => {
                history.pushState({}, '', path);
                video.dispatchEvent(new Event('loadstart'));
            };
            navigate('/watch?v=AAAAAAAAAAA');
            navigate('/results?search_query=ducks');
            await new Promise((resolve) => setTimeout(resolve, 0));
            return document.querySelectorAll('.ddg-sponsorblock-overlay > div').length;
        });
        expect(markers).toBe(0);
        expect((await requestsFor(collector, 'getSegments')).map((m) => /** @type {any} */ (m.payload).params.videoID)).toEqual([
            'dQw4w9WgXcQ',
            'AAAAAAAAAAA',
        ]);
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
            // Anchored above the layer's bottom row: 180px layer, row top at 100px, plus a 12px gap.
            await expect(page.locator(SKIP_BUTTON)).toHaveCSS('bottom', '92px');
            // Fails with "intercepts pointer events" if the layer sits over the button.
            await page.locator(SKIP_BUTTON).click();
            expect(await currentTime(page)).toBeCloseTo(5, 1);
        });

        test('activates in a nocookie embed framed by a nocookie page (macOS Duck Player)', async ({ page }, testInfo) => {
            await loadPlayer(page, testInfo, { url: EMBED_URL, framedBy: 'https://www.youtube-nocookie.com/player' });
            await expect(page.frameLocator('iframe').locator(MARKER)).toHaveCount(1);
        });

        test('Android: drives the Duck Player embed from the page', async ({ page }, testInfo) => {
            test.skip(testInfo.project.name !== 'android', 'Android-only: the other platforms run in the embed itself');
            const collector = await loadPlayer(page, testInfo, { url: EMBED_URL, framedBy: 'https://www.youtube-nocookie.com/player' });
            const frame = page.frameLocator('iframe');
            await expect(frame.locator(MARKER)).toHaveCount(1);
            // Android injects only into the top frame, so the embed must not run an instance of its own.
            expect(await requestsFor(collector, 'getConfig')).toHaveLength(1);
            const embedOutgoing = await page.frames()[1].evaluate(() => /** @type {any} */ (window).__playwright_01?.mocks.outgoing ?? []);
            expect(embedOutgoing.filter((/** @type {any} */ m) => m.payload.featureName === 'sponsorBlock')).toEqual([]);

            await page.frames()[1].evaluate(() => {
                /** @type {HTMLVideoElement} */ (document.querySelector('video')).currentTime = 3;
            });
            await expect(frame.locator(`#player-controls > ${SKIP_BUTTON}`)).toBeVisible();
            // On the controls row, just above the progress bar: 180px layer, row bottom at 140px, plus a 4px gap.
            await expect(frame.locator(SKIP_BUTTON)).toHaveCSS('bottom', '44px');
            await frame.locator(SKIP_BUTTON).click();
            const time = await page
                .frames()[1]
                .evaluate(() => /** @type {HTMLVideoElement} */ (document.querySelector('video')).currentTime);
            expect(time).toBeCloseTo(5, 1);
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
