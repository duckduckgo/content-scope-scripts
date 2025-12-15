import { test } from '@playwright/test';
import { SpecialErrorPage } from './special-error.js';

test.describe('special-error theme and theme variants', () => {
    test('setting theme = dark and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'dark', themeVariant: 'violet' } });
        await sp.hasTheme('dark', 'violet');
        await sp.hasBackgroundColor({ hex: '#2e2158' });
    });

    test('setting theme = light and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'light', themeVariant: 'coolGray' } });
        await sp.hasTheme('light', 'coolGray');
        await sp.hasBackgroundColor({ hex: '#d2d5e3' });
    });

    test('light theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage();
        await sp.hasTheme('light', 'default');
        await sp.hasBackgroundColor({ hex: '#eeeeee' });
    });

    test('dark theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.darkMode();
        await sp.openPage();
        await sp.hasTheme('dark', 'default');
        const isIOS = sp.platform.name === 'ios'; // iOS has a different default background color
        await sp.hasBackgroundColor({ hex: isIOS ? '#222222' : '#333333' });
    });

    test('changing theme to dark and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'light', themeVariant: 'desert' } });
        await sp.hasTheme('light', 'desert');
        await sp.hasBackgroundColor({ hex: '#eee9e1' });
        await sp.acceptsThemeUpdate('dark', 'slateBlue');
        await sp.hasTheme('dark', 'slateBlue');
        await sp.hasBackgroundColor({ hex: '#1e3347' });
    });

    test('changing theme to light and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'dark', themeVariant: 'rose' } });
        await sp.hasTheme('dark', 'rose');
        await sp.hasBackgroundColor({ hex: '#5b194b' });
        await sp.acceptsThemeUpdate('light', 'green');
        await sp.hasTheme('light', 'green');
        await sp.hasBackgroundColor({ hex: '#e3eee1' });
    });

    test('respects CSS media query for light/dark when browser theme is "system"', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'system' } });
        await sp.hasTheme('light', 'default');
        await sp.darkMode();
        await sp.hasTheme('dark', 'default');
    });
});
