import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';

const test = createConfiguredDbpTest(base);
const visualizedTest = createConfiguredDbpTest(base, BROKER_PROTECTION_CONFIGS.visualizeActions);

const OVERLAY = 'ddg-pir-assist';

/**
 * @param {number} handOffAfterMs
 */
function userAssistAction(handOffAfterMs) {
    return {
        state: {
            action: {
                actionType: 'userAssist',
                id: 'solve-captcha',
                step: 'Searching for your record',
                highlight: '#captcha-widget',
                handOffAfterMs,
                completeWhen: [{ type: 'element', selector: "#optout-form input[name='cf-turnstile-response'][value]:not([value=''])" }],
            },
        },
    };
}

/**
 * @param {import('../page-objects/broker-protection.js').BrokerProtectionPage} dbp
 * @param {string} method
 */
async function sentCount(dbp, method) {
    const calls = await dbp.collector.outgoingMessages();
    return calls.filter((call) => 'method' in call.payload && call.payload.method === method).length;
}

test.describe('Broker Protection userAssist action', () => {
    test('completes straight away when completeWhen already passes', async ({ dbp }) => {
        await dbp.navigatesTo('user-assist.html');
        await dbp.page.click('#solve');
        await dbp.receivesInlineAction(userAssistAction(0));

        const response = await dbp.collector.waitForMessage('actionCompleted');
        expect(response[0].payload.params.result).toEqual({
            success: { actionID: 'solve-captcha', actionType: 'userAssist', response: null },
        });
        expect(await sentCount(dbp, 'userTurnNeeded')).toBe(0);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });

    test('hands off to the user after handOffAfterMs, then completes once they act', async ({ dbp }) => {
        await dbp.navigatesTo('user-assist.html');
        await dbp.receivesInlineAction(userAssistAction(1500));

        await dbp.page.waitForTimeout(700);
        expect(await sentCount(dbp, 'userTurnNeeded')).toBe(0);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);

        const handOff = await dbp.collector.waitForMessage('userTurnNeeded');
        expect(handOff[0].payload.params).toEqual({ actionID: 'solve-captcha' });
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);
        // reCAPTCHA's challenge popup uses 2000000000; hCaptcha's is clamped to the maximum.
        const zIndex = await dbp.page.locator(OVERLAY).evaluate((host) => Number(getComputedStyle(host).zIndex));
        expect(zIndex).toBeLessThan(2000000000);
        expect(await sentCount(dbp, 'actionCompleted')).toBe(0);

        await dbp.page.click('#solve');
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
        expect(await sentCount(dbp, 'userTurnNeeded')).toBe(1);
    });

    test('keeps waiting instead of failing until the user acts', async ({ dbp }) => {
        await dbp.navigatesTo('user-assist.html');
        await dbp.receivesInlineAction(userAssistAction(0));
        await dbp.collector.waitForMessage('userTurnNeeded');

        await dbp.page.waitForTimeout(2000);
        expect(await sentCount(dbp, 'actionCompleted')).toBe(0);
        expect(await sentCount(dbp, 'actionError')).toBe(0);
    });
});

test.describe('Broker Protection visualizeActions', () => {
    test('draws nothing for clicks and fills when the setting is off', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.receivesAction('fill-form.json');
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await dbp.isFormFilled();

        await dbp.receivesAction('click.json');
        await dbp.collector.waitForMessage('actionCompleted', 2);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });

    visualizedTest('types filled values visibly without sending extra events', async ({ dbp }) => {
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

    visualizedTest('keeps a value the page reformats while the fill is replayed', async ({ dbp }) => {
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
        await dbp.receivesAction('fill-form.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator('#user_phone')).toHaveValue('formatted by page');
    });

    visualizedTest('presents clicks', async ({ dbp }) => {
        await dbp.navigatesTo('form.html');
        await dbp.receivesAction('click.json');
        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(1);
    });
});
