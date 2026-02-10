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
        const expectedText = adBlockingEnabled ? 'Watch YouTube ad-free' : 'Play YouTube without targeted ads';
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

    async hasAdditionalInformationV4() {
        const { page } = this;
        await expect(page.locator('h2')).toContainText('Set things up just the way you want.');
    }
}
