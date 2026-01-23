import { expect } from '@playwright/test';
import { OnboardingPage } from './onboarding.page.js';
import { perPlatform } from 'injected/integration-test/type-helpers.mjs';

export class OnboardingV1Page extends OnboardingPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new OnboardingV1Page(page, build, platformInfo);
    }

    async skipsOnboarding() {
        await this.page.getByTestId('skip').click({
            clickCount: 5,
        });
    }

    async didSendStepCompletedMessages() {
        const calls = await this.mocks.outgoing({ names: ['stepCompleted'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'stepCompleted',
                    params: { id: 'welcome' },
                },
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'stepCompleted',
                    params: { id: 'getStarted' },
                },
            },
        ]);
    }

    async choseToStartBrowsing() {
        await this.page.getByRole('button', { name: 'Start Browsing' }).click();
    }

    async didDismissToSearch() {
        await this.mocks.waitForCallCount({ method: 'dismissToAddressBar', count: 1, timeout: 500 });
    }

    async didDismissToSettings() {
        await this.page.getByRole('link', { name: 'Settings' }).click();
        await this.mocks.waitForCallCount({ method: 'dismissToSettings', count: 1, timeout: 500 });
    }

    async hasAdditionalInformation() {
        const { page } = this;
        await expect(page.locator('h2')).toContainText('Make DuckDuckGo work just the way you want.');
    }

    async handlesFatalException() {
        const { page } = this;
        await expect(page.getByRole('heading')).toContainText('Something went wrong');
        const calls = await this.mocks.waitForCallCount({ method: 'reportPageException', count: 1 });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'reportPageException',
                    params: {
                        message: 'Simulated Exception',
                        id: 'welcome',
                    },
                },
            },
        ]);
    }

    async getStarted() {
        const { page } = this;
        await page.getByRole('button', { name: 'Get Started' }).click();
        await expect(page.getByLabel('Unlike other browsers,')).toContainText(
            'Unlike other browsers, DuckDuckGo comes with privacy by default',
        );
    }

    async didSendInitialHandshake() {
        const calls = await this.mocks.outgoing({ names: ['init'] });
        expect(calls).toMatchObject([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'onboarding',
                    method: 'init',
                },
            },
        ]);
    }
}
