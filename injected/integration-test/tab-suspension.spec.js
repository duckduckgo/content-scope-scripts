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

    test('notifies for each new connection', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG);

        await page.evaluate(() => {
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
            // eslint-disable-next-line no-new
            new RTCPeerConnection();
        });

        const messages = await collector.waitForMessage('webRTCConnectionChanged', 2);
        expect(messages).toHaveLength(2);
        expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
        expect(/** @type {{params: any}} */ (messages[1].payload).params).toStrictEqual({ isActive: true });
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
        const rtcMessages = messages.filter((m) => m.payload.method === 'webRTCConnectionChanged');
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
