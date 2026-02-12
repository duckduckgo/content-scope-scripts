import { gotoAndWait, testContextForExtension } from './helpers/harness.js';
import { test as base, expect } from '@playwright/test';

const test = testContextForExtension(base);

// Test runner for API-not-present scenario
// Note: "API present" case is covered by "Permissions API - when present" test suite
// which uses permissionsPresent feature with different (proxy-based) behavior
function createApiTestRunner(testName, testFunction) {
    test.describe(testName, () => {
        testFunction({ removeApi: true });
    });
}

test.describe('Ensure safari interface is injected', () => {
    test('should expose window.safari when enabled', async ({ page }) => {
        await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: [] } });
        const noSafari = await page.evaluate(() => {
            return 'safari' in window;
        });
        expect(noSafari).toEqual(false);

        await gotoAndWait(page, '/blank.html', {
            site: {
                enabledFeatures: ['webCompat'],
            },
            featureSettings: {
                webCompat: {
                    safariObject: 'enabled',
                },
            },
        });
        const hasSafari = await page.evaluate(() => {
            return 'safari' in window;
        });
        expect(hasSafari).toEqual(true);

        const pushNotificationToString = await page.evaluate(() => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            return window.safari.pushNotification.toString();
        });
        expect(pushNotificationToString).toEqual('[object SafariRemoteNotification]');

        const pushNotificationPermission = await page.evaluate(() => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            return window.safari.pushNotification.permission('test');
        });
        expect(pushNotificationPermission.deviceToken).toEqual(null);
        expect(pushNotificationPermission.permission).toEqual('denied');

        const pushNotificationRequestPermissionThrow = await page.evaluate(() => {
            try {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.safari.pushNotification.requestPermission('test', 'test.com');
            } catch (e) {
                return e.message;
            }
        });
        expect(pushNotificationRequestPermissionThrow).toEqual(
            "Invalid 'callback' value passed to safari.pushNotification.requestPermission(). Expected a function.",
        );

        const pushNotificationRequestPermission = await page.evaluate(() => {
            const response = new Promise((resolve) => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.safari.pushNotification.requestPermission('test', 'test.com', {}, (data) => {
                    resolve(data);
                });
            });
            return response;
        });
        expect(pushNotificationRequestPermission.deviceToken).toEqual(null);
        expect(pushNotificationRequestPermission.permission).toEqual('denied');
    });
});

test.describe('Ensure Notification interface is injected', () => {
    test('should expose window.Notification when enabled', async ({ page }) => {
        // Fake the Notification API not existing in this browser
        const removeNotificationScript = `
            delete window.Notification
        `;
        function checkForNotification() {
            return 'Notification' in window;
        }
        function checkObjectDescriptorSerializedValue() {
            const descriptor = Object.getOwnPropertyDescriptor(window, 'Notification');
            const out = {};
            for (const key in descriptor) {
                out[key] = !!descriptor[key];
            }
            return out;
        }
        await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: [] } });
        const initialNotification = await page.evaluate(checkForNotification);
        // Base implementation of the test env should have it.
        expect(initialNotification).toEqual(true);
        const initialDescriptorSerialization = await page.evaluate(checkObjectDescriptorSerializedValue);

        await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: [] } }, removeNotificationScript);
        const noNotification = await page.evaluate(() => {
            return 'Notification' in window;
        });
        expect(noNotification).toEqual(false);

        await gotoAndWait(
            page,
            '/blank.html',
            {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        notification: 'enabled',
                    },
                },
            },
            removeNotificationScript,
        );
        const hasNotification = await page.evaluate(checkForNotification);
        expect(hasNotification).toEqual(true);

        const modifiedDescriptorSerialization = await page.evaluate(checkObjectDescriptorSerializedValue);
        expect(modifiedDescriptorSerialization).toEqual(initialDescriptorSerialization);

        const permissionDenied = await page.evaluate(() => {
            return window.Notification.requestPermission();
        });
        expect(permissionDenied).toEqual('denied');

        const permissionPropDenied = await page.evaluate(() => {
            return window.Notification.permission;
        });
        expect(permissionPropDenied).toEqual('denied');

        const maxActionsPropDenied = await page.evaluate(() => {
            // @ts-expect-error - This is a property that should exist but experimental.
            return window.Notification.maxActions;
        });
        expect(maxActionsPropDenied).toEqual(2);

        const notificationToString = await page.evaluate(() => {
            return window.Notification.toString();
        });
        expect(notificationToString).toEqual('function Notification() { [native code] }');

        const requestPermissionToString = await page.evaluate(() => {
            return window.Notification.requestPermission.toString();
        });
        expect(requestPermissionToString).toEqual('function requestPermission() { [native code] }');

        const notificationToStringToString = await page.evaluate(() => {
            return window.Notification.toString.toString();
        });
        expect(notificationToStringToString).toEqual('function toString() { [native code] }');

        const requestPermissionToStringToString = await page.evaluate(() => {
            return window.Notification.requestPermission.toString.toString();
        });
        expect(requestPermissionToStringToString).toEqual('function toString() { [native code] }');
    });
});

test.describe('webNotifications', () => {
    /**
     * @param {import("@playwright/test").Page} page
     */
    async function beforeWebNotifications(page) {
        await gotoAndWait(page, '/blank.html', {
            site: { enabledFeatures: ['webCompat'] },
            featureSettings: { webCompat: { webNotifications: 'enabled' } },
        });
    }

    test('should override Notification API when enabled', async ({ page }) => {
        await beforeWebNotifications(page);
        const hasNotification = await page.evaluate(() => 'Notification' in window);
        expect(hasNotification).toEqual(true);
    });

    test('should return default for permission initially', async ({ page }) => {
        await beforeWebNotifications(page);
        const permission = await page.evaluate(() => window.Notification.permission);
        expect(permission).toEqual('default');
    });

    test('should return 2 for maxActions', async ({ page }) => {
        await beforeWebNotifications(page);
        const maxActions = await page.evaluate(() => {
            // @ts-expect-error - maxActions is experimental
            return window.Notification.maxActions;
        });
        expect(maxActions).toEqual(2);
    });

    test('should send showNotification message when constructing', async ({ page }) => {
        await beforeWebNotifications(page);
        await page.evaluate(() => {
            globalThis.notifyCalls = [];
            globalThis.cssMessaging.impl.notify = (msg) => {
                globalThis.notifyCalls.push(msg);
            };
        });

        await page.evaluate(() => new window.Notification('Test Title', { body: 'Test Body' }));

        const calls = await page.evaluate(() => globalThis.notifyCalls);
        expect(calls.length).toBeGreaterThan(0);
        expect(calls[0]).toMatchObject({
            featureName: 'webCompat',
            method: 'showNotification',
            params: { title: 'Test Title', body: 'Test Body' },
        });
    });

    test('should send closeNotification message on close()', async ({ page }) => {
        await beforeWebNotifications(page);
        await page.evaluate(() => {
            globalThis.notifyCalls = [];
            globalThis.cssMessaging.impl.notify = (msg) => {
                globalThis.notifyCalls.push(msg);
            };
        });

        await page.evaluate(() => {
            const n = new window.Notification('Test');
            n.close();
        });

        const calls = await page.evaluate(() => globalThis.notifyCalls);
        const closeCall = calls.find((c) => c.method === 'closeNotification');
        expect(closeCall).toBeDefined();
        expect(closeCall).toMatchObject({
            featureName: 'webCompat',
            method: 'closeNotification',
        });
        expect(closeCall.params.id).toBeDefined();
    });

    test('should only fire onclose once when close() is called multiple times', async ({ page }) => {
        await beforeWebNotifications(page);

        const closeCount = await page.evaluate(() => {
            let count = 0;
            const notification = new window.Notification('Test');
            notification.onclose = () => {
                count++;
            };

            // Call close() multiple times - should only fire onclose once
            notification.close();
            notification.close();
            notification.close();

            return count;
        });

        expect(closeCount).toEqual(1);
    });

    test('should propagate requestPermission result from native', async ({ page }) => {
        await beforeWebNotifications(page);
        await page.evaluate(() => {
            globalThis.cssMessaging.impl.request = () => {
                return Promise.resolve({ permission: 'denied' });
            };
        });

        const permission = await page.evaluate(() => window.Notification.requestPermission());
        expect(permission).toEqual('denied');
    });

    test('should update Notification.permission after requestPermission resolves', async ({ page }) => {
        await beforeWebNotifications(page);

        // Initially should be 'default'
        const initialPermission = await page.evaluate(() => window.Notification.permission);
        expect(initialPermission).toEqual('default');

        // Mock native to return 'granted'
        await page.evaluate(() => {
            globalThis.cssMessaging.impl.request = () => {
                return Promise.resolve({ permission: 'granted' });
            };
        });

        await page.evaluate(() => window.Notification.requestPermission());

        // After requestPermission, Notification.permission should reflect the new state
        const updatedPermission = await page.evaluate(() => window.Notification.permission);
        expect(updatedPermission).toEqual('granted');
    });

    test('should return denied when native error occurs', async ({ page }) => {
        await beforeWebNotifications(page);
        await page.evaluate(() => {
            globalThis.cssMessaging.impl.request = () => {
                return Promise.reject(new Error('native error'));
            };
        });

        const permission = await page.evaluate(() => window.Notification.requestPermission());
        expect(permission).toEqual('denied');
    });

    test('requestPermission should have native-looking toString()', async ({ page }) => {
        await beforeWebNotifications(page);

        const requestPermissionToString = await page.evaluate(() => window.Notification.requestPermission.toString());
        expect(requestPermissionToString).toEqual('function requestPermission() { [native code] }');
    });
});

test.describe('webNotifications with nativeEnabled: false', () => {
    /**
     * @param {import("@playwright/test").Page} page
     */
    async function beforeWebNotificationsDisabled(page) {
        await gotoAndWait(page, '/blank.html', {
            site: { enabledFeatures: ['webCompat'] },
            featureSettings: { webCompat: { webNotifications: { state: 'enabled', nativeEnabled: false } } },
        });
    }

    test('should return denied for permission when nativeEnabled is false', async ({ page }) => {
        await beforeWebNotificationsDisabled(page);
        const permission = await page.evaluate(() => window.Notification.permission);
        expect(permission).toEqual('denied');
    });

    test('should not send showNotification when nativeEnabled is false', async ({ page }) => {
        await beforeWebNotificationsDisabled(page);
        await page.evaluate(() => {
            globalThis.notifyCalls = [];
            globalThis.cssMessaging.impl.notify = (msg) => {
                globalThis.notifyCalls.push(msg);
            };
        });

        await page.evaluate(() => new window.Notification('Test Title'));

        const calls = await page.evaluate(() => globalThis.notifyCalls);
        expect(calls.length).toEqual(0);
    });

    test('should return denied from requestPermission without calling native', async ({ page }) => {
        await beforeWebNotificationsDisabled(page);
        await page.evaluate(() => {
            globalThis.requestCalls = [];
            globalThis.cssMessaging.impl.request = (msg) => {
                globalThis.requestCalls.push(msg);
                return Promise.resolve({ permission: 'granted' });
            };
        });

        const permission = await page.evaluate(() => window.Notification.requestPermission());
        const calls = await page.evaluate(() => globalThis.requestCalls);

        expect(permission).toEqual('denied');
        expect(calls.length).toEqual(0);
    });
});

// Shared utility functions for permissions tests
function checkForPermissions() {
    return !!window.navigator.permissions;
}

/**
 * Shared test setup for permissions tests
 * @param {import("@playwright/test").Page} page
 * @param {Object} options - Setup options
 * @param {boolean} [options.removePermissions=false] - Whether to remove permissions API
 * @param {boolean} [options.enablePermissionsPresent=false] - Whether to enable permissionsPresent feature
 */
async function setupPermissionsTest(page, options = {}) {
    const { removePermissions = false, enablePermissionsPresent = false } = options;

    const featureSettings = {
        webCompat: {
            permissions: {
                state: 'enabled',
                supportedPermissions: {
                    // Non-native permissions (should fall through to original API)
                    geolocation: {},
                    notification: { name: 'name-override' },
                    // Native permissions (handled by our implementation)
                    push: {
                        name: 'notifications',
                        native: true,
                    },
                    camera: {
                        name: 'video_capture',
                        native: true,
                    },
                },
            },
        },
    };

    if (enablePermissionsPresent) {
        featureSettings.webCompat.permissionsPresent = {
            state: 'enabled',
        };
    }

    const removePermissionsScript = removePermissions
        ? `
        Object.defineProperty(window.navigator, 'permissions', { writable: true, value: undefined })
    `
        : undefined;

    await gotoAndWait(
        page,
        '/blank.html',
        {
            site: {
                enabledFeatures: ['webCompat'],
            },
            featureSettings,
        },
        removePermissionsScript,
    );
}

/**
 * Shared permission checking function
 * @param {import("@playwright/test").Page} page
 * @param {any} name
 * @return {Promise<{result: any, message: *}>}
 */
async function checkPermission(page, name) {
    const payload = `window.navigator.permissions.query(${JSON.stringify({ name })})`;
    const result = await page.evaluate(payload).catch((e) => {
        return { threw: e };
    });
    const message = await page.evaluate(() => {
        return globalThis.shareReq;
    });
    return { result, message };
}

/**
 * Shared test cases for permissions functionality
 */
const permissionsTestCases = {
    /**
     * Test that permissions API is exposed when enabled
     * @param {import("@playwright/test").Page} page
     */
    async testPermissionsExposed(page) {
        const hasPermissions = await page.evaluate(checkForPermissions);
        expect(hasPermissions).toEqual(true);
    },

    /**
     * Test error handling for unsupported permissions
     * @param {import("@playwright/test").Page} page
     */
    async testUnsupportedPermission(page) {
        const { result } = await checkPermission(page, 'notexistent');
        expect(result.threw).not.toBeUndefined();
        expect(result.threw.message).toContain('notexistent');
    },

    /**
     * Test default prompt response
     * @param {import("@playwright/test").Page} page
     */
    async testDefaultPrompt(page) {
        const { result } = await checkPermission(page, 'geolocation');
        expect(result).toMatchObject({ name: 'geolocation', state: 'prompt' });
    },

    /**
     * Test name override functionality
     * @param {import("@playwright/test").Page} page
     */
    async testNameOverride(page) {
        const { result } = await checkPermission(page, 'notification');
        expect(result).toMatchObject({ name: 'name-override', state: 'prompt' });
    },

    /**
     * Test native permission with successful messaging
     * @param {import("@playwright/test").Page} page
     */
    async testNativePermissionSuccess(page) {
        await page.evaluate(() => {
            globalThis.cssMessaging.impl.request = (req) => {
                globalThis.shareReq = req;
                return Promise.resolve({ state: 'granted' });
            };
        });
        const { result, message } = await checkPermission(page, 'camera');
        expect(result).toMatchObject({ name: 'video_capture', state: 'granted' });
        expect(message).toMatchObject({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } });
    },

    /**
     * Test native permission with unexpected response
     * @param {import("@playwright/test").Page} page
     */
    async testNativePermissionUnexpectedResponse(page) {
        page.on('console', (msg) => {
            console.log(`PAGE LOG: ${msg.text()}`);
        });

        await page.evaluate(() => {
            globalThis.cssMessaging.impl.request = (message) => {
                globalThis.shareReq = message;
                return Promise.resolve({ noState: 'xxx' });
            };
        });
        const { result, message } = await checkPermission(page, 'camera');
        expect(result).toMatchObject({ name: 'video_capture', state: 'prompt' });
        expect(message).toMatchObject({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } });
    },

    /**
     * Test native permission with messaging error
     * @param {import("@playwright/test").Page} page
     */
    async testNativePermissionError(page) {
        await page.evaluate(() => {
            globalThis.cssMessaging.impl.request = (message) => {
                globalThis.shareReq = message;
                return Promise.reject(new Error('something wrong'));
            };
        });
        const { result, message } = await checkPermission(page, 'camera');
        expect(result).toMatchObject({ name: 'video_capture', state: 'prompt' });
        expect(message).toMatchObject({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } });
    },
};

createApiTestRunner('Permissions API', ({ removeApi }) => {
    function checkObjectDescriptorIsNotPresent() {
        const descriptor = Object.getOwnPropertyDescriptor(window.navigator, 'permissions');
        return descriptor === undefined;
    }

    test.describe('disabled feature', () => {
        test('should not expose permissions API', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: [] } });
            const initialPermissions = await page.evaluate(checkForPermissions);
            // Base implementation of the test env should have it.
            expect(initialPermissions).toEqual(true);
            const initialDescriptorSerialization = await page.evaluate(checkObjectDescriptorIsNotPresent);
            expect(initialDescriptorSerialization).toEqual(true);
            // Remove permissions API without enabling webCompat feature
            await gotoAndWait(
                page,
                '/blank.html',
                { site: { enabledFeatures: [] } },
                `
                Object.defineProperty(window.navigator, 'permissions', { writable: true, value: undefined })
            `,
            );
            const noPermissions = await page.evaluate(checkForPermissions);
            expect(noPermissions).toEqual(false);
        });
    });

    test.describe('enabled feature', () => {
        test('should expose window.navigator.permissions when enabled', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testPermissionsExposed(page);
            const modifiedDescriptorSerialization = await page.evaluate(checkObjectDescriptorIsNotPresent);
            // This fails in a test condition purely because we have to add a descriptor to modify the prop
            expect(modifiedDescriptorSerialization).toEqual(false);
        });

        test('should throw error when permission not supported', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testUnsupportedPermission(page);
        });

        test('should return prompt by default', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testDefaultPrompt(page);
        });

        test('should return updated name when configured', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testNameOverride(page);
        });

        test('should propagate result from native when configured', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testNativePermissionSuccess(page);
        });

        test('should default to prompt when native sends unexpected response', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testNativePermissionUnexpectedResponse(page);
        });

        test('should default to prompt when native error occurs', async ({ page }) => {
            await setupPermissionsTest(page, { removePermissions: removeApi });
            await permissionsTestCases.testNativePermissionError(page);
        });
    });
});

test.describe('Permissions API - when present', () => {
    test.describe('disabled feature', () => {
        test('should not modify existing permissions API', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: [] } });
            const hasPermissions = await page.evaluate(checkForPermissions);
            expect(hasPermissions).toEqual(true);

            // Test that the original API behavior is preserved
            // Only test if the query method is actually available
            const originalQuery = await page.evaluate(() => {
                return window.navigator.permissions.query;
            });

            // Only run the assertion if the query method is available
            // This can happen in test environments where the API is partially implemented
            if (typeof originalQuery !== 'undefined') {
                expect(typeof originalQuery).toBe('function');
            }
        });
    });

    test.describe('enabled feature', () => {
        test('should preserve existing permissions API', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            await permissionsTestCases.testPermissionsExposed(page);
        });

        test('should fall through to original API for non-native permissions', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            // Native PermissionStatus has name/state as getters that don't serialize,
            // so we extract them inside the page context
            const result = await page.evaluate(async () => {
                const status = await window.navigator.permissions.query({ name: 'geolocation' });
                return { name: status.name, state: status.state };
            });

            // Should use original API behavior - verifies non-native permissions bypass our shim
            expect(result.name).toBe('geolocation');
            expect(result.state).toBeDefined();
        });

        test('should fall through to original API for unsupported permissions', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            await permissionsTestCases.testUnsupportedPermission(page);
        });

        test('should intercept native permissions and return custom result', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            await permissionsTestCases.testNativePermissionSuccess(page);
        });

        test('should apply name overrides for native permissions', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (req) => {
                    globalThis.shareReq = req;
                    return Promise.resolve({ state: 'granted' });
                };
            });

            const { result } = await checkPermission(page, 'camera');

            // Should use our custom implementation for native permissions
            // with the overridden name from config
            expect(result).toMatchObject({ name: 'video_capture', state: 'granted' });
        });

        test('should fall through to original API when native messaging fails', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (message) => {
                    globalThis.shareReq = message;
                    return Promise.reject(new Error('something wrong'));
                };
            });
            const { result, message } = await checkPermission(page, 'camera');
            // Should fall through to original API when messaging fails
            expect(result).toBeDefined();
            expect(message).toMatchObject({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } });
        });

        test('should fall through to original API for invalid arguments', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            const { result } = await checkPermission(page, null);
            // Should use original API validation
            expect(result.threw).not.toBeUndefined();
        });

        test('should use configured name override for native permissions', async ({ page }) => {
            await setupPermissionsTest(page, { enablePermissionsPresent: true });
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (req) => {
                    globalThis.shareReq = req;
                    return Promise.resolve({ state: 'denied' });
                };
            });
            const { result } = await checkPermission(page, 'push');
            expect(result).toMatchObject({ name: 'notifications', state: 'denied' });
        });
    });
});

test.describe('ScreenOrientation API', () => {
    test.describe('disabled feature', () => {
        /**
         * @param {import("@playwright/test").Page} page
         * @param {any} orientation
         * @return {Promise<any>}
         */
        async function checkLockThrows(page, orientation) {
            const payload = `screen.orientation.lock(${JSON.stringify(orientation)})`;
            const result = await page.evaluate(payload).catch((e) => {
                return { threw: e };
            });
            return result;
        }

        test(' should not fix screenOrientation API', async ({ page }) => {
            // no screenLock setting
            await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: ['webCompat'] } });
            const result = await checkLockThrows(page, 'landscape');
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain('screen.orientation.lock() is not available on this device.');
        });
    });

    test.describe('enabled feature', () => {
        async function beforeAll(page) {
            await gotoAndWait(page, '/blank.html', {
                site: {
                    enabledFeatures: ['webCompat'],
                },
                featureSettings: {
                    webCompat: {
                        screenLock: 'enabled',
                    },
                },
            });
        }

        /**
         * @param {import("@playwright/test").Page} page
         * @param {any} orientation
         */
        async function checkLock(page, orientation) {
            const payload = `screen.orientation.lock(${JSON.stringify(orientation)})`;
            const result = await page.evaluate(payload).catch((e) => {
                return { threw: e };
            });
            const message = await page.evaluate(() => {
                return globalThis.lockReq;
            });
            return { result, message };
        }

        /**
         * @param {import("@playwright/test").Page} page
         */
        async function checkUnlock(page) {
            const payload = 'screen.orientation.unlock()';
            const result = await page.evaluate(payload).catch((e) => {
                return { threw: e };
            });
            const message = await page.evaluate(() => {
                return globalThis.lockReq;
            });
            return { result, message };
        }

        test('should err out when orientation not provided', async ({ page }) => {
            await beforeAll(page);
            const { result } = await checkLock(page, undefined);
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain(
                "Failed to execute 'lock' on 'ScreenOrientation': 1 argument required, but only 0 present",
            );
        });

        test('should err out when orientation of unexpected type', async ({ page }) => {
            await beforeAll(page);
            const { result } = await checkLock(page, {});
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain('not a valid enum value of type OrientationLockType');
        });

        test('should err out when orientation of unexpected value', async ({ page }) => {
            await beforeAll(page);
            const { result } = await checkLock(page, 'xxx');
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain('not a valid enum value of type OrientationLockType');
        });

        test('should propagate native TypeError', async ({ page }) => {
            await beforeAll(page);
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () => {
                    return Promise.resolve({ failure: { name: 'TypeError', message: 'some error message' } });
                };
            });

            const { result } = await checkLock(page, 'landscape');
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain('some error message');
        });

        test('should propagate native InvalidStateError', async ({ page }) => {
            await beforeAll(page);
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () => {
                    return Promise.resolve({ failure: { name: 'InvalidStateError', message: 'some error message' } });
                };
            });

            const { result } = await checkLock(page, 'landscape');
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain('some error message');
        });

        test('should propagate native default error', async ({ page }) => {
            await beforeAll(page);
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () => {
                    return Promise.resolve({ failure: { name: 'xxx', message: 'some error message' } });
                };
            });

            const { result } = await checkLock(page, 'landscape');
            expect(result.threw).not.toBeUndefined();
            expect(result.threw.message).toContain('some error message');
        });

        test('should fix screenOrientation API', async ({ page }) => {
            await beforeAll(page);
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (req) => {
                    globalThis.lockReq = req;
                    return Promise.resolve({});
                };
            });

            const { result, message } = await checkLock(page, 'landscape');
            expect(result).toBeUndefined();
            expect(message).toMatchObject({ featureName: 'webCompat', method: 'screenLock', params: { orientation: 'landscape' } });
        });

        test('should send message on unlock', async ({ page }) => {
            await beforeAll(page);
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (req) => {
                    globalThis.lockReq = req;
                    return Promise.resolve({});
                };
            });

            const { result, message } = await checkUnlock(page);
            expect(result).toBeUndefined();
            expect(message).toMatchObject({ featureName: 'webCompat', method: 'screenUnlock' });
        });
    });
});

test.describe('Viewport fixes', () => {
    function getViewportValue() {
        return document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    }

    test('should not change viewport if disabled', async ({ page }) => {
        await gotoAndWait(
            page,
            '/blank.html',
            { site: { enabledFeatures: [] } },
            'document.head.innerHTML += \'<meta name="viewport" content="width=device-width">\'',
        );
        const initialViewportValue = await page.evaluate(getViewportValue);
        // Base implementation of the test env should have it.
        expect(initialViewportValue).toEqual('width=device-width');

        // We don't make a change if disabled
        await gotoAndWait(page, '/blank.html', { site: { enabledFeatures: [] } });
        const viewportValue = await page.evaluate(getViewportValue);
        expect(viewportValue).toBeUndefined();
    });

    test('should respect forced zoom', async ({ page }) => {
        await gotoAndWait(
            page,
            '/blank.html',
            {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: false,
                forcedZoomEnabled: true,
            },
            'document.head.innerHTML += \'<meta name="viewport" content="width=device-width">\'',
        );

        const viewportValue = await page.evaluate(getViewportValue);
        expect(viewportValue).toEqual('initial-scale=1, user-scalable=yes, maximum-scale=10, width=device-width');
    });

    test.describe('Desktop mode off', () => {
        test('should respect the forcedMobileValue config', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: { state: 'enabled', forcedMobileValue: 'bla, bla, bla' } } },
                desktopModeEnabled: false,
            });
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual('bla, bla, bla');
        });

        test('should force wide viewport if the meta tag is not present', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: false,
            });
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(`width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes`);
        });

        test('should respect forced zoom', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: false,
                forcedZoomEnabled: true,
            });
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(
                `initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes, maximum-scale=10, width=${expectedWidth}`,
            );
        });

        test('should fix the WebView edge case', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: false,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="initial-scale=1.00001, something-something">\'',
            );
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual('width=device-width, initial-scale=1.00001, something-something');
        });

        test('should ignore the character case in the viewport tag', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: false,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="initIAL-scale=1.00001, something-something">\'',
            );
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual('width=device-width, initIAL-scale=1.00001, something-something');
        });
    });

    test.describe('Desktop mode on', () => {
        test('should respect the forcedDesktopValue config', async ({ page }) => {
            await gotoAndWait(page, '/blank.html', {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: { state: 'enabled', forcedDesktopValue: 'bla, bla, bla' } } },
                desktopModeEnabled: true,
            });
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual('bla, bla, bla');
        });

        test('should force wide viewport, ignoring the viewport tag', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: true,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="width=device-width, initial-scale=2, user-scalable=no, something-something">\'',
            );
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(
                `width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes, something-something`,
            );
        });

        test('should override minimum-scale, if it is set', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: true,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="width=device-width, initial-scale=2, user-scalable=no, minimum-scale=1, something-something">\'',
            );
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(
                `width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes, minimum-scale=0, something-something`,
            );
        });

        test('should force wide viewport, ignoring the viewport tag 2', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: true,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="something-something">\'',
            );
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(
                `width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes, something-something`,
            );
        });

        test('should respect forced zoom', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: true,
                    forcedZoomEnabled: true,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="width=device-width, initial-scale=2, user-scalable=no, something-something">\'',
            );
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(
                `initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes, maximum-scale=10, width=${expectedWidth}, something-something`,
            );
        });

        test('should ignore the character case in the viewport tag', async ({ page }) => {
            await gotoAndWait(
                page,
                '/blank.html',
                {
                    site: { enabledFeatures: ['webCompat'] },
                    featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                    desktopModeEnabled: true,
                },
                'document.head.innerHTML += \'<meta name="viewport" content="wIDth=device-width, iniTIal-scale=2, usER-scalable=no, something-something">\'',
            );
            const width = await page.evaluate('screen.width');
            const expectedWidth = width < 1280 ? 980 : 1280;
            const viewportValue = await page.evaluate(getViewportValue);
            expect(viewportValue).toEqual(
                `width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, user-scalable=yes, something-something`,
            );
        });
    });
});
