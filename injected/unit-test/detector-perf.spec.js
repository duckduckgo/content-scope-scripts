import { JSDOM } from 'jsdom';
import DetectorPerf, { parseThresholds, timeDetector } from '../src/features/detector-perf.js';

/**
 * Wait for fire-and-forget event dispatch (callFeatureMethod awaits the
 * target feature's readiness before invoking, so delivery is async).
 */
function settle() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('DetectorPerf', () => {
    /** @type {JSDOM} */
    let dom;
    let originalWindow;
    let originalDocument;

    beforeEach(() => {
        dom = new JSDOM('<html><body></body></html>', { url: 'https://example.com/page' });
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        globalThis.window = dom.window;
        globalThis.document = dom.window.document;
    });

    afterEach(() => {
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
    });

    /**
     * @param {object} [featureSettings] - settings for the detectorPerf feature
     * @returns {{ feature: DetectorPerf, captured: string[], capturedEvents: Array<{type: string, data?: Record<string, unknown>}> }}
     */
    function createFeature(featureSettings = {}) {
        /** @type {string[]} */
        const captured = [];
        /** @type {Array<{type: string, data?: Record<string, unknown>}>} */
        const capturedEvents = [];
        // Minimal stand-in for the webEvents feature as seen by callFeatureMethod.
        const webEventsStub = {
            _exposedMethods: ['fireEvent'],
            _ready: Promise.resolve({ status: 'ready' }),
            fireEvent({ type, data }) {
                captured.push(type);
                capturedEvents.push({ type, data });
            },
        };
        const args = {
            site: { domain: 'example.com', url: 'https://example.com/page' },
            platform: {},
            featureSettings: { detectorPerf: featureSettings },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        // @ts-expect-error - stub features map for test
        const feature = new DetectorPerf('detectorPerf', undefined, { webEvents: webEventsStub }, args);
        feature.init();
        return { feature, captured, capturedEvents };
    }

    describe('parseThresholds', () => {
        const fallback = [10, 20];

        it('returns fallback for missing or non-array values', () => {
            expect(parseThresholds(undefined, fallback)).toEqual(fallback);
            expect(parseThresholds(null, fallback)).toEqual(fallback);
            expect(parseThresholds('nope', fallback)).toEqual(fallback);
            expect(parseThresholds({}, fallback)).toEqual(fallback);
        });

        it('returns fallback when no valid edges remain', () => {
            expect(parseThresholds([], fallback)).toEqual(fallback);
            expect(parseThresholds(['8', NaN, -5, 0, Infinity], fallback)).toEqual(fallback);
        });

        it('sorts, deduplicates and drops invalid entries', () => {
            expect(parseThresholds([50, 8, 8, '16', 16, -1], fallback)).toEqual([8, 16, 50]);
        });
    });

    describe('fire-at-occurrence event emission', () => {
        it('emits measured at init, before any detector runs', async () => {
            const { captured } = createFeature();
            await settle();
            expect(captured).toEqual(['detectorPerf_measured']);
        });

        it('emits ran and every crossed single-run edge as runs happen', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 5);
            await settle();
            expect(captured).toContain('detectorPerf_bot_ran');
            expect(captured).not.toContain('detectorPerf_bot_over8ms');

            feature.record('bot', 40);
            await settle();
            // worst run 40ms crosses 8 and 16, not 50 or 150 (default edges)
            expect(captured).toContain('detectorPerf_bot_over8ms');
            expect(captured).toContain('detectorPerf_bot_over16ms');
            expect(captured).not.toContain('detectorPerf_bot_over50ms');
            expect(captured).not.toContain('detectorPerf_bot_over150ms');
        });

        it('emits total-per-page edges as the sum of runs crosses them', async () => {
            const { feature, captured } = createFeature();
            // three runs of 30ms: worst 30, total 90
            feature.record('adwall', 30);
            feature.record('adwall', 30);
            await settle();
            expect(captured).toContain('detectorPerf_adwall_total_over50ms');

            feature.record('adwall', 30);
            await settle();
            expect(captured).not.toContain('detectorPerf_adwall_total_over100ms');
        });

        it('sums combined total across detectors', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 60);
            await settle();
            expect(captured).not.toContain('detectorPerf_combined_over100ms');

            feature.record('fraud', 60);
            await settle();
            // combined 120ms crosses the 100 edge, not 250 (default edges)
            expect(captured).toContain('detectorPerf_combined_over100ms');
            expect(captured).not.toContain('detectorPerf_combined_over250ms');
        });

        it('does not cross an edge on an exact-equal duration', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 16);
            await settle();
            expect(captured).toContain('detectorPerf_bot_over8ms');
            expect(captured).not.toContain('detectorPerf_bot_over16ms');
        });
    });

    describe('at-most-once emission per page', () => {
        it('does not re-emit already crossed edges on later runs', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 40);
            await settle();
            const afterFirst = [...captured];
            // 9ms re-crosses the 8ms single-run edge without newly crossing
            // any total edge: nothing may be re-emitted
            feature.record('bot', 9);
            await settle();
            expect(captured).toEqual(afterFirst);
        });

        it('emits only newly crossed edges and newly ran detectors', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 20);
            await settle();
            expect(captured).toContain('detectorPerf_bot_over16ms');
            expect(captured).not.toContain('detectorPerf_bot_over50ms');

            feature.record('bot', 60);
            feature.record('fraud', 10);
            await settle();
            expect(captured).toContain('detectorPerf_bot_over50ms');
            expect(captured).toContain('detectorPerf_fraud_ran');
            expect(captured.filter((type) => type === 'detectorPerf_bot_over16ms').length).toBe(1);
            expect(captured.filter((type) => type === 'detectorPerf_bot_ran').length).toBe(1);
            expect(captured.filter((type) => type === 'detectorPerf_measured').length).toBe(1);
        });
    });

    describe('config parsing', () => {
        it('uses configured threshold edges', async () => {
            const { feature, captured } = createFeature({
                defaults: {
                    singleRunThresholdsMs: [5],
                    totalPerPageThresholdsMs: [5],
                },
                combinedThresholdsMs: [5],
            });
            feature.record('bot', 10);
            await settle();
            expect(captured).toContain('detectorPerf_bot_over5ms');
            expect(captured).toContain('detectorPerf_bot_total_over5ms');
            expect(captured).toContain('detectorPerf_combined_over5ms');
        });

        it('falls back to defaults when settings are malformed', async () => {
            const { feature, captured } = createFeature({
                defaults: {
                    singleRunThresholdsMs: 'not-an-array',
                    totalPerPageThresholdsMs: [-1, 'x'],
                },
                combinedThresholdsMs: null,
            });
            feature.record('bot', 40);
            await settle();
            expect(captured).toContain('detectorPerf_bot_over16ms');
            expect(captured).not.toContain('detectorPerf_bot_over50ms');
        });

        it('applies per-detector overrides only to the named detector', async () => {
            const { feature, captured } = createFeature({
                detectorOverrides: {
                    bot: { singleRunThresholdsMs: [100] },
                },
            });
            feature.record('bot', 40);
            feature.record('fraud', 40);
            await settle();
            // bot uses the override (100ms edge, not crossed)
            expect(captured).not.toContain('detectorPerf_bot_over8ms');
            expect(captured).not.toContain('detectorPerf_bot_over100ms');
            // fraud keeps defaults
            expect(captured).toContain('detectorPerf_fraud_over16ms');
        });
    });

    describe('severe immediate events', () => {
        /**
         * @param {Array<{type: string, data?: Record<string, unknown>}>} capturedEvents
         * @returns {Array<Record<string, unknown> | undefined>}
         */
        function severePayloads(capturedEvents) {
            return capturedEvents.filter((event) => event.type === 'detectorPerf_severe').map((event) => event.data);
        }

        it('fires when a run crosses the highest single-run edge', async () => {
            const { feature, capturedEvents } = createFeature();
            feature.record('bot', 200);
            await settle();
            expect(severePayloads(capturedEvents)).toEqual([{ kind: 'single', detector: 'bot', thresholdMs: 150 }]);
        });

        it('does not fire below the highest edge', async () => {
            const { feature, capturedEvents } = createFeature();
            feature.record('bot', 60); // crosses 50, not 150
            await settle();
            expect(severePayloads(capturedEvents)).toEqual([]);
        });

        it('attributes config-driven detectors via the detail argument', async () => {
            const { feature, capturedEvents } = createFeature();
            feature.record('webDetection', 200, 'adwalls.generic_en');
            await settle();
            expect(severePayloads(capturedEvents)).toEqual([{ kind: 'single', detector: 'adwalls.generic_en', thresholdMs: 150 }]);
        });

        it('falls back to the label when the detail is invalid', async () => {
            const { feature, capturedEvents } = createFeature();
            feature.record('webDetection', 200, 'bad detail!');
            await settle();
            expect(severePayloads(capturedEvents)).toEqual([{ kind: 'single', detector: 'webDetection', thresholdMs: 150 }]);
        });

        it('fires at most once per page per detector and kind', async () => {
            // Pin total/combined edges high so only single-run severes fire here
            const { feature, capturedEvents } = createFeature({
                defaults: {
                    singleRunThresholdsMs: [8, 16, 50, 150],
                    totalPerPageThresholdsMs: [10000],
                },
                combinedThresholdsMs: [10000],
            });
            feature.record('bot', 200);
            feature.record('bot', 300);
            feature.record('fraud', 200);
            await settle();
            const severe = capturedEvents.filter((event) => event.type === 'detectorPerf_severe');
            expect(severe.map((event) => event.data?.detector).sort()).toEqual(['bot', 'fraud']);
        });

        it('fires for accumulated per-page totals against the pooled label', async () => {
            const { feature, capturedEvents } = createFeature();
            // three 90ms runs: no single run crosses 150, but the total crosses 250
            feature.record('webDetection', 90, 'adwalls.generic_en');
            feature.record('webDetection', 90, 'captcha.recaptcha');
            feature.record('webDetection', 90, 'adwalls.generic_de');
            await settle();
            // totals cannot attribute an exact ID: the accumulator pools them
            expect(severePayloads(capturedEvents)).toEqual([{ kind: 'total', detector: 'webDetection', thresholdMs: 250 }]);
        });

        it('fires for the combined total across detectors', async () => {
            const { feature, capturedEvents } = createFeature();
            feature.record('bot', 140);
            feature.record('fraud', 140);
            feature.record('adwall', 140);
            feature.record('webDetection', 140);
            await settle();
            // 560ms combined crosses 500; no single run crossed 150 and no
            // per-detector total crossed 250
            expect(severePayloads(capturedEvents)).toEqual([{ kind: 'combined', detector: 'combined', thresholdMs: 500 }]);
        });

        it('respects per-detector overrides for the severe edge', async () => {
            const { feature, capturedEvents } = createFeature({
                detectorOverrides: {
                    bot: { singleRunThresholdsMs: [500] },
                },
            });
            feature.record('bot', 200); // over the default 150, under the overridden 500
            await settle();
            expect(severePayloads(capturedEvents)).toEqual([]);
        });

        it('emits the ordinary counters alongside a severe fire', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 200);
            await settle();
            expect(captured).toContain('detectorPerf_severe');
            expect(captured).toContain('detectorPerf_bot_ran');
            expect(captured).toContain('detectorPerf_bot_over150ms');
        });

        it('caps severe emissions per page at the default of 10', async () => {
            // Pin total/combined edges high so only single-run severes fire,
            // then cross the edge with 15 distinct detector IDs.
            const { feature, capturedEvents } = createFeature({
                defaults: { totalPerPageThresholdsMs: [100000] },
                combinedThresholdsMs: [100000],
            });
            for (let i = 0; i < 15; i++) {
                feature.record('webDetection', 200, `adwalls.generic_${i}`);
            }
            await settle();
            expect(severePayloads(capturedEvents).length).toBe(10);
        });

        it('reads the severe cap from config', async () => {
            const { feature, capturedEvents } = createFeature({
                defaults: { totalPerPageThresholdsMs: [100000] },
                combinedThresholdsMs: [100000],
                maxSeverePerPage: 2,
            });
            feature.record('bot', 200);
            feature.record('fraud', 200);
            feature.record('adwall', 200);
            await settle();
            expect(severePayloads(capturedEvents).map((data) => data?.detector)).toEqual(['bot', 'fraud']);
        });

        it('ignores an invalid severe cap setting', async () => {
            const { feature, capturedEvents } = createFeature({
                defaults: { totalPerPageThresholdsMs: [100000] },
                combinedThresholdsMs: [100000],
                maxSeverePerPage: -1,
            });
            feature.record('bot', 200);
            feature.record('fraud', 200);
            feature.record('adwall', 200);
            await settle();
            expect(severePayloads(capturedEvents).length).toBe(3);
        });
    });

    describe('record input validation', () => {
        it('ignores invalid names and durations', async () => {
            const { feature, captured } = createFeature();
            feature.record('bad name!', 10);
            feature.record('', 10);
            // @ts-expect-error - invalid input on purpose
            feature.record(null, 10);
            feature.record('bot', -1);
            feature.record('bot', NaN);
            feature.record('bot', Infinity);
            // @ts-expect-error - invalid input on purpose
            feature.record('bot', '10');
            await settle();
            expect(captured).toEqual(['detectorPerf_measured']);
        });

        it('accepts namespaced names for future sub-metrics', async () => {
            const { feature, captured } = createFeature();
            feature.record('youtube.sweep', 10);
            await settle();
            expect(captured).toContain('detectorPerf_youtube.sweep_ran');
        });

        it('counts zero-duration runs (coarsened timers) as runs', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 0);
            await settle();
            expect(captured).toContain('detectorPerf_bot_ran');
            expect(feature.getStats().detectors.bot).toEqual({ runs: 1, totalMs: 0, worstMs: 0 });
        });
    });

    describe('missing webEvents feature', () => {
        it('records and accumulates safely when webEvents is absent', async () => {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com/page' },
                platform: {},
                featureSettings: { detectorPerf: {} },
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const feature = new DetectorPerf('detectorPerf', undefined, {}, args);
            expect(() => feature.init()).not.toThrow();
            // 200ms also exercises the severe dispatch path
            expect(() => feature.record('bot', 200)).not.toThrow();
            await settle();
            expect(feature.getStats().detectors.bot).toEqual({ runs: 1, totalMs: 200, worstMs: 200 });
        });
    });

    describe('getStats breakage-report snapshot', () => {
        it('returns empty stats when no detector ran', () => {
            const { feature } = createFeature();
            expect(feature.getStats()).toEqual({ combinedTotalMs: 0, detectors: {} });
        });

        it('accumulates exact runs, total and worst per detector', () => {
            const { feature } = createFeature();
            feature.record('bot', 5);
            feature.record('bot', 40);
            feature.record('fraud', 10);
            expect(feature.getStats()).toEqual({
                combinedTotalMs: 55,
                detectors: {
                    bot: { runs: 2, totalMs: 45, worstMs: 40 },
                    fraud: { runs: 1, totalMs: 10, worstMs: 10 },
                },
            });
        });

        it('keys pooled detectors by exact config ID via the detail argument', () => {
            const { feature } = createFeature();
            feature.record('webDetection', 10, 'adwalls.generic_en');
            feature.record('webDetection', 20, 'adwalls.generic_en');
            feature.record('webDetection', 5, 'captcha.recaptcha');
            expect(feature.getStats()).toEqual({
                combinedTotalMs: 35,
                detectors: {
                    'adwalls.generic_en': { runs: 2, totalMs: 30, worstMs: 20 },
                    'captcha.recaptcha': { runs: 1, totalMs: 5, worstMs: 5 },
                },
            });
        });

        it('falls back to the label key when the detail is invalid', () => {
            const { feature } = createFeature();
            feature.record('webDetection', 10, 'bad detail!');
            expect(feature.getStats().detectors).toEqual({
                webDetection: { runs: 1, totalMs: 10, worstMs: 10 },
            });
        });

        it('rounds durations to 0.1ms', () => {
            const { feature } = createFeature();
            feature.record('bot', 1.23456);
            feature.record('bot', 2.34567);
            expect(feature.getStats()).toEqual({
                combinedTotalMs: 3.6,
                detectors: {
                    bot: { runs: 2, totalMs: 3.6, worstMs: 2.3 },
                },
            });
        });
    });

    describe('timeDetector wrapper', () => {
        it('returns the wrapped result and records the duration', async () => {
            const { feature, captured } = createFeature();
            const caller = {
                callFeatureMethod: (featureName, methodName, name, durationMs) => {
                    if (featureName === 'detectorPerf' && methodName === 'record') {
                        feature.record(name, durationMs);
                    }
                    return Promise.resolve(undefined);
                },
            };
            // @ts-expect-error - minimal caller stub for test
            const result = timeDetector(caller, 'bot', () => 'detected');
            expect(result).toBe('detected');
            await settle();
            expect(captured).toContain('detectorPerf_bot_ran');
        });

        it('passes the attribution detail through to record', async () => {
            const { feature, capturedEvents } = createFeature();
            const caller = {
                callFeatureMethod: (featureName, methodName, name, _durationMs, detail) => {
                    if (featureName === 'detectorPerf' && methodName === 'record') {
                        // Deliver a synthetic severe-crossing duration so attribution is observable
                        feature.record(name, 200, detail);
                    }
                    return Promise.resolve(undefined);
                },
            };
            // @ts-expect-error - minimal caller stub for test
            timeDetector(caller, 'webDetection', () => true, 'captcha.recaptcha');
            await settle();
            const severe = capturedEvents.find((event) => event.type === 'detectorPerf_severe');
            expect(severe?.data?.detector).toBe('captcha.recaptcha');
        });

        it('never lets recording failures affect the call site', () => {
            const throwingCaller = {
                callFeatureMethod: () => {
                    throw new Error('boom');
                },
            };
            // @ts-expect-error - minimal caller stub for test
            expect(timeDetector(throwingCaller, 'bot', () => 42)).toBe(42);

            const rejectingCaller = {
                callFeatureMethod: () => Promise.reject(new Error('boom')),
            };
            // @ts-expect-error - minimal caller stub for test
            expect(timeDetector(rejectingCaller, 'bot', () => 'ok')).toBe('ok');
        });
    });
});
