import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { makeTrackerDataBasic } from './test-pages/tracker-protection/tracker-data-fixtures.js';
import { blankFrame, frameMessages } from './helpers/blank-subframe.js';

const HTML = '/blank-subframe/pages/blank-subframe.html';
const CONFIG = './integration-test/test-pages/blank-subframe/config/blank-subframe.json';
const TRACKER = 'https://tracker.example/pixel.js';
/** @type {Partial<import('../src/utils.js').Platform>} */
const IOS = { name: 'ios' };

test('blank-subframe (iOS): keeps navigatorInterface in about:blank iframes', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG, IOS);

    const hasNavigatorInterface = await blankFrame(page).evaluate(() => typeof navigator.duckduckgo?.isDuckDuckGo === 'function');
    expect(hasNavigatorInterface).toBe(true);
});

test('blank-subframe (iOS): keeps print in about:blank iframes', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG, IOS);

    const frame = blankFrame(page);
    await frame.evaluate(() => window.print());
    await expect.poll(() => frameMessages(frame, 'print')).toHaveLength(1);
});

test('blank-subframe (iOS): keeps trackerProtection in about:blank iframes', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    collector.withUserPreferences({ trackerData: makeTrackerDataBasic() });
    await collector.load(HTML, CONFIG, IOS);

    const frame = blankFrame(page);
    await frame.evaluate((src) => /** @type {any} */ (window.parent).addTrackerScript(document, src), TRACKER);
    await expect.poll(async () => (await frameMessages(frame, 'resourceObserved')).map((m) => m.payload.params.url)).toEqual([TRACKER]);
});
