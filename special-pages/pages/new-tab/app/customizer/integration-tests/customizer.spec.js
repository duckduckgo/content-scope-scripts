import { test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { CustomizerPage } from './customizer.page.js';

test.describe('newtab customizer', () => {
    test('loads with the default light background when disabled', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { customizerDrawer: 'disabled' } });
        await cp.hasDefaultBackground();
    });
    test('loads with the default dark background when disabled', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.darkMode();
        await ntp.openPage({ additional: { customizerDrawer: 'disabled' } });
        await cp.hasDefaultDarkBackground();
        await page.pause();
    });
});
