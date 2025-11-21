import { test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { ProtectionsPage } from './protections.page.js';

test.describe('protections report', () => {
    test('fetches config + data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { 'protections.feed': 'privacy-stats' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
        ]);
    });
    test('displays privacy-stats', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { 'protections.feed': 'privacy-stats' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'stats_getData', count: 1 }),
        ]);
    });
    test('displays activity', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { 'protections.feed': 'activity' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'activity_getData', count: 1 }),
        ]);
    });
    test('receives total count update', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'protections.feed': 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        // Use default (undefined = legacy UI / current production)
        await protections.receivesUpdatedTotal(100);
    });
    test('localization smoke test', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'protections.feed': 'activity', locale: 'pl' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.hasPolishText();
    });

    test('displays cookie popup blocking stats when enabled and counts > 0', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'protections.feed': 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.displaysCookiePopupStats();
    });

    test('hides cookie popup stats when CPM is disabled (null)', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'protections.feed': 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.hidesCookiePopupStatsWhenDisabled();
    });

    test('hides cookie popup stats when count is 0', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'protections.feed': 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.hidesCookiePopupStatsWhenZero();
    });

    test('displays info tooltip', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        // Use cpm: 'null' to enable new UI (feature available but disabled)
        await ntp.openPage({ additional: { 'protections.feed': 'activity', cpm: 'null' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.hasInfoTooltip();
    });
});
