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

        test('should expose a safe getCapabilities shim for synthetic input devices', async ({ page }) => {
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

            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (message) => {
                    globalThis.deviceEnumerationRequest = message;
                    return Promise.resolve({
                        videoInput: true,
                        audioInput: true,
                        audioOutput: true,
                        willPrompt: true,
                    });
                };
            });

            const result = await page.evaluate(async () => {
                const devices = await navigator.mediaDevices.enumerateDevices();
                /** @type {InputDeviceInfo | undefined} */
                const audioInput = /** @type {InputDeviceInfo | undefined} */ (devices.find((device) => device.kind === 'audioinput'));
                /** @type {InputDeviceInfo | undefined} */
                const videoInput = /** @type {InputDeviceInfo | undefined} */ (devices.find((device) => device.kind === 'videoinput'));
                const audioOutput = devices.find((device) => device.kind === 'audiooutput');

                return {
                    message: globalThis.deviceEnumerationRequest,
                    devices,
                    inputDevicesAreInputDeviceInfo: [audioInput, videoInput].every((device) => device instanceof InputDeviceInfo),
                    audioCapabilities: audioInput?.getCapabilities(),
                    videoCapabilities: videoInput?.getCapabilities(),
                    outputHasGetCapabilities: typeof (/** @type {any} */ (audioOutput))?.getCapabilities,
                };
            });

            expect(result.message).toMatchObject({
                featureName: 'webCompat',
                method: 'deviceEnumeration',
                params: {},
            });
            expect(result.devices).toHaveLength(3);
            expect(result.inputDevicesAreInputDeviceInfo).toEqual(true);
            expect(result.audioCapabilities).toEqual({});
            expect(result.videoCapabilities).toEqual({});
            expect(result.outputHasGetCapabilities).toEqual('undefined');
        });
    });
});
