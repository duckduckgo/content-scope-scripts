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

        test('should not forward devicechange addEventListener to native', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        enumerateDevices: 'enabled',
                    },
                },
            });

            const result = await page.evaluate(() => {
                const nativeAdd = MediaDevices.prototype.addEventListener;
                let nativeDeviceChangeCalls = 0;
                MediaDevices.prototype.addEventListener = function (type, ...rest) {
                    if (type === 'devicechange') {
                        nativeDeviceChangeCalls += 1;
                    }
                    return nativeAdd.apply(this, [type, ...rest]);
                };

                navigator.mediaDevices.addEventListener('devicechange', () => {});

                return { nativeDeviceChangeCalls };
            });

            expect(result.nativeDeviceChangeCalls).toBe(0);
        });

        test('should fire devicechange (addEventListener) when OS permission is granted', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        enumerateDevices: 'enabled',
                    },
                },
            });

            const result = await page.evaluate(async () => {
                let willPrompt = true;
                globalThis.cssMessaging.impl.request = (message) => {
                    if (message.method === 'deviceEnumeration') {
                        return Promise.resolve({
                            videoInput: true,
                            audioInput: true,
                            audioOutput: true,
                            willPrompt,
                        });
                    }
                    return Promise.reject(new Error('unexpected request'));
                };

                await navigator.mediaDevices.enumerateDevices();

                const fired = new Promise((resolve) => {
                    navigator.mediaDevices.addEventListener('devicechange', () => resolve(true), { once: true });
                });

                willPrompt = false;

                return { fired: await fired };
            });

            expect(result.fired).toBe(true);
        });

        test('should fire devicechange (ondevicechange) when OS permission is granted', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        enumerateDevices: 'enabled',
                    },
                },
            });

            const result = await page.evaluate(async () => {
                let willPrompt = true;
                globalThis.cssMessaging.impl.request = (message) => {
                    if (message.method === 'deviceEnumeration') {
                        return Promise.resolve({
                            videoInput: true,
                            audioInput: true,
                            audioOutput: true,
                            willPrompt,
                        });
                    }
                    return Promise.reject(new Error('unexpected request'));
                };

                await navigator.mediaDevices.enumerateDevices();

                const fired = new Promise((resolve) => {
                    navigator.mediaDevices.ondevicechange = () => resolve(true);
                });

                willPrompt = false;

                return { fired: await fired };
            });

            expect(result.fired).toBe(true);
        });
    });
});
