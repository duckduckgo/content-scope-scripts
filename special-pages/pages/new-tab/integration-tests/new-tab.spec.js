import { expect, test } from '@playwright/test';
import { NewtabPage } from './new-tab.page.js';
import { CustomizerPage } from '../app/customizer/integration-tests/customizer.page.js';

test.describe('newtab widgets', () => {
    test('widget config single click', async ({ page }, workerInfo) => {
        await page.clock.install();

        const ntp = NewtabPage.create(page, workerInfo);
        const cp = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage();
        await cp.opensCustomizer();

        // hide
        await page.getByRole('switch', { name: 'Toggle Protections Report' }).uncheck();

        // debounced
        await page.clock.fastForward(501);

        // verify the single sync call, where one is hidden
        const outgoing = await ntp.mocks.outgoing({ names: ['widgets_setConfig'] });

        expect(outgoing).toStrictEqual([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'newTabPage',
                    params: [
                        { id: 'omnibar', visibility: 'visible' },
                        { id: 'favorites', visibility: 'visible' },
                        { id: 'protections', visibility: 'hidden' },
                    ],
                    method: 'widgets_setConfig',
                },
            },
        ]);
    });
    test.skip('widget config double click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage();

        // menu
        await page.getByRole('button', { name: 'Customize' }).click();

        // hide
        await page.locator('label').filter({ hasText: 'Blocked Tracking Attempts' }).uncheck();

        // show
        await page.locator('label').filter({ hasText: 'Blocked Tracking Attempts' }).check();

        // debounced
        await page.waitForTimeout(500);

        // verify the single sync call, where both are visible.
        const outgoing = await ntp.mocks.outgoing({ names: ['widgets_setConfig'] });
        expect(outgoing).toStrictEqual([
            {
                payload: {
                    context: 'specialPages',
                    featureName: 'newTabPage',
                    params: [
                        { id: 'omnibar', visibility: 'visible' },
                        { id: 'favorites', visibility: 'visible' },
                        { id: 'protections', visibility: 'visible' },
                    ],
                    method: 'widgets_setConfig',
                },
            },
        ]);
    });
    test('context menu', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage();

        // wait for the menu, as a signal that the JS is ready
        await page.getByRole('button', { name: 'Customize' }).waitFor();

        await page.locator('body').click({ button: 'right' });

        const calls = await ntp.mocks.waitForCallCount({ method: 'contextMenu', count: 1 });
        expect(calls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'contextMenu',
            params: {
                visibilityMenuItems: [
                    {
                        id: 'omnibar',
                        title: 'Search',
                    },
                    {
                        id: 'favorites',
                        title: 'Favorites',
                    },
                    {
                        id: 'protections',
                        title: 'Protections Report',
                    },
                ],
            },
        });
    });
    test.describe('multi-instance widgets', () => {
        test('can add weather widget instance', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            ntp.mocks.defaultResponses({
                initialSetup: {
                    widgets: [{ id: 'rmf' }, { id: 'favorites' }, { id: 'weather' }],
                    widgetConfigs: [
                        { id: 'favorites', visibility: 'visible' },
                        {
                            id: 'weather',
                            instanceId: 'weather-1',
                            visibility: 'visible',
                            location: 'NYC',
                            temperatureUnit: 'fahrenheit',
                            expansion: 'expanded',
                        },
                    ],
                    env: 'development',
                    locale: 'en',
                    platform: { name: 'windows' },
                    updateNotification: { content: null },
                    customizer: { theme: 'system', userImages: [], userColor: null, background: { kind: 'default' } },
                },
            });
            await ntp.openPage({ additional: { weather: 'sydney' } });

            // Open customizer and add another weather widget
            await ntp.addWidgetInstance('Weather');

            // Verify we now have 2 weather widget rows
            const weatherRows = await page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Weather' }).count();
            expect(weatherRows).toBe(2);
        });

        test('added widget instance appears on page', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            ntp.mocks.defaultResponses({
                initialSetup: {
                    widgets: [{ id: 'rmf' }, { id: 'favorites' }, { id: 'weather' }],
                    widgetConfigs: [{ id: 'favorites', visibility: 'visible' }],
                    env: 'development',
                    locale: 'en',
                    platform: { name: 'windows' },
                    updateNotification: { content: null },
                    customizer: { theme: 'system', userImages: [], userColor: null, background: { kind: 'default' } },
                },
            });
            await ntp.openPage();

            // Verify no weather widgets initially
            const initialWeatherWidgets = await page.locator('[data-entry-point="weather"]').count();
            expect(initialWeatherWidgets).toBe(0);

            // Add a weather widget
            await ntp.addWidgetInstance('Weather');

            // Close the customizer to see the page
            await page.keyboard.press('Escape');

            // Verify weather widget now appears on the page
            await expect(page.locator('[data-entry-point="weather"]')).toBeVisible();
        });

        test('can remove weather widget instance', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            ntp.mocks.defaultResponses({
                initialSetup: {
                    widgets: [{ id: 'rmf' }, { id: 'favorites' }, { id: 'weather' }],
                    widgetConfigs: [
                        { id: 'favorites', visibility: 'visible' },
                        {
                            id: 'weather',
                            instanceId: 'weather-1',
                            visibility: 'visible',
                            location: 'NYC',
                            temperatureUnit: 'fahrenheit',
                            expansion: 'expanded',
                        },
                    ],
                    env: 'development',
                    locale: 'en',
                    platform: { name: 'windows' },
                    updateNotification: { content: null },
                    customizer: { theme: 'system', userImages: [], userColor: null, background: { kind: 'default' } },
                },
            });
            await ntp.openPage({ additional: { weather: 'sydney' } });

            // Open customizer
            await page.getByRole('button', { name: 'Customize' }).click();

            // Count initial weather rows
            const initialCount = await page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Weather' }).count();
            expect(initialCount).toBe(1);

            // Remove the weather widget
            await ntp.removeWidgetInstance('Weather');

            // Verify it's gone
            const finalCount = await page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Weather' }).count();
            expect(finalCount).toBe(0);
        });

        test('toggle only shown for non-multi-instance widgets', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            ntp.mocks.defaultResponses({
                initialSetup: {
                    widgets: [{ id: 'rmf' }, { id: 'favorites' }, { id: 'weather' }],
                    widgetConfigs: [
                        { id: 'favorites', visibility: 'visible' },
                        {
                            id: 'weather',
                            instanceId: 'weather-1',
                            visibility: 'visible',
                            location: 'NYC',
                            temperatureUnit: 'fahrenheit',
                            expansion: 'expanded',
                        },
                    ],
                    env: 'development',
                    locale: 'en',
                    platform: { name: 'windows' },
                    updateNotification: { content: null },
                    customizer: { theme: 'system', userImages: [], userColor: null, background: { kind: 'default' } },
                },
            });
            await ntp.openPage({ additional: { weather: 'sydney' } });

            // Open customizer
            await page.getByRole('button', { name: 'Customize' }).click();

            // Favorites (non-multi-instance) should have a switch
            const favoritesRow = page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Favorites' });
            await expect(favoritesRow.locator('[role="switch"]')).toBeVisible();

            // Weather (multi-instance) should have a remove button, not a switch
            const weatherRow = page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Weather' });
            await expect(weatherRow.locator('[class*="removeButton"]')).toBeVisible();
            await expect(weatherRow.locator('[role="switch"]')).not.toBeVisible();
        });

        test('X button only shown for multi-instance widgets', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            ntp.mocks.defaultResponses({
                initialSetup: {
                    widgets: [{ id: 'rmf' }, { id: 'favorites' }, { id: 'weather' }],
                    widgetConfigs: [
                        { id: 'favorites', visibility: 'visible' },
                        {
                            id: 'weather',
                            instanceId: 'weather-1',
                            visibility: 'visible',
                            location: 'NYC',
                            temperatureUnit: 'fahrenheit',
                            expansion: 'expanded',
                        },
                    ],
                    env: 'development',
                    locale: 'en',
                    platform: { name: 'windows' },
                    updateNotification: { content: null },
                    customizer: { theme: 'system', userImages: [], userColor: null, background: { kind: 'default' } },
                },
            });
            await ntp.openPage({ additional: { weather: 'sydney' } });

            // Open customizer
            await page.getByRole('button', { name: 'Customize' }).click();

            // Favorites should NOT have X button
            const favoritesRow = page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Favorites' });
            await expect(favoritesRow.locator('[class*="removeButton"]')).not.toBeVisible();

            // Weather should have X button
            const weatherRow = page.locator('[class*="widgetsSection"] li[class*="row"]').filter({ hasText: 'Weather' });
            await expect(weatherRow.locator('[class*="removeButton"]')).toBeVisible();
        });
    });

    test.describe('default background colors', () => {
        test('default background light', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage();
            await ntp.waitForCustomizer();
            await ntp.hasBackgroundColor({ hex: '#fafafa' });
        });
        test('default background dark', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.darkMode();
            await ntp.openPage();
            await ntp.waitForCustomizer();
            await ntp.hasBackgroundColor({ hex: '#1c1c1c' });
        });
        test('with overrides from initial setup (light)', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.openPage({ additional: { defaultStyles: 'visual-refresh' } });
            await ntp.waitForCustomizer();
            await page.pause();
            await ntp.hasBackgroundColor({ hex: '#E9EBEC' });
        });
        test('with overrides from initial setup (dark)', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            await ntp.reducedMotion();
            await ntp.darkMode();
            await ntp.openPage({ additional: { defaultStyles: 'visual-refresh' } });
            await ntp.waitForCustomizer();
            await ntp.hasBackgroundColor({ hex: '#27282A' });
        });
        test('with pushed updated theme value (light)', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const cp = new CustomizerPage(ntp);
            await ntp.reducedMotion();
            await ntp.openPage({});
            await ntp.waitForCustomizer();
            await cp.acceptsThemeUpdateWithDefaults('light', { darkBackgroundColor: '#000000', lightBackgroundColor: '#ffffff' });
            await ntp.hasBackgroundColor({ hex: '#ffffff' });
        });
        test('with pushed updated theme value (dark)', async ({ page }, workerInfo) => {
            const ntp = NewtabPage.create(page, workerInfo);
            const cp = new CustomizerPage(ntp);
            await ntp.reducedMotion();
            await ntp.darkMode();
            await ntp.openPage({});
            await ntp.waitForCustomizer();
            await cp.acceptsThemeUpdateWithDefaults('dark', { darkBackgroundColor: '#000000', lightBackgroundColor: '#ffffff' });
            await ntp.hasBackgroundColor({ hex: '#000000' });
        });
    });
});
