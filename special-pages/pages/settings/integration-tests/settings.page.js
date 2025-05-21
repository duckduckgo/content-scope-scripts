import { perPlatform } from 'injected/integration-test/type-helpers.mjs';
import { Mocks } from '../../../shared/mocks.js';
import { expect } from '@playwright/test';

/**
 * @typedef {import('injected/integration-test/type-helpers.mjs').Build} Build
 * @typedef {import('injected/integration-test/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

export class SettingsTestPage {
    entries = 200;
    /**
     * Sets the number of entries stored in memory
     * @param {number} count - The number of entries to set.
     */
    withEntries(count) {
        this.entries = count;
        return this;
    }
    /**
     * @param {import("@playwright/test").Page} page
     * @param {Build} build
     * @param {PlatformInfo} platform
     */
    constructor(page, build, platform) {
        this.page = page;
        this.build = build;
        this.platform = platform;
        this.mocks = new Mocks(page, build, platform, {
            context: 'specialPages',
            featureName: 'settings',
            env: 'development',
        });
        this.page.on('console', console.log);
        if (this.platform.name === 'extension') throw new Error('unreachable - not supported in extension platform');
        this.mocks.defaultResponses({
            /** @type {import('../types/settings.ts').InitialSetupResponse} */
            initialSetup: {
                env: 'development',
                locale: 'en',
                platform: {
                    name: this.platform.name || 'windows',
                },
                settingsData: {
                    screens: [],
                },
                settingsState: {},
            },
        });
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     * @param {Object} [params] - Optional parameters for opening the page.
     * @param {'debug' | 'production'} [params.mode] - Optional parameters for opening the page.
     * @param {boolean} [params.willThrow] - Optional flag to simulate an exception
     * @param {Record<string, any>} [params.additional] - Optional map of key/values to add
     */
    async openPage({ mode = 'debug', additional, willThrow = false } = {}) {
        await this.mocks.install();
        const searchParams = new URLSearchParams({ mode, willThrow: String(willThrow) });
        for (const [key, value] of Object.entries(additional || {})) {
            searchParams.set(key, value);
        }

        searchParams.set('settings', String(this.entries));

        // eslint-disable-next-line no-undef
        if (process.env.PAGE) {
            await this.page.goto('/' + '?' + searchParams.toString());
        } else {
            await this.page.goto('/settings' + '?' + searchParams.toString());
        }
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new SettingsTestPage(page, build, platformInfo);
    }

    async darkMode() {
        await this.page.emulateMedia({ colorScheme: 'dark' });
    }
    async lightMode() {
        await this.page.emulateMedia({ colorScheme: 'light' });
    }

    didMakeInitialQueries() {
        throw new Error('todo: implement didMakeInitialQueries');
        // const rangesCall = await this.mocks.waitForCallCount({ method: 'getRanges', count: 1 });
        // const calls = await this.mocks.waitForCallCount({ method: 'query', count: 1 });
        // expect(calls[0].payload.params).toStrictEqual(queryType({ query, limit: 150, offset: 0, source: 'initial' }));
        // expect(rangesCall[0].payload.params).toStrictEqual({});
    }

    /**
     * @param {string} term
     */
    async types(term) {
        const { page } = this;
        await page.getByPlaceholder('Search').fill(term);
    }

    async clearsInput() {
        const { page } = this;
        await page.getByPlaceholder('Search').fill('');
    }

    async didResetScroll() {
        const { page } = this;
        const scrollPosition = await page.waitForFunction(() => {
            const scrollableItem = document.querySelector('main');
            return scrollableItem ? scrollableItem.scrollTop === 0 : false;
        });
        expect(scrollPosition).toBeTruthy();
    }

    async opensLinks() {
        const row = this.main().locator('[aria-selected]').nth(0);
        await row.dblclick();
        await row.dblclick({ modifiers: ['Meta'] });
        await row.dblclick({ modifiers: ['Shift'] });

        await row.locator('a').click({ button: 'middle', force: true });
        await this._opensMainLink();
    }
    async _opensMainLink() {
        const calls = await this.mocks.waitForCallCount({ method: 'open', count: 3 });
        const url = 'https://www.youtube.com/watch?v=75Mw8r5gW8E';

        expect(calls[0].payload.params).toStrictEqual({
            url,
            target: 'same-tab',
        });

        expect(calls[1].payload.params).toStrictEqual({
            url,
            target: 'new-tab',
        });

        expect(calls[2].payload.params).toStrictEqual({
            url,
            target: 'new-window',
        });

        expect(calls[3].payload.params).toStrictEqual({
            url,
            target: 'new-tab',
        });
    }

    async sidebarHasItem(label) {
        const { page } = this;
        await expect(page.getByLabel(label)).toBeVisible({ timeout: 1000 });
    }

    async hasEmptyState() {
        const { page } = this;
        await expect(page.getByRole('heading', { level: 2, name: 'Nothing to see here!' })).toBeVisible();
        await expect(page.getByText('No browsing settings yet.')).toBeVisible();
    }

    async hasNoResultsState() {
        const { page } = this;
        await expect(page.getByRole('heading', { level: 2, name: 'No results found for "empty"' })).toBeVisible();
        await expect(page.getByText('Try searching for a different URL or keywords')).toBeVisible();
    }

    async pressesEscape() {
        const { page } = this;
        const main = page.locator('body');
        await main.press('Escape');
    }

    _withDialogHandling() {
        throw new Error('todo: implement _withDialogHandling');
        // const { page } = this;
        //
        // const handler = (dialog) => {
        //     return dialog.accept();
        // };
        // page.on('dialog', handler);
        // return () => {
        //     page.off('dialog', handler);
        // };
    }

    /**
     * @param {string} domain
     */
    async inputContainsDomain(domain) {
        const { page } = this;
        await expect(page.getByPlaceholder('Search')).toHaveValue(domain);
    }

    /**
     * @param {string} term
     */
    async didUpdateUrlWithQueryTerm(term) {
        const { page } = this;
        await page.waitForURL((url) => url.searchParams.get('q') === term);
    }

    /**
     * @param {number} count
     */
    async hasRowCount(count) {
        const { page } = this;
        const rows = page.locator('main').locator('[aria-selected]');
        const rowCount = await rows.count();
        expect(rowCount).toBe(count);
    }

    /**
     * @param {number} count
     */
    async waitForRowCount(count) {
        const { page } = this;
        await page.waitForFunction((count) => document.querySelector('main')?.querySelectorAll('[aria-selected]').length === count, count);
    }

    sidebar() {
        return this.page.locator('aside');
    }

    main() {
        return this.page.locator('main');
    }
    header() {
        return this.page.locator('header');
    }

    async submitSearchForm() {
        await this.page.getByRole('searchbox', { name: 'Search your settings' }).press('Enter');
    }

    /**
     * @param {object} params
     * @param {string} params.hex
     * @returns {Promise<void>}
     */
    async hasBackgroundColor({ hex }) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const rgb = `rgb(${[r, g, b].join(', ')})`;
        await expect(this.page.locator('[data-layout-mode="normal"]')).toHaveCSS('background-color', rgb, { timeout: 50 });
    }
}
