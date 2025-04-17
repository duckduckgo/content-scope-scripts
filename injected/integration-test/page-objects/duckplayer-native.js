import { readFileSync } from 'fs';
import { expect } from '@playwright/test';
import { perPlatform } from '../type-helpers.mjs';
import { ResultsCollector } from './results-collector.js';

/**
 * @import { PageType} from '../../src/features/duck-player-native.js'
 * @typedef {"default" | "incremental-dom" | "age-restricted-error" | "sign-in-error"} PlayerPageVariants
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configFiles = /** @type {const} */ (['native.json']);

export class DuckPlayerNative {
    /** @type {Partial<Record<PageType, string>>} */
    pages = {
        YOUTUBE: '/duckplayer-native/pages/player.html',
        NOCOOKIE: '/duckplayer-native/pages/player.html',
    };

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
                locale: 'en',
            },
            onCurrentTimestamp: {},
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
     * @param {object} [params]
     * @param {string} [params.videoID]
     */
    async gotoYouTubePage(params = {}) {
        await this.gotoPage('YOUTUBE', params);
    }

    async gotoNoCookiePage() {
        await this.gotoPage('NOCOOKIE', {});
    }

    async gotoAgeRestrictedErrorPage() {
        await this.gotoPage('NOCOOKIE', { variant: 'age-restricted-error' });
    }

    async gotoSignInErrorPage() {
        await this.gotoPage('NOCOOKIE', { variant: 'sign-in-error' });
    }

    async gotoSERP() {
        await this.gotoPage('SERP', {});
    }

    /**
     * @param {PageType} pageType
     * @param {object} [params]
     * @param {PlayerPageVariants} [params.variant]
     * @param {string} [params.videoID]
     */
    async gotoPage(pageType, params = {}) {
        await this.pageTypeIs(pageType);

        const { variant = 'default', videoID = '123' } = params;
        const urlParams = new URLSearchParams([
            ['v', videoID],
            ['variant', variant],
        ]);

        const page = this.pages[pageType];

        await this.page.goto(page + '?' + urlParams.toString());
    }

    /**
     * @param {object} [params]
     * @param {configFiles[number]} [params.json="native"] - default is settings for localhost
     * @param {string} [params.locale] - optional locale
     */
    async withRemoteConfig(params = {}) {
        const { json = 'native.json', locale = 'en' } = params;

        await this.collector.setup({ config: loadConfig(json), locale });
    }

    /**
     * @param {PageType} pageType
     * @return {Promise<void>}
     */
    async pageTypeIs(pageType) {
        const initialSetupResponse = {
            locale: 'en',
            pageType,
        };

        await this.collector.updateMockResponse({
            initialSetup: initialSetupResponse,
        });
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} payload
     */
    async simulateSubscriptionMessage(name, payload) {
        await this.collector.simulateSubscriptionMessage('duckPlayerNative', name, payload);
    }

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new DuckPlayerNative(page, build, platformInfo);
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

    /* Subscriptions */

    /**
     * @param {object} options
     */
    async sendOnMediaControl(options = { pause: true }) {
        await this.simulateSubscriptionMessage('onMediaControl', options);
    }

    /**
     * @param {object} options
     */
    async sendOnSerpNotify(options = {}) {
        await this.simulateSubscriptionMessage('onSerpNotify', options);
    }

    /**
     * @param {object} options
     */
    async sendOnMuteAudio(options = { mute: true }) {
        await this.simulateSubscriptionMessage('onMuteAudio', options);
    }

    /* Messaging assertions */

    async didSendInitialHandshake() {
        const messages = await this.collector.waitForMessage('initialSetup');
        expect(messages).toMatchObject([
            {
                payload: {
                    context: this.collector.messagingContextName,
                    featureName: 'duckPlayerNative',
                    method: 'initialSetup',
                    params: {},
                },
            },
        ]);
    }

    async didSendCurrentTimestamp() {
        const messages = await this.collector.waitForMessage('onCurrentTimestamp');
        expect(messages).toMatchObject([
            {
                payload: {
                    context: this.collector.messagingContextName,
                    featureName: 'duckPlayerNative',
                    method: 'onCurrentTimestamp',
                    params: { timestamp: 0 },
                },
            },
        ]);
    }

    /* Thumbnail Overlay assertions */

    async didShowThumbnailOverlay() {
        await this.page.locator('ddg-video-thumbnail-overlay-mobile').waitFor({ state: 'visible', timeout: 1000 });
    }

    async didShowLogoInOverlay() {
        await this.page.locator('ddg-video-thumbnail-overlay-mobile .logo').waitFor({ state: 'visible', timeout: 1000 });
    }

    /* Custom Error assertions */

    async didShowGenericError() {
        await expect(this.page.locator('ddg-video-error')).toMatchAriaSnapshot(`
            - heading "YouTube won’t let Duck Player load this video" [level=1]
            - paragraph: YouTube doesn’t allow this video to be viewed outside of YouTube.
            - paragraph: You can still watch this video on YouTube, but without the added privacy of Duck Player.
          `);
    }

    async didShowSignInError() {
        await expect(this.page.locator('ddg-video-error')).toMatchAriaSnapshot(`
            - heading "YouTube won’t let Duck Player load this video" [level=1]
            - paragraph: YouTube is blocking this video from loading. If you’re using a VPN, try turning it off and reloading this page.
            - paragraph: If this doesn’t work, you can still watch this video on YouTube, but without the added privacy of Duck Player.
          `);
    }
}

/**
 * @param {configFiles[number]} name
 * @return {Record<string, any>}
 */
function loadConfig(name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/duckplayer-native/config/${name}`, 'utf8'));
}
