import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { CustomizerPage } from './customizer.page.js';

test.describe('newtab customizer', () => {
    test('loads with the default light background when disabled', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({});
        await cp.hasDefaultBackground();
    });
    test('loads with the default dark background when disabled', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.darkMode();
        await ntp.openPage();
        await cp.hasDefaultDarkBackground();
    });
    test('Opens automatically from initialSetup settings', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true' } });
        await cp.closesCustomizer();
    });
    test('Opens automatically from subscription message', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();

        // control
        await cp.opensCustomizer();
        // await page.screenshot({ path: 'abc.png' });
        await cp.closesCustomizer();
        // await page.screenshot({ path: 'abc1.png' });
        await cp.customizerOpensAutomatically();
    });
    test('loads with the default background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();

        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
    });
    test('respects CSS media query for light/dark when browser theme is "system"', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { theme: 'system' } });
        await cp.opensCustomizer();

        // check the main page + drawer both are light theme
        await cp.mainContentHasTheme('light');
        await cp.drawerHasTheme('light');

        // emulate changing os-level settings to 'dark'
        await ntp.darkMode();

        // now assert the themes updated correctly
        await cp.mainContentHasTheme('dark');
        await cp.drawerHasTheme('dark');
    });
    test('loads with the default background and accepts background update', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();

        await cp.hasDefaultBackground();
        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();

        await cp.acceptsBackgroundUpdate({
            kind: 'color',
            value: 'color01',
        });
        await cp.hasColorBackground('rgb(0, 0, 0)');
    });
    test('loads with the default background and accepts theme update', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();

        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();

        // this is a control, to ensure it's light before we deliver an update
        await cp.hasContentTheme('light');

        // now deliver the update and ensure it changed
        await cp.acceptsThemeUpdate('dark');
        await cp.hasContentTheme('dark');
    });
    test('loads with a color background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'color01', theme: 'dark' } });
        await cp.opensCustomizer();
        await cp.hasColorSelected();
        await cp.acceptsThemeUpdate('light');
    });
    test('loads with a color background, and sets back to default', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'color01' } });
        await cp.opensCustomizer();
        await cp.hasColorSelected();
        await cp.selectsDefault();
    });
    test('loads with default background, and sets a color', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
        const back = await cp.selectsColor();
        await back();
        await cp.hasColorSelected();
    });
    test('loads with default background, and uses color picker', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'default' } });
        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
        await cp.showsColorSelectionPanel();

        await cp.selectsCustomColor('#cacaca');
        await cp.savesTheCustomColor('#cacaca');
    });
    test('loads with default background and accepts a color update', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'default' } });
        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
        await cp.showsColorSelectionPanel();

        await test.step('when a color update is received', async () => {
            await cp.hasCustomColorValue('#ffffff');
            await cp.acceptsColorUpdate('#cacaca');
        });

        await test.step('then the custom color panel should reflect the color', async () => {
            await cp.hasCustomColorValue('#cacaca');
        });
    });
    test('switches from selected predefined color, to a previously selected hex value', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'color01', userColor: 'cacaca' } });
        await cp.opensCustomizer();
        await cp.hasColorSelected();
        await cp.selectsPreviousCustomColor('#cacaca');
        await cp.savesTheCustomColor('#cacaca');
    });
    test('loads with default background, and sets a gradient', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
        const back = await cp.selectsGradient();
        await back();
        await cp.hasGradientSelected();
    });
    test('loads with a gradient background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'gradient02' } });
        await cp.opensCustomizer();
        await cp.hasGradientSelected();
    });
    test('loads with a user image', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { background: 'userImage:01', userImages: 'true' } });
        await cp.opensCustomizer();
        await cp.hasImagesSelected();
    });
    test('loads without images, and then accepts 1', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.opensCustomizer();
        await cp.hasEmptyImagesPanel();
        await cp.acceptsImagesUpdate();
    });
    test('loads without images, and handles root-level exceptions', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.opensCustomizer();
        await cp.hasEmptyImagesPanel();
        await cp.acceptsBadImagesUpdate();
        await cp.closesCustomizer();
    });
    test('loads with images, and handles nested exceptions', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { userImages: 'true', willThrowPageException: 'userImages' } });
        await cp.opensCustomizer();
        await cp.opensImages();
        await cp.handlesNestedException();
    });
    test('trigger file upload', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.opensCustomizer();
        await cp.uploadsFirstImage();
    });
    test('trigger additional file uploads', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { userImages: 'true' } });
        await cp.opensCustomizer();
        await cp.opensImages();
        await cp.uploadsAdditional({ existing: 3 });
    });
    test('Sets theme', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { theme: 'light' } });
        await cp.opensCustomizer();
        await cp.lightThemeIsSelected();
        await cp.setsDarkTheme();
        await cp.darkThemeIsSelected();
    });
    test('toggles section visibility', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { theme: 'light' } });
        await cp.opensCustomizer();
        await cp.hidesSection('Protections Report');
    });
    test('opening settings', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { theme: 'light' } });
        await cp.opensCustomizer();
        await cp.opensSettings();
    });
    test('context menu for image selections', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        const cp = new CustomizerPage(ntp);
        await ntp.openPage({ additional: { userImages: 'true' } });
        await cp.opensCustomizer();
        await cp.opensImages();
        await cp.rightClicksFirstImage();
        const calls = await ntp.mocks.waitForCallCount({ method: 'customizer_contextMenu', count: 1 });
        expect(calls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'customizer_contextMenu',
            params: {
                target: 'userImage',
                id: '01',
            },
        });
    });
    test('loads with initial theme variant from initialSetup', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { themeVariant: 'violet', theme: 'light' } });
        await ntp.hasBackgroundColor({ hex: '#edecf9' }); // violet light surface-canvas
    });
    test('accepts theme variant update via subscription message', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.acceptsThemeVariantUpdate('light', 'coolGray');
        await ntp.hasBackgroundColor({ hex: '#e3e5ec' }); // coolGray light surface-canvas
    });
    test('accepts theme variant update (dark mode)', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.darkMode();
        await ntp.openPage();
        await cp.acceptsThemeVariantUpdate('dark', 'slateBlue');
        await ntp.hasBackgroundColor({ hex: '#1e3042' }); // slateBlue dark surface-canvas
    });
    test('custom background color overrides theme variant background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { themeVariant: 'rose', theme: 'dark' } });
        await ntp.hasBackgroundColor({ hex: '#511442' }); // rose dark surface-canvas
        await cp.acceptsBackgroundUpdate({
            kind: 'color',
            value: 'color01',
        });
        await cp.hasColorBackground('rgb(0, 0, 0)'); // color01 is black, overrides rose
    });
    test('custom hex color overrides theme variant background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { themeVariant: 'orange', theme: 'light' } });
        await ntp.hasBackgroundColor({ hex: '#fdf4e6' }); // orange light surface-canvas
        await cp.acceptsBackgroundUpdate({
            kind: 'hex',
            value: '#ff5733',
        });
        await ntp.hasBackgroundColor({ hex: '#ff5733' }); // custom hex overrides orange
    });
    test('changing browser theme preserves theme variant', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { themeVariant: 'desert', theme: 'light' } });
        await ntp.hasBackgroundColor({ hex: '#f5f4ef' }); // desert light surface-canvas
        await cp.acceptsThemeUpdate('dark');
        await ntp.hasBackgroundColor({ hex: '#312e2a' }); // desert dark surface-canvas, NOT default dark
    });
    test('shows ThemeSection when themeVariant is truthy', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true', themeVariant: 'default' } });
        await cp.themeSectionIsVisible();
    });
    test('shows BrowserThemeSection when themeVariant is not set', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true' } });
        await cp.browserThemeSectionIsVisible();
    });
    test('theme and theme variant are correctly selected', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true', themeVariant: 'violet', theme: 'dark' } });
        await cp.themeIsSelected('dark');
        await cp.themeVariantIsSelected('violet');
    });
    test('can select a theme and customizer_setTheme is called', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true', themeVariant: 'default', theme: 'light' } });
        await cp.themeIsSelected('light');
        await cp.selectsTheme('dark', 'default');
    });
    test('can select a theme variant and customizer_setTheme is called', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true', themeVariant: 'default', theme: 'system' } });
        await cp.themeVariantIsSelected('default');
        await cp.selectsThemeVariant('rose', 'system');
    });

    test('theme variant popover appears when customizer.showThemeVariantPopover=true', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': true, themeVariant: 'default' } });
        await expect(cp.themeVariantPopover()).toBeVisible();
    });

    test('theme variant popover does not appear when showThemeVariantPopover=false', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': false, themeVariant: 'default' } });
        await expect(cp.themeVariantPopover()).not.toBeVisible();
    });

    test('clicking close button dismisses theme variant popover', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': true, themeVariant: 'default' } });

        // Popover should be visible initially
        await expect(cp.themeVariantPopover()).toBeVisible();

        // Click close button
        await cp.themeVariantPopoverCloseButton().click();

        // Popover should be dismissed
        await expect(cp.themeVariantPopover()).not.toBeVisible();
    });

    test('manually opening customizer dismisses theme variant popover', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': true, themeVariant: 'default' } });

        // Popover should be visible initially
        await expect(cp.themeVariantPopover()).toBeVisible();

        // Open customizer manually using the main customize button
        await cp.opensCustomizer();

        // Customizer should be open and popover should be dismissed
        await expect(cp.context()).toBeVisible();
        await expect(cp.themeVariantPopover()).not.toBeVisible();
    });

    test('pressing escape dismisses theme variant popover', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': true, themeVariant: 'default' } });

        // Popover should be visible initially
        await expect(cp.themeVariantPopover()).toBeVisible();

        // Press Escape
        await page.keyboard.press('Escape');

        // Popover should be dismissed
        await expect(cp.themeVariantPopover()).not.toBeVisible();
    });

    test('sends telemetryEvent when drawer opens and closes', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();

        await cp.opensCustomizer();

        const openCalls = await ntp.mocks.waitForCallCount({ method: 'telemetryEvent', count: 1 });
        expect(openCalls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'telemetryEvent',
            params: {
                attributes: { name: 'customizer_drawer', value: { state: 'opened', themeVariantPopoverWasOpen: false } },
            },
        });

        await cp.closesCustomizer();

        const closeCalls = await ntp.mocks.waitForCallCount({ method: 'telemetryEvent', count: 2 });
        expect(closeCalls[1].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'telemetryEvent',
            params: {
                attributes: { name: 'customizer_drawer', value: { state: 'closed' } },
            },
        });
    });

    test('sends telemetryEvent when drawer auto-opens', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { autoOpen: 'true' } });

        const calls = await ntp.mocks.waitForCallCount({ method: 'telemetryEvent', count: 1 });
        expect(calls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'telemetryEvent',
            params: {
                attributes: { name: 'customizer_drawer', value: { state: 'opened', themeVariantPopoverWasOpen: false } },
            },
        });
    });

    test('sends telemetryEvent with themeVariantPopoverWasOpen when drawer opens while popover is visible', async ({
        page,
    }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': true, themeVariant: 'default' } });

        const cp = new CustomizerPage(ntp);
        await cp.opensCustomizer();

        const calls = await ntp.mocks.waitForCallCount({ method: 'telemetryEvent', count: 1 });
        expect(calls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'telemetryEvent',
            params: {
                attributes: { name: 'customizer_drawer', value: { state: 'opened', themeVariantPopoverWasOpen: true } },
            },
        });
    });

    test('accepts show theme variant popover update via subscription (show)', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': false, themeVariant: 'default' } });
        await expect(cp.themeVariantPopover()).not.toBeVisible();
        await cp.acceptsShowThemeVariantPopoverUpdate(true);
        await expect(cp.themeVariantPopover()).toBeVisible();
    });

    test('accepts show theme variant popover update via subscription (hide)', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { 'customizer.showThemeVariantPopover': true, themeVariant: 'default' } });
        await expect(cp.themeVariantPopover()).toBeVisible();
        await cp.acceptsShowThemeVariantPopoverUpdate(false);
        await expect(cp.themeVariantPopover()).not.toBeVisible();
    });
});
