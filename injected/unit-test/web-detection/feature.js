import WebDetection from '../../src/features/web-detection.js';
import { NativeReader } from '../../src/features/web-detection/evaluate/native-reader.js';
import WebEvents from '../../src/features/web-events.js';
import { counter, detects, runDetector, runDetectorsInEnv, testGlobal } from './support.js';

/**
 * @typedef {import('../../src/features/web-detection/compile/detector-config.js').RawDetectorConfig} RawDetectorConfig
 */

describe('WebDetection feature', () => {
    describe('runDetectors', () => {
        it('should return empty array when no detectors configured', () => {
            expect(runDetectorsInEnv({})).toEqual([]);
        });

        it('should include a detector whose breakageReportData action ran', () => {
            const results = runDetector(detects(true));
            expect(results).toEqual([{ detectorId: 'group.detector', detected: true }]);
        });

        it('should exclude a detector whose `match` did not hold', () => {
            expect(runDetector(detects(false))).toEqual([]);
        });

        it('should exclude a detector with no breakageReportData action that has not failed', () => {
            expect(runDetector({ actions: { fireEvent: { type: 'adwall' } } })).toEqual([]);
        });

        it('should include a detector with no breakageReportData action once a run fails', () => {
            expect(runDetector({ match: { element: { selector: '!!!invalid' } }, actions: { fireEvent: { type: 'adwall' } } })).toEqual([
                { detectorId: 'group.detector', errors: { 'match.element': 'error' } },
            ]);
        });

        it('should not run when detector state is disabled', () => {
            expect(runDetector(detects(true, { state: 'disabled' }))).toEqual([]);
        });

        it('should not run when trigger state is disabled', () => {
            expect(runDetector(detects(true, { triggers: { breakageReport: { state: 'disabled' } } }))).toEqual([]);
        });

        it('should not run in iframe when default runConditions require top frame', () => {
            expect(runDetector(detects(true), { isTopFrame: false })).toEqual([]);
        });

        it('should run in top frame when runConditions require top frame', () => {
            expect(runDetector(detects(true), { isTopFrame: true }).length).toBe(1);
        });

        it('should not run when domain runCondition does not match', () => {
            expect(
                runDetector(detects(true, { triggers: { breakageReport: { runConditions: [{ domain: 'example.com' }] } } }), {
                    domain: 'other.com',
                }),
            ).toEqual([]);
        });

        it('should run when domain runCondition matches', () => {
            expect(
                runDetector(detects(true, { triggers: { breakageReport: { runConditions: [{ domain: 'example.com' }] } } }), {
                    domain: 'example.com',
                }).length,
            ).toBe(1);
        });

        it('should run internal detector when platform.internal is true', () => {
            expect(runDetector(detects(true, { state: 'internal' }), { platform: { internal: true } }).length).toBe(1);
        });

        it('should not run internal detector when platform.internal is false', () => {
            expect(runDetector(detects(true, { state: 'internal' }), { platform: { internal: false } })).toEqual([]);
        });

        it('should return multiple detectors from different groups', () => {
            const results = runDetectorsInEnv({
                adwalls: { generic: detects(true), specific: detects(true) },
                paywalls: { detector1: detects(true) },
            });
            expect(results.length).toBe(3);
            expect(results.map((r) => r.detectorId).sort()).toEqual(['adwalls.generic', 'adwalls.specific', 'paywalls.detector1']);
        });

        it('should only include enabled detectors from mixed set', () => {
            const results = runDetectorsInEnv({
                group: {
                    enabled1: detects(true),
                    disabled1: detects(true, { state: 'disabled' }),
                    enabled2: detects(true),
                    disabledTrigger: detects(true, { triggers: { breakageReport: { state: 'disabled' } } }),
                },
            });
            expect(results.map((r) => r.detectorId).sort()).toEqual(['group.enabled1', 'group.enabled2']);
        });

        it('should return error for detector with invalid regex', () => {
            expect(runDetector(detects({ text: { pattern: '[invalid(regex' } }))).toEqual([
                { detectorId: 'group.detector', errors: { parse: 'error' } },
            ]);
        });

        it('should return error for detector with invalid selector', () => {
            expect(runDetector(detects({ element: { selector: '!!!invalid' } }))).toEqual([
                { detectorId: 'group.detector', errors: { 'match.element': 'error' } },
            ]);
        });

        it('should return error when condition mixes operator keys with leaf fields', () => {
            expect(runDetector(detects({ text: { all: [{ pattern: 'foo' }], pattern: 'bar' } }))).toEqual([
                { detectorId: 'group.detector', errors: { parse: 'error' } },
            ]);
        });

        it('should return error for detector that fails to parse', () => {
            expect(runDetector(/** @type {RawDetectorConfig} */ ({ match: {}, actions: [{ when: true }] }))).toEqual([
                { detectorId: 'group.detector', errors: { parse: 'error' } },
            ]);
        });

        it('should continue processing other detectors after error', () => {
            const results = runDetectorsInEnv({
                group: {
                    broken: detects({ text: { pattern: '[invalid' } }),
                    working: detects(true),
                },
            });
            expect(results.length).toBe(2);
            expect(results.find((r) => r.detectorId === 'group.broken')?.errors).toEqual({ parse: 'error' });
            expect(results.find((r) => r.detectorId === 'group.working')?.detected).toBe(true);
        });
    });

    describe('_executeFireEvent', () => {
        /**
         * @returns {WebDetection}
         */
        function createInstance() {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com/page' },
                platform: {},
                featureSettings: { webDetection: { detectors: {} } },
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
            try {
                const instance = new WebDetection('webDetection', undefined, {}, args);
                instance.init();
                return instance;
            } finally {
                globalThis.window = originalWindow;
            }
        }

        it('should send the type', async () => {
            const instance = createInstance();
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent('adwall');
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 'adwall' });
        });

        it('should send the payload when there is one', async () => {
            const instance = createInstance();
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent('adwall', { n: 1 });
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 'adwall', data: { n: 1 } });
        });
    });

    describe('fireEvent with webEvents feature lifecycle', () => {
        /** @type {typeof globalThis.window} */
        let originalWindow;

        beforeEach(() => {
            originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
        });

        afterEach(() => {
            globalThis.window = originalWindow;
        });

        const defaultArgs = {
            site: { domain: 'example.com', url: 'https://example.com/page' },
            platform: {},
            featureSettings: { webDetection: { detectors: {} } },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };

        it('should not fire when webEvents feature is not loaded', async () => {
            const instance = new WebDetection('webDetection', undefined, {}, defaultArgs);
            instance.init();

            // callFeatureMethod will return CallFeatureMethodError (feature not found)
            await instance._executeFireEvent('adwall');
            // Completes without error
        });

        it('should not fire when webEvents feature is skipped (disabled on page)', async () => {
            /** @type {Partial<import('../../src/features.js').FeatureMap>} */
            const features = {};
            const webEvents = new WebEvents('webEvents', undefined, features, defaultArgs);
            features.webEvents = webEvents;
            webEvents.markFeatureAsSkipped('feature disabled for this site');
            const fireEventSpy = spyOn(webEvents, 'fireEvent');

            const instance = new WebDetection('webDetection', undefined, features, defaultArgs);
            instance.init();

            // callFeatureMethod will return CallFeatureMethodError (skipped)
            await instance._executeFireEvent('adwall');
            expect(fireEventSpy).not.toHaveBeenCalled();
        });

        it('should fire when webEvents feature is loaded and ready', async () => {
            /** @type {Partial<import('../../src/features.js').FeatureMap>} */
            const features = {};
            const webEvents = new WebEvents('webEvents', undefined, features, defaultArgs);
            features.webEvents = webEvents;
            await webEvents.callInit(defaultArgs);
            const fireEventSpy = spyOn(webEvents, 'fireEvent');

            const instance = new WebDetection('webDetection', undefined, features, defaultArgs);
            instance.init();

            await instance._executeFireEvent('adwall');
            expect(fireEventSpy).toHaveBeenCalledWith({ type: 'adwall' });
        });
    });

    describe('in the feature', () => {
        /** @type {any} */
        let originalWindow;
        beforeEach(() => {
            originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
            jasmine.clock().install();
        });
        afterEach(() => {
            jasmine.clock().uninstall();
            globalThis.window = originalWindow;
            delete testGlobal.wdTestPage;
        });

        /**
         * @param {Record<string, unknown>} detectors
         * @returns {WebDetection}
         */
        function createInstance(detectors) {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com/page' },
                platform: {},
                featureSettings: { webDetection: { detectors: { g: detectors } } },
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const instance = new WebDetection('webDetection', undefined, {}, args);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            instance.init();
            return instance;
        }

        const auto = { auto: { state: 'enabled', when: { intervalMs: [100, 200, 300] } } };

        it('cancels the timers of a detector once its `match` holds', () => {
            const instance = createInstance({ d: { triggers: auto, match: true, actions: { fireEvent: { type: 'a' } } } });
            const run = spyOn(instance, '_runDetector').and.callThrough();
            jasmine.clock().tick(1000);
            expect(run).toHaveBeenCalledTimes(1);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('keeps the timers shared with a detector that is not done', () => {
            const instance = createInstance({
                done: { triggers: auto, match: true, actions: { breakageReportData: {} } },
                running: { triggers: auto, actions: { fireEvent: { type: 'a' } } },
            });
            jasmine.clock().tick(1000);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(3);
        });

        it('shares one task among the detectors of a timer or a report, and starts a new one for the next', () => {
            const instance = createInstance({
                a: { triggers: auto, actions: { fireEvent: { type: 'a' } } },
                b: { triggers: auto, actions: { fireEvent: { type: 'b' } } },
            });
            const run = spyOn(instance, '_runDetector').and.callThrough();
            const tasks = () => run.calls.allArgs().map((args) => args[2]);
            jasmine.clock().tick(100);
            jasmine.clock().tick(100);
            instance.runDetectors({ trigger: 'breakageReport' });
            const [first, second, third, fourth, fifth, sixth] = tasks();
            expect(second).toBe(first);
            expect(fourth).toBe(third);
            expect(third).not.toBe(first);
            expect(sixth).toBe(fifth);
            expect(fifth).not.toBe(third);
        });

        it('returns entries written by `auto` runs, and does not run a done detector for the report', () => {
            testGlobal.wdTestPage = { n: 3 };
            const instance = createInstance({
                d: {
                    triggers: auto,
                    match: true,
                    actions: { fireEvent: { type: 'a' }, breakageReportData: { data: { n: { value: { api: 'wdTestPage.n' } } } } },
                },
            });
            jasmine.clock().tick(100);
            testGlobal.wdTestPage.n = 9;
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true, data: { n: 3 } }]);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('runs a detector with no `match` for the report, which reads its detector names', () => {
            const instance = createInstance({
                d: {
                    triggers: auto,
                    actions: [
                        { define: { 'this.count': counter } },
                        { breakageReportData: { data: { runs: { value: { ref: 'this.count' } } } } },
                    ],
                },
            });
            jasmine.clock().tick(1000);
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', data: { runs: 4 } }]);
        });

        describe('compiling', () => {
            const unparseable = { match: { element: { selector: 'img' }, using: 'length' }, actions: { breakageReportData: {} } };

            it('compiles at init only the detectors a trigger runs in the frame', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const on = detects(true);
                const autoOnly = {
                    triggers: { breakageReport: { state: 'disabled' }, ...auto },
                    match: true,
                    actions: { breakageReportData: {} },
                };
                createInstance({
                    on,
                    disabled: detects(true, { state: 'disabled' }),
                    noTrigger: detects(true, { triggers: { breakageReport: { state: 'disabled' } } }),
                    otherDomain: detects(true, { triggers: { breakageReport: { runConditions: [{ domain: 'other.com' }] } } }),
                    autoOnly,
                });
                expect(compile.calls.allArgs().map(([config]) => /** @type {unknown} */ (config.raw))).toEqual([on, autoOnly]);
            });

            it('compiles nothing in a frame where no detector runs', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                // @ts-expect-error - mocking for test
                globalThis.window.top = {};
                const instance = createInstance({
                    d: detects(true),
                    a: { triggers: auto, match: true, actions: { breakageReportData: {} } },
                });
                jasmine.clock().tick(1000);
                expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([]);
                expect(compile).not.toHaveBeenCalled();
            });

            it('compiles a detector once, however often it runs', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const instance = createInstance({ d: { triggers: auto, actions: { fireEvent: { type: 'a' } } } });
                jasmine.clock().tick(1000);
                instance.runDetectors({ trigger: 'breakageReport' });
                expect(instance.callFeatureMethod).toHaveBeenCalledTimes(4);
                expect(compile).toHaveBeenCalledTimes(1);
            });

            it('reports the parse error of a detector that runs, and not of one that does not', () => {
                const instance = createInstance({ runs: unparseable, disabled: { ...unparseable, state: 'disabled' } });
                expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                    { detectorId: 'g.runs', errors: { parse: 'error' } },
                ]);
            });
        });

        describe('parsing at load and init', () => {
            const reads = (/** @type {string} */ name) => ({ match: { api: name }, actions: { breakageReportData: {} } });

            /**
             * @param {Record<string, unknown> | undefined} detectors - the detectors at load, or none
             */
            function loadInstance(detectors) {
                const args = {
                    site: { domain: 'example.com', url: 'https://example.com/page' },
                    platform: {},
                    featureSettings: detectors ? { webDetection: { detectors: { g: detectors } } } : {},
                    bundledConfig: undefined,
                    messagingContextName: 'test',
                };
                const instance = new WebDetection('webDetection', undefined, {}, args);
                instance.load();
                return { instance, args };
            }

            /**
             * @param {WebDetection} instance
             * @param {object} args
             * @param {Record<string, unknown>} detectors
             */
            function initWith(instance, args, detectors) {
                instance.setArgs({ ...args, featureSettings: { webDetection: { detectors: { g: detectors } } } });
                instance.init();
            }

            it('parses once when init has the settings load parsed', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const { instance } = loadInstance({ d: detects(true) });
                instance.init();
                expect(compile).toHaveBeenCalledTimes(1);
                expect(capture).toHaveBeenCalledTimes(1);
                expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true }]);
            });

            it('takes the detectors from settings init has that differ from those load parsed, and captures the names added', () => {
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const { instance, args } = loadInstance({ a: reads('wdLoaded') });
                initWith(instance, args, { a: reads('wdLoaded'), b: reads('wdAdded') });
                expect(capture).toHaveBeenCalledTimes(2);
                expect([...capture.calls.mostRecent().args[0]]).toContain('wdAdded');
                testGlobal.wdLoaded = true;
                testGlobal.wdAdded = true;
                try {
                    expect(instance.runDetectors({ trigger: 'breakageReport' }).map((entry) => entry.detectorId)).toEqual(['g.a', 'g.b']);
                } finally {
                    delete testGlobal.wdLoaded;
                    delete testGlobal.wdAdded;
                }
            });

            it('parses at init when load had no detectors', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const { instance, args } = loadInstance(undefined);
                expect(compile).not.toHaveBeenCalled();
                initWith(instance, args, { d: detects(true) });
                expect(compile).toHaveBeenCalledTimes(1);
                expect(capture).toHaveBeenCalledTimes(1);
                expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true }]);
            });
        });

        describe('a throw in a report-time run', () => {
            it('records a page value thrown past the reader at its path, calling none of its code', () => {
                testGlobal.wdTestPage = { x: 1 };
                const instance = createInstance({
                    thrown: { match: { api: 'wdTestPage.x', is: 1 }, actions: { breakageReportData: {} } },
                    working: detects(true),
                });
                /** @type {object} */
                const thrown = {
                    toString() {
                        throw thrown;
                    },
                };
                spyOn(instance._reader, 'read').and.callFake(() => {
                    throw thrown;
                });
                expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                    { detectorId: 'g.thrown', errors: { 'match.api': 'error' } },
                    { detectorId: 'g.working', detected: true },
                ]);
            });

            it('records a throw outside any expression under `run`, and runs the other detectors', () => {
                const instance = createInstance({
                    thrown: { match: true, actions: { fireEvent: { type: 'a' } } },
                    working: detects(true),
                });
                spyOn(instance, '_executeFireEvent').and.throwError('boom');
                expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                    { detectorId: 'g.thrown', errors: { run: 'error' } },
                    { detectorId: 'g.working', detected: true },
                ]);
            });
        });
    });
});
