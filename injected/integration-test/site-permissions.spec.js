import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/site-permissions/index.html';
const CONFIG_ENABLED = './integration-test/test-pages/site-permissions/config/enabled.json';
const CONFIG_NOT_CONFIGURED = './integration-test/test-pages/site-permissions/config/not-configured.json';

const ALLOWED_REGISTRATION = {
    status: 'registered',
    enabled: true,
    constraints: { isSecureContext: true, isPolicyAllowed: true, isSandboxed: false },
};

const POSITION = {
    status: 'success',
    coords: { latitude: 51.5, longitude: -0.12, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: 1_700_000_000_000,
};

/**
 * Stubs the native getUserMedia before C-S-S captures it, so tests can see when the feature forwards a call.
 * @param {import('@playwright/test').Page} page
 */
async function stubNativeGetUserMedia(page) {
    await page.addInitScript(() => {
        // @ts-expect-error test-only marker
        window.nativeGetUserMediaCalls = 0;
        Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
            configurable: true,
            writable: true,
            value: function getUserMedia() {
                // @ts-expect-error test-only marker
                window.nativeGetUserMediaCalls++;
                return Promise.resolve('native-stream');
            },
        });
    });
}

/**
 * Calls a subscription the way native code does and returns the page's acknowledgement.
 * @param {import('@playwright/test').Page} page
 * @param {string} subscriptionName
 * @param {Record<string, unknown>} params
 */
async function pushToPage(page, subscriptionName, params) {
    return await page.evaluate(
        ({ subscriptionName, params }) => {
            const handler = navigator.duckduckgo?.messageHandlers?.[subscriptionName];
            return handler?.({ context: 'contentScopeScripts', featureName: 'sitePermissionsGeolocation', subscriptionName, params });
        },
        { subscriptionName, params },
    );
}

test.describe('site permissions without native settings', () => {
    test('leaves geolocation, permissions and getUserMedia untouched', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NOT_CONFIGURED);

        const state = await page.evaluate(() => ({
            getCurrentPosition: navigator.geolocation.getCurrentPosition.toString(),
            query: navigator.permissions.query.toString(),
            getUserMedia: navigator.mediaDevices.getUserMedia.toString(),
            documentID: '__ddgSitePermissionsGeolocationDocumentID' in window,
        }));
        expect(state.getCurrentPosition).toContain('[native code]');
        expect(state.query).toContain('[native code]');
        expect(state.getUserMedia).toContain('[native code]');
        expect(state.documentID).toBe(false);
        expect(await collector.outgoingMessages()).toEqual([]);
    });
});

test.describe('sitePermissionsGeolocation', () => {
    test('registers the frame with the capability and document identity', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ registerFrame: ALLOWED_REGISTRATION });
        await collector.load(HTML, CONFIG_ENABLED);

        const [registration] = await collector.waitForMessage('registerFrame');
        expect(registration.payload.featureName).toBe('sitePermissionsGeolocation');
        expect(registration.payload.params.capability).toBe('test-capability');
        expect(registration.payload.params.nonce).toMatch(/^[0-9a-f]{32}$/);
        expect(registration.payload.params.documentID).toMatch(/^[0-9a-f]{32}$/);
        // @ts-expect-error DDG custom global
        const documentID = await page.evaluate(() => window.__ddgSitePermissionsGeolocationDocumentID);
        expect(documentID).toBe(registration.payload.params.documentID);
    });

    test('installs before registration and keeps the replacement after deletion', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ registerFrame: ALLOWED_REGISTRATION });
        await collector.load(HTML, CONFIG_ENABLED);

        const state = await page.evaluate(() => {
            const replaced = navigator.geolocation.getCurrentPosition;
            // @ts-expect-error testing that page code cannot restore the native API
            delete Geolocation.prototype.getCurrentPosition;
            // @ts-expect-error testing that page code cannot restore the native API
            delete navigator.geolocation;
            return {
                native: replaced.toString().includes('[native code]'),
                unchanged: navigator.geolocation.getCurrentPosition === replaced,
            };
        });
        expect(state).toEqual({ native: false, unchanged: true });
    });

    test('delivers the native position to getCurrentPosition', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ registerFrame: ALLOWED_REGISTRATION, getCurrentPosition: POSITION });
        await collector.load(HTML, CONFIG_ENABLED);

        const position = await page.evaluate(
            () =>
                new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (result) => resolve({ latitude: result.coords.latitude, timestamp: result.timestamp }),
                        (error) => reject(new Error(error.message)),
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: Infinity },
                    );
                }),
        );
        expect(position).toEqual({ latitude: 51.5, timestamp: POSITION.timestamp });

        const [request] = await collector.waitForMessage('getCurrentPosition');
        expect(request.payload.params.capability).toBe('test-capability');
        expect(request.payload.params.options).toEqual({ enableHighAccuracy: true, timeout: 5000, maximumAge: 'infinity' });
    });

    test('denies without asking native code when the frame is sandboxed', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({
            registerFrame: { ...ALLOWED_REGISTRATION, constraints: { ...ALLOWED_REGISTRATION.constraints, isSandboxed: true } },
            getCurrentPosition: POSITION,
        });
        await collector.load(HTML, CONFIG_ENABLED);

        const code = await page.evaluate(
            () =>
                new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        () => resolve('success'),
                        (error) => resolve(error.code),
                    );
                }),
        );
        expect(code).toBe(1);
        const methods = (await collector.outgoingMessages()).map((call) => /** @type {{ method?: string }} */ (call.payload).method);
        expect(methods).not.toContain('getCurrentPosition');
    });

    test('routes watch results to the page and acknowledges them until clearWatch', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({
            registerFrame: ALLOWED_REGISTRATION,
            startWatch: { status: 'started' },
            clearWatch: { status: 'cleared' },
        });
        await collector.load(HTML, CONFIG_ENABLED);

        const watchID = await page.evaluate(() => {
            // @ts-expect-error test-only marker
            window.watchLatitudes = [];
            return navigator.geolocation.watchPosition((position) => {
                // @ts-expect-error test-only marker
                window.watchLatitudes.push(position.coords.latitude);
            });
        });
        const [start] = await collector.waitForMessage('startWatch');
        const requestID = start.payload.params.requestID;
        expect(requestID).toBe(`${start.payload.params.documentID}:${watchID}`);

        expect(await pushToPage(page, 'geolocationWatchResult', { requestID, result: POSITION })).toBe(true);
        expect(await pushToPage(page, 'geolocationWatchResult', { requestID: 'unknown:1', result: POSITION })).toBe(false);
        // @ts-expect-error test-only marker
        expect(await page.evaluate(() => window.watchLatitudes)).toEqual([51.5]);

        await page.evaluate((id) => navigator.geolocation.clearWatch(id), watchID);
        const [clear] = await collector.waitForMessage('clearWatch');
        expect(clear.payload.params.requestID).toBe(requestID);
        expect(await pushToPage(page, 'geolocationWatchResult', { requestID, result: POSITION })).toBe(false);
    });

    test('updates a geolocation PermissionStatus when native code pushes a change', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ registerFrame: ALLOWED_REGISTRATION, queryPermission: { status: 'permission', state: 'prompt' } });
        await collector.load(HTML, CONFIG_ENABLED);

        const initialState = await page.evaluate(async () => {
            const status = await navigator.permissions.query({ name: 'geolocation' });
            // @ts-expect-error test-only marker
            window.permissionChanges = [];
            // @ts-expect-error test-only marker
            status.addEventListener('change', () => window.permissionChanges.push(status.state));
            return status.state;
        });
        expect(initialState).toBe('prompt');

        const [query] = await collector.waitForMessage('queryPermission');
        const statusID = query.payload.params.statusID;
        expect(await pushToPage(page, 'geolocationPermissionState', { statusID, state: 'granted' })).toBe(true);
        expect(await pushToPage(page, 'geolocationPermissionState', { statusID, state: 'granted' })).toBe(true);
        // @ts-expect-error test-only marker
        expect(await page.evaluate(() => window.permissionChanges)).toEqual(['granted']);
    });
});

test.describe('sitePermissionsMediaCapture', () => {
    for (const { decision, forwarded } of [
        { decision: 'allow', forwarded: true },
        { decision: 'bypass', forwarded: true },
        { decision: 'deny', forwarded: false },
    ]) {
        test(`a "${decision}" reply ${forwarded ? 'forwards to' : 'does not reach'} the native getUserMedia`, async ({
            page,
        }, testInfo) => {
            await stubNativeGetUserMedia(page);
            const collector = ResultsCollector.create(page, testInfo.project.use);
            collector.withMockResponse({ registerFrame: ALLOWED_REGISTRATION, requestPermission: { decision } });
            await collector.load(HTML, CONFIG_ENABLED);

            const outcome = await page.evaluate(async () => {
                try {
                    return { value: await navigator.mediaDevices.getUserMedia({ video: true }) };
                } catch (error) {
                    return { error: /** @type {DOMException} */ (error).name };
                }
            });
            expect(outcome).toEqual(forwarded ? { value: 'native-stream' } : { error: 'NotAllowedError' });

            const [request] = await collector.waitForMessage('requestPermission');
            expect(request.payload.featureName).toBe('sitePermissionsMediaCapture');
            expect(request.payload.params).toEqual({
                capability: 'test-capability',
                requestID: expect.stringMatching(/^[0-9a-f]{32}:1$/),
                isEligible: true,
                video: true,
                audio: false,
            });
            // @ts-expect-error test-only marker
            expect(await page.evaluate(() => window.nativeGetUserMediaCalls)).toBe(forwarded ? 1 : 0);
        });
    }

    test('passes requests without video or audio straight to the native getUserMedia', async ({ page }, testInfo) => {
        await stubNativeGetUserMedia(page);
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ registerFrame: ALLOWED_REGISTRATION });
        await collector.load(HTML, CONFIG_ENABLED);

        expect(await page.evaluate(() => navigator.mediaDevices.getUserMedia({}))).toBe('native-stream');
        const methods = (await collector.outgoingMessages()).map((call) => /** @type {{ method?: string }} */ (call.payload).method);
        expect(methods).not.toContain('requestPermission');
    });
});
