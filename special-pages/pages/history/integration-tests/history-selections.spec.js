import { test } from '@playwright/test';
import { HistoryTestPage } from './history.page.js';

test.describe('history selections', () => {
    test('selects one item at a time', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRow(0);
        await hp.selectsRow(1);
        await hp.selectsRow(2);
    });
    test('resets selection with new query', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRow(0);
        await hp.types('example.com');
        await hp.rowIsNotSelected(0);
    });
    test('adds to selection', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});

        await hp.selectsRow(0);
        await hp.selectsRowWithCtrl(1);

        await hp.rowIsSelected(0);
        await hp.rowIsSelected(1);
    });
    test('removes from a selection', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});

        await hp.selectsRow(0);
        await hp.selectsRowWithCtrl(1);
        await hp.selectsRowWithCtrl(1);
        await hp.rowIsSelected(0);
        await hp.rowIsNotSelected(1);
    });
});
