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
     * @returns {{ feature: DetectorPerf, captured: string[] }}
     */
    function createFeature(featureSettings = {}) {
        /** @type {string[]} */
        const captured = [];
        // Minimal stand-in for the webEvents feature as seen by callFeatureMethod.
        const webEventsStub = {
            _exposedMethods: ['fireEvent'],
            _ready: Promise.resolve({ status: 'ready' }),
            fireEvent({ type }) {
                captured.push(type);
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
        return { feature, captured };
    }

    /** Simulate the page becoming hidden. */
    function hidePage() {
        Object.defineProperty(dom.window.document, 'visibilityState', { value: 'hidden', configurable: true });
        dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    }

    /** Simulate the page becoming visible again. */
    function showPage() {
        Object.defineProperty(dom.window.document, 'visibilityState', { value: 'visible', configurable: true });
        dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
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

    describe('accumulator math and event emission', () => {
        it('emits measured even when no detector ran', async () => {
            const { captured } = createFeature();
            hidePage();
            await settle();
            expect(captured).toEqual(['detectorPerf_measured']);
        });

        it('emits ran and every crossed single-run edge for the worst run', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 5);
            feature.record('bot', 40);
            hidePage();
            await settle();
            expect(captured).toContain('detectorPerf_measured');
            expect(captured).toContain('detectorPerf_bot_ran');
            // worst run 40ms crosses 8 and 16, not 50 or 150 (default edges)
            expect(captured).toContain('detectorPerf_bot_over8ms');
            expect(captured).toContain('detectorPerf_bot_over16ms');
            expect(captured).not.toContain('detectorPerf_bot_over50ms');
            expect(captured).not.toContain('detectorPerf_bot_over150ms');
        });

        it('emits total-per-page edges from the sum of runs', async () => {
            const { feature, captured } = createFeature();
            // three runs of 30ms: worst 30, total 90
            feature.record('adwall', 30);
            feature.record('adwall', 30);
            feature.record('adwall', 30);
            hidePage();
            await settle();
            expect(captured).toContain('detectorPerf_adwall_total_over50ms');
            expect(captured).not.toContain('detectorPerf_adwall_total_over100ms');
        });

        it('sums combined total across detectors', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 60);
            feature.record('fraud', 60);
            hidePage();
            await settle();
            // combined 120ms crosses the 100 edge, not 250 (default edges)
            expect(captured).toContain('detectorPerf_combined_over100ms');
            expect(captured).not.toContain('detectorPerf_combined_over250ms');
        });

        it('does not cross an edge on an exact-equal duration', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 16);
            hidePage();
            await settle();
            expect(captured).toContain('detectorPerf_bot_over8ms');
            expect(captured).not.toContain('detectorPerf_bot_over16ms');
        });
    });

    describe('at-most-once emission per page', () => {
        it('does not re-emit on repeated hidden transitions', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 40);
            hidePage();
            await settle();
            const firstFlush = [...captured];
            showPage();
            hidePage();
            dom.window.dispatchEvent(new dom.window.Event('pagehide'));
            await settle();
            expect(captured).toEqual(firstFlush);
        });

        it('emits only newly crossed edges on later flushes', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 20);
            hidePage();
            await settle();
            expect(captured).toContain('detectorPerf_bot_over16ms');
            expect(captured).not.toContain('detectorPerf_bot_over50ms');

            showPage();
            feature.record('bot', 60);
            feature.record('fraud', 10);
            hidePage();
            await settle();
            // newly crossed edges and newly ran detectors only, no duplicates
            expect(captured).toContain('detectorPerf_bot_over50ms');
            expect(captured).toContain('detectorPerf_fraud_ran');
            expect(captured.filter((type) => type === 'detectorPerf_bot_over16ms').length).toBe(1);
            expect(captured.filter((type) => type === 'detectorPerf_measured').length).toBe(1);
        });
    });

    describe('flush triggers', () => {
        it('flushes on pagehide as a backstop', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 10);
            dom.window.dispatchEvent(new dom.window.Event('pagehide'));
            await settle();
            expect(captured).toContain('detectorPerf_measured');
            expect(captured).toContain('detectorPerf_bot_ran');
        });

        it('does not flush while the page stays visible', async () => {
            const { feature, captured } = createFeature();
            feature.record('bot', 500);
            showPage();
            await settle();
            expect(captured).toEqual([]);
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
            hidePage();
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
            hidePage();
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
            hidePage();
            await settle();
            // bot uses the override (100ms edge, not crossed)
            expect(captured).not.toContain('detectorPerf_bot_over8ms');
            expect(captured).not.toContain('detectorPerf_bot_over100ms');
            // fraud keeps defaults
            expect(captured).toContain('detectorPerf_fraud_over16ms');
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
            hidePage();
            await settle();
            expect(captured).toEqual(['detectorPerf_measured']);
        });

        it('accepts namespaced names for future sub-metrics', async () => {
            const { feature, captured } = createFeature();
            feature.record('youtube.sweep', 10);
            hidePage();
            await settle();
            expect(captured).toContain('detectorPerf_youtube.sweep_ran');
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
            hidePage();
            await settle();
            expect(captured).toContain('detectorPerf_bot_ran');
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
