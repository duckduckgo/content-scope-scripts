import { readFileSync } from 'fs';
import { expect } from '@playwright/test';
import { perPlatform } from '../type-helpers.mjs';
import { ResultsCollector } from './results-collector.js';

/**
 * @import { PageType} from '../../src/features/duck-player-native.js'
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configFiles = /** @type {const} */ (['native.json']);

export class DuckPlayerNative {
    /** @type {Partial<Record<PageType, string>>} */
    pages = {
        YOUTUBE: '/duckplayer-native/pages/player.html',
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
     * @param {"default" | "incremental-dom"} [params.variant]
     * @param {string} [params.videoID]
     */
    async gotoYouTubePage(params = {}) {
        await this.gotoPage('YOUTUBE', params);
    }

    async gotoNoCookiePage() {
        await this.gotoPage('NOCOOKIE', {});
    }

    async gotoSERP() {
        await this.gotoPage('SERP', {});
    }

    /**
     * @param {PageType} pageType
     * @param {object} [params]
     * @param {"default" | "incremental-dom"} [params.variant]
     * @param {string} [params.videoID]
     */
    async gotoPage(pageType, params = {}) {
        await this.pageTypeIs(pageType);

        const { variant = 'default', videoID = '123' } = params;
        const urlParams = new URLSearchParams([
            ['v', videoID],
            ['variant', variant],
            ['pageType', pageType],
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
}

/**
 * @param {configFiles[number]} name
 * @return {Record<string, any>}
 */
function loadConfig(name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/duckplayer-native/config/${name}`, 'utf8'));
}
