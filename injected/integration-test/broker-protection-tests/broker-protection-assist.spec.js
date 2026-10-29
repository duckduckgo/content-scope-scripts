import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures.js';

const test = createConfiguredDbpTest(base);

const OVERLAY = 'ddg-pir-assist';

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
            field.addEventListener('input', () => inputEvents++);
            const sample = () => {
                if (values[values.length - 1] !== field.value) values.push(field.value);
                requestAnimationFrame(sample);
            };
            sample();
            Object.assign(globalThis, { readFirstName: () => ({ values, inputEvents }) });
        });
        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: true });
        await dbp.receivesAction('fill-form.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await dbp.isFormFilled();
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);

        const { values, inputEvents } = await dbp.page.evaluate(() => globalThis.readFirstName());
        expect(values.some((value) => value.length > 0 && value.length < 'John'.length)).toBe(true);
        expect(values[values.length - 1]).toBe('John');
        // fillForm itself dispatches two input events per field; the visible re-type adds none.
        expect(inputEvents).toBe(2);
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

        await dbp.page.waitForTimeout(1200);
        expect(await dbp.collector.waitForMessage('userTurnCompleted')).toHaveLength(1);
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
        const held = await dbp.collector.outgoingMessages();
        expect(held.filter((call) => 'method' in call.payload && call.payload.method === 'actionCompleted')).toHaveLength(0);

        await dbp.simulateSubscriptionMessage('userTurnEnded', { reason: 'userConfirmed' });
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });
});
