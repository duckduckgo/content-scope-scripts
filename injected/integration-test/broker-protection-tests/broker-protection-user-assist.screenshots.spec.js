import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures.js';

const test = createConfiguredDbpTest(base);

test.describe('Broker Protection user assist screenshots @screenshots', () => {
    test.beforeEach(async ({ page }, workerInfo) => {
        test.skip(workerInfo.project.name !== 'apple-broker-protection', 'The overlay is the same on every platform');
        await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('Turnstile hand-off', async ({ dbp }) => {
        await handsOffTurnstile(dbp);
        await expect(dbp.page).toHaveScreenshot('turnstile-hand-off.png');
    });

    test('Turnstile hand-off on a page with a strict CSP', async ({ dbp }) => {
        await dbp.page.route('**/people-search/optouts.html*', async (route) => {
            const response = await route.fetch();
            await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': "default-src 'self'" } });
        });
        await handsOffTurnstile(dbp);
        await expect(dbp.page).toHaveScreenshot('turnstile-hand-off.png');
    });

    test('hCaptcha hand-off', async ({ dbp }) => {
        await dbp.navigatesToSite('people-search/additional-fields.html');
        await dbp.receivesAction('user-assist/hcaptcha.json');
        await dbp.collector.waitForMessage('userTurnNeeded');
        await expect(dbp.page).toHaveScreenshot('hcaptcha-hand-off.png');
    });
});

/**
 * @param {import('../page-objects/broker-protection.js').BrokerProtectionPage} dbp
 */
async function handsOffTurnstile(dbp) {
    await dbp.page.clock.install();
    await dbp.navigatesToSite('people-search/optouts.html?turnstile=manual');
    await dbp.receivesAction('user-assist/turnstile.json');
    await dbp.page.clock.runFor(10_000);
    await dbp.collector.waitForMessage('userTurnNeeded');
}
