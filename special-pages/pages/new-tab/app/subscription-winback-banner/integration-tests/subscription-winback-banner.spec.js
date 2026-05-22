import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';

test.describe('newtab remote messaging framework subscriptionWinBackBanner', () => {
    test('fetches config + data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ winback: 'winback_last_day' });

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'winBackOffer_getData', count: 1 });

        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
    });

    test('renders a title, descriptionText an action button, and dismiss button', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ winback: 'winback_last_day' });

        await page.getByRole('heading', { name: 'Last day to save 25%!' }).waitFor();
        await page.getByText('Stay protected with our').waitFor();

        await page.getByRole('button', { name: 'See Offer' }).click();
        await ntp.mocks.waitForCallCount({ method: 'winBackOffer_action', count: 1 });
        await page.getByTestId('dismissBtn').click();
        await ntp.mocks.waitForCallCount({ method: 'winBackOffer_dismiss', count: 1 });
    });
});
