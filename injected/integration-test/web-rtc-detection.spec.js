import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/web-rtc-detection/index.html';
const CONFIG = './integration-test/test-pages/web-rtc-detection/config/web-rtc-detection.json';

test('notifies isActive:true when a peer connection is created', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
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
        new RTCPeerConnection();
        new RTCPeerConnection();
    });

    const messages = await collector.waitForMessage('webRTCConnectionChanged', 2);
    expect(messages).toHaveLength(2);
    expect(/** @type {{params: any}} */ (messages[0].payload).params).toStrictEqual({ isActive: true });
    expect(/** @type {{params: any}} */ (messages[1].payload).params).toStrictEqual({ isActive: true });
});
