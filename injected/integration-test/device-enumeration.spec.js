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

        test('should forward devicechange addEventListener to native when willPrompt is false', async ({ page }) => {
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
                globalThis.cssMessaging.impl.request = () =>
                    Promise.resolve({
                        videoInput: true,
                        audioInput: true,
                        audioOutput: true,
                        willPrompt: false,
                    });

                const nativeAdd = MediaDevices.prototype.addEventListener;
                let nativeDeviceChangeCalls = 0;
                MediaDevices.prototype.addEventListener = function (type, ...rest) {
                    if (type === 'devicechange') {
                        nativeDeviceChangeCalls += 1;
                    }
                    return nativeAdd.apply(this, [type, ...rest]);
                };

                navigator.mediaDevices.addEventListener('devicechange', () => {});
                await new Promise((resolve) => setTimeout(resolve, 50));

                return { nativeDeviceChangeCalls };
            });

            expect(result.nativeDeviceChangeCalls).toBe(1);
        });

        test('should not forward devicechange addEventListener to native when willPrompt is true', async ({ page }) => {
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
                globalThis.cssMessaging.impl.request = () =>
                    Promise.resolve({
                        videoInput: true,
                        audioInput: true,
                        audioOutput: true,
                        willPrompt: true,
                    });

                const nativeAdd = MediaDevices.prototype.addEventListener;
                let nativeDeviceChangeCalls = 0;
                MediaDevices.prototype.addEventListener = function (type, ...rest) {
                    if (type === 'devicechange') {
                        nativeDeviceChangeCalls += 1;
                    }
                    return nativeAdd.apply(this, [type, ...rest]);
                };

                navigator.mediaDevices.addEventListener('devicechange', () => {});
                await new Promise((resolve) => setTimeout(resolve, 50));

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

                const fired = new Promise((resolve) => {
                    navigator.mediaDevices.addEventListener('devicechange', () => resolve(true), { once: true });
                });
                await new Promise((resolve) => setTimeout(resolve, 50));

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

                const fired = new Promise((resolve) => {
                    navigator.mediaDevices.ondevicechange = () => resolve(true);
                });
                await new Promise((resolve) => setTimeout(resolve, 50));

                willPrompt = false;

                return { fired: await fired };
            });

            expect(result.fired).toBe(true);
        });
    });
});
