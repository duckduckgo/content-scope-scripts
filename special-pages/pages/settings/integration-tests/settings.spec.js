import { test } from '@playwright/test';
import { SettingsTestPage } from './settings.page.js';

test.describe('settings', () => {
    test('has empty state', async ({ page }, workerInfo) => {
        const hp = SettingsTestPage.create(page, workerInfo).withEntries(0);
        await hp.openPage();
        // await hp.didMakeInitialQueries({ term: '' });
        await hp.hasEmptyState();
    });
    test('has no-results state', async ({ page }, workerInfo) => {
        const hp = SettingsTestPage.create(page, workerInfo).withEntries(0);
        await hp.openPage();
        // await hp.didMakeInitialQueries({ term: '' });
        await hp.hasEmptyState();
        await hp.types('empty');
        await hp.hasNoResultsState();
    });
    test.describe('default background colors', () => {
        test('default background light', async ({ page }, workerInfo) => {
            const hp = SettingsTestPage.create(page, workerInfo).withEntries(0);
            await hp.openPage();
            await hp.hasEmptyState();
            await hp.hasBackgroundColor({ hex: '#fafafa' });
        });
        test('default background dark', async ({ page }, workerInfo) => {
            const hp = SettingsTestPage.create(page, workerInfo).withEntries(0);
            await hp.darkMode();
            await hp.openPage();
            await hp.hasEmptyState();
            await hp.hasBackgroundColor({ hex: '#333333' });
        });
        test('with overrides from initial setup (light)', async ({ page }, workerInfo) => {
            const hp = SettingsTestPage.create(page, workerInfo).withEntries(0);
            await hp.openPage({ additional: { defaultStyles: 'visual-refresh' } });
            await hp.hasEmptyState();
            await hp.hasBackgroundColor({ hex: '#E9EBEC' });
        });
        test('with overrides from initial setup (dark)', async ({ page }, workerInfo) => {
            const hp = SettingsTestPage.create(page, workerInfo).withEntries(0);
            await hp.darkMode();
            await hp.openPage({ additional: { defaultStyles: 'visual-refresh' } });
            await hp.hasEmptyState();
            await hp.hasBackgroundColor({ hex: '#27282A' });
        });
    });
});
