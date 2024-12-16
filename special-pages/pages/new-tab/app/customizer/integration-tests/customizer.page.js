import { test, expect } from '@playwright/test';
import { values } from '../values.js';

/**
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionEventNames
 */

export class CustomizerPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
    }

    async showsColorSelectionPanel() {
        const { page } = this.ntp;
        await page.locator('aside').getByLabel('Solid Colors').click();
    }

    async opensCustomizer() {
        const { page } = this.ntp;
        await page.getByRole('button', { name: 'Customize' }).click();
    }

    async hasDefaultBackgroundSelected() {
        const { page } = this.ntp;
        const selected = page.locator('aside').getByLabel('Default');
        await expect(selected).toHaveAttribute('aria-checked', 'true');
    }

    /**
     * @param {'light' | 'dark'} theme
     */
    async mainContentHasTheme(theme) {
        const { page } = this.ntp;
        await test.step(`main content area theme should be: ${theme}`, async () => {
            await expect(page.locator('main')).toHaveAttribute('data-theme', theme);
        });
    }

    /**
     * @param {'light' | 'dark'} theme
     */
    async drawerHasTheme(theme) {
        const { page } = this.ntp;
        await test.step(`customizer drawer theme should be: ${theme}`, async () => {
            await expect(page.locator('aside')).toHaveAttribute('data-theme', theme);
        });
    }

    async hasColorSelected() {
        const { page } = this.ntp;
        const selected = page.locator('aside').getByLabel('Solid Colors');
        await expect(selected).toHaveAttribute('aria-checked', 'true');
    }

    async hasGradientSelected() {
        const { page } = this.ntp;
        await page.pause();
        const selected = page.locator('aside').getByLabel('Gradients');
        await expect(selected).toHaveAttribute('aria-checked', 'true');
    }

    async hasImagesSelected() {
        const { page } = this.ntp;
        const selected = page.locator('aside').getByLabel('My Backgrounds');
        await expect(selected).toHaveAttribute('aria-checked', 'true');
    }

    async uploadsFirstImage() {
        const { page } = this.ntp;
        await page.getByLabel('Add Background').click();
        await this.ntp.mocks.waitForCallCount({ count: 1, method: 'customizer_upload' });
    }
    async setsDarkTheme() {
        const { page } = this.ntp;
        await page.getByRole('radio', { name: 'Select dark theme' }).click();
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: 'customizer_setTheme' });
        expect(calls[0].payload).toMatchObject({
            method: 'customizer_setTheme',
            params: { theme: 'dark' },
        });
    }

    async lightThemeIsSelected() {
        const { page } = this.ntp;
        await expect(page.getByRole('radio', { name: 'Select light theme' })).toHaveAttribute('aria-checked', 'true');
    }
    async darkThemeIsSelected() {
        const { page } = this.ntp;
        await expect(page.getByRole('radio', { name: 'Select dark theme' })).toHaveAttribute('aria-checked', 'true');
    }

    async selectsDefault() {
        const { page } = this.ntp;
        await page.locator('aside').getByLabel('Default').click();
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: 'customizer_setBackground' });
        expect(calls[0].payload).toMatchObject({
            method: 'customizer_setBackground',
            params: { background: { kind: 'default' } },
        });
    }

    async hasDefaultBackground() {
        const { page } = this.ntp;
        await expect(page.getByTestId('BackgroundConsumer')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }

    async hasDefaultDarkBackground() {
        const { page } = this.ntp;
        await expect(page.getByTestId('BackgroundConsumer')).toHaveCSS('background-color', 'rgb(51, 51, 51)');
    }

    /**
     * @param {keyof typeof values.colors} color
     */
    async hasColorBackground(color) {
        const { page } = this.ntp;
        const value = values.colors[color];
        await expect(page.getByTestId('BackgroundConsumer')).toHaveAttribute('data-background-color', value.hex);
    }

    async selectsColor() {
        const { page } = this.ntp;
        await this.showsColorSelectionPanel();
        await page.getByRole('radio', { name: 'Select color03' }).click();
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: 'customizer_setBackground' });
        expect(calls[0].payload).toMatchObject({
            method: 'customizer_setBackground',
            params: { background: { kind: 'color', value: 'color03' } },
        });
        return async () => await page.getByRole('button', { name: 'Solid Colors' }).click();
    }

    async selectsGradient() {
        const { page } = this.ntp;
        await page.locator('aside').getByLabel('Gradients').click();
        await page.getByRole('radio', { name: 'Select gradient01' }).click();
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: 'customizer_setBackground' });
        expect(calls[0].payload).toMatchObject({
            method: 'customizer_setBackground',
            params: { background: { kind: 'gradient', value: 'gradient01' } },
        });
        return async () => await page.getByRole('button', { name: 'Gradients' }).click();
    }

    /**
     * @param {import('../../../types/new-tab.js').BackgroundVariant} bg
     */
    async acceptsBackgroundUpdate(bg) {
        /** @type {import('../../../types/new-tab.js').BackgroundData} */
        const payload = { background: bg };
        /** @type {SubscriptionEventNames} */
        const named = 'customizer_onBackgroundUpdate';
        await this.ntp.mocks.simulateSubscriptionMessage(named, payload);
    }

    /**
     * @param {'light' | 'dark'} theme
     */
    async acceptsThemeUpdate(theme) {
        /** @type {import('../../../types/new-tab.js').ThemeData} */
        const payload = { theme };
        /** @type {SubscriptionEventNames} */
        const named = 'customizer_onThemeUpdate';
        await this.ntp.mocks.simulateSubscriptionMessage(named, payload);
    }

    /**
     * @param {string} color
     */
    async acceptsColorUpdate(color) {
        await test.step('subscription event: customizer_onColorUpdate', async () => {
            /** @type {import('../../../types/new-tab.js').UserColorData} */
            const payload = { userColor: { kind: 'hex', value: color } };
            /** @type {SubscriptionEventNames} */
            const named = 'customizer_onColorUpdate';
            await this.ntp.mocks.simulateSubscriptionMessage(named, payload);
        });
    }

    /**
     *
     */
    async acceptsImagesUpdate() {
        const { page } = this.ntp;
        await test.step('subscription event: customizer_onImagesUpdate', async () => {
            // Listener for the thumb loading
            const resPromise = page.waitForResponse((req) => {
                return req.url().includes(values.userImages['01'].thumb);
            });

            /** @type {import('../../../types/new-tab.js').UserImageData} */
            const payload = { userImages: [values.userImages['01']] };
            /** @type {SubscriptionEventNames} */
            const named = 'customizer_onImagesUpdate';
            await this.ntp.mocks.simulateSubscriptionMessage(named, payload);

            const response = await resPromise;
            await page.pause();
            expect(response.ok()).toBe(true);
        });
    }

    /**
     * @param {'light' | 'dark'} theme
     */
    async hasContentTheme(theme) {
        const { page } = this.ntp;
        await expect(page.getByRole('main')).toHaveAttribute('data-theme', theme);
    }

    /**
     * @param {string} color
     */
    async selectsCustomColor(color) {
        const { page } = this.ntp;
        await page.locator('input[type="color"]').click();
        await page.waitForTimeout(500);
        await page.locator('input[type="color"]').fill(color);
        await page.locator('body').click();
    }

    /**
     * @param {string} color
     */
    async selectsPreviousCustomColor(color) {
        const { page } = this.ntp;
        await this.showsColorSelectionPanel();
        await expect(page.locator('input[type="color"]')).toHaveValue(color);
        await page.locator('input[type="color"]').click();
        await page.locator('body').click();
    }

    /**
     * @param {string} color
     */
    async hasCustomColorValue(color) {
        const { page } = this.ntp;
        await expect(page.locator('input[type="color"]'), { message: `input should have value ${color}` }).toHaveValue(color);
    }

    /**
     * @param {string} color
     */
    async savesTheCustomColor(color) {
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: 'customizer_setBackground' });
        expect(calls[0].payload).toMatchObject({
            method: 'customizer_setBackground',
            params: { background: { kind: 'hex', value: color } },
        });
    }

    async hasEmptyImagesPanel() {
        const { page } = this.ntp;
        await page.getByLabel('Add Background').waitFor();
    }
}
