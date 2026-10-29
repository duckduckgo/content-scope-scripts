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

    test('moves the cursor to click targets and still clicks', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: true });
        await dbp.receivesAction('click.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);
    });

    test('removes the overlay when native turns assist mode off', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.simulateSubscriptionMessage('setAssistMode', { enabled: true });
        await dbp.receivesAction('click.json');
        await dbp.collector.waitForMessage('actionCompleted');
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

        // Two token polls (500ms apart) without a report.
        await dbp.page.waitForTimeout(1100);
        const early = await dbp.collector.outgoingMessages();
        expect(early.filter((call) => 'method' in call.payload && call.payload.method === 'userTurnCompleted')).toHaveLength(0);

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
