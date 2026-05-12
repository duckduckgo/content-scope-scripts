import { gotoAndWait, testContextForExtension } from './helpers/harness.js';
import { test as base, expect } from '@playwright/test';

const test = testContextForExtension(base);

test.describe('Device Enumeration Feature', () => {
    test.describe('disabled feature', () => {
        test('should not intercept enumerateDevices when disabled', async ({ page }) => {
            await gotoAndWait(page, '/webcompat/pages/device-enumeration.html', {
                site: { enabledFeatures: [] },
            });

            const results = await page.evaluate(
                () =>
                    /** @type {any} */ (window).results ??
                    new Promise((resolve) =>
                        window.addEventListener('results-ready', (event) => resolve(/** @type {any} */ (event).detail)),
                    ),
            );

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

            const results = await page.evaluate(
                () =>
                    /** @type {any} */ (window).results ??
                    new Promise((resolve) =>
                        window.addEventListener('results-ready', (event) => resolve(/** @type {any} */ (event).detail)),
                    ),
            );

            expect(results).toBeDefined();
        });

        test('should prove native getCapabilities throws on old synthetic InputDeviceInfo objects', async ({ page }) => {
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
                const syntheticInputDevice = Object.create(InputDeviceInfo.prototype);
                Object.defineProperties(syntheticInputDevice, {
                    deviceId: {
                        value: 'communications',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    groupId: {
                        value: '',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    kind: {
                        value: 'audioinput',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    label: {
                        value: 'Fake microphone',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                });

                try {
                    syntheticInputDevice.getCapabilities();
                    return {
                        threw: false,
                        isInputDeviceInfo: syntheticInputDevice instanceof InputDeviceInfo,
                        hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(syntheticInputDevice, 'getCapabilities'),
                    };
                } catch (error) {
                    return {
                        threw: true,
                        errorName: error instanceof Error ? error.name : String(error),
                        errorMessage: error instanceof Error ? error.message : String(error),
                        isInputDeviceInfo: syntheticInputDevice instanceof InputDeviceInfo,
                        hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(syntheticInputDevice, 'getCapabilities'),
                    };
                }
            });

            expect(result).toMatchObject({
                threw: true,
                errorName: 'TypeError',
                errorMessage: 'Illegal invocation',
                isInputDeviceInfo: true,
                hasOwnGetCapabilities: false,
            });
        });

        test('should not throw when a synthetic InputDeviceInfo defines its own getCapabilities', async ({ page }) => {
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
                const syntheticInputDevice = Object.create(InputDeviceInfo.prototype);
                Object.defineProperties(syntheticInputDevice, {
                    deviceId: {
                        value: 'communications',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    groupId: {
                        value: '',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    kind: {
                        value: 'audioinput',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    label: {
                        value: 'Fake microphone',
                        writable: false,
                        configurable: false,
                        enumerable: true,
                    },
                    getCapabilities: {
                        value: function () {
                            return {};
                        },
                        writable: false,
                        configurable: true,
                        enumerable: false,
                    },
                });

                try {
                    return {
                        threw: false,
                        capabilities: syntheticInputDevice.getCapabilities(),
                        isInputDeviceInfo: syntheticInputDevice instanceof InputDeviceInfo,
                        hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(syntheticInputDevice, 'getCapabilities'),
                    };
                } catch (error) {
                    return {
                        threw: true,
                        errorName: error instanceof Error ? error.name : String(error),
                        errorMessage: error instanceof Error ? error.message : String(error),
                        isInputDeviceInfo: syntheticInputDevice instanceof InputDeviceInfo,
                        hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(syntheticInputDevice, 'getCapabilities'),
                    };
                }
            });

            expect(result).toMatchObject({
                threw: false,
                capabilities: {},
                isInputDeviceInfo: true,
                hasOwnGetCapabilities: true,
            });
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
                const audioInputAny = /** @type {any} */ (audioInput);

                return {
                    message: globalThis.deviceEnumerationRequest,
                    devices,
                    inputDevicesAreInputDeviceInfo: [audioInput, videoInput].every((device) => device instanceof InputDeviceInfo),
                    audioHasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(audioInputAny, 'getCapabilities'),
                    audioCapabilities: audioInput?.getCapabilities(),
                    videoCapabilities: videoInput?.getCapabilities(),
                    outputHasGetCapabilities: typeof (/** @type {any} */ (audioOutput)?.getCapabilities),
                    audioGetCapabilitiesToString: audioInput?.getCapabilities.toString(),
                    audioGetCapabilitiesToStringToString: audioInput?.getCapabilities.toString.toString(),
                    audioDeleteGetCapabilities: delete audioInputAny.getCapabilities,
                    audioCapabilitiesAfterDelete: audioInputAny?.getCapabilities(),
                };
            });

            expect(result.message).toMatchObject({
                featureName: 'webCompat',
                method: 'deviceEnumeration',
                params: {},
            });
            expect(result.devices).toHaveLength(3);
            expect(result.inputDevicesAreInputDeviceInfo).toEqual(true);
            expect(result.audioHasOwnGetCapabilities).toEqual(false);
            expect(result.audioCapabilities).toEqual({});
            expect(result.videoCapabilities).toEqual({});
            expect(result.outputHasGetCapabilities).toEqual('undefined');
            // The shim should be masked so toString() looks like a native method (not the JS source).
            expect(result.audioGetCapabilitiesToString).toEqual('function getCapabilities() { [native code] }');
            expect(result.audioGetCapabilitiesToStringToString).toEqual('function toString() { [native code] }');
            expect(result.audioDeleteGetCapabilities).toEqual(true);
            expect(result.audioCapabilitiesAfterDelete).toEqual({});
        });

        test('getCapabilitiesShim=instanceOwn preserves the prototype identity and exposes an own shim', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        enumerateDevices: {
                            state: 'enabled',
                            getCapabilitiesShim: 'instanceOwn',
                        },
                    },
                },
            });

            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () =>
                    Promise.resolve({
                        videoInput: true,
                        audioInput: true,
                        audioOutput: true,
                        willPrompt: true,
                    });
            });

            const result = await page.evaluate(async () => {
                const devices = await navigator.mediaDevices.enumerateDevices();
                /** @type {InputDeviceInfo | undefined} */
                const audioInput = /** @type {InputDeviceInfo | undefined} */ (devices.find((device) => device.kind === 'audioinput'));
                const audioInputAny = /** @type {any} */ (audioInput);

                return {
                    prototypeIsInputDeviceInfo: Object.getPrototypeOf(audioInputAny) === InputDeviceInfo.prototype,
                    isInputDeviceInfo: audioInput instanceof InputDeviceInfo,
                    hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(audioInputAny, 'getCapabilities'),
                    capabilities: audioInput?.getCapabilities(),
                    getCapabilitiesToString: audioInput?.getCapabilities.toString(),
                };
            });

            expect(result).toEqual({
                prototypeIsInputDeviceInfo: true,
                isInputDeviceInfo: true,
                hasOwnGetCapabilities: true,
                capabilities: {},
                getCapabilitiesToString: 'function getCapabilities() { [native code] }',
            });
        });

        test('getCapabilitiesShim=disabled documents the native illegal-invocation trade-off', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        enumerateDevices: {
                            state: 'enabled',
                            getCapabilitiesShim: 'disabled',
                        },
                    },
                },
            });

            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () =>
                    Promise.resolve({
                        videoInput: true,
                        audioInput: true,
                        audioOutput: true,
                        willPrompt: true,
                    });
            });

            const result = await page.evaluate(async () => {
                const devices = await navigator.mediaDevices.enumerateDevices();
                /** @type {InputDeviceInfo | undefined} */
                const audioInput = /** @type {InputDeviceInfo | undefined} */ (devices.find((device) => device.kind === 'audioinput'));
                const audioInputAny = /** @type {any} */ (audioInput);

                try {
                    audioInput?.getCapabilities();
                    return {
                        threw: false,
                        prototypeIsInputDeviceInfo: Object.getPrototypeOf(audioInputAny) === InputDeviceInfo.prototype,
                        hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(audioInputAny, 'getCapabilities'),
                    };
                } catch (error) {
                    return {
                        threw: true,
                        errorName: error instanceof Error ? error.name : String(error),
                        errorMessage: error instanceof Error ? error.message : String(error),
                        prototypeIsInputDeviceInfo: Object.getPrototypeOf(audioInputAny) === InputDeviceInfo.prototype,
                        hasOwnGetCapabilities: Object.prototype.hasOwnProperty.call(audioInputAny, 'getCapabilities'),
                    };
                }
            });

            expect(result).toEqual({
                threw: true,
                errorName: 'TypeError',
                errorMessage: 'Illegal invocation',
                prototypeIsInputDeviceInfo: true,
                hasOwnGetCapabilities: false,
            });
        });
    });
});
