import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';
import { readFileSync } from 'node:fs';

const BASE_CONFIG = './integration-test/test-pages/web-detection/config/config.json';

/**
 * Build a config enabling detectorPerf alongside the detector-hosting features.
 * Reuses the web-detection test config (auto-run detectors and breakage-report
 * detectors) so both wrapped call paths are exercised.
 */
function buildConfig() {
    const config = JSON.parse(readFileSync(BASE_CONFIG, 'utf8'));
    config.features.webEvents = { state: 'enabled', hash: 'test', exceptions: [] };
    config.features.detectorPerf = {
        state: 'enabled',
        hash: 'test',
        exceptions: [],
        settings: {
            defaults: {
                singleRunThresholdsMs: [8, 16, 50, 150],
                totalPerPageThresholdsMs: [50, 100, 250],
            },
            combinedThresholdsMs: [100, 250, 500],
            detectorOverrides: {},
        },
    };
    // Empty interferenceTypes settings object: breakageReporting reads this via
    // getFeatureSetting and runs the bot/fraud utils with their defaults.
    config.features.webInterferenceDetection = {
        state: 'enabled',
        hash: 'test',
        exceptions: [],
        settings: { interferenceTypes: {} },
    };
    return config;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} projectUse
 */
async function setup(page, projectUse) {
    const collector = ResultsCollector.create(page, projectUse);
    collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
    await page.clock.install();
    await collector.load('/web-detection/index.html', buildConfig());
    return collector;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} pagePath
 */
async function navigateTo(page, pagePath) {
    await page.evaluate((targetUrl) => {
        window.location.href = targetUrl;
    }, pagePath);
    await page.waitForURL(`**${pagePath}`);
}

/**
 * Collect the detectorPerf event types sent through webEvents so far.
 * @param {ResultsCollector} collector
 * @returns {Promise<string[]>}
 */
async function getDetectorPerfEvents(collector) {
    const calls = await collector.outgoingMessages();
    return calls
        .map((c) => /** @type {import('../../messaging/index.js').NotificationMessage} */ (c.payload))
        .filter((payload) => payload.method === 'webEvent' && String(payload.params?.type).startsWith('detectorPerf_'))
        .map((payload) => String(payload.params?.type));
}

/**
 * Collect the data payloads of webEvents of one type sent so far.
 * @param {ResultsCollector} collector
 * @param {string} type
 * @returns {Promise<Record<string, unknown>[]>}
 */
async function getWebEventPayloads(collector, type) {
    const calls = await collector.outgoingMessages();
    return calls
        .map((c) => /** @type {import('../../messaging/index.js').NotificationMessage} */ (c.payload))
        .filter((payload) => payload.method === 'webEvent' && payload.params?.type === type)
        .map((payload) => /** @type {Record<string, unknown>} */ (payload.params?.data ?? {}));
}

test.describe('DetectorPerf Feature', () => {
    test('auto-run webDetection scans are timed and reported at occurrence, once per page', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        // measured fires at feature init, before any detector runs
        expect(await getDetectorPerfEvents(collector)).toEqual(['detectorPerf_measured']);

        // Trigger the auto-run scans (configured at 100ms and 300ms intervals)
        await page.clock.fastForward(300);

        const events = await getDetectorPerfEvents(collector);
        // Events fire as they occur: no page-lifecycle trigger needed
        expect(events).toContain('detectorPerf_measured');
        // Config-driven detectors are attributed to the pooled webDetection label
        expect(events).toContain('detectorPerf_webDetection_ran');

        // Trigger genuinely new detector runs (the auto-run intervals are
        // one-shot timeouts, so advancing the clock further runs nothing):
        // the breakage-report path re-runs the webDetection detectors, which
        // must not re-emit the already fired events
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');

        const eventsAfterMoreRuns = await getDetectorPerfEvents(collector);
        expect(eventsAfterMoreRuns).toContain('detectorPerf_bot_ran');
        const counts = new Map();
        for (const type of eventsAfterMoreRuns) {
            counts.set(type, (counts.get(type) ?? 0) + 1);
        }
        for (const [type, count] of counts) {
            expect(count, `event ${type} must be emitted at most once per page`).toBe(1);
        }
    });

    test('on-demand detectors via the breakage-report path are timed per detector', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/no-detection.html');

        // Native requests a breakage report: runs bot/fraud utils and
        // the webDetection breakageReport trigger
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');

        const events = await getDetectorPerfEvents(collector);
        expect(events).toContain('detectorPerf_measured');
        expect(events).toContain('detectorPerf_bot_ran');
        expect(events).toContain('detectorPerf_fraud_ran');
        expect(events).toContain('detectorPerf_webDetection_ran');
        // The YouTube detector is excluded from detectorPerf entirely
        expect(events.filter((type) => type.includes('youtube'))).toEqual([]);
    });

    test('breakage reports carry exact per-detector timing stats', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/no-detection.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [reportCall] = await collector.waitForMessage('breakageReportResult');
        const params = /** @type {Record<string, any>} */ (reportCall.payload).params;

        const breakageData = JSON.parse(decodeURIComponent(String(params.breakageData)));
        const perf = breakageData.detectorPerf;
        expect(perf).toBeDefined();
        expect(typeof perf.combinedTotalMs).toBe('number');
        // The standalone detectors just ran via timeDetector, so each has
        // exact stats — unlike the bucketed events, values are not thresholds
        for (const name of ['bot', 'fraud']) {
            const stats = perf.detectors[name];
            expect(stats, `expected detectorPerf stats for ${name}`).toBeDefined();
            expect(stats.runs).toBeGreaterThanOrEqual(1);
            expect(stats.totalMs).toBeGreaterThanOrEqual(0);
            expect(stats.worstMs).toBeGreaterThanOrEqual(0);
        }
        // Config-driven detectors are keyed by exact config ID
        // (group.detectorId), never by the pooled webDetection label
        const keys = Object.keys(perf.detectors);
        expect(keys.filter((key) => /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(key)).length).toBeGreaterThan(0);
        expect(keys).not.toContain('webDetection');

        // Ordering guard: getStats() must observe the fire-and-forget
        // record() calls from the *same* report flow (they funnel through
        // one shared `_ready` await, so continuations run FIFO). A second
        // report must therefore show exactly one more run for the
        // standalone detectors, which only ever run inside report flows.
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const reportCalls = await collector.waitForMessage('breakageReportResult', 2);
        const secondParams = /** @type {Record<string, any>} */ (reportCalls[1].payload).params;
        const secondPerf = JSON.parse(decodeURIComponent(String(secondParams.breakageData))).detectorPerf;
        for (const name of ['bot', 'fraud']) {
            expect(secondPerf.detectors[name].runs, `expected ${name} runs to include the current report's run`).toBe(
                perf.detectors[name].runs + 1,
            );
        }
    });

    test('measurement leaves no page-observable performance timeline entries', async ({ page }, testInfo) => {
        // No fake clock here: page.clock.install() suppresses performance.mark
        // entries from getEntriesByType, which would make this test pass
        // vacuously regardless of what the code does.
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
        await collector.load('/web-detection/index.html', buildConfig());
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        // Run detectors through both wrapped paths on real timers
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');
        // Confirm measurement actually happened before asserting its invisibility
        expect(await getDetectorPerfEvents(collector)).toContain('detectorPerf_bot_ran');

        const timelineEntries = await page.evaluate(() => {
            return performance
                .getEntriesByType('mark')
                .concat(performance.getEntriesByType('measure'))
                .map((entry) => entry.name)
                .filter((name) => name.toLowerCase().includes('detector'));
        });
        // The shared feature framework unconditionally marks every feature's
        // init/load lifecycle (ContentFeature.callInit/callLoad) — that is
        // pre-existing, feature-agnostic behavior outside detectorPerf's
        // measurement path, acknowledged in the TD's web-observability notes.
        // The suffix-less variants are `performance.measure` entries, created
        // only under args.debug (which this harness enables) — production
        // pages see only the marks.
        const frameworkLifecycleEntry = /^detectorPerfCall(Init|Load)(Start|End)?$/;
        expect(timelineEntries.filter((name) => !frameworkLifecycleEntry.test(name))).toEqual([]);
        // Vacuity guard: the framework marks must be visible, proving the
        // timeline read above can actually observe marks in this world.
        expect(timelineEntries.length).toBeGreaterThan(0);
    });

    test('severe crossings fire immediately with exact config detector attribution', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
        const config = buildConfig();
        // Force the webDetection severe edge below any real run duration so a
        // real crossing is deterministic. No fake clock in this test: the
        // measured durations must be real for the edge to be crossed.
        config.features.detectorPerf.settings.detectorOverrides = {
            webDetection: { singleRunThresholdsMs: [0.0001] },
        };
        await collector.load('/web-detection/index.html', config);
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');

        // Severe events fire immediately: the page is never hidden in this test
        await expect
            .poll(async () => (await getWebEventPayloads(collector, 'detectorPerf_severe')).length, {
                message: 'expected at least one detectorPerf_severe event',
            })
            .toBeGreaterThan(0);

        const payloads = await getWebEventPayloads(collector, 'detectorPerf_severe');
        for (const data of payloads) {
            expect(data.kind).toBe('single');
            expect(data.thresholdMs).toBe(0.0001);
            // Exact config attribution: groupName.detectorId, not the pooled label
            expect(String(data.detector)).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/);
        }
    });

    test('debug builds broadcast live stats to the page as a JSON-string CustomEvent', async ({ page }, testInfo) => {
        // The harness loads with args.debug enabled, which is exactly the
        // configuration where test-page overlays consume this event.
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
        await collector.load('/web-detection/index.html', buildConfig());
        await navigateTo(page, '/web-detection/pages/no-detection.html');

        // Listen after navigation (the init broadcast is missed; run
        // broadcasts follow), then trigger detectors via the breakage flow.
        await page.evaluate(() => {
            // @ts-expect-error - test-only page global
            window.__debugStats = [];
            window.addEventListener('detectorPerfDebugStats', (event) => {
                // @ts-expect-error - test-only page global
                window.__debugStats.push(/** @type {CustomEvent} */ (event).detail);
            });
        });
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        await collector.waitForMessage('breakageReportResult');

        await expect
            .poll(
                async () =>
                    // @ts-expect-error - test-only page global
                    await page.evaluate(() => window.__debugStats.length),
                { message: 'expected debug stats broadcasts on the page' },
            )
            .toBeGreaterThan(0);

        // @ts-expect-error - test-only page global
        const details = await page.evaluate(() => window.__debugStats);
        // Detail must be a JSON string: primitives cross isolated-world
        // boundaries, objects from an isolated world do not (Chromium).
        for (const detail of details) {
            expect(typeof detail).toBe('string');
        }
        const last = JSON.parse(details[details.length - 1]);
        expect(typeof last.combinedTotalMs).toBe('number');
        expect(Array.isArray(last.severe)).toBe(true);
        expect(last.lastRun).toEqual(
            expect.objectContaining({
                name: expect.any(String),
                attributed: expect.any(String),
                durationMs: expect.any(Number),
            }),
        );
        // The standalone detectors just ran, so their exact stats are present
        expect(last.detectors.bot.runs).toBeGreaterThanOrEqual(1);
        expect(last.detectors.fraud.runs).toBeGreaterThanOrEqual(1);
    });

    test('without the debug flag no stats broadcast reaches the page', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
        // Production configuration: the harness default of debug:true is
        // overridden. A production-env build cannot receive the harness's
        // development-env subscription pushes, so this test drives detectors
        // through the timer-based auto-run path instead of the breakage flow.
        collector.withUserPreferences({ debug: false });
        await page.clock.install();
        await collector.load('/web-detection/index.html', buildConfig());
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        await page.evaluate(() => {
            // @ts-expect-error - test-only page global
            window.__debugStats = [];
            window.addEventListener('detectorPerfDebugStats', (event) => {
                // @ts-expect-error - test-only page global
                window.__debugStats.push(/** @type {CustomEvent} */ (event).detail);
            });
        });
        // Trigger the auto-run scans (configured at 100ms and 300ms intervals)
        await page.clock.fastForward(300);

        // Detectors ran (recording is independent of the debug flag)…
        await expect
            .poll(async () => await getDetectorPerfEvents(collector), {
                message: 'expected webDetection to have run',
            })
            .toContain('detectorPerf_webDetection_ran');
        // …but the page observed nothing.
        // @ts-expect-error - test-only page global
        expect(await page.evaluate(() => window.__debugStats)).toEqual([]);
    });

    test('emits only measured when the feature is enabled but no detector runs', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo.project.use);
        await navigateTo(page, '/web-detection/pages/no-detection.html');

        const events = await getDetectorPerfEvents(collector);
        expect(events).toEqual(['detectorPerf_measured']);
    });

    test('emits nothing and is omitted from breakage reports when disabled', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        collector.withMockResponse({ webDetectionAutoRun: null, webEvent: null, breakageReportResult: null });
        await page.clock.install();
        const config = buildConfig();
        config.features.detectorPerf.state = 'disabled';
        await collector.load('/web-detection/index.html', config);
        await navigateTo(page, '/web-detection/pages/auto-run-basic.html');

        await page.clock.fastForward(300);

        expect(await getDetectorPerfEvents(collector)).toEqual([]);

        // Breakage reports must omit the detectorPerf key gracefully rather
        // than fail or carry an error placeholder
        await collector.simulateSubscriptionMessage('breakageReporting', 'getBreakageReportValues', {});
        const [reportCall] = await collector.waitForMessage('breakageReportResult');
        const params = /** @type {Record<string, any>} */ (reportCall.payload).params;
        if (params.breakageData !== undefined) {
            const breakageData = JSON.parse(decodeURIComponent(String(params.breakageData)));
            expect(breakageData.detectorPerf).toBeUndefined();
        }
    });
});
