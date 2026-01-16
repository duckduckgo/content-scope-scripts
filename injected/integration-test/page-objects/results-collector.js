import { readFileSync } from 'fs';
import {
    mockAndroidMessaging,
    mockResponses,
    mockWebkitMessaging,
    mockWindowsMessaging,
    readOutgoingMessages,
    simulateSubscriptionMessage,
    waitForCallCount,
    wrapWebkitScripts,
    wrapWindowsScripts,
} from '@duckduckgo/messaging/lib/test-utils.mjs';
import { perPlatform } from '../type-helpers.mjs';
import { windowsGlobalPolyfills } from '../shared.mjs';
import { processConfig } from '../../src/utils.js';
import { gotoAndWait } from '../helpers/harness.js';

/**
 * @typedef {import('../../src/utils.js').Platform} Platform
 */

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
     * @param {Partial<Platform>} [platform]
     */
    async load(htmlPath, configPath, platform) {
        /**
         * For now, take a separate path for the extension since it's setup
         * is quite different to browsers. We hide this setup step from consumers,
         * allowing all platforms to call '.load(html, config)' and not care
         * about the details.
         */
        if (this.platform.name === 'extension' || String(this.platform.name) === 'integration') {
            return await this._loadExtension(htmlPath, configPath, platform);
        }
        await this.setup({ config: configPath, platform });
        await this.page.goto(htmlPath);
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
        this.#mockResponses = {
            ...this.#mockResponses,
            ...values,
        };
        return this;
    }
    /**
     * @param {Record<string, any>} values
     */
    async updateMockResponse(values) {
        await this.page.addInitScript(mockResponses, {
            responses: values,
        });
    }

    /**
     * @param {string} htmlPath
     * @param {string} configPath
     * @param {Partial<Platform>} [platform]
     * @private
     */
    async _loadExtension(htmlPath, configPath, platform) {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        /** @type {import('../../src/utils.js').UserPreferences} */
        const userPreferences = {
            platform: {
                name: this.platform.name,
                ...platform,
            },
            sessionKey: 'test',
        };
        console.log('Processing config');
        const processedConfig = processConfig(
            /** @type {import('../../src/utils.js').RemoteConfig} */ (config),
            /* userList */ [],
            /* preferences */ userPreferences /*, platformSpecificFeatures = [] */,
        );
        console.log('Processed config');

        // For integration platform, load the integration script instead of using gotoAndWait
        if (String(this.platform.name) === 'integration') {
            await this.page.goto(htmlPath + '?automation=true');
            await this.page.addScriptTag({
                url: './integration-test/extension/contentScope.js',
            });
            // Wait for the integration script to initialize
            // Hybrid approach: Try waitForFunction, fallback if CSP blocks
            try {
                await this.page.waitForFunction(
                    () => {
                        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                        return window.__content_scope_status === 'loaded';
                    },
                    { timeout: 30000 },
                );
            } catch (e) {
                console.warn(`Could not detect extension load, waiting 2s`);
                await this.page.waitForTimeout(2000);
            }

            // Send the config via custom event
            const evalString = `
                ;(() => {
                    const detail = ${JSON.stringify(processedConfig)}
                    const evt = new CustomEvent('content-scope-init-args', { detail })
                    document.dispatchEvent(evt);
                })();
            `;
            await this.page.evaluate(evalString);

            // Wait for initialization to complete
            // Hybrid approach: Try waitForFunction, fallback if CSP blocks

            // DEBUG: Check if extension is loading at all
            const statusCheck = await this.page
                .evaluate(() => {
                    // @ts-expect-error - window.__content_scope_status is set by integration script
                    const hasStatus = typeof window.__content_scope_status !== 'undefined';
                    // @ts-expect-error - window.__content_scope_status is set by integration script
                    const status = window.__content_scope_status;
                    // @ts-expect-error - window.__duck_messaging is set by integration script
                    const hasMessaging = typeof window.__duck_messaging !== 'undefined';
                    return {
                        hasStatus,
                        status,
                        hasMessaging,
                    };
                })
                .catch((e) => ({ error: e.message }));
            console.log(`[DEBUG] Extension status check:`, JSON.stringify(statusCheck));

            try {
                await this.page.waitForFunction(
                    () => {
                        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                        return window.__content_scope_status === 'initialized';
                    },
                    { timeout: 30000 },
                );
                console.log(`[DEBUG] Extension initialized successfully`);
            } catch (e) {
                console.warn(`Could not detect extension init (timeout), waiting 1s`);
                await this.page.waitForTimeout(1000);
            }
        } else {
            await gotoAndWait(this.page, htmlPath + '?automation=true', processedConfig);
        }
    }

    /**
     * @param {object} params
     * @param {Record<string, any> | string} params.config
     * @param {string} [params.locale]
     * @param {Partial<Platform>} [params.platform]
     * @return {Promise<void>}
     */
    async setup(params) {
        let { config, locale, platform } = params;

        if (typeof config === 'string') {
            config = JSON.parse(readFileSync(config, 'utf8'));
        }

        await this.build.switch({
            windows: async () => {
                /**
                 * In CI, the global objects such as USB might not be installed on the
                 * version of chromium running there.
                 */
                await this.page.addInitScript(windowsGlobalPolyfills);
            },
            'apple-isolated': async () => {
                // noop
            },
            apple: async () => {
                // noop
            },
            android: async () => {
                // noop
            },
            'android-autofill-import': async () => {
                // noop
            },
        });

        const messagingMock = this.build.switch({
            apple: () => mockWebkitMessaging,
            'apple-isolated': () => mockWebkitMessaging,
            windows: () => mockWindowsMessaging,
            android: () => mockAndroidMessaging,
            'android-autofill-import': () => mockAndroidMessaging,
        });

        await this.page.addInitScript(messagingMock, {
            messagingContext: this.messagingContext('n/a'),
            responses: this.#mockResponses,
            messageCallback: 'messageCallback',
            javascriptInterface: this.#userPreferences.javascriptInterface,
        });

        const wrapFn = this.build.switch({
            'apple-isolated': () => wrapWebkitScripts,
            apple: () => wrapWebkitScripts,
            android: () => wrapWebkitScripts,
            'android-autofill-import': () => wrapWebkitScripts,
            windows: () => wrapWindowsScripts,
        });

        // read the built file from disk and do replacements
        const injectedJS = wrapFn(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: this.platform.name, ...platform },
                debug: true,
                messageCallback: 'messageCallback',
                messageSecret: 'duckduckgo-android-messaging-secret',
                javascriptInterface: this.messagingContextName,
                locale,
                ...this.#userPreferences,
            },
        });

        // attach the JS
        await this.page.addInitScript(injectedJS);
    }

    /**
     * @param {() => Promise<unknown>} [beforeAwait]
     */
    async results(beforeAwait) {
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
        if (beforeAwait) {
            await beforeAwait();
        }
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
            messageCallback: this.#userPreferences.messageCallback,
            messageSecret: this.#userPreferences.messageSecret,
        });
    }

    get messagingContextName() {
        return this.build.name === 'apple-isolated' ? 'contentScopeScriptsIsolated' : 'contentScopeScripts';
    }

    get mockResponses() {
        return this.#mockResponses;
    }

    /**
     * @param {string} featureName
     * @return {import("@duckduckgo/messaging").MessagingContext}
     */
    messagingContext(featureName) {
        return {
            context: this.messagingContextName,
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
     * @param {string} method
     * @param {number} [count=1]
     * @return {Promise<Record<string, any>[]>}
     */
    async waitForMessage(method, count = 1) {
        await this.page.waitForFunction(
            waitForCallCount,
            {
                method,
                count,
            },
            { timeout: 5000, polling: 100 },
        );
        const calls = await this.page.evaluate(readOutgoingMessages);
        return calls.filter((v) => v.payload.method === method);
    }

    /**
     * @return {Promise<UnstableMockCall[]>}
     */
    async outgoingMessages() {
        return await this.page.evaluate(readOutgoingMessages);
    }

    /**
     * Helper for creating an instance per platform
     * @param {import('@playwright/test').Page} page
     * @param {Record<string, any>} use
     */
    static create(page, use) {
        // Read the configuration object to determine which platform we're testing against
        page.on('console', (msg) => {
            const messageType = msg.type();
            const messageText = msg.text();

            // Handle cases where msg.type() might return undefined
            if (messageType && typeof console[messageType] === 'function') {
                console[messageType](messageText);
            } else {
                // Fallback to console.log if type is undefined or not a valid console method
                console.log(`[${messageType || 'unknown'}]`, messageText);
            }
        });
        const { platformInfo, build } = perPlatform(use);
        return new ResultsCollector(page, build, platformInfo);
    }
}
