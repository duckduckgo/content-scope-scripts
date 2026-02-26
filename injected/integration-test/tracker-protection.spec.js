import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/tracker-protection/pages/tracker-protection.html';
const CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection.json';
const DISABLED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-disabled.json';
const CTL_DISABLED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-ctl-disabled.json';
const UNPROTECTED_CONFIG = './integration-test/test-pages/tracker-protection/config/tracker-protection-unprotected.json';

function trackerMessages(messages) {
    return messages.filter((m) => m.payload.featureName === 'trackerProtection');
}

test('tracker-protection: detects tracker from dynamically added script', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    const messages = await collector.waitForMessage('trackerDetected', 1);
    const detection = messages[0].payload.params;

    expect(detection.url).toBe('https://tracker.example/pixel.js');
    expect(detection.blocked).toBe(true);
    expect(detection.reason).toBe('default block');
    expect(detection.isSurrogate).toBe(false);
    expect(detection.entityName).toBe('Tracker Inc');
});

test('tracker-protection: loads surrogate for matching rule', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/scripts/analytics.js');
    });

    const detected = await collector.waitForMessage('trackerDetected', 1);
    expect(detected[0].payload.params.isSurrogate).toBe(true);

    const injected = await collector.waitForMessage('surrogateInjected', 1);
    expect(injected[0].payload.params.url).toBe('https://tracker.example/scripts/analytics.js');
    expect(injected[0].payload.params.isSurrogate).toBe(true);
});

test('tracker-protection: ignores non-tracker URLs', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://safe-site.example/scripts/app.js');
    });

    await page.waitForTimeout(200);

    const allMessages = await collector.outgoingMessages();
    const trackerDetections = trackerMessages(allMessages).filter((m) => m.payload.method === 'trackerDetected');
    expect(trackerDetections).toHaveLength(0);
});

test('tracker-protection: does not send messages when disabled', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, DISABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    await page.waitForTimeout(200);

    const allMessages = await collector.outgoingMessages();
    const trackerDetections = trackerMessages(allMessages).filter((m) => m.payload.method === 'trackerDetected');
    expect(trackerDetections).toHaveLength(0);
});

test('tracker-protection: reports allowed tracker with blocked=false', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://allowed.example/something.js');
    });

    const messages = await collector.waitForMessage('trackerDetected', 1);
    const detection = messages[0].payload.params;

    expect(detection.url).toBe('https://allowed.example/something.js');
    expect(detection.blocked).toBe(false);
});

test('tracker-protection: detects tracker from XHR error', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    await page.evaluate(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://tracker.example/pixel.gif');
        xhr.send();
        // DNS failure triggers error event (timing variable: 100-500ms)
    });

    // waitForMessage has 5-second timeout (sufficient for DNS failure)
    const messages = await collector.waitForMessage('trackerDetected', 1);
    expect(messages[0].payload.params.url).toBe('https://tracker.example/pixel.gif');
    expect(messages[0].payload.params.blocked).toBe(true);
});

test('tracker-protection: respects CTL disabled for fb-sdk', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CTL_DISABLED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://facebook.example/sdk.js');
    });

    const detected = await collector.waitForMessage('trackerDetected', 1);
    expect(detected[0].payload.params.isSurrogate).toBe(false);

    // Ensure no surrogateInjected message sent
    await page.waitForTimeout(200);
    const allMessages = await collector.outgoingMessages();
    const injected = trackerMessages(allMessages).filter((m) => m.payload.method === 'surrogateInjected');
    expect(injected).toHaveLength(0);
});

test('tracker-protection: reports but does not block on unprotected domain', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, UNPROTECTED_CONFIG);

    await page.evaluate(() => {
        /** @type {any} */ (window).addTrackerScript('https://tracker.example/pixel.js');
    });

    const messages = await collector.waitForMessage('trackerDetected', 1);
    expect(messages[0].payload.params.blocked).toBe(false);
    expect(messages[0].payload.params.reason).toBe('unprotectedDomain');
});
