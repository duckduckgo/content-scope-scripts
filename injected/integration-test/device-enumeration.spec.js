import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const DEVICE_ENUMERATION_HTML = '/webcompat/pages/device-enumeration.html';
const BLANK_HTML = '/blank.html';
const CONFIG_ENABLED = './integration-test/test-pages/webcompat/config/device-enumeration.json';
const CONFIG_DISABLED = './integration-test/test-pages/webcompat/config/device-enumeration-disabled.json';

/** @param {boolean} willPrompt */
const deviceEnumerationResponse = (willPrompt) => ({
    videoInput: true,
    audioInput: true,
    audioOutput: true,
    willPrompt,
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function countDeviceChangeRegistration(page) {
    return page.evaluate(() => {
        const eventTargetAdd = EventTarget.prototype.addEventListener;
        let eventTargetDeviceChangeCalls = 0;
        EventTarget.prototype.addEventListener = function (type, ...rest) {
            if (type === 'devicechange' && this === navigator.mediaDevices) {
                eventTargetDeviceChangeCalls += 1;
            }
            return eventTargetAdd.apply(this, [type, ...rest]);
        };

        const before = window.__playwright_01.mocks.outgoing.length;
        navigator.mediaDevices.addEventListener('devicechange', () => {});

        return new Promise((resolve) => {
            setTimeout(() => {
                const deviceEnumerationCalls = window.__playwright_01.mocks.outgoing
                    .slice(before)
                    .filter((entry) => entry.payload?.method === 'deviceEnumeration').length;
                resolve({ eventTargetDeviceChangeCalls, deviceEnumerationCalls });
            }, 300);
        });
    });
}

test.describe('Device Enumeration Feature', () => {
    test.describe('disabled feature', () => {
        test('should not intercept enumerateDevices when disabled', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector
                .withMockResponse({ deviceEnumeration: deviceEnumerationResponse(false) })
                .load(DEVICE_ENUMERATION_HTML, CONFIG_DISABLED);
            const results = await collector.results();
            expect(results).toBeDefined();
        });
    });

    test.describe('enabled feature', () => {
        test('should intercept enumerateDevices when enabled', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector
                .withMockResponse({ deviceEnumeration: deviceEnumerationResponse(true) })
                .load(DEVICE_ENUMERATION_HTML, CONFIG_ENABLED);
            const results = await collector.results();
            expect(results).toBeDefined();
        });

        test('should forward devicechange addEventListener to native when willPrompt is false', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.withMockResponse({ deviceEnumeration: deviceEnumerationResponse(false) }).setup({
                config: {
                    version: 1,
                    unprotectedTemporary: [],
                    features: {
                        webCompat: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                enumerateDevices: 'enabled',
                                deviceChangeListeners: 'enabled',
                            },
                        },
                    },
                },
            });
            await page.goto(BLANK_HTML);

            const result = await countDeviceChangeRegistration(page);
            expect(result.deviceEnumerationCalls).toBeGreaterThan(0);
            expect(result.eventTargetDeviceChangeCalls).toBe(1);
        });

        test('should not forward devicechange addEventListener to native when willPrompt is true', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.withMockResponse({ deviceEnumeration: deviceEnumerationResponse(true) }).load(BLANK_HTML, CONFIG_ENABLED);

            const result = await countDeviceChangeRegistration(page);
            expect(result.deviceEnumerationCalls).toBeGreaterThan(0);
            expect(result.eventTargetDeviceChangeCalls).toBe(0);
        });

        test('should forward devicechange to native when deviceChangeListeners is disabled', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.withMockResponse({ deviceEnumeration: deviceEnumerationResponse(true) }).setup({
                config: {
                    version: 1,
                    unprotectedTemporary: [],
                    features: {
                        webCompat: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                enumerateDevices: 'enabled',
                                deviceChangeListeners: 'disabled',
                            },
                        },
                    },
                },
            });
            await page.goto(BLANK_HTML);

            const result = await countDeviceChangeRegistration(page);
            expect(result.deviceEnumerationCalls).toBe(0);
            expect(result.eventTargetDeviceChangeCalls).toBe(1);
        });

        test('should fire devicechange (addEventListener) when OS permission is granted', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.withMockResponse({ deviceEnumeration: deviceEnumerationResponse(true) }).load(BLANK_HTML, CONFIG_ENABLED);

            const fired = await page.evaluate(async () => {
                const firedPromise = new Promise((resolve) => {
                    navigator.mediaDevices.addEventListener('devicechange', () => resolve(true), { once: true });
                });

                await new Promise((resolve) => setTimeout(resolve, 50));

                window.__playwright_01.mockResponses.deviceEnumeration = {
                    videoInput: true,
                    audioInput: true,
                    audioOutput: true,
                    willPrompt: false,
                };

                return Promise.race([
                    firedPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('devicechange timeout')), 3000)),
                ]);
            });

            expect(fired).toBe(true);
        });

        test('should fire devicechange (ondevicechange) when OS permission is granted', async ({ page }, testInfo) => {
            const collector = ResultsCollector.create(page, testInfo.project.use);
            await collector.withMockResponse({ deviceEnumeration: deviceEnumerationResponse(true) }).load(BLANK_HTML, CONFIG_ENABLED);

            const fired = await page.evaluate(async () => {
                const firedPromise = new Promise((resolve) => {
                    navigator.mediaDevices.ondevicechange = () => resolve(true);
                });

                await new Promise((resolve) => setTimeout(resolve, 50));

                window.__playwright_01.mockResponses.deviceEnumeration = {
                    videoInput: true,
                    audioInput: true,
                    audioOutput: true,
                    willPrompt: false,
                };

                return Promise.race([
                    firedPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('devicechange timeout')), 3000)),
                ]);
            });

            expect(fired).toBe(true);
        });
    });
});
