import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { FavoritesPage } from './favorites.page.js';

test.describe('newtab favorites', () => {
    test('fetches config + favorites data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage();

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'favorites_getConfig', count: 1 });
        const calls3 = await ntp.mocks.waitForCallCount({ method: 'favorites_getData', count: 1 });

        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
        expect(calls3.length).toBe(1);
    });
    test('Toggles expansion', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await favorites.togglesExpansion();
    });
    test('Opens a favorite', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ platformName: 'macos' });
        await favorites.opensInSameTab();
    });
    test('Opens a favorite in new tab', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ platformName: 'macos' });
        await favorites.opensInNewTab();
    });
    test('Opens a favorite in new window', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ platformName: 'macos' });
        await favorites.opensInNewWindow();
    });
    test('Adds an item', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await favorites.addsAnItem();
    });
    test('Opens context menu', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await favorites.rightClickInvokesContextMenuFor();
    });
    test('Supports keyboard nav', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await favorites.tabsThroughItems();
    });
    test('initial empty state', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ favorites: 0 });
        await favorites.tabsPastEmptyFavorites();
    });
    test('re-orders items', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        const { id } = await favorites.drags({ index: 0, to: 2 });
        await favorites.sent({ id, fromIndex: 0, targetIndex: 2 });
    });
    test('support drop on placeholders', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ favorites: '2' });
        /**
         * Dragging the element onto position 4 is a placeholder (because only 2 favorites were loaded)
         * Therefor, this test is asserting that dropping onto a placeholder is the same action as
         * dropping into the last position in the list
         */
        const PLACEHOLDER_INDEX = 4;
        const EXPECTED_TARGET_INDEX = 2;
        const { id } = await favorites.drags({ index: 0, to: PLACEHOLDER_INDEX });
        await favorites.sent({ id, fromIndex: 0, targetIndex: EXPECTED_TARGET_INDEX });
    });
    test('accepts external drag/drop', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await favorites.acceptsExternalDrop({ index: 0 });
    });
    test('requests small favicon', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const favorites = new FavoritesPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ favorites: 'small-icon' });
        await favorites.requestsSmallFavicon();
    });
    test('requests loads fallbacks', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        // const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion();
        await ntp.openPage({ favorites: 'fallbacks' });
    });
});
