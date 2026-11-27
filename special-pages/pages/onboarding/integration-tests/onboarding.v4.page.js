import { expect } from '@playwright/test';
import { OnboardingPage } from './onboarding.page.js';
import { perPlatform } from 'injected/integration-test/type-helpers.mjs';

export class OnboardingV4Page extends OnboardingPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new OnboardingV4Page(page, build, platformInfo);
    }

    withMockData(data) {
        this.mocks.defaultResponses({
            ...this.defaultResponses,
            ...data,
        });
    }

    /**
     * @param {boolean} adBlockingEnabled
     */
    async checkYouTubeText(adBlockingEnabled) {
        const expectedText = adBlockingEnabled ? 'Watch YouTube ad-free' : 'Play YouTube videos without ads';
        await expect(this.page.getByRole('table')).toContainText(expectedText);
    }

    async importUserData() {
        const { page } = this;
        await page.getByRole('button', { name: 'Import' }).click();
        await page.getByRole('img', { name: 'Completed Action' }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['requestImport'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'requestImport',
                    params: {},
                },
            },
        ]);
    }

    async importUserDataFailedGracefully() {
        const { page } = this;
        await page.getByRole('button', { name: 'Import Now', exact: true }).click();
        await page.getByRole('button', { name: 'Import', exact: true }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['requestImport'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'requestImport',
                    params: {},
                },
            },
        ]);
    }

    async restoreSession() {
        const { page } = this;
        await page.getByRole('button', { name: 'Enable Session Restore' }).click();
        await page.getByRole('img', { name: 'Completed Action' }).waitFor();
        const calls = await this.mocks.outgoing({ names: ['setSessionRestore'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setSessionRestore',
                    params: { enabled: true },
                },
            },
        ]);
    }

    async canToggleRestoreSession() {
        const { page } = this;
        const input = page.getByLabel('Enable Session Restore');

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
        const calls = await this.mocks.outgoing({ names: ['setSessionRestore'] });
        expect(calls).toMatchObject([
            // initial call from skipping:
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setSessionRestore',
                    params: { enabled: false },
                },
            },
            // subsequent calls from toggling:
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setSessionRestore',
                    params: { enabled: true },
                },
            },
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

    async enableEnhancedAdBlocking() {
        const { page } = this;
        await page.getByRole('button', { name: 'Turn on Enhanced Ad Blocking' }).click();
        await expect(page.getByRole('img', { name: 'Completed Action' })).toBeVisible();
        await this.didSetAdBlocking();
    }

    async enableYouTubeAdBlocking() {
        const { page } = this;
        await page.getByRole('button', { name: 'Block Ads' }).click();
        await expect(page.getByRole('img', { name: 'Completed Action' })).toBeVisible();
        await this.didSetAdBlocking();
    }

    async skipAdBlocking() {
        const { page } = this;
        await this.skippedCurrent();
        await page.getByRole('button', { name: 'Next' }).waitFor();
        await this.didSetAdBlocking({ enabled: false }); // important that setAdBlocking() is called when skipped so that native apps can fire a pixel
    }

    async skipYouTubeAdBlocking() {
        const { page } = this;
        await this.skippedCurrent();
        await page.getByRole('button', { name: 'Next' }).waitFor();
        await this.didSetAdBlocking({ enabled: false }); // important that setAdBlocking() is called when skipped so that native apps can fire a pixel
    }

    async didSetAdBlocking({ enabled = true } = {}) {
        const calls = await this.mocks.outgoing({ names: ['setAdBlocking'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'setAdBlocking',
                    params: { enabled },
                },
            },
        ]);
    }

    async startBrowsing() {
        const { page } = this;
        await page.getByRole('button', { name: 'Start Browsing' }).click();
        await this.didDismissToAddressBar();
    }

    async didDismissToAddressBar() {
        await this.mocks.waitForCallCount({ method: 'dismissToAddressBar', count: 1 });
        const calls = await this.mocks.outgoing({ names: ['dismissToAddressBar'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'dismissToAddressBar',
                    params: {},
                },
            },
        ]);
    }

    /**
     * @param {import('../app/types').SubmitQueryParams} params
     */
    async didSubmitQuery(params) {
        const calls = await this.mocks.outgoing({ names: ['submitQuery'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'submitQuery',
                    params,
                },
            },
        ]);
    }

    /**
     * Asserts exactly one addFavorites was sent, with exactly these favorites.
     * @param {import('../types/onboarding.ts').AddFavorites['favorites']} favorites
     */
    async didAddFavorites(favorites) {
        const calls = await this.mocks.outgoing({ names: ['addFavorites'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'addFavorites',
                    params: { favorites },
                },
            },
        ]);
    }

    async didNotAddFavorites() {
        const calls = await this.mocks.outgoing({ names: ['addFavorites'] });
        expect(calls).toHaveLength(0);
    }

    /**
     * Opens the picker step, with customize before it and addressBarMode after it.
     * @param {{ reducedMotion?: boolean, init?: Record<string, any> }} [options] - without reduced motion the step stays
     *   mounted through its exit fade; `init` adds to or replaces fields of the init response
     */
    async goToTopSitesPicker({ reducedMotion = true, init = {} } = {}) {
        this.withInitData({
            stepDefinitions: null,
            steps: ['welcome', 'getStarted', 'customize', 'topSitesPicker', 'addressBarMode'],
            ...init,
        });
        if (reducedMotion) await this.reducedMotion();
        await this.openPage({ env: 'app', page: 'topSitesPicker' });
        await this.page.getByRole('button', { name: 'Skip' }).waitFor({ timeout: 1000 });
    }

    /**
     * Opens customize with the picker listed after it, so leaving customize asks native about the picker.
     * @param {{ steps?: string[] }} [options] - replaces the default steps, which put addressBarMode after the picker
     */
    async goToStepBeforeTopSitesPicker({ steps = ['welcome', 'getStarted', 'customize', 'topSitesPicker', 'addressBarMode'] } = {}) {
        this.withInitData({ stepDefinitions: null, steps });
        await this.reducedMotion();
        await this.openPage({ env: 'app', page: 'customize' });
        await this.skippedBookmarksBar();
        await this.skippedSessionRestore();
        await this.skippedShowHomeButton();
    }

    /**
     * Opens the addressBarMode step with searchOrChat listed after it, optionally picks Search Only, and moves on.
     * @param {{ searchOnly?: boolean }} [options]
     */
    async goToSearchOrChat({ searchOnly = false } = {}) {
        const { page } = this;
        this.withInitData({ stepDefinitions: null, steps: ['welcome', 'getStarted', 'addressBarMode', 'searchOrChat'] });
        await this.reducedMotion();
        await this.openPage({ env: 'app', page: 'addressBarMode' });
        if (searchOnly) {
            await page.getByRole('button', { name: 'Search Only' }).click();
        }
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('textbox').waitFor({ timeout: 1000 });
    }

    async hasAdditionalInformationV4() {
        const { page } = this;
        await expect(page.getByText('Set things up just the way you want.')).toBeVisible();
    }

    async showDockInstructions() {
        const { page } = this;
        await page.getByRole('button', { name: 'Show Me How' }).click();
        await expect(page.getByText('Hold control and click the DuckDuckGo app icon')).toBeVisible();
    }

    async dismissDockInstructions() {
        const { page } = this;
        await page.getByRole('button', { name: 'Next' }).click();
    }
}
