import { Mocks } from '../../../shared/mocks.js';
import { expect } from '@playwright/test';
import { join } from 'node:path';

/**
 * @typedef {import('injected/integration-test/type-helpers.mjs').Build} Build
 * @typedef {import('injected/integration-test/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

/**
 * @abstract
 */
export class OnboardingPage {
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
            featureName: 'onboarding',
            env: 'development',
        });
        this.page.on('console', console.log);
        this.defaultResponses = {
            requestSetAsDefault: {},
            requestDockOptIn: {},
            requestImport: { enabled: true },
            stepCompleted: {},
            setAdBlocking: {},
            reportPageException: {},
            init: {
                stepDefinitions: {
                    systemSettings: {
                        // this 'dock' is not part of the default
                        rows: ['dock', 'import', 'default-browser'],
                    },
                },
                env: 'development',
            },
        };
        // default mocks - just enough to render the first page without error
        this.mocks.defaultResponses(this.defaultResponses);
    }

    withInitData(data) {
        this.mocks.defaultResponses({
            ...this.defaultResponses,
            init: data,
        });
    }

    /**
     * Opens a page with optional parameters.
     * This method ensures that mocks are installed and routes are set up before navigating to the page.
     *
     * @param {Object} [params] - Optional parameters for opening the page.
     * @param {'app' | 'components'} [params.env] - Optional parameters for opening the page.
     * @param {import('../app/types.js').Step['id']} [params.page] - Optional start page
     * @param {boolean} [params.willThrow] - Optional flag to simulate an exception
     * @param {boolean} [params.debugState] - Optional flag to show debug state overlay (default: true)
     */
    async openPage({ env = 'app', page = 'welcome', willThrow = false, debugState = true } = {}) {
        await this.mocks.install();
        const searchParams = new URLSearchParams({ env, page, willThrow: String(willThrow) });
        if (debugState) {
            searchParams.set('debugState', 'true');
        }
        await this.page.route('/**', (route, req) => {
            const url = new URL(req.url());
            // try to serve assets, but change `/` to 'index'
            let filepath = url.pathname;
            if (filepath === '/') filepath = 'index.html';

            return route.fulfill({
                status: 200,
                path: join(this.basePath, filepath),
            });
        });
        await this.page.goto('/' + '?' + searchParams.toString());
    }

    async reducedMotion() {
        await this.page.emulateMedia({ reducedMotion: 'reduce' });
    }

    async darkMode() {
        await this.page.emulateMedia({ colorScheme: 'dark' });
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath() {
        return this.build.switch({
            windows: () => '../build/windows/pages/onboarding',
            apple: () => '../Sources/ContentScopeScripts/dist/pages/onboarding',
        });
    }

    async skippedCurrent() {
        await this.page.getByRole('button', { name: 'Skip' }).click();
    }

    async showBookmarksBar() {
        const { page } = this;
        await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click();
        await page.getByRole('img', { name: 'Completed Action' }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['setBookmarksBar'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: true },
                },
            },
        ]);
    }

    async skippedBookmarksBar() {
        await this.skippedCurrent();
        await this.page.getByRole('switch', { name: 'Show Bookmarks Bar' }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['setBookmarksBar'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: false },
                },
            },
        ]);
    }

    async skippedSessionRestore() {
        await this.skippedCurrent();
        await this.page.getByRole('switch', { name: 'Enable Session Restore' }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['setSessionRestore'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setSessionRestore',
                    params: { enabled: false },
                },
            },
        ]);
    }

    async skippedShowHomeButton() {
        await this.skippedCurrent();
        await this.page.getByRole('switch', { name: 'Show Home Button' }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['setShowHomeButton'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: false },
                },
            },
        ]);
    }

    async canToggleBookmarksBar() {
        const { page } = this;
        const input = page.getByLabel('Bookmarks Bar');

        // control: ensure we're starting in the 'off' state
        expect(await input.isChecked()).toBe(false);

        // now turn it on
        await input.click();
        await page.waitForTimeout(100);
        expect(await input.isChecked()).toBe(true);

        // and then back off
        await input.click();
        await page.waitForTimeout(100);
        expect(await input.isChecked()).toBe(false);

        // now check the outgoing messages
        const calls = await this.mocks.outgoing({ names: ['setBookmarksBar'] });
        expect(calls).toMatchObject([
            // initial call from skipping:
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: false },
                },
            },
            // subsequent calls from toggling:
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: true },
                },
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setBookmarksBar',
                    params: { enabled: false },
                },
            },
        ]);
    }

    async canToggleHomeButton() {
        const { page } = this;
        const input = page.getByLabel('Home Button');

        // control: ensure we're starting in the 'off' state
        expect(await input.isChecked()).toBe(false);

        // now turn it on
        await input.click();
        await page.waitForTimeout(100);
        expect(await input.isChecked()).toBe(true);

        // and then back off
        await input.click();
        await page.waitForTimeout(100);
        expect(await input.isChecked()).toBe(false);

        // now check the outgoing messages
        const calls = await this.mocks.outgoing({ names: ['setShowHomeButton'] });
        expect(calls).toMatchObject([
            // initial call from skipping:
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: false },
                },
            },
            // subsequent calls from toggling:
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: true },
                },
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: false },
                },
            },
        ]);
    }

    async showHomeButton() {
        const { page } = this;
        await page.getByRole('button', { name: 'Show Home Button' }).click();
        await expect(page.getByRole('img', { name: 'Completed Action' })).toBeVisible();
        const calls = await this.mocks.outgoing({ names: ['setShowHomeButton'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setShowHomeButton',
                    params: { enabled: true },
                },
            },
        ]);
    }

    async keepInTaskbar() {
        const { page } = this;
        const locator = this.build.switch({
            apple: () => page.getByRole('button', { name: 'Keep in Dock' }),
            windows: () => page.getByRole('button', { name: 'Pin to Taskbar' }),
        });
        await locator.click();
        const calls = await this.mocks.waitForCallCount({ method: 'requestDockOptIn', count: 1 });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'requestDockOptIn',
                },
            },
        ]);
    }
}
