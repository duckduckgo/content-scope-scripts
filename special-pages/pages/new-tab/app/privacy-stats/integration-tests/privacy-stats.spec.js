import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';

test.describe('newtab privacy stats', () => {
    test('fetches config + stats', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stats: 'few' } });

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'stats_getData', count: 1 });
        const calls3 = await ntp.mocks.waitForCallCount({ method: 'stats_getConfig', count: 1 });

        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
        expect(calls3.length).toBe(1);

        const listItems = page.getByTestId('CompanyList').locator('li');
        expect(await listItems.count()).toBe(5);
        expect(await listItems.nth(0).textContent()).toBe('Facebook310');
        expect(await listItems.nth(1).textContent()).toBe('Google279');
        expect(await listItems.nth(2).textContent()).toBe('Amazon67');
        expect(await listItems.nth(3).textContent()).toBe('Google Ads2');
        expect(await listItems.nth(4).textContent()).toBe('210 attempts from other networks');

        // show/hide
        await page.getByLabel('Hide recent activity').click();
        await page.getByLabel('Show recent activity').click();
    });
    test('sending a pixel when show more is clicked', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stats: 'many' } });
        await page.getByLabel('Show More', { exact: true }).click();
        await page.getByLabel('Show Less').click();
        const calls1 = await ntp.mocks.waitForCallCount({ method: 'telemetryEvent', count: 2 });
        expect(calls1.length).toBe(2);
        expect(calls1).toStrictEqual([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'newTabPage',
                    method: 'telemetryEvent',
                    params: { attributes: { name: 'stats_toggle', value: 'show_more' } },
                },
            },
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'newTabPage',
                    method: 'telemetryEvent',
                    params: { attributes: { name: 'stats_toggle', value: 'show_less' } },
                },
            },
        ]);
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
            await page.getByText('No recent tracking activity').waitFor();
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
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { stats: 'willUpdate', 'stats-update-count': '2' } });

            //
            // Checking the first + last bar widths due to a regression
            await page.getByText('Google Ads5').locator('[style="width: 100%;"]').waitFor();
            await page.getByText('Facebook1').locator('[style="width: 20%;"]').waitFor();
        },
    );
});
