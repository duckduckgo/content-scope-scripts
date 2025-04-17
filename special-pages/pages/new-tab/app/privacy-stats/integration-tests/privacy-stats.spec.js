import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { PrivacyStatsPage } from './privacy-stats.page.js';

test.describe('newtab privacy stats', () => {
    test('fetches config + stats', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stats: 'few' } });

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'stats_getData', count: 1 });
        const calls3 = await ntp.mocks.waitForCallCount({ method: 'stats_getConfig', count: 1 });

        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
        expect(calls3.length).toBe(1);

        const listItems = page.getByTestId('CompanyList').locator('li');
        expect(await listItems.count()).toBe(4);
        expect(await listItems.nth(0).textContent()).toBe('Facebook310');
        expect(await listItems.nth(1).textContent()).toBe('Google279');
        expect(await listItems.nth(2).textContent()).toBe('Amazon67');
        expect(await listItems.nth(3).textContent()).toBe('Google Ads2');

        await expect(psp.listFooter()).toHaveText('210 attempts from other networks');

        // show/hide
        await page.getByLabel('Hide recent activity').click();
        await page.getByLabel('Show recent activity').click();
    });
    test('titles', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stats: 'none' } });
        await psp.hasEmptyTrackersOnlyTitle();
        await ntp.openPage({ additional: { stats: 'some' } });
        await psp.hasPopulatedTrackersOnlyTitle();
        await ntp.openPage({ additional: { stats: 'none', adBlocking: 'enabled' } });
        await psp.hasEmptyAdsAndTrackersTitle();
        await ntp.openPage({ additional: { stats: 'some', adBlocking: 'enabled' } });
        await psp.hasPopulatedAdsAndTrackersTitle();
    });
    test('sending a pixel when show more is clicked', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stats: 'many' } });

        // show + hide
        await psp.showMoreSecondary();
        await psp.showLessSecondary();

        // assert the event were sent
        await ntp.mocks.waitForCallCount({ method: 'stats_showMore', count: 1 });
        await ntp.mocks.waitForCallCount({ method: 'stats_showLess', count: 1 });

        // to re-instate later
        // expect(calls1.length).toBe(2);
        // expect(calls1).toStrictEqual([
        //     {
        //         payload: {
        //             context: 'specialPages',
        //             featureName: 'newTabPage',
        //             method: 'telemetryEvent',
        //             params: { attributes: { name: 'stats_toggle', value: 'show_more' } },
        //         },
        //     },
        //     {
        //         payload: {
        //             context: 'specialPages',
        //             featureName: 'newTabPage',
        //             method: 'telemetryEvent',
        //             params: { attributes: { name: 'stats_toggle', value: 'show_less' } },
        //         },
        //     },
        // ]);
    });
    test(
        'hiding the expander when empty',
        {
            annotation: {
                type: 'issue',
                description: 'https://app.asana.com/0/0/1208792040873366/f',
            },
        },
        async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'none' } });
            await page.getByText('Tracking protections active').waitFor();
            await expect(page.getByLabel('Hide recent activity')).not.toBeVisible();
            await expect(page.getByLabel('Show recent activity')).not.toBeVisible();
        },
    );
    test(
        'bar width',
        {
            annotation: {
                type: 'issue',
                description: 'https://app.asana.com/0/0/1208800221025230/f',
            },
        },
        async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const psp = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'none' } });
            await page.getByText('Tracking protections active').waitFor();

            await psp.receiveData({
                totalCount: 2,
                trackerCompanies: [
                    { displayName: 'Google', count: 1 },
                    { displayName: 'Facebook', count: 1 },
                ],
            });

            await page.getByText('Google1').locator('[style="width: 100%;"]').waitFor();
            await page.getByText('Facebook1').locator('[style="width: 100%;"]').waitFor();

            await psp.receiveData({
                totalCount: 2,
                trackerCompanies: [
                    { displayName: 'Google', count: 5 },
                    { displayName: 'Facebook', count: 1 },
                ],
            });

            // Checking the first + last bar widths due to a regression
            await page.getByText('Google5').locator('[style="width: 100%;"]').waitFor();
            await page.getByText('Facebook1').locator('[style="width: 20%;"]').waitFor();
        },
    );
    test(
        'secondary expansion',
        {
            annotation: {
                type: 'issue',
                description: 'https://app.asana.com/0/1201141132935289/1208861172991227/f',
            },
        },
        async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const psp = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'none' } });

            // deliver enough companies to show the 'show more' toggle
            await psp.receive({ count: 6 });
            await psp.hasRows(5); // 1 is hidden
            await psp.showMoreSecondary();

            await psp.receive({ count: 7 });
            await psp.hasRows(7);
            await psp.showLessSecondary();

            await psp.receive({ count: 2 });
            await psp.hasRows(2);
        },
    );
    test(
        'when all trackers are not within the top 100 companies',
        {
            annotation: {
                type: 'issue',
                description: 'https://app.asana.com/0/1201141132935289/1209123210947322/f',
            },
        },
        async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const psp = new PrivacyStatsPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'onlyother' } });
            await psp.hasRows(0);
            await psp.hasHeading('2 tracking attempts blocked');
        },
    );
    test('ui state: toggling when there is many top sites, but zero other', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await psp.togglesOnlyTopSites();
    });
    test('ui state: no toggling when there is only top sites', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await psp.showsOnlyTopSitesWithoutToggle();
    });
    test('ui state: no toggle when the only other row is the `other` text', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await psp.showsTopSitesAndOtherText();
    });
    test('ui state: has toggle and shows `other` text when expanded', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const psp = new PrivacyStatsPage(page, ntp);
        await ntp.reducedMotion();
        await psp.showsTopSitesWithToggleAndOtherText();
    });
});
