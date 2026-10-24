import WebDetection from '../../src/features/web-detection.js';
import { NativeReader } from '../../src/features/web-detection/evaluate/native-reader.js';
import WebEvents from '../../src/features/web-events.js';
import {
    FAILING,
    counter,
    createInstance,
    detects,
    inTopFrame,
    instanceArgs,
    report,
    runDetector,
    runDetectorsInEnv,
    testGlobal,
} from './support.js';

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
        inTopFrame();

        it('should send the type', async () => {
            const instance = createInstance({});
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent('adwall');
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 'adwall' });
        });

        it('should send the payload when there is one', async () => {
            const instance = createInstance({});
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent('adwall', { n: 1 });
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 'adwall', data: { n: 1 } });
        });
    });

    describe('fireEvent with webEvents feature lifecycle', () => {
        inTopFrame();
        const defaultArgs = instanceArgs({});

        it('should not fire when webEvents feature is not loaded', async () => {
            const instance = createInstance({});

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
            const instance = createInstance({}, { features });

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
            const instance = createInstance({}, { features });

            await instance._executeFireEvent('adwall');
            expect(fireEventSpy).toHaveBeenCalledWith({ type: 'adwall' });
        });
    });

    describe('in the feature', () => {
        inTopFrame();
        beforeEach(() => {
            jasmine.clock().install();
            spyOn(WebDetection.prototype, 'callFeatureMethod').and.resolveTo(undefined);
        });
        afterEach(() => {
            jasmine.clock().uninstall();
            delete testGlobal.wdTestPage;
        });

        /** An instance over the detectors of group `g`. */
        const create = (/** @type {Record<string, unknown>} */ detectors) => createInstance({ g: detectors });

        const auto = { auto: { state: 'enabled', when: { intervalMs: [100, 200, 300] } } };

        it('cancels the timers of a detector once its `match` holds', () => {
            const instance = create({ d: { triggers: auto, match: true, actions: { fireEvent: { type: 'a' } } } });
            const run = spyOn(instance, '_runDetector').and.callThrough();
            jasmine.clock().tick(1000);
            expect(run).toHaveBeenCalledTimes(1);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('keeps the timers shared with a detector that is not done', () => {
            const instance = create({
                done: { triggers: auto, match: true, actions: { breakageReportData: {} } },
                running: { triggers: auto, actions: { fireEvent: { type: 'a' } } },
            });
            jasmine.clock().tick(1000);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(3);
        });

        it('shares one task among the detectors of a timer or a report, and starts a new one for the next', () => {
            const instance = create({
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
            const instance = create({
                d: {
                    triggers: auto,
                    match: true,
                    actions: { fireEvent: { type: 'a' }, breakageReportData: { data: { n: { value: { api: 'wdTestPage.n' } } } } },
                },
            });
            jasmine.clock().tick(100);
            testGlobal.wdTestPage.n = 9;
            expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true, data: { n: 3 } }]);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('lists an aborted detector in breakage results, with no data', () => {
            const failing = { ...FAILING, using: 'length', is: { gt: 0 } };
            const instance = create({ d: { match: failing, actions: { breakageReportData: { data: { x: { value: 1 } } } } } });
            expect(report(instance)).toEqual([{ detectorId: 'g.d', errors: { 'match.api': 'aborted' } }]);
        });

        it('fires the event with its data on a match', async () => {
            const instance = create({
                d: { match: true, actions: { fireEvent: { type: 't', data: { x: { value: 2, buckets: { two: 2 } } } } } },
            });
            instance.runDetectors({ trigger: 'breakageReport' });
            await Promise.resolve();
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 't', data: { x: 'two' } });
        });

        it('runs a detector with no `match` for the report, which reads its detector names', () => {
            const instance = create({
                d: {
                    triggers: auto,
                    actions: [
                        { define: { 'this.count': counter } },
                        { breakageReportData: { data: { runs: { value: { ref: 'this.count' } } } } },
                    ],
                },
            });
            jasmine.clock().tick(1000);
            expect(report(instance)).toEqual([{ detectorId: 'g.d', data: { runs: 4 } }]);
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
                create({
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
                const instance = create({
                    d: detects(true),
                    a: { triggers: auto, match: true, actions: { breakageReportData: {} } },
                });
                jasmine.clock().tick(1000);
                expect(report(instance)).toEqual([]);
                expect(compile).not.toHaveBeenCalled();
            });

            it('compiles a detector once, however often it runs', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const instance = create({ d: { triggers: auto, actions: { fireEvent: { type: 'a' } } } });
                jasmine.clock().tick(1000);
                instance.runDetectors({ trigger: 'breakageReport' });
                expect(instance.callFeatureMethod).toHaveBeenCalledTimes(4);
                expect(compile).toHaveBeenCalledTimes(1);
            });

            it('reports the parse error of a detector that runs, and not of one that does not', () => {
                const instance = create({ runs: unparseable, disabled: { ...unparseable, state: 'disabled' } });
                expect(report(instance)).toEqual([{ detectorId: 'g.runs', errors: { parse: 'error' } }]);
            });

            it('reports the parse error of an `auto`-only detector once its timer has run', () => {
                const instance = create({ d: { ...unparseable, triggers: { breakageReport: { state: 'disabled' }, ...auto } } });
                expect(report(instance)).toEqual([]);
                jasmine.clock().tick(100);
                expect(report(instance)).toEqual([{ detectorId: 'g.d', errors: { parse: 'error' } }]);
            });
        });

        describe('parsing at load and init', () => {
            const reads = (/** @type {string} */ name) => ({ match: { api: name }, actions: { breakageReportData: {} } });

            /** An instance after `load` with the detectors of group `g`, or none. */
            const loadInstance = (/** @type {Record<string, unknown> | undefined} */ detectors) =>
                createInstance(detectors && { g: detectors }, { load: true });

            /**
             * @param {WebDetection} instance
             * @param {Record<string, unknown>} detectors
             */
            function initWith(instance, detectors) {
                instance.setArgs(instanceArgs({ g: detectors }));
                instance.init();
            }

            it('parses once when init has the settings load parsed', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const instance = loadInstance({ d: detects(true) });
                instance.init();
                expect(compile).toHaveBeenCalledTimes(1);
                expect(capture).toHaveBeenCalledTimes(1);
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });

            it('takes the detectors from settings init has that differ from those load parsed, and captures the names added', () => {
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const instance = loadInstance({ a: reads('wdLoaded') });
                initWith(instance, { a: reads('wdLoaded'), b: reads('wdAdded') });
                expect(capture).toHaveBeenCalledTimes(2);
                expect([...capture.calls.mostRecent().args[0]]).toContain('wdAdded');
                testGlobal.wdLoaded = true;
                testGlobal.wdAdded = true;
                try {
                    expect(report(instance).map((entry) => entry.detectorId)).toEqual(['g.a', 'g.b']);
                } finally {
                    delete testGlobal.wdLoaded;
                    delete testGlobal.wdAdded;
                }
            });

            it('parses at init when load had no detectors', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const instance = loadInstance(undefined);
                expect(compile).not.toHaveBeenCalled();
                initWith(instance, { d: detects(true) });
                expect(compile).toHaveBeenCalledTimes(1);
                expect(capture).toHaveBeenCalledTimes(1);
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });
        });

        describe('a throw in a report-time run', () => {
            it('records a page value thrown past the reader at its path, calling none of its code', () => {
                testGlobal.wdTestPage = { x: 1 };
                const instance = create({
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
                expect(report(instance)).toEqual([
                    { detectorId: 'g.thrown', errors: { 'match.api': 'error' } },
                    { detectorId: 'g.working', detected: true },
                ]);
            });

            it('records a throw outside any expression under `run`, and runs the other detectors', () => {
                const instance = create({
                    thrown: { match: true, actions: { fireEvent: { type: 'a' } } },
                    working: detects(true),
                });
                throwOutsideRun(instance, 'g.thrown');
                expect(report(instance)).toEqual([
                    { detectorId: 'g.thrown', errors: { run: 'error' } },
                    { detectorId: 'g.working', detected: true },
                ]);
            });
        });

        describe('a throw in an `auto` run', () => {
            it('records a throw outside any expression under `run`, in the next report', () => {
                const instance = create({
                    thrown: {
                        triggers: { breakageReport: { state: 'disabled' }, ...auto },
                        match: true,
                        actions: { breakageReportData: {} },
                    },
                    working: {
                        triggers: { breakageReport: { state: 'disabled' }, ...auto },
                        match: true,
                        actions: { breakageReportData: {} },
                    },
                });
                throwOutsideRun(instance, 'g.thrown');
                jasmine.clock().tick(100);
                expect(report(instance)).toEqual([
                    { detectorId: 'g.thrown', errors: { run: 'error' } },
                    { detectorId: 'g.working', detected: true },
                ]);
            });
        });

        describe('actions', () => {
            it('send events and write the breakage entry as each runs, in config order', () => {
                const instance = create({
                    d: {
                        actions: [
                            { fireEvent: { type: 'a' } },
                            { breakageReportData: { data: { x: { value: 1 } } } },
                            { fireEvent: { type: 'b' } },
                        ],
                    },
                });
                /** @type {unknown[]} */
                const sent = [];
                spyOn(instance, '_executeFireEvent').and.callFake((type) => {
                    sent.push([type, instance.getBreakageReportData()]);
                    return Promise.resolve();
                });
                instance.runDetectors({ trigger: 'breakageReport' });
                expect(sent).toEqual([
                    ['a', []],
                    ['b', [{ detectorId: 'g.d', data: { x: 1 } }]],
                ]);
            });
        });

        /**
         * Make the run of one detector throw outside any expression, before it evaluates.
         *
         * @param {WebDetection} instance
         * @param {string} detectorId
         */
        function throwOutsideRun(instance, detectorId) {
            const compiledOf = instance._compiledOf.bind(instance);
            spyOn(instance, '_compiledOf').and.callFake((detector) => {
                if (detector.detectorId === detectorId) throw new Error('boom');
                return compiledOf(detector);
            });
        }
    });
});
