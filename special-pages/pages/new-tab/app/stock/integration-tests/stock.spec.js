import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { StockPage } from './stock.page.js';

test.describe('newtab stock widget', () => {
    test('fetches stock data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stock: 'aapl' } });

        const calls = await ntp.mocks.waitForCallCount({ method: 'stock_getData', count: 1 });
        expect(calls.length).toBe(1);
    });

    test('displays stock widget with aapl preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const stock = new StockPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stock: 'aapl' } });

        await stock.waitForStockWidget();
        const widget = stock.stockWidget();

        await expect(widget.getByText('AAPL')).toBeVisible();
        await expect(widget.getByText('Apple Inc')).toBeVisible();
        await expect(widget.getByText('$258.27')).toBeVisible();
        await expect(widget.getByText('+2.86 (+1.12%)')).toBeVisible();
    });

    test('displays stock widget with googl preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const stock = new StockPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stock: 'googl' } });

        await stock.waitForStockWidget();
        const widget = stock.stockWidget();

        await expect(widget.getByText('GOOGL')).toBeVisible();
        await expect(widget.getByText('Alphabet Inc')).toBeVisible();
        await expect(widget.getByText('$175.98')).toBeVisible();
    });

    test('displays negative change correctly', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const stock = new StockPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { stock: 'down' } });

        await stock.waitForStockWidget();
        const widget = stock.stockWidget();

        await expect(widget.getByText('XYZ')).toBeVisible();
        await expect(widget.getByText('Example Corp')).toBeVisible();
        await expect(widget.getByText('$45.20')).toBeVisible();
        await expect(widget.getByText('-2.80 (-5.83%)')).toBeVisible();
    });

    test('supports URL parameter overrides', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const stock = new StockPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: {
                stock: 'aapl',
                'stock.symbol': 'TEST',
                'stock.price': '100.50',
            },
        });

        await stock.waitForStockWidget();
        const widget = stock.stockWidget();

        await expect(widget.getByText('TEST')).toBeVisible();
        await expect(widget.getByText('$100.50')).toBeVisible();
    });
});
