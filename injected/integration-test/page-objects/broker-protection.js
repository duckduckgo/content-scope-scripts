import { expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { perPlatform } from '../type-helpers.mjs';
import { ResultsCollector } from './results-collector.js';

export class BrokerProtectionPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../type-helpers.mjs").Build} build
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     */
    constructor(page, build, platform) {
        this.page = page;
        this.collector = new ResultsCollector(page, build, platform);
    }

    // Given the "overlays" feature is enabled
    async enabled() {
        await this.collector.setup({ config: loadConfig('enabled') });
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
     * @return {Promise<void>}
     */
    async isFormFilled() {
        await expect(this.page.getByLabel('First Name:', { exact: true })).toHaveValue('John');
        await expect(this.page.getByLabel('Last Name:', { exact: true })).toHaveValue('Smith');
        await expect(this.page.getByLabel('Phone Number:', { exact: true })).toHaveValue(/^\d{10}$/);
        await expect(this.page.getByLabel('Street Address:', { exact: true })).toHaveValue(/^\d+ [A-Za-z]+(?: [A-Za-z]+)?$/);
        await expect(this.page.locator('#state')).toHaveValue('IL');
        await expect(this.page.getByLabel('Zip Code:', { exact: true })).toHaveValue(/^\d{5}$/);

        const randomValue = await this.page.getByLabel('Random number between 5 and 15:').inputValue();
        const randomValueInt = parseInt(randomValue);

        expect(Number.isInteger(randomValueInt)).toBe(true);
        expect(randomValueInt).toBeGreaterThanOrEqual(5);
        expect(randomValueInt).toBeLessThanOrEqual(15);

        await expect(this.page.getByLabel('City & State:', { exact: true })).toHaveValue('Chicago, IL');
    }

    /**
     * @return {Promise<void>}
     */
    async isCaptchaTokenFilled() {
        const captchaTextArea = await this.page.$('#g-recaptcha-response');
        const captchaToken = await captchaTextArea?.evaluate((element) => element.innerHTML);
        expect(captchaToken).toBe('test_token');
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
     * @return {void}
     */
    isCaptchaMatch(response) {
        expect(response).toStrictEqual({
            siteKey: '6LeCl8UUAAAAAGssOpatU5nzFXH2D7UZEYelSLTn',
            url: 'http://localhost:3220/broker-protection/pages/captcha.html',
            type: 'recaptcha2',
        });
    }

    /**
     * @return {void}
     */
    isHCaptchaMatch(response) {
        expect(response).toStrictEqual({
            siteKey: '6LeCl8UUAAAAAGssOpatU5nzFXH2D7UZEYelSLTn',
            url: 'http://localhost:3220/broker-protection/pages/captcha2.html',
            type: 'hcaptcha',
        });
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

    /**
     * @param {object} response
     */
    isErrorMessage(response) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        expect('error' in response[0].payload?.params?.result).toBe(true);
    }

    isSuccessMessage(response) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        expect('success' in response[0].payload?.params?.result).toBe(true);
    }

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {Record<string, any>} use
     */
    static create(page, use) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(use);
        return new BrokerProtectionPage(page, build, platformInfo);
    }
}

/**
 * @param {"enabled"} name
 * @return {Record<string, any>}
 */
function loadConfig(name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/broker-protection/config/${name}.json`, 'utf8'));
}
