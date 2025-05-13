import { test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';

test.describe('protections report', () => {
    test('fetches config + data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { feed: 'protections', 'protections.feed': 'privacy-stats' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });

        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
        ]);
    });
    test('displays privacy-stats', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { feed: 'protections', 'protections.feed': 'privacy-stats' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
        ]);
        await page.pause();
    });
    test('displays activity', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { feed: 'protections', 'protections.feed': 'activity' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
        ]);
        await page.pause();
    });
});
