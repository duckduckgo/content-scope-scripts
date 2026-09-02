import { Mocks } from '../../../shared/mocks.js';
import { perPlatform } from 'injected/integration-test/type-helpers.mjs';
import { join } from 'node:path';
import { expect } from '@playwright/test';

/**
 * @typedef {import('injected/integration-test/type-helpers.mjs').Build} Build
 * @typedef {import('injected/integration-test/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

export class SetAsDefaultPage {
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
            featureName: 'set-as-default',
            env: 'development',
        });
        this.page.on('console', console.log);
        this.mocks.defaultResponses({
            initialSetup: {
                env: 'development',
                locale: 'en',
            },
        });
    }

    /**
     * @param {Object} [params]
     * @param {boolean} [params.willThrow] - simulate a fatal exception
     * @param {Record<string, string>} [params.query] - extra query params, eg: arrow_x / arrow_y
     */
    async openPage({ willThrow = false, query = {} } = {}) {
        await this.mocks.install();
        await this.page.route('/**', (route, req) => {
            const url = new URL(req.url());
            let filepath = url.pathname;
            if (filepath === '/') filepath = 'index.html';

            return route.fulfill({
                status: 200,
                path: join(this.basePath, filepath),
            });
        });
        const searchParams = new URLSearchParams({ debugState: 'true', willThrow: String(willThrow), ...query });
        await this.page.goto('/' + '?' + searchParams.toString());
    }

    /**
     * @return {string}
     */
    get basePath() {
        return this.build.switch({
            windows: () => '../build/windows/pages/set-as-default',
        });
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new SetAsDefaultPage(page, build, platformInfo);
    }

    async darkMode() {
        await this.page.emulateMedia({ colorScheme: 'dark' });
    }

    async didSendInitialHandshake() {
        const calls = await this.mocks.outgoing({ names: ['initialSetup'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'set-as-default',
                    method: 'initialSetup',
                },
            },
        ]);
    }

    async didShowInstructions() {
        await expect(this.page.getByRole('main')).toContainText('Select the Set default button in your settings');
    }

    /**
     * @param {{left: string, top: string}} expected
     */
    async arrowHasPosition(expected) {
        const arrow = this.page.locator('svg[aria-hidden="true"]').locator('..');
        await expect(arrow).toHaveCSS('left', expected.left);
        await expect(arrow).toHaveCSS('top', expected.top);
    }

    async handlesFatalException() {
        await expect(this.page.getByText('A problem occurred with this feature')).toBeVisible();
        const calls = await this.mocks.waitForCallCount({ method: 'reportPageException', count: 1 });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'set-as-default',
                    method: 'reportPageException',
                    params: {
                        message: 'Set as Default application Simulated Exception',
                    },
                },
            },
        ]);
    }
}
