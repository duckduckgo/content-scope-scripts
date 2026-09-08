import { expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { perPlatform } from '../type-helpers.mjs';
import { ResultsCollector } from './results-collector.js';
import { createCaptchaResponse } from '../mocks/broker-protection/captcha.js';
import { createFeatureConfig } from '../mocks/broker-protection/feature-config.js';

/**
 * @import { Page } from '@playwright/test'
 * @import { Build } from '../type-helpers.mjs'
 * @import { PlatformInfo } from '@duckduckgo/messaging/lib/test-utils.mjs'
 */

const RECAPTCHA_RESPONSE_ID = 'g-recaptcha-response';
const RECAPTCHA_RESPONSE_SELECTOR = `#${RECAPTCHA_RESPONSE_ID}`;

export class BrokerProtectionPage {
    /**
     * @param {Page} page
     * @param {Build} build
     * @param {PlatformInfo} platform
     */
    constructor(page, build, platform) {
        this.page = page;
        this.collector = new ResultsCollector(page, build, platform);
    }

    async enabled() {
        await this.collector.setup({ config: createFeatureConfig({ state: 'enabled' }) });
    }

    /**
     * @param {object} config
     */
    async withFeatureConfig(config) {
        await this.collector.setup({ config });
    }

    /**
     * @param {string} page - add more pages here as you need them
     * @return {Promise<void>}
     */
    async navigatesTo(page) {
        await this.page.goto('/broker-protection/pages/' + page);
    }

    /**
     * @param {string} selector
     */
    async elementIsAbsent(selector) {
        // control - ensure the element isn't there first
        const e = await this.page.$(selector);
        expect(e).toBeNull();
    }

    /**
     * @param {object} [options]
     * @return {Promise<void>}
     */
    async isFormFilled(options) {
        await expect(this.page.getByLabel('First Name:', { exact: true })).toHaveValue('John');
        await expect(this.page.getByLabel('Last Name:', { exact: true })).toHaveValue('Smith');
        await expect(this.page.getByLabel('Phone Number:', { exact: true })).toHaveValue(/^\d{10}$/);
        await expect(this.page.getByLabel('Street Address:', { exact: true })).toHaveValue(/^\d+ [A-Za-z]+(?: [A-Za-z]+)?$/);

        if (options && options.fullState) {
            await expect(this.page.locator('#full-state')).toHaveValue('Illinois');
        } else {
            await expect(this.page.locator('#state')).toHaveValue('IL');
        }

        await expect(this.page.getByLabel('Zip Code:', { exact: true })).toHaveValue(/^\d{5}$/);

        const randomValue = await this.page.getByLabel('Random number between 5 and 15:').inputValue();
        const randomValueInt = parseInt(randomValue);

        expect(Number.isInteger(randomValueInt)).toBe(true);
        expect(randomValueInt).toBeGreaterThanOrEqual(5);
        expect(randomValueInt).toBeLessThanOrEqual(15);

        await expect(this.page.getByLabel('City & State:', { exact: true })).toHaveValue('Chicago, IL');
    }

    /**
     * @param {string} selector - the selector for the input
     * @return {Promise<string>}
     */
    async getFormFieldValue(selector) {
        return await this.page.locator(selector).inputValue();
    }

    /**
     * @param {string} selector - the selector for the input
     * @param {string} desiredValue - the value we're wanting to match
     * @return {Promise<void>}
     */
    async doesInputValueEqual(selector, desiredValue) {
        const actualValue = await this.getFormFieldValue(selector);
        expect(actualValue).toEqual(desiredValue);
    }

    /**
     * @param {string} selector - the selector for an `<input type="date">`
     * @param {number} age - the age the filled date of birth should imply as of today
     * @return {Promise<void>}
     */
    async isDateOfBirthForAge(selector, age) {
        const value = await this.getFormFieldValue(selector);
        expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        const [year, month, day] = value.split('-').map(Number);
        const today = new Date();
        const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
        expect(today.getFullYear() - year - (today < birthdayThisYear ? 1 : 0)).toBe(age);
    }

    /**
     * @param {object} selectors
     * @param {string} selectors.date - an `<input type="date">` filled with the default format
     * @param {string} selectors.year - filled with `YYYY`
     * @param {string} selectors.month - filled with `MM`
     * @param {string} selectors.day - filled with `D`
     * @param {string} selectors.us - filled with `MM/DD/YYYY`
     * @param {number} age - the age the date of birth should imply as of today
     * @return {Promise<void>}
     */
    async isDateOfBirthSplitAcrossFields(selectors, age) {
        await this.isDateOfBirthForAge(selectors.date, age);

        const [year, month, day] = (await this.getFormFieldValue(selectors.date)).split('-');
        await this.doesInputValueEqual(selectors.year, year);
        await this.doesInputValueEqual(selectors.month, month);
        await this.doesInputValueEqual(selectors.day, String(Number(day)));
        await this.doesInputValueEqual(selectors.us, `${month}/${day}/${year}`);
    }

    /**
     * @param {string} responseElementSelector
     * @return {Promise<void>}
     */
    async isCaptchaTokenFilled(responseElementSelector) {
        const captchaTarget = await this.page.$(responseElementSelector);
        const captchaToken = await captchaTarget?.evaluate((element) => ('value' in element ? element.value : element.innerHTML));
        expect(captchaToken).toBe('test_token');
    }

    /**
     * @param {object} params
     * @param {number} params.widgetId
     * @param {Record<number, string|null>} params.clients
     */
    async rendersRecaptchaClients({ widgetId, clients }) {
        await this.page.evaluate(
            ({ responseId, widgetId, clients }) => {
                const responseElement = document.querySelector(`#${responseId}`);
                if (!(responseElement instanceof HTMLElement)) {
                    throw new Error('reCAPTCHA response element is missing');
                }
                responseElement.id = `${responseId}-${widgetId}`;
                globalThis.___grecaptcha_cfg.clients = Object.fromEntries(
                    Object.entries(clients).map(([id, callbackAttribute]) => [
                        id,
                        globalThis.createRecaptchaClient({ callbackAttribute, callable: callbackAttribute !== null }),
                    ]),
                );
            },
            { responseId: RECAPTCHA_RESPONSE_ID, widgetId, clients },
        );
    }

    /**
     * @param {{callback: {eval: string}}} response
     */
    async runsCaptchaCallback(response) {
        await this.page.evaluate(response.callback.eval);
    }

    /**
     * @param {string} selector
     * @param {string} callbackAttribute
     */
    async isWidgetNotified(selector, callbackAttribute) {
        await expect(this.page.locator(selector)).toHaveAttribute(callbackAttribute, 'test_token');
    }

    /**
     * @param {string} selector
     * @param {string} callbackAttribute
     */
    async isWidgetNotNotified(selector, callbackAttribute) {
        await expect(this.page.locator(selector)).not.toHaveAttribute(callbackAttribute, 'test_token');
    }

    async hasNoNotifiedWidget() {
        await expect(this.page.locator('.g-recaptcha[data-callback-token="test_token"]')).toHaveCount(0);
    }

    /**
     * @param {number} widgetId
     */
    async removesRecaptchaWidgetId(widgetId) {
        await this.page.locator(`${RECAPTCHA_RESPONSE_SELECTOR}-${widgetId}`).evaluate((element) => {
            element.id = 'captcha-response-without-widget-id';
        });
    }

    /**
     * @return {void}
     */
    isExtractMatch(response, person) {
        expect(person).toMatchObject(response);
    }

    /**
     * @return {void}
     */
    isUrlMatch(response) {
        expect(response.url).toBe('https://www.verecor.com/profile/search?fname=Ben&lname=Smith&state=fl&city=New-York&fage=41-50');
    }

    /**
     * @param {object} response
     * @param {object} captchaParams
     * @param {string} captchaParams.captchaType
     * @param {string} captchaParams.targetPage
     * @param {string} [captchaParams.siteKey]
     *
     * @return {void}
     */
    isCaptchaMatch(response, { captchaType, targetPage, ...overrides }) {
        const expectedResponse = createCaptchaResponse({ captchaType, targetPage, ...overrides });

        switch (captchaType) {
            case 'image':
                // Validate that the correct keys are present in the response
                expect(Object.keys(response).sort()).toStrictEqual(Object.keys(expectedResponse).sort());
                // Validate that the siteKey looks like a base64 encoded image
                expect(response.siteKey).toMatch(/^data:image\/jpeg;base64,/);
                break;
            default:
                expect(response).toStrictEqual(expectedResponse);
        }
    }

    /**
     * @param {string} [actionID]
     */
    async isCaptchaError(actionID) {
        expect(await this.getErrorMessage(actionID)).not.toBeFalsy();
    }

    /**
     * @return {void}
     */
    isQueryParamRemoved(response) {
        const url = new URL(response.url);
        expect(url.searchParams.toString()).toBe('');
    }

    /**
     * @param meta
     */
    responseContainsMetadata(meta) {
        expect(meta.extractResults).toHaveLength(10);
        expect(meta.extractResults.filter((x) => x.result === true)).toHaveLength(1);
        expect(meta.extractResults.filter((x) => x.result === false)).toHaveLength(9);
        const match = meta.extractResults.find((x) => x.result === true);
        expect(match.matchedFields).toMatchObject(['name', 'age', 'addressCityStateList']);
        expect(match.element).toBe(undefined);
        expect(match.score).toBe(3);
    }

    /**
     * Simulate the native-side pushing an action into the client-side JS
     *
     * @param {string} action
     * @return {Promise<void>}
     */
    async receivesAction(action) {
        const actionJson = JSON.parse(readFileSync('./integration-test/test-pages/broker-protection/actions/' + action, 'utf8'));
        await this.simulateSubscriptionMessage('onActionReceived', actionJson);
    }

    /**
     * @param {{state: {action: Record<string, any>}}} action
     * @return {Promise<void>}
     */
    async receivesInlineAction(action) {
        await this.simulateSubscriptionMessage('onActionReceived', action);
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} payload
     */
    async simulateSubscriptionMessage(name, payload) {
        await this.collector.simulateSubscriptionMessage('brokerProtection', name, payload);
    }

    async getActionCompletedParams() {
        return await this.collector.waitForMessage('actionCompleted');
    }

    /**
     * @param {string} [actionID]
     */
    async getSuccessResponse(actionID) {
        if (!actionID) {
            const response = await this.getActionCompletedParams();
            this.isSuccessMessage(response);
            return this._getResultFromResponse(response).success.response;
        }

        await expect.poll(async () => this._getResultFromResponse(await this.getActionCompletedParams(), actionID)).toBeDefined();

        const response = await this.getActionCompletedParams();
        this.isSuccessMessage(response, actionID);
        return this._getResultFromResponse(response, actionID).success.response;
    }

    async getErrorMessage(actionID) {
        if (actionID) {
            await expect.poll(async () => this._getResultFromResponse(await this.getActionCompletedParams(), actionID)).toBeDefined();
        }

        const response = await this.getActionCompletedParams();
        this.isErrorMessage(response, actionID);
        return this._getResultFromResponse(response, actionID).error.message;
    }

    /**
     * @param {object} response
     * @param {string} [actionID]
     */
    isErrorMessage(response, actionID) {
        expect('error' in this._getResultFromResponse(response, actionID)).toBe(true);
    }

    isSuccessMessage(response, actionID) {
        const result = this._getResultFromResponse(response, actionID);
        expect('success' in result, JSON.stringify(result)).toBe(true);
    }

    /**
     * @param {object} response
     * @param {string} [actionID]
     */
    _getResultFromResponse(response, actionID) {
        const results = response.map((message) => message.payload?.params?.result);
        if (!actionID) {
            return results[0];
        }

        return results.find((result) => (result?.success ?? result?.error)?.actionID === actionID);
    }

    /**
     * Helper for creating an instance per platform
     * @param {Page} page
     * @param {Record<string, any>} use
     */
    static create(page, use) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(use);
        return new BrokerProtectionPage(page, build, platformInfo);
    }
}
