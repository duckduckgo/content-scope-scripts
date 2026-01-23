import { OnboardingPage } from './onboarding.page.js';
import { perPlatform } from 'injected/integration-test/type-helpers.mjs';

export class OnboardingV2Page extends OnboardingPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create(page, testInfo) {
        const { platformInfo, build } = perPlatform(testInfo.project.use);
        return new OnboardingV2Page(page, build, platformInfo);
    }
}
