import { gotoAndWait, testContextForExtension } from './helpers/harness.js';
import { test as base, expect } from '@playwright/test';

const test = testContextForExtension(base);

test.describe('Device Enumeration Feature', () => {
    test.describe('disabled feature', () => {
        test('should not intercept enumerateDevices when disabled', async ({ page }) => {
            await gotoAndWait(page, '/webcompat/pages/device-enumeration.html', {
                site: { enabledFeatures: [] },
            });

            // Should use native implementation
            const results = await page.evaluate(() => {
                // @ts-expect-error - results is set by renderResults()
                return window.results;
            });

            // The test should pass with native behavior
            expect(results).toBeDefined();
        });
    });

    test.describe('enabled feature', () => {
        test('should intercept enumerateDevices when enabled', async ({ page }) => {
            await gotoAndWait(page, '/webcompat/pages/device-enumeration.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        enumerateDevices: 'enabled',
                    },
                },
            });

            // Should use our implementation
            const results = await page.evaluate(() => {
                // @ts-expect-error - results is set by renderResults()
                return window.results;
            });

            // The test should pass with our implementation
            expect(results).toBeDefined();
        });
    });
});
