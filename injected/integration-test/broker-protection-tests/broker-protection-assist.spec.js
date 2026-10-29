import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures.js';

const test = createConfiguredDbpTest(base);

const OVERLAY = 'ddg-pir-assist';
// How often the page checks the challenge's token field (TOKEN_POLL_MS in user-assist.js).
const TOKEN_POLL_MS = 500;

/**
 * @param {import('../page-objects/broker-protection.js').BrokerProtectionPage} dbp
 * @param {string} method
 */
async function sentCount(dbp, method) {
    const calls = await dbp.collector.outgoingMessages();
    return calls.filter((call) => 'method' in call.payload && call.payload.method === method).length;
}

test.describe('Broker Protection user assist', () => {
    test('draws nothing unless native turns assist mode on', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.receivesAction('fill-form.json');
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await dbp.isFormFilled();
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });

    test('types filled values visibly without sending extra events', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.page.evaluate(() => {
            const field = /** @type {HTMLInputElement} */ (document.querySelector('#user_first_name'));
            /** @type {string[]} */
            const values = [];
            let inputEvents = 0;
            /** @type {number | null} */
            let inputEventsAfterFill = null;
            field.addEventListener('input', () => inputEvents++);
            const sample = () => {
                if (values[values.length - 1] !== field.value) values.push(field.value);
                if (inputEventsAfterFill === null && field.value === 'John') inputEventsAfterFill = inputEvents;
                requestAnimationFrame(sample);
            };
            sample();
            Object.assign(globalThis, { readFirstName: () => ({ values, inputEvents, inputEventsAfterFill }) });
        });
        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: true });
        await dbp.receivesAction('fill-form.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await dbp.isFormFilled();
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);

        const { values, inputEvents, inputEventsAfterFill } = await dbp.page.evaluate(() => globalThis.readFirstName());
        expect(values.some((value) => value.length > 0 && value.length < 'John'.length)).toBe(true);
        expect(values[values.length - 1]).toBe('John');
        expect(inputEvents).toBe(inputEventsAfterFill);
    });

    test('keeps a value the page reformats while the fill is replayed', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.page.evaluate(() => {
            const field = /** @type {HTMLInputElement} */ (document.querySelector('#user_phone'));
            // Stands in for a site formatter that rewrites the field while the replay is part-way through.
            const watch = () => {
                if (field.value.length > 0 && field.value.length < 10) field.value = 'formatted by page';
                else requestAnimationFrame(watch);
            };
            watch();
        });
        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: true });
        await dbp.receivesAction('fill-form.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator('#user_phone')).toHaveValue('formatted by page');
    });

    test('presents clicks, and removes the overlay when native turns assist mode off', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: true });
        await dbp.receivesAction('click.json');
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);

        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: false });
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });

    test('ignores a token that was already there when the turn started', async ({ dbp }) => {
        await dbp.navigatesTo('cloudflare-captcha.html');
        await dbp.page.evaluate(() => {
            /** @type {HTMLInputElement} */ (document.querySelector("input[name='cf-turnstile-response']")).value = 'expired';
        });
        await dbp.simulateSubscriptionMessage('userTurnStarted', { kind: 'turnstile', tokenSelector: null });

        await dbp.page.waitForTimeout(2 * TOKEN_POLL_MS + 100);
        expect(await sentCount(dbp, 'userTurnCompleted')).toBe(0);

        await dbp.page.evaluate(() => {
            /** @type {HTMLInputElement} */ (document.querySelector("input[name='cf-turnstile-response']")).value = 'fresh';
        });
        await dbp.collector.waitForMessage('userTurnCompleted');
    });

    test('reports once when the user solves an embedded Turnstile', async ({ dbp }) => {
        await dbp.navigatesTo('cloudflare-captcha.html');
        await dbp.simulateSubscriptionMessage('userTurnStarted', { kind: 'turnstile', tokenSelector: null });
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);

        await dbp.page.evaluate(() => {
            /** @type {HTMLInputElement} */ (document.querySelector("input[name='cf-turnstile-response']")).value = 'token';
        });
        const messages = await dbp.collector.waitForMessage('userTurnCompleted');
        expect(messages[0].payload.params).toEqual({ kind: 'turnstile' });

        await dbp.page.waitForTimeout(2 * TOKEN_POLL_MS + 100);
        expect(await sentCount(dbp, 'userTurnCompleted')).toBe(1);
    });

    test('watches a token selector native provides', async ({ dbp }) => {
        await dbp.navigatesTo('re-captcha.html');
        await dbp.simulateSubscriptionMessage('userTurnStarted', { kind: 'generic', tokenSelector: '#g-recaptcha-response' });
        await dbp.page.evaluate(() => {
            /** @type {HTMLTextAreaElement} */ (document.querySelector('#g-recaptcha-response')).value = 'token';
        });
        const messages = await dbp.collector.waitForMessage('userTurnCompleted');
        expect(messages[0].payload.params).toEqual({ kind: 'generic' });
    });

    test('holds actions until the user turn ends', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.simulateSubscriptionMessage('userTurnStarted', { kind: 'generic', tokenSelector: null });
        await dbp.receivesAction('click.json');

        await dbp.page.waitForTimeout(1000);
        expect(await sentCount(dbp, 'actionCompleted')).toBe(0);

        await dbp.simulateSubscriptionMessage('userTurnEnded', { reason: 'userConfirmed' });
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });
});
