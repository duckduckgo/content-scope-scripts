import { test } from '@playwright/test';
import { HistoryTestPage } from './history.page.js';

test.describe('history', () => {
    test('makes an initial empty query', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(100);
        await hp.openPage();
        await hp.didMakeInitialQueries({ term: '' });
    });
    test('makes an initial query with term', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(100);
        await hp.openPage({ additional: { q: 'youtube' } });
        await hp.didMakeInitialQueries({ term: 'youtube' });
    });
    test('makes an initial query with range', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(100);
        await hp.openPage({ additional: { range: 'today' } });
        await hp.didMakeInitialQueries({ range: 'today' });
    });
    test('switches from initial search query to range', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(100);
        await hp.openPage({ additional: { q: 'youtube' } });
        await hp.didMakeInitialQueries({ term: 'youtube' });
        await hp.selectsToday();
        await hp.didMakeNthQuery({ nth: 1, query: { range: 'today' } });
    });
    test('switches from initial range to term', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(100);
        await hp.openPage({ additional: { range: 'today' } });
        await hp.types('youtube');
        await hp.didMakeNthQuery({ nth: 0, query: { range: 'today' } });
        await hp.didMakeNthQuery({ nth: 1, query: { term: 'youtube' } });
    });
    test('makes query after clearing input and retyping', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(100);
        await hp.openPage({ additional: { debounce: '10' } });

        // page load was an empty query
        await hp.didMakeNthQuery({ nth: 0, query: { term: '' } });

        // then a manual entry
        await hp.types('youtube');
        await hp.didMakeNthQuery({ nth: 1, query: { term: 'youtube' } });

        // ensure the URL `q` params gets cleaned
        await hp.clearsInput();
        await page.waitForURL((url) => url.searchParams.get('q') === null, { timeout: 2000 });

        // clearing the input
        await hp.didMakeNthQuery({ nth: 2, query: { term: '' } });

        // retyping a query
        await hp.types('playwright');
        await hp.didMakeNthQuery({ nth: 3, query: { term: 'playwright' } });
    });
    test('performs paging', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(300);
        await hp.openPage({});

        // from page load, empty query
        await hp.didMakeNthQuery({ nth: 0, query: { term: '' } });

        // scroll to end, triggering the next fetch
        await hp.scrollsToEnd();

        // make sure the offset is sent
        await hp.didMakeNthPagingQuery({ nth: 1, query: { term: '' }, offset: 150 });

        // now search for something that has many results
        await hp.types('500');

        // and assert we're back at the top of the container
        await hp.didResetScroll();
    });
    test('selecting `all` resets to an empty query', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(300);
        await hp.openPage({});

        // start with a fresh range query
        await hp.selectsToday();
        await hp.didMakeNthQuery({ nth: 1, query: { range: 'today' } });

        // click 'all' (to reset)
        await hp.selectsAll();

        // ensure it's a full reset
        await hp.didMakeNthQuery({ nth: 2, query: { term: '' } });
    });
    test('opening links', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(5);
        await hp.openPage({});
        await hp.opensLinks();
    });
});
