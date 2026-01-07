import { test } from '@playwright/test';
import { SpecialErrorPage } from './special-error.js';

test.describe('special-error theme and theme variants', () => {
    test('setting theme = dark and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'dark', themeVariant: 'violet' } });
        await sp.hasTheme('dark', 'violet');
        const isIOS = sp.platform.name === 'ios';
        await sp.hasBackgroundColor({ hex: isIOS ? '#222222' : '#271c49' });
    });

    test('setting theme = light and themeVariant via initialSetup', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'light', themeVariant: 'coolGray' } });
        await sp.hasTheme('light', 'coolGray');
        const isIOS = sp.platform.name === 'ios';
        await sp.hasBackgroundColor({ hex: isIOS ? '#eeeeee' : '#e3e5ec' });
    });

    test('light theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage();
        await sp.hasTheme('light', 'default');
        const isIOS = sp.platform.name === 'ios';
        await sp.hasBackgroundColor({ hex: isIOS ? '#eeeeee' : '#fafafa' });
    });

    test('dark theme and default themeVariant when unspecified', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.darkMode();
        await sp.openPage();
        await sp.hasTheme('dark', 'default');
        const isIOS = sp.platform.name === 'ios';
        await sp.hasBackgroundColor({ hex: isIOS ? '#222222' : '#1c1c1c' });
    });

    test('changing theme to dark and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'light', themeVariant: 'desert' } });
        await sp.hasTheme('light', 'desert');
        const isIOS = sp.platform.name === 'ios';
        await sp.hasBackgroundColor({ hex: isIOS ? '#eeeeee' : '#f5f4ef' });
        await sp.acceptsThemeUpdate('dark', 'slateBlue');
        await sp.hasTheme('dark', 'slateBlue');
        await sp.hasBackgroundColor({ hex: isIOS ? '#222222' : '#1e3042' });
    });

    test('changing theme to light and themeVariant using onThemeUpdate', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'dark', themeVariant: 'rose' } });
        await sp.hasTheme('dark', 'rose');
        const isIOS = sp.platform.name === 'ios';
        await sp.hasBackgroundColor({ hex: isIOS ? '#222222' : '#511442' });
        await sp.acceptsThemeUpdate('light', 'green');
        await sp.hasTheme('light', 'green');
        await sp.hasBackgroundColor({ hex: isIOS ? '#eeeeee' : '#ecf5ea' });
    });

    test('respects CSS media query for light/dark when browser theme is "system"', async ({ page }, workerInfo) => {
        const sp = SpecialErrorPage.create(page, workerInfo);
        await sp.openPage({ additional: { theme: 'system' } });
        await sp.hasTheme('light', 'default');
        await sp.darkMode();
        await sp.hasTheme('dark', 'default');
    });
});
