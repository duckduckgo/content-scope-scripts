import { readFileSync } from 'fs';
import {
    mockAndroidMessaging,
    mockWebkitMessaging,
    mockWindowsMessaging,
    simulateSubscriptionMessage,
    wrapWebkitScripts,
    wrapWindowsScripts,
} from '@duckduckgo/messaging/lib/test-utils.mjs';
import { perPlatform } from '../type-helpers.mjs';

/**
 * This is designed to allow you to execute Playwright tests using the various
 * artifacts we produce. For example, on the `apple` target this can be used to ensure
 * your tests run against the *real* file that Apple platforms will use in production.
 *
 * It also handles injecting global variables (like those seen in the entry points within the 'inject' folder)
 *
 * It has convenience methods for allowing you to extract test-results from the in-page tests too.
 *
 * ```js
 * test('testing against a built artifact and collecting results from the page', async ({ page }, testInfo) => {
 *     const collector = ResultsCollector.create(page, testInfo)
 *     await collector.load(HTML_PATH, CONFIG_PATH);
 *
 *     const results = await collector.collectResultsFromPage();
 *
 *     expect(results).toStrictEqual({
 *         "has DDG signal": [{
 *             "name": "navigator.duckduckgo.isDuckDuckGo()",
 *             "result": "true",
 *             "expected": "true"
 *         }],
 *     })
 * })
 * ```
 *
 */
export class ResultsCollector {
    #userPreferences = {};
    #mockResponses = {};
    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('../type-helpers.mjs').Build} build
     * @param {import('../type-helpers.mjs').PlatformInfo} platform
     */
    constructor(page, build, platform) {
        this.page = page;
        this.build = build;
        this.platform = platform;
    }

    /**
     * @param {string} htmlPath
     * @param {string} configPath
     */
    async load(htmlPath, configPath) {
        await this.setup({ config: configPath });
        await this.page.goto(htmlPath);
        return this;
    }

    /**
     * @param {Record<string, any>} values
     */
    withUserPreferences(values) {
        this.#userPreferences = values;
        return this;
    }
    /**
     * @param {Record<string, any>} values
     */
    withMockResponse(values) {
        this.#mockResponses = values;
        return this;
    }

    /**
     * @param {object} params
     * @param {Record<string, any> | string} params.config
     * @return {Promise<void>}
     */
    async setup(params) {
        let { config } = params;
        if (typeof config === 'string') {
            config = JSON.parse(readFileSync(config, 'utf8'));
        }

        const wrapFn = this.build.switch({
            'apple-isolated': () => wrapWebkitScripts,
            apple: () => wrapWebkitScripts,
            android: () => wrapWindowsScripts,
            windows: () => wrapWindowsScripts,
        });

        // read the built file from disk and do replacements
        const injectedJS = wrapFn(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: this.platform.name },
                debug: true,
                ...this.#userPreferences,
            },
        });

        const messagingMock = this.build.switch({
            apple: () => mockWebkitMessaging,
            'apple-isolated': () => mockWebkitMessaging,
            windows: () => mockWindowsMessaging,
            android: () => mockAndroidMessaging,
        });

        await this.page.addInitScript(messagingMock, {
            messagingContext: this.messagingContext('n/a'),
            responses: this.#mockResponses,
        });

        // attach the JS
        await this.page.addInitScript(injectedJS);
    }

    collectResultsFromPage() {
        return this.page.evaluate(() => {
            return new Promise((resolve) => {
                // @ts-expect-error - this is added by the test framework
                if (window.results) return resolve(window.results);
                window.addEventListener('results-ready', () => {
                    // @ts-expect-error - this is added by the test framework
                    resolve(window.results);
                });
            });
        });
    }

    async runTests() {
        const resultsPromise = this.page.evaluate(() => {
            return new Promise((resolve) => {
                if ('results' in window) {
                    resolve(window.results);
                } else {
                    window.addEventListener('results-ready', () => {
                        // @ts-expect-error - this is added by the test framework
                        resolve(window.results);
                    });
                }
            });
        });
        // await this.page.getByTestId('render-results').click();
        return await resultsPromise;
    }

    /**
     * @param {string} featureName
     * @param {string} name
     * @param {Record<string, any>} payload
     */
    async simulateSubscriptionMessage(featureName, name, payload) {
        await this.page.evaluate(simulateSubscriptionMessage, {
            messagingContext: this.messagingContext(featureName),
            name,
            payload,
            injectName: this.build.name,
        });
    }

    /**
     * @param {string} featureName
     * @return {import("@duckduckgo/messaging").MessagingContext}
     */
    messagingContext(featureName) {
        const context = this.build.name === 'apple-isolated' ? 'contentScopeScriptsIsolated' : 'contentScopeScripts';
        return {
            context,
            featureName,
            env: 'development',
        };
    }

    /**
     * @return {string}
     */
    isolatedVariant() {
        return this.build.switch({
            apple: () => 'apple-isolated',
            windows: () => 'windows',
        });
    }

    /**
     * Helper for creating an instance per platform
     * @param {import('@playwright/test').Page} page
     * @param {Record<string, any>} use
     */
    static create(page, use) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(use);
        return new ResultsCollector(page, build, platformInfo);
    }
}
