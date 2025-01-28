import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { ActivityPage } from './activity.page.js';

test.describe('activity widget', () => {
    test('Renders activity', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'activity_getData', count: 1 });
        const calls3 = await ntp.mocks.waitForCallCount({ method: 'activity_getConfig', count: 1 });

        expect(calls1.length).toBe(1);
        expect(calls2.length).toBe(1);
        expect(calls3.length).toBe(1);

        await ap.didRender();
    });
    test('Accepts update (subscription)', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.acceptsUpdatedFavorite();
        await ap.acceptsUpdatedHistoryPaths();
    });
    test('can expand with entries', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity', activity: 'onlyTopLevel' } });
        await ap.canCollapseList();
    });
    test('empty state', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity', activity: 'onlyTopLevel' } });
        await ap.cannotExpandListWhenEmpty();
    });
    test('favorite item', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.addsFavorite();
    });
    test('remove favorite item', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.removesFavorite();
    });
    test('burns item', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.burnsItem();
    });
    test('removes item (windows)', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' }, platformName: 'windows' });
        await ap.didRender();
        await ap.removesItem();
    });
    test('opening links from title', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.opensLinkFromTitle();
    });
    test('opening links from favicons', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.opensLinkFromFavicon();
    });
    test('opening links from history', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.opensLinkFromHistory();
    });
    test('listing tracker companies', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.listsAtMost3TrackerCompanies();
    });
    test('supported empty trackers states', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();
        await ap.showsEmptyTrackerState();
    });
    test('after rendering and navigating to a new tab, data is re-requested on return', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity' } });
        await ap.didRender();

        // Open a new tab and navigate it to about:blank
        await ntp.mocks.waitForCallCount({ method: 'activity_getData', count: 1 });
        const newTab = await page.context().newPage();
        await newTab.goto('about:blank');

        // Bring the first tab back into focus
        await page.bringToFront();

        await page.evaluate(() => {
            // @ts-expect-error - testing only property
            const fn = window.__trigger_document_visibilty__;
            fn?.();
        });
        await ntp.mocks.waitForCallCount({ method: 'activity_getData', count: 2 });
    });
});
