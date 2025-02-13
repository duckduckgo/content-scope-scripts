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
    test('Expands a select with shift+click', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRow(0);
        await hp.selectsRowWithShift(4);
        await hp.rowIsSelected(0);
        await hp.rowIsSelected(1);
        await hp.rowIsSelected(2);
        await hp.rowIsSelected(3);
        await hp.rowIsSelected(4);

        // control
        await hp.rowIsNotSelected(5);
    });
    test('Anchors a selection with shift+click', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRow(4);
        await hp.selectsRowWithShift(6);
        await hp.rowIsSelected(4);
        await hp.rowIsSelected(5);
        await hp.rowIsSelected(6);

        await hp.selectsRowWithShift(0);
        await hp.rowIsSelected(0);
        await hp.rowIsSelected(1);
        await hp.rowIsSelected(2);
        await hp.rowIsSelected(3);
        await hp.rowIsSelected(4);

        // control
        await hp.rowIsNotSelected(5);
        await hp.rowIsNotSelected(6);
    });
});
