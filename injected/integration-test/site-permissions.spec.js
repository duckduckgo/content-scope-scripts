import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/site-permissions/index.html';
const CONFIG_ENABLED = './integration-test/test-pages/site-permissions/config/enabled.json';
const CONFIG_NOT_CONFIGURED = './integration-test/test-pages/site-permissions/config/not-configured.json';

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

// The collector's default `messageSecret`; bridge event names between the two features include it.
const MESSAGE_SECRET = 'duckduckgo-android-messaging-secret';

/**
 * Forwards a native update the way the isolated policy feature does, and returns the page's acknowledgement.
 * @param {import('@playwright/test').Page} page
 * @param {string} subscriptionName
 * @param {Record<string, unknown>} params
 */
async function pushToPage(page, subscriptionName, params) {
    return await page.evaluate(
        ({ subscriptionName, params, secret }) => {
            const event = new CustomEvent(`ddg-site-permissions-geolocation-deliver-${secret}`, {
                cancelable: true,
                detail: JSON.stringify({ subscriptionName, params }),
            });
            return !window.dispatchEvent(event);
        },
        { subscriptionName, params, secret: MESSAGE_SECRET },
    );
}

/**
 * Asks the page feature for its document identity, as the isolated policy feature does.
 * @param {import('@playwright/test').Page} page
 */
async function requestPageDocument(page) {
    return await page.evaluate((secret) => {
        /** @type {unknown} */
        let announced = null;
        window.addEventListener(`ddg-site-permissions-geolocation-document-${secret}`, (event) => {
            announced = /** @type {CustomEvent} */ (event).detail;
        });
        window.dispatchEvent(new CustomEvent(`ddg-site-permissions-geolocation-document-request-${secret}`));
        return announced;
    }, MESSAGE_SECRET);
}

test.describe('site permissions without native settings', () => {
    test('leaves geolocation, permissions and getUserMedia untouched', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NOT_CONFIGURED);

        const state = await page.evaluate(() => ({
            getCurrentPosition: navigator.geolocation.getCurrentPosition.toString(),
            query: navigator.permissions.query.toString(),
            getUserMedia: navigator.mediaDevices.getUserMedia.toString(),
        }));
        expect(state.getCurrentPosition).toContain('[native code]');
        expect(state.query).toContain('[native code]');
        expect(state.getUserMedia).toContain('[native code]');
        expect(await requestPageDocument(page)).toBeNull();
        expect(await collector.outgoingMessages()).toEqual([]);
    });
});

test.describe('sitePermissionsGeolocation', () => {
    test('sends nothing until the page asks, then sends the capability and document identity', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ getCurrentPosition: POSITION });
        await collector.load(HTML, CONFIG_ENABLED);
        expect(await collector.outgoingMessages()).toEqual([]);

        await page.evaluate(() => new Promise((resolve) => navigator.geolocation.getCurrentPosition(resolve, resolve)));
        const [request] = await collector.waitForMessage('getCurrentPosition');
        expect(request.payload.featureName).toBe('sitePermissionsGeolocation');
        expect(request.payload.params.capability).toBe('test-capability');
        expect(request.payload.params.documentID).toMatch(/^[0-9a-f]{32}$/);
        expect(await requestPageDocument(page)).toBe(request.payload.params.documentID);
        const methods = (await collector.outgoingMessages()).map((call) => /** @type {{ method?: string }} */ (call.payload).method);
        expect(methods).toEqual(['getCurrentPosition']);
    });

    test('defines no globals or subscriptions in the page world', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ENABLED);

        const exposed = await page.evaluate(() => ({
            globals: Object.getOwnPropertyNames(window).filter((name) => /SitePermissions|MediaCapture/i.test(name)),
            subscriptions: Object.getOwnPropertyNames(navigator.duckduckgo?.messageHandlers ?? {}).filter((name) =>
                name.startsWith('geolocation'),
            ),
        }));
        expect(exposed).toEqual({ globals: [], subscriptions: [] });
    });

    test('installs at document start and keeps the replacement after deletion', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
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
        collector.withMockResponse({ getCurrentPosition: POSITION });
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

    test('passes a native policy denial to the page', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({
            getCurrentPosition: { status: 'error', code: 1, message: 'Geolocation is not allowed in this context' },
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
    });

    test('never starts a watch that the page clears straight away', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({
            startWatch: { status: 'started' },
            clearWatch: { status: 'cleared' },
            queryPermission: { status: 'permission', state: 'prompt' },
        });
        await collector.load(HTML, CONFIG_ENABLED);

        await page.evaluate(async () => {
            navigator.geolocation.clearWatch(navigator.geolocation.watchPosition(() => {}));
            await navigator.permissions.query({ name: 'geolocation' });
        });
        await collector.waitForMessage('queryPermission');
        const methods = (await collector.outgoingMessages()).map((call) => /** @type {{ method?: string }} */ (call.payload).method);
        expect(methods).not.toContain('startWatch');
    });

    test('routes watch results to the page and acknowledges them until clearWatch', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({
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
        collector.withMockResponse({ queryPermission: { status: 'permission', state: 'prompt' } });
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
            collector.withMockResponse({ requestPermission: { decision } });
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
        await collector.load(HTML, CONFIG_ENABLED);

        expect(await page.evaluate(() => navigator.mediaDevices.getUserMedia({}))).toBe('native-stream');
        const methods = (await collector.outgoingMessages()).map((call) => /** @type {{ method?: string }} */ (call.payload).method);
        expect(methods).not.toContain('requestPermission');
    });
});
