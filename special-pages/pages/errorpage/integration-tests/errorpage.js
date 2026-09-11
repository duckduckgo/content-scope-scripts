import { join } from 'node:path';
import { perPlatform } from 'injected/integration-test/type-helpers.mjs';

export class ErrorPage {
    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('injected/integration-test/type-helpers.mjs').Build} build
     */
    constructor(page, build) {
        this.page = page;
        this.build = build;
    }

    async openPage() {
        await this.page.route('/**', (route, request) => {
            const url = new URL(request.url());
            const filePath = url.pathname === '/' ? 'index.html' : url.pathname;
            return route.fulfill({
                status: 200,
                path: join(this.basePath, filePath),
            });
        });
        await this.page.goto('/');
    }

    get basePath() {
        return this.build.switch({
            apple: () => '../Sources/ContentScopeScripts/dist/pages/errorpage',
        });
    }

    get link() {
        return this.page.locator('#error-page-link');
    }

    /**
     * @param {string} text
     * @param {string} callbackName
     */
    async configureLink(text, callbackName) {
        await this.page.evaluate(
            ({ text, callbackName }) => {
                const configureErrorPageLink = /** @type {any} */ (window).configureErrorPageLink;
                configureErrorPageLink({
                    text,
                    onClick: function () {
                        const calls = document.body.dataset.errorPageLinkCalls;
                        document.body.dataset.errorPageLinkCalls = calls ? `${calls},${callbackName}` : callbackName;
                    },
                });
            },
            { text, callbackName },
        );
    }

    /**
     * @param {'blank-text' | 'non-function-callback'} invalidValue
     */
    async clearLinkWithInvalidConfiguration(invalidValue) {
        await this.page.evaluate((invalidValue) => {
            const configureErrorPageLink = /** @type {any} */ (window).configureErrorPageLink;
            const configuration =
                invalidValue === 'blank-text'
                    ? {
                          text: '   ',
                          onClick: function () {
                              document.body.dataset.errorPageLinkCalls = 'invalid';
                          },
                      }
                    : { text: 'Still visible', onClick: null };
            configureErrorPageLink(configuration);
        }, invalidValue);
    }

    async clickLinkProgrammatically() {
        await this.link.evaluate((element) => /** @type {HTMLButtonElement} */ (element).click());
    }

    async callbackNames() {
        const calls = await this.page.locator('body').getAttribute('data-error-page-link-calls');
        return calls ? calls.split(',') : [];
    }

    /**
     * @param {string} themeVariant
     */
    async changeTheme(themeVariant) {
        await this.page.evaluate((themeVariant) => {
            const onChangeTheme = /** @type {any} */ (window).onChangeTheme;
            onChangeTheme({ themeVariant });
        }, themeVariant);
    }

    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('@playwright/test').TestInfo} testInfo
     */
    static create(page, testInfo) {
        const { build } = perPlatform(testInfo.project.use);
        return new ErrorPage(page, build);
    }
}
