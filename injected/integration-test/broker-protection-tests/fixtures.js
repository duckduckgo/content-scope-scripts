import { BrokerProtectionPage } from '../page-objects/broker-protection.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';
/**
 * @import {PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestType, test as playwrightTest} from "@playwright/test"
 */

/**
 * @param {typeof playwrightTest} test
 * @return {TestType<PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions & { dbp: BrokerProtectionPage }, {}>}
 */
export function createConfiguredDbpTest(test) {
    return test.extend({
        dbp: async ({ page }, use, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.withFeatureConfig(BROKER_PROTECTION_CONFIGS.default);
            await use(dbp);
        },
    });
}
