import { test } from '@playwright/test';
import { HistoryTestPage } from './history.page.js';

test.describe('history theme and theme variants', () => {
    test('setting theme = dark and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'dark', themeVariant: 'violet' } });
        await hp.hasTheme('dark', 'violet');
        await hp.hasBackgroundColor({ hex: '#2e2158' });
    });

    test('setting theme = light and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'light', themeVariant: 'coolGray' } });
        await hp.hasTheme('light', 'coolGray');
        await hp.hasBackgroundColor({ hex: '#d2d5e3' });
    });

    test('light theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage();
        await hp.hasTheme('light', 'default');
        await hp.hasBackgroundColor({ hex: '#fafafa' });
    });

    test('dark theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.darkMode();
        await hp.openPage();
        await hp.hasTheme('dark', 'default');
        await hp.hasBackgroundColor({ hex: '#333333' });
    });

    test('changing theme to dark and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'light', themeVariant: 'desert' } });
        await hp.hasTheme('light', 'desert');
        await hp.hasBackgroundColor({ hex: '#eee9e1' });
        await hp.acceptsThemeUpdate('dark', 'slateBlue');
        await hp.hasTheme('dark', 'slateBlue');
        await hp.hasBackgroundColor({ hex: '#1e3347' });
    });

    test('changing theme to light and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'dark', themeVariant: 'rose' } });
        await hp.hasTheme('dark', 'rose');
        await hp.hasBackgroundColor({ hex: '#5b194b' });
        await hp.acceptsThemeUpdate('light', 'green');
        await hp.hasTheme('light', 'green');
        await hp.hasBackgroundColor({ hex: '#e3eee1' });
    });
});
