import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/tab-suspension/index.html';
const CONFIG = './integration-test/test-pages/tab-suspension/config/tab-suspension.json';
const CONFIG_NATIVE_DISABLED = './integration-test/test-pages/tab-suspension/config/tab-suspension-native-disabled.json';

test.describe('tabSuspension - webRtcDetection', () => {
    test('notifies isActive:true when a peer connection is created', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.evaluate(() => {
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
        });

        const messages = await collector.waitForMessage('webRTCConnectionChanged', 1);
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
    });

    test('coalesces rapid constructor calls into a single notification', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        // Multiple synchronous constructor calls should be coalesced
        await page.evaluate(() => {
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
        });

        const messages = await collector.waitForMessage('webRTCConnectionChanged', 1);
        // Rate limiting coalesces synchronous calls into one notification
        expect(messages).toHaveLength(1);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
    });

    test('notifies separately for async-separated constructor calls', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.evaluate(async () => {
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
            // Wait for the coalesced notification to flush
            await new Promise((resolve) => setTimeout(resolve, 10));
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
        });

        const messages = await collector.waitForMessage('webRTCConnectionChanged', 2);
        expect(messages).toHaveLength(2);
    });
});

test.describe('tabSuspension - webRtcDetection constructor invariants', () => {
    test('RTCPeerConnection still functions normally', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const result = await page.evaluate(() => {
            const pc = new RTCPeerConnection();
            return pc instanceof RTCPeerConnection;
        });

        expect(result).toBe(true);
    });

    test('static methods are preserved', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const result = await page.evaluate(() => {
            return typeof RTCPeerConnection.generateCertificate === 'function';
        });

        expect(result).toBe(true);
    });

    test('constructor identity is preserved', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const result = await page.evaluate(() => {
            const pc = new RTCPeerConnection();
            return pc.constructor === RTCPeerConnection;
        });

        expect(result).toBe(true);
    });

    test('calling without new throws TypeError', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const result = await page.evaluate(() => {
            try {
                // @ts-expect-error - intentionally calling without new
                RTCPeerConnection();
                return 'no error';
            } catch (e) {
                return e instanceof TypeError ? 'TypeError' : 'other error';
            }
        });

        expect(result).toBe('TypeError');
    });

    test('subclassing works correctly', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        const result = await page.evaluate(() => {
            class CustomRTC extends RTCPeerConnection {}
            const custom = new CustomRTC();
            return {
                instanceOfCustom: custom instanceof CustomRTC,
                instanceOfRTC: custom instanceof RTCPeerConnection,
            };
        });

        expect(result.instanceOfCustom).toBe(true);
        expect(result.instanceOfRTC).toBe(true);
    });
});

test.describe('tabSuspension - webRtcDetection with nativeEnabled: false', () => {
    test('does not notify when a peer connection is created', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NATIVE_DISABLED);

        await page.evaluate(() => {
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
        });

        // Brief wait to ensure any async message would have been sent
        await page.waitForTimeout(500);

        const messages = await collector.outgoingMessages();
        const rtcMessages = messages.filter((m) => 'method' in m.payload && m.payload.method === 'webRTCConnectionChanged');
        expect(rtcMessages).toHaveLength(0);
    });

    test('RTCPeerConnection still functions normally', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NATIVE_DISABLED);

        const result = await page.evaluate(() => {
            const pc = new RTCPeerConnection();
            return pc instanceof RTCPeerConnection;
        });

        expect(result).toBe(true);
    });
});
