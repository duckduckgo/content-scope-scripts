import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { ProtectionsPage } from './protections.page.js';

test.describe('protections report', () => {
    test('fetches config + data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { protections_feed: 'privacy-stats' } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await Promise.all([
            ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
        ]);
    });
    test('displays privacy-stats', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { protections_feed: 'privacy-stats' } });
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

        await ntp.openPage({ additional: { protections_feed: 'activity' } });
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
        await ntp.openPage({ additional: { protections_feed: 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        // Use default (undefined = legacy UI / current production)
        await protections.receivesUpdatedTotal(100);
    });
    test('localization smoke test', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { protections_feed: 'activity', locale: 'pl' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.hasPolishText();
    });

    test.describe('report (new schema)', () => {
        /** @type {Record<string, string>} */
        const report = { protections: 'report', stats: 'report' };

        test('shows the headline and what trackers were trying to do', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.displaysHeadline();
            await protections.displaysPurposes();
            await protections.displaysCookieFooter(762);
        });

        test('the retired summary feed opens on the first view', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { ...report, protections_feed: 'privacy-stats' } });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.displaysPurposes();
        });

        test('switches views from the menu and persists the choice', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.hasViewOptions([
                'Why we blocked them',
                'Who we blocked the most',
                'Where they tried to track you',
                'When they tried to track you',
                'How they try to recognize you',
            ]);

            await protections.choosesView('Who we blocked the most', 'companies');
            await protections.displaysCompanies();

            await protections.choosesView('When they tried to track you', 'activity');
            // personal browsing history isn't offered for sharing
            await expect(protections.report().getByRole('button', { name: 'Share as image' })).toHaveCount(0);
            await ntp.mocks.waitForCallCount({ method: 'activity_getData', count: 1 });
            await expect(protections.report().getByTestId('Activity')).toBeVisible();
        });

        test('shows what companies are known to read from this device', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.choosesView('How they try to recognize you', 'recognition');
            await protections.displaysRecognition();
        });

        test('shares the report as an image', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            const png = await protections.sharesAsImage();
            await workerInfo.attach('protections-report.png', { body: png, contentType: 'image/png' });
        });

        test('shares the image through the share sheet when available', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            const protections = new ProtectionsPage(ntp);
            await protections.stubShareSheet('share');
            await ntp.openPage({ additional: report });
            await protections.ready();
            await protections.sharesViaShareSheet();
        });

        test('downloads the image when the share sheet refuses', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            const protections = new ProtectionsPage(ntp);
            await protections.stubShareSheet('refuse');
            await ntp.openPage({ additional: report });
            await protections.ready();
            await protections.sharesAsImage();
        });

        test('shows which sites had the most trackers', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { ...report, protections_feed: 'top-sites' } });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.displaysTopSites();
        });

        test('uses the built-in Tracker Radar table when native sends no categories', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { protections: 'report', stats: 'reportWithoutCategories' } });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            // no topSites in this mock, so that view is left out
            await protections.hasViewOptions([
                'Why we blocked them',
                'Who we blocked the most',
                'When they tried to track you',
                'How they try to recognize you',
            ]);
            await protections.displaysPurposesFromBuiltInTable();
        });

        test('updates the cookie pop-up footer from subscription data', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.receivesCookieCount(25);
        });

        test('hides the cookie pop-up footer when CPM is disabled (null)', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.hidesCookieFooterFor(null);
        });

        test('hides the cookie pop-up footer when the count is 0', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.hidesCookieFooterFor(0);
        });

        test('shows the empty state when nothing was blocked this week', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { protections: 'empty', stats: 'none' } });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.displaysEmptyReport();
        });

        test('explains why this matters', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.hasInfoPopover();
        });

        test('collapses and expands', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: report });

            const protections = new ProtectionsPage(ntp);
            await protections.ready();
            await protections.collapsesReport();
        });
    });

    test('scrolls to protections heading via subscription message', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { protections_feed: 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.scrollsToProtectionsHeading();
    });

    test('toggles collapsed/expanded from heading button', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { protections_feed: 'activity' } });

        const protections = new ProtectionsPage(ntp);
        await protections.ready();
        await protections.togglesCollapsedState();
    });
});
