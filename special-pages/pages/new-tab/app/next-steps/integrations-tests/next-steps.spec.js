import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';

test.describe('newtab NextSteps cards', () => {
    test('fetches config + next steps data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextSteps: 'bringStuff' });
        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'nextSteps_getData', count: 1 });
        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
    });

    test('renders a dismiss button', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextSteps: 'bringStuff' });
        await page.getByTestId('dismissBtn').click();
        await ntp.mocks.waitForCallCount({ method: 'nextSteps_dismiss', count: 1 });
    });

    test('renders corresponding title text and action text', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ nextSteps: 'bringStuff' });
        await page.getByText('Bring Your Stuff').waitFor();
        await page.getByRole('button', { name: 'Import Now' }).click();
        await ntp.mocks.waitForCallCount({ method: 'nextSteps_action', count: 1 });
        await ntp.openPage({ nextSteps: 'defaultApp' });
        await page.getByText('Set as Default Browser').waitFor();
        await page.getByRole('button', { name: 'Make Default Browser' }).click();
        await ntp.mocks.waitForCallCount({ method: 'nextSteps_action', count: 1 });
    });
});
