import { BrokerProtectionPage } from '../page-objects/broker-protection.js';
/**
 * @import {PlaywrightTestArgs, PlaywrightTestOptions, PlaywrightWorkerArgs, PlaywrightWorkerOptions, TestType} from "@playwright/test"
 */

/**
 * @param {typeof import("@playwright/test").test} test
 * @return {TestType<PlaywrightTestArgs & PlaywrightTestOptions & PlaywrightWorkerArgs & PlaywrightWorkerOptions & { createConfiguredDbp: (config: Record<string, any>) => Promise<BrokerProtectionPage> }, {}>}
 */
export function createConfiguredDbpTest(test) {
    return test.extend({
        createConfiguredDbp: async ({ page }, use, workerInfo) => {
            /**
             * @param {Record<string, any>} config
             */
            const createWithConfig = async (config) => {
                const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
                await dbp.withFeatureConfig(config);
                return dbp;
            };

            await use(createWithConfig);
        },
    });
}
