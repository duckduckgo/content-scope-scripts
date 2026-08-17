import { readFileSync } from 'fs';
import { expect } from '@playwright/test';
import { perPlatform } from '../type-helpers.mjs';
import { ResultsCollector } from './results-collector.js';

// Every possible combination of UserValues
const userValues = {
    /** @type {import("../../src/features/duck-player.js").UserValues} */
    'always ask': {
        privatePlayerMode: { alwaysAsk: {} },
        overlayInteracted: false,
    },
    /** @type {import("../../src/features/duck-player.js").UserValues} */
    'always ask remembered': {
        privatePlayerMode: { alwaysAsk: {} },
        overlayInteracted: true,
    },
    /** @type {import("../../src/features/duck-player.js").UserValues} */
    enabled: {
        privatePlayerMode: { enabled: {} },
        overlayInteracted: false,
    },
    /** @type {import("../../src/features/duck-player.js").UserValues} */
    disabled: {
        privatePlayerMode: { disabled: {} },
        overlayInteracted: false,
    },
};

// Possible UI Settings
const uiSettings = {
    'play in duck player': {
        playInDuckPlayer: true,
    },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configFiles = /** @type {const} */ ([
    'overlays.json',
    'overlays-live.json',
    'overlays-drawer.json',
    'overlays-fullscreen-guard.json',
    'overlays-buffering-fullscreen.json',
    'disabled.json',
    'thumbnail-overlays-disabled.json',
    'click-interceptions-disabled.json',
    'video-overlays-disabled.json',
    'video-alt-selectors.json',
]);

/** @typedef {(typeof configFiles)[number]} ConfigFile */

// fulfilled from here, not the test server: the hold takes https only and the pages are http
const TINY_IMAGE = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
const STUB_POSTER_URL = 'https://duckduckgo.example/poster.svg';

/**
 * @param {import("@playwright/test").Route} route
 * @param {number} status
 */
function fulfillPoster(route, status) {
    return route.fulfill({
        status,
        contentType: 'image/svg+xml',
        body: TINY_IMAGE,
        // The HEAD check is a fetch, so a cross-origin answer needs the header i.ytimg.com sends
        headers: { 'access-control-allow-origin': '*' },
    });
}

export class DuckplayerOverlays {
    overlaysPage = '/duckplayer/pages/overlays.html';
    playerPage = '/duckplayer/pages/player.html';
    videoAltSelectors = '/duckplayer/pages/video-alt-selectors.html';
    serpProxyPage = '/duckplayer/pages/serp-proxy.html';
    mobile = new DuckplayerOverlaysMobile(this);
    pixels = new DuckplayerOverlayPixels(this);
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../type-helpers.mjs").Build} build
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     */
    constructor(page, build, platform) {
        this.page = page;
        this.build = build;
        this.platform = platform;
        this.collector = new ResultsCollector(page, build, platform);
        this.collector.withMockResponse({
            initialSetup: {
                userValues: {
                    privatePlayerMode: { alwaysAsk: {} },
                    overlayInteracted: false,
                },
                ui: {},
            },
            getUserValues: {
                privatePlayerMode: { alwaysAsk: {} },
                overlayInteracted: false,
            },
            setUserValues: {
                privatePlayerMode: { alwaysAsk: {} },
                overlayInteracted: false,
            },
            sendDuckPlayerPixel: {},
        });
        this.collector.withUserPreferences({
            messageSecret: 'ABC',
            javascriptInterface: 'javascriptInterface',
            messageCallback: 'messageCallback',
        });
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text());
        });
    }

    async reducedMotion() {
        await this.page.emulateMedia({ reducedMotion: 'reduce' });
    }

    /**
     * @param {object} params
     * @param {'default' | 'cookie_banner'} [params.variant]
     * @return {Promise<void>}
     */
    async gotoThumbsPage(params = {}) {
        const { variant = 'default' } = params;
        const urlParams = new URLSearchParams({
            variant,
        });
        await this.page.goto(this.overlaysPage + '?' + urlParams.toString());
    }

    async dismissCookies() {
        // cookie banner
        await this.page.getByRole('button', { name: 'Reject the use of cookies and other data for the purposes described' }).click();
    }

    async gotoYoutubeHomepage() {
        await this.page.goto('https://www.youtube.com');
        // await this.dismissCookies()
    }

    async gotoYoutubeVideo() {
        await this.page.goto('https://www.youtube.com/watch?v=nfWlot6h_JM');
        // await this.dismissCookies()
    }

    async gotoYoutubeSearchPageForMovie() {
        await this.page.goto('https://www.youtube.com/results?search_query=snatch');
        // await this.dismissCookies()
    }

    /**
     * @return {Promise<string>}
     */
    async clicksFirstThumbnail() {
        const elem = this.page.locator('a[href^="/watch?v"]:has(img)').first();
        const link = await elem.getAttribute('href');
        if (!link) throw new Error('link must exist');
        await elem.click({ force: true });
        const url = new URL(link, 'https://youtube.com');
        const v = url.searchParams.get('v');
        if (!v) throw new Error('v param must exist');
        return v;
    }

    async clicksFirstShortsThumbnail() {
        await this.page.locator('[href*="/shorts"] img').first().click({ force: true });
    }

    async showsShortsPage() {
        await this.page.waitForURL(/^https:\/\/www\.youtube\.com\/shorts/, { timeout: 5000 });
    }

    /**
     */
    async showsVideoPageFor(videoID) {
        await this.page.waitForURL(
            (url) => {
                if (url.pathname === '/watch') {
                    if (url.searchParams.get('v') === videoID) return true;
                }
                return false;
            },
            { timeout: 1000 },
        );
    }

    /**
     * @param {string} requestUrl
     */
    opensShort(requestUrl) {
        const url = new URL(requestUrl);
        expect(url.pathname).toBe('/shorts/1');
    }

    /**
     * @param {object} [params]
     * @param {"default" | "incremental-dom"} [params.variant]
     * @param {string} [params.videoID]
     * @param {'playerPage' | 'videoAltSelectors'} [params.pageType]
     *  - we are replicating different strategies in the HTML to capture regressions/bugs
     */
    async gotoPlayerPage(params = {}) {
        const { variant = 'default', videoID = '123', pageType = 'playerPage' } = params;
        const urlParams = new URLSearchParams([
            ['v', videoID],
            ['variant', variant],
        ]);

        const page = this[pageType];

        await this.page.goto(page + '?' + urlParams.toString());
    }

    async gotoSerpProxyPage() {
        await this.page.goto(this.serpProxyPage);
    }

    async userValuesCallIsProxied() {
        const calls = await this.collector.outgoingMessages();
        const message = calls[0];
        const payload = message.payload;
        if (!('id' in payload)) throw new Error('missing id');

        const { id, ...rest } = payload;

        // just a sanity-check to ensure a none-empty string was used as the id
        expect(id.length).toBeGreaterThan(10);

        // assert on the payload, minus the ID
        expect(rest).toMatchObject({
            context: this.collector.messagingContextName,
            featureName: 'duckPlayer',
            params: {},
            method: 'getUserValues',
        });
    }

    /**
     * Answer the synthesised thumbnail URL so the overlay can paint without the real network.
     * Must run before navigation, since the overlay requests it as soon as it appends.
     */
    async stubsThumbnail() {
        await this.page.route('https://i.ytimg.com/**/maxresdefault.jpg', (route) => fulfillPoster(route, 200));
    }

    /**
     * The overlay paints the video's thumbnail behind its content, and records the outcome so
     * its scrim can lighten once a real image is there.
     */
    async overlayThumbnailIsPainted() {
        await expect(async () => {
            const backgroundImage = await this.page
                .locator('ddg-video-overlay .ddg-vpo-bg')
                .evaluate((el) => getComputedStyle(el).backgroundImage);
            expect(backgroundImage).toContain('url(');
        }).toPass({ timeout: 2000 });
        await expect(this.page.locator('ddg-video-overlay .ddg-video-player-overlay')).toHaveAttribute('data-thumb-loaded', 'true');
    }

    async overlayBlocksVideo() {
        await this.page.locator('ddg-video-overlay').waitFor({ state: 'visible', timeout: 1000 });
        await this.page.getByRole('link', { name: 'Turn On Duck Player' }).waitFor({ state: 'visible', timeout: 1000 });
        await this.page
            .getByText('What you watch in DuckDuckGo won’t influence your recommendations on YouTube.')
            .waitFor({ timeout: 100 });
    }

    /**
     * @param {object} [params]
     * @param {string} [params.videoID]
     */
    async hasWatchLinkFor(params = {}) {
        const { videoID = '123' } = params;

        // this is added because 'getAttribute' does not auto-wait
        await expect(async () => {
            const link = await this.page.getByRole('link', { name: 'Turn On Duck Player' }).getAttribute('href');
            expect(link).toEqual('duck://player/' + videoID);
        }).toPass({ timeout: 5000 });
    }

    /**
     * @param {object} [params]
     * @param {string} [params.videoID]
     */
    async clickRelatedThumb(params = {}) {
        const { videoID = '123' } = params;
        await this.page.locator(`a[href="/watch?v=${videoID}"]`).click({ force: true });
        await this.page.waitForURL((url) => url.searchParams.get('v') === videoID);
    }

    async smallOverlayShows() {
        await this.page.getByRole('link', { name: 'Duck Player', exact: true }).waitFor({ state: 'attached' });
    }

    /**
     * @param {object} [params]
     * @param {ConfigFile} [params.json="overlays"] - default is settings for localhost
     * @param {string} [params.locale] - optional locale
     */
    async withRemoteConfig(params = {}) {
        const { json = 'overlays.json', locale = 'en' } = params;

        await this.collector.setup({ config: loadConfig(json), locale });
    }

    async serpProxyEnabled() {
        const config = loadConfig('overlays.json');
        const domains = config.features.duckPlayer.settings.domains[0].patchSettings;
        config.features.duckPlayer.settings.domains[0].patchSettings = domains.filter((x) => x.path === '/overlays/serpProxy/state');
        await this.collector.setup({ config, locale: 'en' });
    }

    async videoOverlayDoesntShow() {
        expect(await this.page.locator('ddg-video-overlay').count()).toBe(0);
    }

    /**
     * @param {keyof userValues} setting
     */
    async userSettingIs(setting) {
        await this.collector.updateMockResponse({
            initialSetup: {
                userValues: userValues[setting],
                ui: {},
            },
        });
    }

    /**
     * @param {keyof userValues} userValueSetting
     * @param {keyof uiSettings} [uiSetting]
     * @return {Promise<void>}
     */
    async initialSetupIs(userValueSetting, uiSetting) {
        const initialSetupResponse = {
            userValues: userValues[userValueSetting],
            ui: {},
        };

        if (uiSetting && uiSettings[uiSetting]) {
            initialSetupResponse.ui = uiSettings[uiSetting];
        }

        await this.collector.updateMockResponse({
            initialSetup: initialSetupResponse,
        });
    }

    /**
     * @param {keyof userValues} setting
     */
    async userChangedSettingTo(setting) {
        await this.collector.simulateSubscriptionMessage('duckPlayer', 'onUserValuesChanged', userValues[setting]);
    }

    /**
     * @param {keyof uiSettings} setting
     */
    async uiChangedSettingTo(setting) {
        await this.collector.simulateSubscriptionMessage('duckPlayer', 'onUIValuesChanged', uiSettings[setting]);
    }

    async overlaysDisabled() {
        // load original config
        const config = loadConfig('overlays.json');
        // remove all domains from 'overlays', this disables the feature
        config.features.duckPlayer.settings.domains = [];
        await this.collector.setup({ config, locale: 'en' });
    }

    async hoverAThumbnail() {
        await this.page.locator('.thumbnail[href^="/watch"]').first().hover({ force: true });
    }

    async hoverNthThumbnail(index = 0) {
        await this.page.locator('.thumbnail[href^="/watch"]').nth(index).hover({ force: true });
    }

    async clickNthThumbnail(index = 0) {
        await this.page.locator('.thumbnail[href^="/watch"]').nth(index).click({ force: true });
    }

    /**
     * @param {string} regionSelector
     */
    async hoverAThumbnailInExcludedRegion(regionSelector) {
        await this.page.locator(`${regionSelector} a[href^="/watch"]`).first().hover();
    }

    async hoverAYouTubeThumbnail() {
        await this.page.locator('a.ytd-thumbnail[href^="/watch"]').first().hover({ force: true });
    }

    async hoverAMovieThumb() {
        await this.page.locator('ytd-movie-renderer a.ytd-thumbnail[href^="/watch"]').first().hover({ force: true });
    }

    async hoverShort() {
        // this should auto-wait for our test code to modify the DOM like YouTube does
        await this.page.getByRole('heading', { name: 'Shorts', exact: true }).scrollIntoViewIfNeeded();
        await this.page.locator('a[href*="/shorts"]').first().hover({ force: true });
    }

    async clickDDGOverlay() {
        await this.hoverAThumbnail();
        await this.page.locator('.ddg-play-privately').click({ force: true });
    }

    async isVisible() {
        await this.page.locator('.ddg-play-privately').waitFor({ state: 'attached', timeout: 1000 });
    }

    async secondOverlayExistsOnVideo() {
        const elements = await this.page.$$('.ddg-play-privately');
        expect(elements.length).toBe(2);
        await this.page.locator('#player .html5-video-player .ddg-overlay[data-size="video-player"]').waitFor({ timeout: 1000 });
    }

    async overlaysDontShow() {
        const elements = await this.page.locator('.ddg-overlay.ddg-overlay-hover').count();

        // if the element exists, assert that it is hidden
        if (elements > 0) {
            const style = await this.page.evaluate(() => {
                const div = /** @type {HTMLDivElement|null} */ (document.querySelector('.ddg-overlay.ddg-overlay-hover'));
                if (div) {
                    return div.style.display;
                }
                return '';
            });

            expect(style).not.toEqual('block');
        }

        // if we get here, the element was absent
    }

    async turnOnDuckPlayer() {
        const action = () => this.page.getByRole('link', { name: 'Turn On Duck Player' }).click();

        await this.build.switch({
            'apple-isolated': async () => {
                await action();
                await this.duckPlayerLoadsFor('123');
            },
            windows: async () => {
                const failure = new Promise((resolve) => {
                    this.page.context().on('requestfailed', (f) => {
                        if (f.url().startsWith('duck')) resolve(f.url());
                    });
                });

                await action();

                // assert the page tried to navigate to duck player
                expect(await failure).toEqual('duck://player/123');
            },
        });
    }

    async noThanks() {
        await this.page.getByText('No Thanks').click();
    }

    async rememberMyChoice() {
        await this.page.getByText('Remember my choice').click();
    }

    /**
     * To say 'our player loads' means to verify that the correct message is communicated
     * to native platforms
     *
     * @param {string} id
     * @return {Promise<void>}
     */
    async duckPlayerLoadsFor(id) {
        const messages = await this.collector.waitForMessage('openDuckPlayer');
        expect(messages).toMatchObject([
            {
                payload: {
                    context: this.collector.messagingContextName,
                    featureName: 'duckPlayer',
                    params: {
                        href: 'duck://player/' + id,
                    },
                    method: 'openDuckPlayer',
                },
            },
        ]);
    }

    async duckPlayerLoadedTimes(times = 0) {
        const calls = await this.collector.outgoingMessages();
        const opened = calls.filter((call) => {
            if ('method' in call.payload) {
                return call.payload.method === 'openDuckPlayer';
            }
            return false;
        });
        expect(opened.length).toBe(times);
    }

    /**
     * @param {keyof userValues} setting
     * @return {Promise<void>}
     */
    async userSettingWasUpdatedTo(setting) {
        const messages = await this.collector.waitForMessage('setUserValues');
        expect(messages).toMatchObject([
            {
                payload: {
                    context: this.collector.messagingContextName,
                    featureName: 'duckPlayer',
                    params: userValues[setting],
                    method: 'setUserValues',
                },
            },
        ]);
    }

    /**
     * @return {Promise<void>}
     */
    async userSettingWasNotUpdated() {
        const messages = await this.collector.outgoingMessages();
        // @ts-expect-error - Subscription is missing method property
        const setUserValuesMessages = messages.filter((message) => message.payload?.method === 'setUserValues');

        expect(setUserValuesMessages.length).toBe(0);
    }

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new DuckplayerOverlays(page, build, platformInfo);
    }

    /**
     * @return {Promise<string>}
     */
    requestWillFail() {
        return new Promise((resolve, reject) => {
            // on windows it will be a failed request
            const timer = setTimeout(() => {
                reject(new Error('timed out'));
            }, 5000);
            this.page.on('framenavigated', (req) => {
                clearTimeout(timer);
                resolve(req.url());
            });
        });
    }

    /**
     * Checks for presence of default overlay copy
     */
    async overlayCopyIsDefault() {
        await this.page.locator('ddg-video-overlay').waitFor({ state: 'visible', timeout: 1000 });
        await this.page
            .getByText('Turn on Duck Player to watch without targeted ads', { exact: true })
            .waitFor({ state: 'visible', timeout: 1000 });
        await this.page
            .getByText('What you watch in DuckDuckGo won’t influence your recommendations on YouTube.', { exact: true })
            .waitFor({ state: 'visible', timeout: 1000 });

        await this.page.getByRole('link', { name: 'Turn On Duck Player' }).waitFor({ state: 'visible', timeout: 1000 });
        await this.page.getByRole('button', { name: 'No Thanks' }).waitFor({ state: 'visible', timeout: 1000 });

        await this.page.getByLabel('Remember my choice').waitFor({ state: 'visible', timeout: 1000 });
    }
}

class DuckplayerOverlaysMobile {
    /**
     * @param {DuckplayerOverlays} overlays
     */
    constructor(overlays) {
        this.overlays = overlays;
    }

    async drawerIsPresented() {
        const { page } = this.overlays;
        await page.locator('ddg-video-drawer-mobile').waitFor({ state: 'visible', timeout: 2000 });
    }
    async choosesWatchHere() {
        const { page } = this.overlays;
        await page.getByRole('button', { name: 'No Thanks' }).click();
    }

    async choosesDuckPlayer() {
        const { page } = this.overlays;
        await page.getByRole('link', { name: 'Turn On Duck Player' }).click();
    }

    async clicksOnVideoThumbnail() {
        const { page } = this.overlays;
        await page.locator('ddg-video-thumbnail-overlay-mobile .bg').click({ force: true });
    }

    async clicksOnDrawerBackdrop() {
        const { page } = this.overlays;
        await page.locator('ddg-video-drawer-mobile .ddg-mobile-drawer-background').click({ position: { x: 10, y: 10 } });
    }

    async selectsRemember() {
        const { page } = this.overlays;
        await page.getByRole('switch').click();
    }

    async overlayIsRemoved() {
        const { page } = this.overlays;
        expect(await page.locator('ddg-video-overlay-mobile').count()).toBe(0);
    }

    /**
     * The buffering hold: a thumbnail overlay in its loading state, held over the player
     * after opt-out until the video presents its first frame. The spinner joins a beat
     * later, so it is asserted separately by the tests that care about it.
     */
    async bufferingFeedbackShows() {
        const { page } = this.overlays;
        // the inner overlay collapses to 0×0 (absolutely positioned children), so assert on the host
        await page.locator('ddg-video-thumbnail-overlay-mobile').waitFor({ state: 'visible', timeout: 2000 });
        await expect(page.locator('ddg-video-thumbnail-overlay-mobile .ddg-video-player-overlay')).toHaveClass(/loading/);
    }

    async spinnerShows() {
        const { page } = this.overlays;
        await page.locator('ddg-video-thumbnail-overlay-mobile .ddg-vpo-spinner').waitFor({ state: 'visible', timeout: 2000 });
    }

    /**
     * Assert a poster was painted behind the spinner (i.e. the spinner never sits on black).
     */
    async bufferingFeedbackHasPoster() {
        const { page } = this.overlays;
        await expect(async () => {
            const backgroundImage = await page
                .locator('ddg-video-thumbnail-overlay-mobile .ddg-vpo-bg')
                .evaluate((el) => getComputedStyle(el).backgroundImage);
            expect(backgroundImage).not.toBe('none');
            expect(backgroundImage).toContain('url(');
        }).toPass({ timeout: 2000 });
    }

    /**
     * Assert which poster won the candidate walk, by matching the painted URL.
     * @param {RegExp} pattern
     */
    async bufferingFeedbackPosterMatches(pattern) {
        const { page } = this.overlays;
        await expect(async () => {
            const backgroundImage = await page
                .locator('ddg-video-thumbnail-overlay-mobile .ddg-vpo-bg')
                .evaluate((el) => getComputedStyle(el).backgroundImage);
            expect(backgroundImage).toMatch(pattern);
        }).toPass({ timeout: 2000 });
    }

    async bufferingFeedbackIsRemoved() {
        const { page } = this.overlays;
        await expect(page.locator('ddg-video-thumbnail-overlay-mobile')).toHaveCount(0, { timeout: 2000 });
    }

    /**
     * The hold stays, minus the spinner, so a video that never arrives settles on a
     * still poster rather than the black frame the hold exists to cover.
     */
    async spinnerIsWithdrawn() {
        const { page } = this.overlays;
        await expect(page.locator('ddg-video-thumbnail-overlay-mobile .ddg-vpo-spinner')).toBeHidden();
        await expect(page.locator('ddg-video-thumbnail-overlay-mobile')).toHaveCount(1);
    }

    async bufferingFeedbackNeverShows() {
        const { page } = this.overlays;
        // give the opt-out teardown a beat to (not) append the hold
        await page.waitForTimeout(200);
        expect(await page.locator('ddg-video-thumbnail-overlay-mobile').count()).toBe(0);
    }

    async tapsBufferingFeedback() {
        const { page } = this.overlays;
        // .bg fills the host, so a click here bubbles to the host's dismiss handler.
        await page.locator('ddg-video-thumbnail-overlay-mobile .ddg-vpo-bg').click({ force: true });
    }

    /**
     * Put the player into fullscreen the way YouTube does, from a real click so the
     * request has the user activation the Fullscreen API demands.
     * @returns {Promise<boolean>} whether the browser granted fullscreen
     */
    async playerEntersFullscreen() {
        const { page } = this.overlays;
        await page.evaluate(() => {
            const button = document.createElement('button');
            button.id = 'test-enter-fullscreen';
            button.textContent = 'fullscreen';
            button.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647';
            button.addEventListener('click', () => {
                const player = /** @type {HTMLElement} */ (document.querySelector('#player'));
                Reflect.set(
                    window,
                    '__fullscreenGranted',
                    player.requestFullscreen().then(
                        () => true,
                        () => false,
                    ),
                );
            });
            document.body.appendChild(button);
        });
        await page.locator('#test-enter-fullscreen').click();
        const granted = await page.evaluate(() => Reflect.get(window, '__fullscreenGranted'));
        await page.locator('#test-enter-fullscreen').evaluate((el) => el.remove());
        return granted;
    }

    /**
     * Our overlays cover the whole screen and stop being tappable once YouTube's
     * player is fullscreen, so an overlay showing means fullscreen must not persist.
     */
    async isNotFullscreen() {
        const { page } = this.overlays;
        await expect(async () => {
            expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(true);
        }).toPass({ timeout: 2000 });
    }

    async overlayIsStillPresented() {
        const { page } = this.overlays;
        await expect(page.locator('ddg-video-overlay-mobile')).toHaveCount(1);
    }

    /**
     * Fullscreen is left alone: either nothing is mounted that needs protecting, or
     * the config gate is off.
     */
    async staysFullscreen() {
        const { page } = this.overlays;
        await page.waitForTimeout(200);
        expect(await page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
    }

    /**
     * Give the player the kind of poster the hold paints first: page-supplied, so it is
     * trusted on load and needs no round trip.
     */
    async stubsVideoPoster() {
        const { page } = this.overlays;
        await page.route(STUB_POSTER_URL, (route) => fulfillPoster(route, 200));
        await page.locator('#player video').evaluate((el, posterUrl) => {
            /** @type {HTMLVideoElement} */ (el).poster = posterUrl;
        }, STUB_POSTER_URL);
    }

    /**
     * Answer the synthesised thumbnail URLs the way YouTube does. A video without a
     * maxres thumbnail gets a valid placeholder image under a 404, so the image loads
     * and only the status gives the miss away — the reason those candidates are
     * HEAD-checked rather than trusted on load.
     */
    async stubsMissingMaxresThumbnail() {
        const { page } = this.overlays;
        await page.route('https://i.ytimg.com/**/maxresdefault.jpg', (route) => fulfillPoster(route, 404));
        await page.route('https://i.ytimg.com/**/hqdefault.jpg', (route) => fulfillPoster(route, 200));
    }

    /**
     * Simulate the underlying video reaching its first frame, which is what the hold
     * waits for before removing itself.
     */
    async firstFrameRenders() {
        const { page } = this.overlays;
        await page.locator('#player video').evaluate((el) => {
            const video = /** @type {HTMLVideoElement} */ (el);
            Object.defineProperty(video, 'paused', { configurable: true, value: false });
            Object.defineProperty(video, 'currentTime', { configurable: true, value: 1 });
            video.dispatchEvent(new Event('timeupdate'));
        });
    }

    /**
     * A fatal media error means no frame is ever coming.
     */
    async videoErrors() {
        const { page } = this.overlays;
        await page.locator('#player video').evaluate((el) => el.dispatchEvent(new Event('error')));
    }

    /**
     * Fail an image inside the player, as a blocked ad creative does. Its error reaches the
     * container in the capture phase exactly like a media error, so the hold has to tell
     * them apart. Resolves once the error has fired, so the assertion after it means something.
     */
    async imageInsidePlayerFails() {
        const { page } = this.overlays;
        await page.locator('#player .html5-video-player').evaluate((el) => {
            return new Promise((resolve) => {
                const img = document.createElement('img');
                img.addEventListener('error', () => resolve(null), { once: true });
                img.src = 'data:image/png;base64,not-a-real-png';
                el.appendChild(img);
            });
        });
    }

    /**
     * Replace the media element with a fresh one, as YouTube does mid-startup, leaving the
     * element the hold started on detached. Deliberately source-less: a copied src would
     * 404 and clear the hold through the error path, hiding whether the swap was followed.
     */
    async swapsVideoElement() {
        const { page } = this.overlays;
        await page.locator('#player video').evaluate((el) => el.replaceWith(document.createElement('video')));
    }

    async opensInfo() {
        const { page } = this.overlays;
        await page.getByLabel('Open Information Modal').click();
        const messages = await this.overlays.collector.waitForMessage('openInfo');
        expect(messages).toHaveLength(1);
    }
}

class DuckplayerOverlayPixels {
    /**
     * @param {DuckplayerOverlays} overlays
     */
    constructor(overlays) {
        this.overlays = overlays;
    }

    /**
     * @param {{pixelName: string, params: Record<string, any>}[]} pixels
     * @return {Promise<void>}
     */
    async sendsPixels(pixels) {
        const messages = await this.overlays.collector.waitForMessage('sendDuckPlayerPixel');
        const params = messages.map((x) => x.payload.params);
        expect(params).toMatchObject(pixels);
    }
}

/**
 * @param {ConfigFile} name
 * @return {Record<string, any>}
 */
function loadConfig(name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/duckplayer/config/${name}`, 'utf8'));
}
