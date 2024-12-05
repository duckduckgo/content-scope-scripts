import { test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { CustomizerPage } from './customizer.page.js';

test.describe('newtab customizer', () => {
    test('loads with the default background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled' } });

        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
    });
    test('loads with a color background', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled', background: 'color01' } });
        await cp.opensCustomizer();
        await cp.hasColorSelected();
    });
    test('loads with a color background, and sets back to default', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled', background: 'color01' } });
        await cp.opensCustomizer();
        await cp.hasColorSelected();
        await cp.selectsDefault();
    });
    test('loads with default background, and sets a color', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled' } });
        await cp.opensCustomizer();
        await cp.hasDefaultBackgroundSelected();
        const back = await cp.selectsColor();
        await back();
        await cp.hasColorSelected();
    });
    test('loads with default background, and sets a gradient', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled' } });
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
        await ntp.openPage({ additional: { customizerDrawer: 'enabled', background: 'gradient02' } });
        await cp.opensCustomizer();
        await cp.hasGradientSelected();
    });
    test('loads with a user image', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled', background: 'userImage:01', userImages: 'true' } });
        await cp.opensCustomizer();
        await cp.hasImagesSelected();
    });
    test('trigger file upload', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled' } });
        await cp.opensCustomizer();
        await cp.uploadsFirstImage();
    });
    test('Sets theme', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'enabled', theme: 'light' } });
        await cp.opensCustomizer();
        await cp.lightThemeIsSelected();
        await cp.setsDarkTheme();
        await cp.darkThemeIsSelected();
    });
});
