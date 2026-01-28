import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { WeatherPage } from './weather.page.js';

test.describe('newtab weather widget', () => {
    test('fetches weather data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { weather: 'sydney' } });

        const calls = await ntp.mocks.waitForCallCount({ method: 'weather_getData', count: 1 });
        expect(calls.length).toBe(1);
    });

    test('displays weather widget with sydney preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const weather = new WeatherPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { weather: 'sydney' } });

        await weather.waitForWeatherWidget();
        const widget = weather.weatherWidget();

        await expect(widget.getByText('Sydney, AU')).toBeVisible();
        await expect(widget.getByText('25°')).toBeVisible();
        await expect(widget.getByText('sunny')).toBeVisible();
    });

    test('displays weather widget with london preset', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const weather = new WeatherPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { weather: 'london' } });

        await weather.waitForWeatherWidget();
        const widget = weather.weatherWidget();

        await expect(widget.getByText('London, UK')).toBeVisible();
        await expect(widget.getByText('12°')).toBeVisible();
        await expect(widget.getByText('cloudy')).toBeVisible();
    });

    test('supports URL parameter overrides', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const weather = new WeatherPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: {
                weather: 'sydney',
                'weather.temp': '30',
                'weather.location': 'Test City',
            },
        });

        await weather.waitForWeatherWidget();
        const widget = weather.weatherWidget();

        await expect(widget.getByText('Test City')).toBeVisible();
        await expect(widget.getByText('30°')).toBeVisible();
    });

    test('displays feels-like temperature when available', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const weather = new WeatherPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { weather: 'sydney' } });

        await weather.waitForWeatherWidget();
        const widget = weather.weatherWidget();

        await expect(widget.getByText('Feels like 27°')).toBeVisible();
    });
});
