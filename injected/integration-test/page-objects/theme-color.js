import { readFileSync } from 'fs';
import { expect } from '@playwright/test';
import { perPlatform } from '../type-helpers.mjs';
import { ResultsCollector } from './results-collector.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configFiles = /** @type {const} */ (['theme-color-absent', 'theme-color-disabled', 'theme-color-enabled']);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const testPages = /** @type {const} */ (['index', 'no-theme-color', 'media-queries']);

export class ThemeColor {
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
            themeColorStatus: {},
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

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        console.log('PLATFORM', platformInfo);
        return new ThemeColor(page, build, platformInfo);
    }

    /**
     * @param {object} [params]
     * @param {configFiles[number]} [params.json="overlays"] - default is settings for localhost
     * @param {string} [params.locale] - optional locale
     */
    async withRemoteConfig(params = {}) {
        const { json = 'theme-color-absent', locale = 'en' } = params;

        await this.collector.setup({ config: loadConfig(json), locale });
    }

    /**
     * @param {testPages[number]} testPage
     */
    async gotoPage(testPage) {
        const page = `/theme-color/${testPage}.html`;

        await this.page.goto(page);
    }

    /**
     *
     * @param {string|null} color
     * @param {string} url
     */
    async receivedThemeColorMessage(color, url) {
        const messages = await this.collector.waitForMessage('themeColorStatus', 1);

        expect(messages[0].payload.params).toStrictEqual({
            themeColor: color,
            documentUrl: url,
        });
    }

    async didNotReceiveThemeColorMessage() {
        // this is here purely to guard against a false positive in this test.
        // without this manual `wait`, it might be possible for the following assertion to
        // pass, but just because it was too quick (eg: the first message wasn't sent yet)
        await this.page.waitForTimeout(100);

        const messages = await this.collector.outgoingMessages();
        expect(messages).toHaveLength(0);
    }

    async setDesktopViewport() {
        await this.page.setViewportSize({ width: 1280, height: 720 });
    }

    async setColorSchemeDark() {
        await this.page.emulateMedia({ colorScheme: 'dark' });
    }
}

/**
 * @param {configFiles[number]} name
 * @return {Record<string, any>}
 */
function loadConfig(name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/theme-color/config/${name}.json`, 'utf8'));
}
