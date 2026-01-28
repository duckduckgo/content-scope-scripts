import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { NewsPage } from './news.page.js';

test.describe('newtab news widget', () => {
    test('fetches news data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { news: 'au' } });

        const calls = await ntp.mocks.waitForCallCount({ method: 'news_getData', count: 1 });
        expect(calls.length).toBe(1);
    });

    test('displays news widget with au preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const news = new NewsPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { news: 'au' } });

        await news.waitForNewsWidget();
        const widget = news.newsWidget();

        await expect(widget.getByText('Sydney Opera House celebrates 50th anniversary with special light show')).toBeVisible();
        await expect(widget.getByText('Sydney Morning Herald')).toBeVisible();
    });

    test('displays news widget with us preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const news = new NewsPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { news: 'us' } });

        await news.waitForNewsWidget();
        const widget = news.newsWidget();

        await expect(widget.getByText('Tech stocks rally as earnings season begins')).toBeVisible();
        await expect(widget.getByText('Wall Street Journal')).toBeVisible();
    });

    test('displays news widget with uk preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const news = new NewsPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { news: 'uk' } });

        await news.waitForNewsWidget();
        const widget = news.newsWidget();

        await expect(widget.getByText('Premier League title race heats up')).toBeVisible();
        await expect(widget.getByText('BBC Sport')).toBeVisible();
    });

    test('displays news widget with tech preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const news = new NewsPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { news: 'tech' } });

        await news.waitForNewsWidget();
        const widget = news.newsWidget();

        await expect(widget.getByText('AI chatbots transform customer service industry')).toBeVisible();
        await expect(widget.getByText('TechCrunch')).toBeVisible();
    });

    test('displays empty state when no news', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const news = new NewsPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { news: 'empty' } });

        await news.waitForNewsWidget();
        const widget = news.newsWidget();

        await expect(widget.getByText('No news available')).toBeVisible();
    });
});
