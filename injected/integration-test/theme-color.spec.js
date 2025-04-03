import { test } from '@playwright/test';
import { ThemeColor } from './page-objects/theme-color';

test('theme-color feature absent', async ({ page }, testInfo) => {
    const themeColor = ThemeColor.create(page, testInfo);

    await themeColor.withRemoteConfig({ json: 'theme-color-absent' });
    await themeColor.gotoPage('index');

    await themeColor.didNotReceiveThemeColorMessage();
});

test('theme-color (no theme color)', async ({ page }, testInfo) => {
    const themeColor = ThemeColor.create(page, testInfo);

    await themeColor.withRemoteConfig({ json: 'theme-color-enabled' });
    await themeColor.gotoPage('no-theme-color');

    await themeColor.receivedThemeColorMessage(null, 'http://localhost:3220/theme-color/no-theme-color.html');
});

test('theme-color (viewport media query)', async ({ page }, testInfo) => {
    const themeColor = ThemeColor.create(page, testInfo);

    await themeColor.setDesktopViewport();
    await themeColor.withRemoteConfig({ json: 'theme-color-enabled' });
    await themeColor.gotoPage('media-queries');

    await themeColor.receivedThemeColorMessage('#00ff00', 'http://localhost:3220/theme-color/media-queries.html');
});

test('theme-color (color scheme media query)', async ({ page }, testInfo) => {
    const themeColor = ThemeColor.create(page, testInfo);

    await themeColor.setColorSchemeDark();
    await themeColor.withRemoteConfig({ json: 'theme-color-enabled' });
    await themeColor.gotoPage('media-queries');

    await themeColor.receivedThemeColorMessage('#0000ff', 'http://localhost:3220/theme-color/media-queries.html');
});

test('theme-color feature disabled completely', async ({ page }, testInfo) => {
    const themeColor = ThemeColor.create(page, testInfo);

    await themeColor.setColorSchemeDark();
    await themeColor.withRemoteConfig({ json: 'theme-color-disabled' });
    await themeColor.gotoPage('index');

    await themeColor.didNotReceiveThemeColorMessage();
});
