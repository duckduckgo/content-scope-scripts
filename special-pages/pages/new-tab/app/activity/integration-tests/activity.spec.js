import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { ActivityPage } from './activity.page.js';
import { BatchingPage } from './batching.page.js';

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
    test('titles', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const ap = new ActivityPage(page, ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { feed: 'activity', activity: 'empty' } });
        await ap.hasEmptyTitle();
        await ntp.openPage({ additional: { feed: 'activity', activity: 'onlyTopLevel' } });
        await ap.hasPopuplatedTitle();
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
    test.describe('batched API', () => {
        test('batched API reads tracker count total from urls api', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const widget = new ActivityPage(page, ntp).withEntries(6);
            const batching = new BatchingPage(page, ntp, widget);
            await ntp.reducedMotion();
            await ntp.openPage({
                additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: widget.entries },
            });
            await batching.displaysTrackerCount();
        });
        test('control: un-batched fetches all', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const ap = new ActivityPage(page, ntp);
            await ntp.reducedMotion();
            await ntp.openPage({
                additional: {
                    feed: 'activity',
                    'activity.api': 'NOT BATCHED',
                    platform: 'macos',
                    activity: '20', // 20 items to show by default
                },
            });
            await ap.hasRows(20);
        });
        test('fetches the minimal amount initially, and then chunks', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const widget = new ActivityPage(page, ntp).withEntries(200);
            const batching = new BatchingPage(page, ntp, widget);
            await ntp.reducedMotion();
            await ntp.openPage({
                additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: widget.entries },
            });
            await batching.fetchedRows(5);
            await widget.hasRows(5);
            await batching.triggerNext();
            await widget.hasRows(15);
            await batching.triggerNext();
            await page.waitForTimeout(100);
            await widget.hasRows(25);
        });
        test('patching in place', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const widget = new ActivityPage(page, ntp);
            const batching = new BatchingPage(page, ntp, widget);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: '200' } });
            await widget.hasRows(5);
            await batching.acceptsUpdate(0);
        });
        test('patching removes an item', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();

            const widget = new ActivityPage(page, ntp).withEntries(5);
            const batching = new BatchingPage(page, ntp, widget);

            await ntp.openPage({
                additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: widget.entries },
            });

            await widget.hasRows(5);
            await batching.removesItem(0);
            await widget.hasRows(4);
        });
        test('items are fetched to replace patched removals', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();

            // 6 entries, 1 more than default to show
            const widget = new ActivityPage(page, ntp).withEntries(6);
            const batching = new BatchingPage(page, ntp, widget);

            await ntp.openPage({
                additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: widget.entries },
            });

            await batching.fillsHoleWhenItemRemoved();
        });
        test('items are reordered on patch', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();

            // 6 entries, 1 more than default to show
            const widget = new ActivityPage(page, ntp).withEntries(6);
            const batching = new BatchingPage(page, ntp, widget);

            await ntp.openPage({
                additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: widget.entries },
            });

            await batching.itemsReorder();
        });
        test('resets on collapse', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();

            // 20 entries, plenty to be triggered
            const widget = new ActivityPage(page, ntp).withEntries(20);
            const batching = new BatchingPage(page, ntp, widget);

            await ntp.openPage({
                additional: { feed: 'activity', 'activity.api': 'batched', platform: 'windows', activity: widget.entries },
            });

            await batching.fetchedRows(5);
            await widget.hasRows(5);
            await batching.triggerNext();
            await widget.hasRows(15);
            await widget.collapsesList();
            await widget.expandsList();
            await widget.hasRows(5);
        });
    });
});
