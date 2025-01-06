import { test, expect } from '@playwright/test';
import { values } from '../values.js';

/**
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionEventNames
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['notifications']['method']} NotificationNames
 */

const named = {
    /** @type {(n: NotificationNames) => NotificationNames} */
    notification: (n) => n,
    /** @type {(n: SubscriptionEventNames) => SubscriptionEventNames} */
    subscription: (n) => n,
};
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

    async closesCustomizer() {
        const { page } = this.ntp;
        await page.locator('aside').getByRole('button', { name: 'Close' }).click();
        await expect(page.locator('aside')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.locator('aside')).toHaveCSS('visibility', 'hidden');
    }

    async opensSettings() {
        const { page } = this.ntp;
        await page.locator('aside').getByRole('link', { name: 'Go to Settings' }).click();
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('open') });
        expect(calls[0].payload).toMatchObject({
            method: 'open',
            params: { target: 'settings' },
        });
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
        await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('customizer_upload') });
    }

    async setsDarkTheme() {
        const { page } = this.ntp;
        await page.getByRole('radio', { name: 'Select dark theme' }).click();
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('customizer_setTheme') });
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
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('customizer_setBackground') });
        expect(calls[0].payload).toMatchObject({
            method: 'customizer_setBackground',
            params: { background: { kind: 'default' } },
        });
    }

    async hasDefaultBackground() {
        const { page } = this.ntp;
        await expect(page.getByTestId('BackgroundConsumer')).toHaveCSS('background-color', 'rgb(250, 250, 250)');
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
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('customizer_setBackground') });
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
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('customizer_setBackground') });
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
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('customizer_onBackgroundUpdate'), payload);
    }

    /**
     * @param {'light' | 'dark'} theme
     */
    async acceptsThemeUpdate(theme) {
        /** @type {import('../../../types/new-tab.js').ThemeData} */
        const payload = { theme };
        /** @type {SubscriptionEventNames} */
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('customizer_onThemeUpdate'), payload);
    }

    /**
     * @param {string} color
     */
    async acceptsColorUpdate(color) {
        await test.step('subscription event: customizer_onColorUpdate', async () => {
            /** @type {import('../../../types/new-tab.js').UserColorData} */
            const payload = { userColor: { kind: 'hex', value: color } };
            await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('customizer_onColorUpdate'), payload);
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
            await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('customizer_onImagesUpdate'), payload);

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

    async opensImages() {
        const { page } = this.ntp;
        await page.getByLabel('My Backgrounds').click();
    }

    async hasImages(number) {
        const { page } = this.ntp;
        await expect(page.locator('aside').getByRole('radio')).toHaveCount(number);
    }

    async hasPlaceholders(number) {
        const { page } = this.ntp;
        await expect(page.locator('aside').getByRole('button', { name: 'Add Background' })).toHaveCount(number);
    }

    async uploadsAdditional({ existing }) {
        const { page } = this.ntp;
        const expectedPlaceholderCount = 8 - existing;

        await this.hasImages(existing);
        await this.hasPlaceholders(expectedPlaceholderCount);
        await page.locator('aside').getByRole('button', { name: 'Add Background' }).nth(existing).click();
        await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('customizer_upload') });

        // check the last placeholder element is also clickable
        await page
            .locator('aside')
            .getByRole('button', { name: 'Add Background' })
            .nth(expectedPlaceholderCount - 1)
            .click();

        await this.ntp.mocks.waitForCallCount({ count: 2, method: named.notification('customizer_upload') });
    }

    /**
     *
     */
    async acceptsBadImagesUpdate() {
        const { page } = this.ntp;
        await test.step('subscription event with bad data: customizer_onImagesUpdate', async () => {
            /** @type {import('../../../types/new-tab.js').UserImageData} */
            // @ts-expect-error - the test is for an error!
            const payload = { lol: '' };
            await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('customizer_onImagesUpdate'), payload);
            await expect(page.getByRole('complementary')).toContainText('A problem occurred with this feature. DuckDuckGo was notified');

            // sends the report
            const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('reportPageException') });
            expect(calls[0].payload).toMatchObject({
                method: 'reportPageException',
                params: {
                    message:
                        "Customizer section 'Customizer Drawer' threw an exception: TypeError: Cannot read properties of undefined (reading 'length')",
                },
            });
        });
    }

    /**
     *
     */
    async handlesNestedException() {
        const { page } = this.ntp;
        await expect(page.getByRole('complementary')).toContainText('A problem occurred with this feature. DuckDuckGo was notified');
        await page.getByRole('button', { name: 'My Backgrounds' }).click();
        await page.getByTestId('dismissBtn').click();

        // sends the report
        const calls = await this.ntp.mocks.waitForCallCount({ count: 1, method: named.notification('reportPageException') });
        expect(calls[0].payload).toMatchObject({
            method: 'reportPageException',
            params: {
                message: "Customizer section 'Image Selection' threw an exception: Error: Simulated error",
            },
        });
    }

    async customizerOpensAutomatically() {
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('customizer_autoOpen'), {});

        // can only close after being opened
        await this.closesCustomizer();
    }

    async hidesSection(label) {
        const { page } = this.ntp;
        await page.locator('aside').getByLabel(label).uncheck();
        // await page.getByLabel('Toggle Blocked Tracking').check();
        // await page.locator('aside').
    }
}
