import { BrokerProtectionPage } from '../page-objects/broker-protection.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';
/**
 * @import {PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestType, test as playwrightTest} from "@playwright/test"
 */

/**
 * @param {typeof playwrightTest} test
 * @param {object} [config]
 * @return {TestType<PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions & { dbp: BrokerProtectionPage }, {}>}
 */
export function createConfiguredDbpTest(test, config = BROKER_PROTECTION_CONFIGS.default) {
    return test.extend({
        dbp: async ({ page }, use, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.withFeatureConfig(config);
            await use(dbp);
        },
    });
}
