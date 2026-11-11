import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures.js';

const test = createConfiguredDbpTest(base);

const OVERLAY = 'ddg-pir-assist';
const TURNSTILE_USER_ASSIST_ID = 'ua-7e2b4c91-0d3a-4f6e-8b15-6a9c2d4e8f30';

/**
 * @param {import('../page-objects/broker-protection.js').BrokerProtectionPage} dbp
 * @param {string} method
 */
async function sentCount(dbp, method) {
    const calls = await dbp.collector.outgoingMessages();
    return calls.filter((call) => 'method' in call.payload && call.payload.method === method).length;
}

test.describe('Broker Protection userAssist', () => {
    test.beforeEach(async ({ dbp }) => {
        // The Windows mock also tries to answer notifications, and under page.clock its "response not found" error fails the test.
        await dbp.collector.updateMockResponse({ actionCompleted: null, userTurnNeeded: null });
    });

    test('completes straight away when the page already shows the step is done', async ({ dbp }) => {
        await dbp.navigatesToSite('people-search/optouts.html');
        await dbp.receivesAction('user-assist/opening.json');

        dbp.isSuccessMessage(await dbp.collector.waitForMessage('actionCompleted'));
        expect(await sentCount(dbp, 'userTurnNeeded')).toBe(0);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });

    test('hands the Turnstile to the user after the grace period, then completes once they solve it', async ({ dbp }) => {
        await dbp.page.clock.install();
        await dbp.navigatesToSite('people-search/optouts.html?turnstile=manual');
        await dbp.receivesAction('user-assist/turnstile.json');

        await dbp.page.clock.runFor(9_000);
        expect(await sentCount(dbp, 'userTurnNeeded')).toBe(0);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);

        await dbp.page.clock.runFor(1_000);
        const handOff = await dbp.collector.waitForMessage('userTurnNeeded');
        expect(handOff[0].payload.params).toEqual({ actionID: TURNSTILE_USER_ASSIST_ID });
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);
        expect(await sentCount(dbp, 'actionCompleted')).toBe(0);

        await dbp.page.getByRole('checkbox', { name: 'Verify you are human' }).click();
        await dbp.page.clock.runFor(1_000);
        dbp.isSuccessMessage(await dbp.collector.waitForMessage('actionCompleted'), TURNSTILE_USER_ASSIST_ID);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });
});
