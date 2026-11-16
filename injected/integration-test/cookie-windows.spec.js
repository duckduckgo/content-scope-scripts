import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const CONFIG = './integration-test/test-pages/cookie/config/cookie.json';
// Sibling hosts of one site, like drive.google.com in docs.google.com. Not *.localhost: Chromium
// treats each of those as its own site, and would itself block the frame's cookies.
const PARENT = 'http://docs.example.test/cookie/pages/frame-parent.html';
const FRAME_HOST = 'drive.example.test';
const TEST_SERVER = 'http://localhost:3220';

/**
 * Windows can't pass per-frame args to C-S-S, so frames ask native for the cookie policy the
 * extension would send. Without it a sibling-host frame (drive.google.com in docs.google.com)
 * is guessed to be third party and loses document.cookie.
 */
test.describe('Windows frame cookie policy', () => {
    /**
     * @param {import('@playwright/test').Page} page
     * @param {import('@playwright/test').TestInfo} testInfo
     * @param {Record<string, unknown>} policy
     */
    async function loadFrame(page, testInfo, policy) {
        // Serve the example.test hosts from the test page server
        await page.route(/^http:\/\/[a-z]+\.example\.test\//, async (route) => {
            const { pathname } = new URL(route.request().url());
            await route.fulfill({ response: await route.fetch({ url: TEST_SERVER + pathname }) });
        });
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ getCookiePolicy: policy });
        await collector.load(PARENT, CONFIG);
        const findFrame = () => page.frames().find((f) => new URL(f.url()).hostname === FRAME_HOST);
        await expect.poll(findFrame).toBeTruthy();
        const frame = /** @type {import('@playwright/test').Frame} */ (findFrame());
        await frame.waitForLoadState();
        return { frame, collector };
    }

    /**
     * @param {import('@playwright/test').Frame} frame
     */
    function setAndReadCookie(frame) {
        return frame.evaluate(async () => {
            // Let native's reply to getCookiePolicy arrive
            await new Promise((resolve) => setTimeout(resolve, 50));
            document.cookie = 'frameCookie=1';
            return document.cookie.includes('frameCookie=1');
        });
    }

    /**
     * @param {import('@playwright/test').Frame} frame
     */
    function cookiePolicyRequests(frame) {
        return frame.evaluate(() =>
            // @ts-expect-error - added by the messaging mock
            window.__playwright_01.mocks.outgoing.filter((m) => m.payload.method === 'getCookiePolicy'),
        );
    }

    test('a frame native calls first party can use cookies', async ({ page }, testInfo) => {
        const { frame } = await loadFrame(page, testInfo, { isFrame: true, isTracker: false, isThirdPartyFrame: false, shouldBlock: true });

        expect(await setAndReadCookie(frame)).toBe(true);
        expect(await cookiePolicyRequests(frame)).toHaveLength(1);
    });

    test('a frame native calls third party cannot use cookies', async ({ page }, testInfo) => {
        const { frame } = await loadFrame(page, testInfo, { isFrame: true, isTracker: false, isThirdPartyFrame: true, shouldBlock: true });

        expect(await setAndReadCookie(frame)).toBe(false);
    });

    test('a frame native excludes from protection can use cookies', async ({ page }, testInfo) => {
        const { frame } = await loadFrame(page, testInfo, { isFrame: true, isTracker: false, isThirdPartyFrame: true, shouldBlock: false });

        expect(await setAndReadCookie(frame)).toBe(true);
    });

    test('an invalid reply keeps the hostname guess', async ({ page }, testInfo) => {
        const { frame } = await loadFrame(page, testInfo, { isThirdPartyFrame: 'no' });

        expect(await setAndReadCookie(frame)).toBe(false);
    });

    test('the top frame does not ask native', async ({ page }, testInfo) => {
        const { collector } = await loadFrame(page, testInfo, {
            isFrame: true,
            isTracker: false,
            isThirdPartyFrame: false,
            shouldBlock: true,
        });

        const requests = (await collector.outgoingMessages()).filter(
            (m) => 'method' in m.payload && m.payload.method === 'getCookiePolicy',
        );
        expect(requests).toHaveLength(0);
    });
});
