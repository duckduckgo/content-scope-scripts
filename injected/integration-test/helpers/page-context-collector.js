import { testContextForExtension } from './harness.js';
import { ResultsCollector } from '../page-objects/results-collector.js';

/**
 * A utility for collecting page content using the page-context feature
 */
export class PageContextCollector {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     * @param {string} [configPath] - Optional config file path
     */
    constructor(page, testInfo, configPath) {
        this.page = page;
        this.testInfo = testInfo;
        this.collector = ResultsCollector.create(page, testInfo.project.use);
        this.configPath = configPath || './integration-test/test-pages/page-context/config/page-context-enabled.json';
    }

    /**
     * Create a PageContextCollector instance
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     * @param {string} [configPath] - Optional config file path
     * @returns {PageContextCollector}
     */
    static create(page, testInfo, configPath) {
        return new PageContextCollector(page, testInfo, configPath);
    }

    /**
     * Configure page-context feature settings by using a custom config file
     * This method is kept for API compatibility but the actual configuration
     * should be done via the JSON config file.
     * @param {Object} options - Configuration options (for documentation purposes)
     * @param {boolean} [options.subscribeToCollect=true] - Enable collect subscription
     * @param {boolean} [options.subscribeToHashChange=true] - Enable hashchange listener
     * @param {boolean} [options.subscribeToPageShow=true] - Enable pageshow listener
     * @param {boolean} [options.subscribeToVisibilityChange=true] - Enable visibility change listener
     * @param {number} [options.maxContentLength=9500] - Maximum content length
     * @param {number} [options.maxTitleLength=100] - Maximum title length
     * @param {number} [options.cacheExpiration=30000] - Cache expiration in ms
     * @param {number} [options.recheckLimit=5] - Maximum recheck attempts
     * @param {object} [_options] - Options object
     * @param {string[]} [_options.excludeSelectors] - CSS selectors to exclude
     * @returns {PageContextCollector}
     */
    withPageContextSettings(_options = {}) {
        // For now, we use the JSON config file for settings
        // In the future, this could be enhanced to dynamically modify the config
        console.log('Page context settings configured via JSON config file');
        return this;
    }

    /**
     * Load a URL and wait for page-context initialization
     * @param {string} url - The URL to load
     * @returns {Promise<void>}
     */
    async loadUrl(url) {
        console.log('Loading URL');
        // Load the page with the page-context config
        await this.collector.load(url, this.configPath);
        console.log('URL loaded');
        // Wait for page load to complete
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Trigger page context collection
     * @returns {Promise<Object>} - The collected page content
     */
    async collectPageContext() {
        // Trigger the collect subscription message
        await this.collector.simulateSubscriptionMessage('pageContext', 'collect', {});

        // Wait for and capture the collectionResult response
        const messages = await this.collector.waitForMessage('collectionResult', 1);

        if (!messages || messages.length === 0) {
            throw new Error('No collectionResult message received');
        }

        const message = messages[0];

        // Parse the serialized page data
        if (message.payload && message.payload.params && message.payload.params.serializedPageData) {
            return JSON.parse(message.payload.params.serializedPageData);
        }

        throw new Error('Invalid collectionResult message format');
    }

    /**
     * Load a URL and collect its page context in one step
     * @param {string} url - The URL to load and collect content from
     * @param {Object} [pageContextSettings] - Optional page-context settings (for API compatibility)
     * @returns {Promise<Object>} - The collected page content
     */
    async loadAndCollect(url, pageContextSettings = {}) {
        if (Object.keys(pageContextSettings).length > 0) {
            this.withPageContextSettings(pageContextSettings);
        }
        await this.loadUrl(url);
        return await this.collectPageContext();
    }

    /**
     * Get the underlying ResultsCollector instance for advanced usage
     * @returns {ResultsCollector}
     */
    getCollector() {
        return this.collector;
    }
}

/**
 * Create a Playwright test context configured for page-context collection
 * @param {import("@playwright/test").test} test - The base test object
 * @returns {import("@playwright/test").test} - The configured test object
 */
export function pageContextTest(test) {
    return testContextForExtension(test);
}

/**
 * Convenience function to collect page content from a URL
 * @param {import("@playwright/test").Page} page
 * @param {import("@playwright/test").TestInfo} testInfo
 * @param {string} url
 * @param {Object} [options] - Optional page-context settings
 * @returns {Promise<Object>} - The collected page content
 */
export async function collectPageContent(page, testInfo, url, options = {}) {
    const collector = PageContextCollector.create(page, testInfo);
    return await collector.loadAndCollect(url, options);
}
