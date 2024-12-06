import { expect } from '@playwright/test';

export class CustomizerPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
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
    async hasColorSelected() {
        const { page } = this.ntp;
        await page.pause();
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
        await page.pause();
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

    async selectsColor() {
        const { page } = this.ntp;
        await page.locator('aside').getByLabel('Solid Colors').click();
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
}
