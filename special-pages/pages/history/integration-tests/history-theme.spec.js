import { test } from '@playwright/test';
import { HistoryTestPage } from './history.page.js';

test.describe('history theme and theme variants', () => {
    test('setting theme = dark and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'dark', themeVariant: 'violet' } });
        await hp.hasTheme('dark', 'violet');
        await hp.hasBackgroundColor({ hex: '#271c49' }); // violet dark surface-canvas
    });

    test('setting theme = light and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'light', themeVariant: 'coolGray' } });
        await hp.hasTheme('light', 'coolGray');
        await hp.hasBackgroundColor({ hex: '#e3e5ec' }); // coolGray light surface-canvas
    });

    test('light theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage();
        await hp.hasTheme('light', 'default');
        await hp.hasBackgroundColor({ hex: '#fafafa' }); // default light surface-canvas
    });

    test('dark theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.darkMode();
        await hp.openPage();
        await hp.hasTheme('dark', 'default');
        await hp.hasBackgroundColor({ hex: '#1c1c1c' }); // default dark surface-canvas
    });

    test('changing theme to dark and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'light', themeVariant: 'desert' } });
        await hp.hasTheme('light', 'desert');
        await hp.hasBackgroundColor({ hex: '#f5f4ef' }); // desert light surface-canvas
        await hp.acceptsThemeUpdate('dark', 'slateBlue');
        await hp.hasTheme('dark', 'slateBlue');
        await hp.hasBackgroundColor({ hex: '#1e3042' }); // slateBlue dark surface-canvas
    });

    test('changing theme to light and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'dark', themeVariant: 'rose' } });
        await hp.hasTheme('dark', 'rose');
        await hp.hasBackgroundColor({ hex: '#511442' }); // rose dark surface-canvas
        await hp.acceptsThemeUpdate('light', 'green');
        await hp.hasTheme('light', 'green');
        await hp.hasBackgroundColor({ hex: '#ecf5ea' }); // green light surface-canvas
    });

    test('respects CSS media query for light/dark when browser theme is "system"', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo);
        await hp.openPage({ additional: { theme: 'system' } });
        await hp.hasTheme('light', 'default');
        await hp.darkMode();
        await hp.hasTheme('dark', 'default');
    });
});
