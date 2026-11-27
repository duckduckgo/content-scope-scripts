import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HAR_FILE = 'integration-test/data/har/example.com/example.com.har';
const CONFIG = {
    features: {
        // initImmediately: overrides navigator.hardwareConcurrency
        fingerprintingHardware: {
            state: 'enabled',
            exceptions: [],
            settings: {
                // Unlike any real core count, so the test can't pass by coincidence
                hardwareConcurrency: { type: 'number', value: 37 },
            },
        },
        // Deferred: starts after init()'s await, as every feature did before initImmediately
        exceptionHandler: {
            state: 'enabled',
            exceptions: [],
        },
    },
    unprotectedTemporary: [],
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
async function openPage(page, testInfo) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.setup({ config: CONFIG, locale: 'en' });
    await page.routeFromHAR(HAR_FILE);
    await page.goto('http://example.com');
}

test.describe('features in a new blank iframe', () => {
    test('protect APIs the page reads in the same synchronous run that created the frame', async ({ page }, testInfo) => {
        await openPage(page, testInfo);

        const values = await page.evaluate(async () => {
            const frame = document.createElement('iframe');
            document.body.appendChild(frame);
            // Fingerprinting scripts borrow unmodified APIs this way: create a frame and read it straight away
            const sameRun = frame.contentWindow?.navigator.hardwareConcurrency;
            await new Promise((resolve) => setTimeout(resolve, 0));
            return {
                mainFrame: navigator.hardwareConcurrency,
                sameRun,
                afterYielding: frame.contentWindow?.navigator.hardwareConcurrency,
            };
        });

        expect(values.mainFrame).toBe(37);
        // The frame got the script; without this, a sameRun failure could mean the frame was never injected
        expect(values.afterYielding).toBe(37);
        expect(values.sameRun).toBe(37);
    });

    test('start features that do not override page-visible APIs after the await', async ({ page }, testInfo) => {
        await openPage(page, testInfo);

        // Each feature's callInit records a <name>CallInitStart mark in the frame's own performance timeline
        const started = await page.evaluate(async () => {
            const frame = document.createElement('iframe');
            document.body.appendChild(frame);
            const marks = () => (frame.contentWindow?.performance.getEntriesByType('mark') ?? []).map((entry) => entry.name);
            const sameRun = marks();
            await new Promise((resolve) => setTimeout(resolve, 0));
            return { sameRun, afterYielding: marks() };
        });

        expect(started.sameRun).toContain('fingerprintingHardwareCallInitStart');
        expect(started.sameRun).not.toContain('exceptionHandlerCallInitStart');
        expect(started.afterYielding).toContain('exceptionHandlerCallInitStart');
    });
});
