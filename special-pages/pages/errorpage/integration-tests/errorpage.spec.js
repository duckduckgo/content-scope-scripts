import { expect, test } from '@playwright/test';
import { ErrorPage } from './errorpage';

test.describe('errorpage', () => {
    test('action link is hidden by default', async ({ page }, testInfo) => {
        const errorPage = ErrorPage.create(page, testInfo);
        await errorPage.openPage();

        await expect(errorPage.link).toBeHidden();
    });

    test('configured action link shows text and calls its function once', async ({ page }, testInfo) => {
        const errorPage = ErrorPage.create(page, testInfo);
        await errorPage.openPage();
        await errorPage.configureLink('Send Feedback', 'configured');

        await expect(errorPage.link).toBeVisible();
        await expect(errorPage.link).toHaveText('Send Feedback');
        await errorPage.link.click();
        expect(await errorPage.callbackNames()).toEqual(['configured']);
    });

    test('reconfiguring the action link replaces its function', async ({ page }, testInfo) => {
        const errorPage = ErrorPage.create(page, testInfo);
        await errorPage.openPage();
        await errorPage.configureLink('First', 'first');
        await errorPage.configureLink('Second', 'second');

        await errorPage.link.click();
        expect(await errorPage.callbackNames()).toEqual(['second']);
    });

    for (const invalidConfiguration of [
        { name: 'blank text', value: /** @type {const} */ ('blank-text') },
        { name: 'a non-function callback', value: /** @type {const} */ ('non-function-callback') },
    ]) {
        test(`configuration with ${invalidConfiguration.name} clears and hides the action link`, async ({ page }, testInfo) => {
            const errorPage = ErrorPage.create(page, testInfo);
            await errorPage.openPage();
            await errorPage.configureLink('Send Feedback', 'configured');
            await errorPage.clearLinkWithInvalidConfiguration(invalidConfiguration.value);

            await expect(errorPage.link).toBeHidden();
            await expect(errorPage.link).toHaveText('');
            await errorPage.clickLinkProgrammatically();
            expect(await errorPage.callbackNames()).toEqual([]);
        });
    }

    test('runtime theme callback still updates the theme', async ({ page }, testInfo) => {
        const errorPage = ErrorPage.create(page, testInfo);
        await errorPage.openPage();
        await errorPage.changeTheme('violet');

        await expect(page.locator('body')).toHaveAttribute('data-theme-variant', 'violet');
    });
});
