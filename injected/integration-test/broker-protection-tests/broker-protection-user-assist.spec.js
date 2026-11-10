import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';
import { BrokerProtectionPage } from '../page-objects/broker-protection.js';

const test = createConfiguredDbpTest(base);

const OVERLAY = 'ddg-pir-assist';
const TURNSTILE_USER_ASSIST_ID = 'ua-7e2b4c91-0d3a-4f6e-8b15-6a9c2d4e8f30';
const HCAPTCHA_USER_ASSIST_ID = 'ua-3f9d6a28-81c4-4e0b-a7d2-5b6e9c1f4a07';

/**
 * @param {BrokerProtectionPage} dbp
 * @param {string} method
 */
async function sentCount(dbp, method) {
    const calls = await dbp.collector.outgoingMessages();
    return calls.filter((call) => 'method' in call.payload && call.payload.method === method).length;
}

test.describe('Broker Protection userAssist', () => {
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

    test('a newer action cancels a pending hand-off', async ({ dbp }) => {
        await dbp.navigatesToSite('people-search/additional-fields.html');
        await dbp.receivesAction('user-assist/hcaptcha.json');
        await dbp.collector.waitForMessage('userTurnNeeded');

        await dbp.receivesAction('user-assist/certify-click.json');

        const responses = await dbp.collector.waitForMessage('actionCompleted', 2);
        dbp.isErrorMessage(responses, HCAPTCHA_USER_ASSIST_ID);
        dbp.isSuccessMessage(responses, '013eb5ef-b479-41a6-af92-da9056c00781');
        await expect(dbp.page.locator(OVERLAY)).toHaveCount(0);
    });
});

test.describe('Broker Protection visualizeActions', () => {
    test('visibly retypes filled values without changing what the page receives', async ({ dbp, context }, workerInfo) => {
        const visualized = BrokerProtectionPage.create(await context.newPage(), workerInfo.project.use);
        await visualized.withFeatureConfig(BROKER_PROTECTION_CONFIGS.visualizeActions);

        const runs = [];
        for (const run of [dbp, visualized]) {
            await run.navigatesToSite('people-search/optouts.html');
            await run.page.evaluate(recordFormActivity);
            await run.receivesAction('user-assist/fill-form.json');
            run.isSuccessMessage(await run.collector.waitForMessage('actionCompleted'));
            runs.push(await run.page.evaluate(() => globalThis.readFormActivity()));
        }
        const [plain, presented] = runs;

        expect(presented.values).toEqual({ fname: 'John', ln: 'Smith', state: 'IL' });
        expect(presented.values).toEqual(plain.values);
        expect(presented.events).toEqual(plain.events);
        expect(plain.shownFirstNames.some(isPartialFirstName)).toBe(false);
        expect(presented.shownFirstNames.some(isPartialFirstName)).toBe(true);
        expect(presented.shownFirstNames.at(-1)).toBe('John');
    });
});

/**
 * @param {string} value
 */
function isPartialFirstName(value) {
    return value.length > 0 && value.length < 'John'.length;
}

/**
 * Runs in the page: records the events the form's fields receive and each first name shown on screen.
 */
function recordFormActivity() {
    const form = /** @type {HTMLFormElement} */ (document.querySelector('#optout-form'));
    const firstName = /** @type {HTMLInputElement} */ (form.querySelector("input[name='fname']"));
    /** @type {string[]} */
    const events = [];
    for (const type of ['focus', 'blur', 'keydown', 'keyup', 'input', 'change']) {
        form.addEventListener(type, (event) => events.push(`${/** @type {HTMLInputElement} */ (event.target).name}:${type}`), true);
    }
    const shownFirstNames = [firstName.value];
    const sample = () => {
        if (shownFirstNames[shownFirstNames.length - 1] !== firstName.value) shownFirstNames.push(firstName.value);
        requestAnimationFrame(sample);
    };
    sample();
    Object.assign(globalThis, {
        readFormActivity: () => ({
            events,
            shownFirstNames,
            values: Object.fromEntries(
                ['fname', 'ln', 'state'].map((name) => [name, /** @type {HTMLInputElement} */ (form.elements.namedItem(name)).value]),
            ),
        }),
    });
}
