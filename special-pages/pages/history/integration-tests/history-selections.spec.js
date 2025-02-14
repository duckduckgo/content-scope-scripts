import { test } from '@playwright/test';
import { HistoryTestPage } from './history.page.js';

test.describe('history selections', () => {
    test('selects one item at a time', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRowIndex(0);
        await hp.selectsRowIndex(1);
        await hp.selectsRowIndex(2);
    });
    test('resets selection with new query', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRowIndex(0);
        await hp.types('example.com');
        await hp.rowIsNotSelected(0);
    });
    test('adds to selection', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});

        await hp.selectsRowIndex(0);
        await hp.selectsRowWithCtrl(1);

        await hp.rowIsSelected(0);
        await hp.rowIsSelected(1);
    });
    test('removes from a selection', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});

        await hp.selectsRowIndex(0);
        await hp.selectsRowWithCtrl(1);
        await hp.selectsRowWithCtrl(1);
        await hp.rowIsSelected(0);
        await hp.rowIsNotSelected(1);
    });
    test('Expands a select with shift+click', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRowIndex(0);
        await hp.selectsRowIndexWithShift(4);
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
        await hp.selectsRowIndex(4);
        await hp.selectsRowIndexWithShift(6);
        await hp.rowIsSelected(4);
        await hp.rowIsSelected(5);
        await hp.rowIsSelected(6);

        await hp.selectsRowIndexWithShift(0);
        await hp.rowIsSelected(0);
        await hp.rowIsSelected(1);
        await hp.rowIsSelected(2);
        await hp.rowIsSelected(3);
        await hp.rowIsSelected(4);

        // control
        await hp.rowIsNotSelected(5);
        await hp.rowIsNotSelected(6);
    });
    test('removes all selections when any item is deleted', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRowIndex(0);
        await hp.deletesFromHistoryEntry(1, { action: 'delete' });
        await hp.rowIsNotSelected(0);
    });
    test('issues context menu for selected group', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRowIndex(0);
        await hp.selectsRowIndexWithShift(2);
        await hp.rightClicksWithinSelection(0, hp.ids(3));
    });
    test('when multiple selected, issues context menu for a single row, when a non-selected item is the target', async ({
        page,
    }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.selectsRowIndex(0);
        await hp.selectsRowIndexWithShift(2);

        // control
        await hp.rowIsSelected(0);
        await hp.rowIsSelected(1);
        await hp.rowIsSelected(2);

        // do the action, right-clicking an entry outside of the selection
        await hp.deletesFromHistoryEntry(3, { action: 'delete' });

        // double-check
        await hp.rowIsNotSelected(0);
    });
    test.skip('expands selection up with shift+arrows', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
    });
    test.skip('expands selection down with shift+arrows', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
    });
    test.skip('changes `deleteAll` button text when selections are made', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
    });
    test.skip('deletes a single row item without confirmation', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.deletesFromHistoryEntry(0, { action: 'delete' });
    });
    test.skip('deletes multiple rows with confirmation', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.deletesFromHistoryEntry(0, { action: 'delete' });
    });
    test.skip('removes all selections with ESC key', async ({ page }, workerInfo) => {
        const hp = HistoryTestPage.create(page, workerInfo).withEntries(2000);
        await hp.openPage({});
        await hp.deletesFromHistoryEntry(0, { action: 'delete' });
    });
});
