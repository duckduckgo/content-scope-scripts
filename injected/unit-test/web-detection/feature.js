import { JSDOM } from 'jsdom';
import WebDetection from '../../src/features/web-detection.js';
import { NativeReader } from '../../src/features/web-detection/evaluate/native-reader.js';
import WebEvents from '../../src/features/web-events.js';
import {
    FAILING,
    REPORT,
    counter,
    createInstance,
    detects,
    fires,
    inTopFrame,
    instanceArgs,
    report,
    runDetector,
    runDetectorsInEnv,
    testGlobal,
} from './support.js';

/**
 * @typedef {import('@duckduckgo/privacy-configuration/schema/features/web-detection.js').DetectorConfig} RawDetectorConfig
 * @typedef {import('../../src/features/web-detection/compile/detector-config.js').RawTriggers} RawTriggers
 * @typedef {import('../../src/features/web-detection/evaluate/breakage-entries.js').BreakageEntry} BreakageEntry
 * @typedef {import('./support.js').TestEnv} TestEnv
 */

describe('WebDetection feature', () => {
    /** @type {RawTriggers} */
    const OFF = { breakageReport: { state: 'disabled' } };

    describe('runDetectors', () => {
        /** @type {BreakageEntry[]} */
        const DETECTED = [{ detectorId: 'group.detector', detected: true }];
        const failed = (/** @type {NonNullable<BreakageEntry['errors']>} */ errors) => [{ detectorId: 'group.detector', errors }];
        const onDomain = detects(true, { triggers: { breakageReport: { runConditions: [{ domain: 'example.com' }] } } });
        const internal = detects(true, { state: 'internal' });

        it('should return empty array when no detectors configured', () => {
            expect(runDetectorsInEnv({})).toEqual([]);
        });

        /** @type {Array<[string, RawDetectorConfig, TestEnv, BreakageEntry[]]>} */
        const cases = [
            ['include a detector whose breakageReportData action ran', detects(true), {}, DETECTED],
            ['exclude a detector whose `match` did not hold', detects(false), {}, []],
            [
                'exclude a detector with no breakageReportData action that has not failed',
                { actions: { fireEvent: { type: 'adwall' } } },
                {},
                [],
            ],
            [
                'include a detector with no breakageReportData action once a run fails',
                { match: { element: { selector: '!!!invalid' } }, actions: { fireEvent: { type: 'adwall' } } },
                {},
                failed({ 'match.element': 'error' }),
            ],
            ['not run when detector state is disabled', detects(true, { state: 'disabled' }), {}, []],
            ['not run when trigger state is disabled', detects(true, { triggers: OFF }), {}, []],
            ['not run in iframe when default runConditions require top frame', detects(true), { isTopFrame: false }, []],
            ['run in top frame when runConditions require top frame', detects(true), { isTopFrame: true }, DETECTED],
            ['not run when domain runCondition does not match', onDomain, { domain: 'other.com' }, []],
            ['run when domain runCondition matches', onDomain, { domain: 'example.com' }, DETECTED],
            ['run internal detector when platform.internal is true', internal, { platform: { internal: true } }, DETECTED],
            ['not run internal detector when platform.internal is false', internal, { platform: { internal: false } }, []],
            [
                'return error for detector with invalid regex',
                detects({ text: { pattern: '[invalid(regex' } }),
                {},
                failed({ parse: 'error' }),
            ],
            [
                'return error for detector with invalid selector',
                detects({ element: { selector: '!!!invalid' } }),
                {},
                failed({ 'match.element': 'error' }),
            ],
            [
                'return error when condition mixes operator keys with leaf fields',
                detects({ text: { all: [{ pattern: 'foo' }], pattern: 'bar' } }),
                {},
                failed({ parse: 'error' }),
            ],
            [
                'return error for detector that fails to parse',
                /** @type {RawDetectorConfig} */ ({ match: {}, actions: [{ when: true }] }),
                {},
                failed({ parse: 'error' }),
            ],
        ];
        for (const [title, config, env, expected] of cases) {
            it(`should ${title}`, () => {
                expect(runDetector(config, env)).toEqual(expected);
            });
        }

        it('should return multiple detectors from different groups', () => {
            const results = runDetectorsInEnv({
                adwalls: { generic: detects(true), specific: detects(true) },
                paywalls: { detector1: detects(true) },
            });
            expect(results.map((r) => r.detectorId).sort()).toEqual(['adwalls.generic', 'adwalls.specific', 'paywalls.detector1']);
        });

        it('should only include enabled detectors from mixed set', () => {
            const results = runDetectorsInEnv({
                group: {
                    enabled1: detects(true),
                    disabled1: detects(true, { state: 'disabled' }),
                    enabled2: detects(true),
                    disabledTrigger: detects(true, { triggers: OFF }),
                },
            });
            expect(results.map((r) => r.detectorId).sort()).toEqual(['group.enabled1', 'group.enabled2']);
        });

        it('should continue processing other detectors after error', () => {
            expect(runDetectorsInEnv({ group: { broken: detects({ text: { pattern: '[invalid' } }), working: detects(true) } })).toEqual([
                { detectorId: 'group.broken', errors: { parse: 'error' } },
                { detectorId: 'group.working', detected: true },
            ]);
        });
    });

    describe('_executeFireEvent', () => {
        inTopFrame();

        it('should send the type, and the payload when there is one', async () => {
            const instance = createInstance({});
            const send = spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent('adwall');
            await instance._executeFireEvent('adwall', { n: 1 });
            expect(/** @type {readonly unknown[][]} */ (send.calls.allArgs())).toEqual([
                ['webEvents', 'fireEvent', { type: 'adwall' }],
                ['webEvents', 'fireEvent', { type: 'adwall', data: { n: 1 } }],
            ]);
        });
    });

    describe('fireEvent with webEvents feature lifecycle', () => {
        inTopFrame();
        const defaultArgs = instanceArgs({});

        it('should not fire when webEvents feature is not loaded, or is skipped (disabled on page)', async () => {
            // callFeatureMethod returns CallFeatureMethodError, for a feature not found and for one skipped
            await expectAsync(createInstance({})._executeFireEvent('adwall')).toBeResolved();
            /** @type {Partial<import('../../src/features.js').FeatureMap>} */
            const features = {};
            const webEvents = (features.webEvents = new WebEvents('webEvents', undefined, features, defaultArgs));
            webEvents.markFeatureAsSkipped('feature disabled for this site');
            const fireEventSpy = spyOn(webEvents, 'fireEvent');
            await createInstance({}, { features })._executeFireEvent('adwall');
            expect(fireEventSpy).not.toHaveBeenCalled();
        });

        it('should fire when webEvents feature is loaded and ready', async () => {
            /** @type {Partial<import('../../src/features.js').FeatureMap>} */
            const features = {};
            const webEvents = (features.webEvents = new WebEvents('webEvents', undefined, features, defaultArgs));
            await webEvents.callInit(defaultArgs);
            const fireEventSpy = spyOn(webEvents, 'fireEvent');
            await createInstance({}, { features })._executeFireEvent('adwall');
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

        /** @type {RawTriggers} */
        const auto = { auto: { state: 'enabled', when: { intervalMs: [100, 200, 300] } } };
        /** A detector that `auto` runs, and the breakage report does not. */
        const autoOnly = detects(true, { triggers: { ...OFF, ...auto } });
        /** A detector with no `match` that `auto` runs, and that sends an event on every run. */
        const firing = (/** @type {string} */ type) => ({ triggers: auto, actions: { fireEvent: { type } } });

        it('cancels the timers of a detector once its `match` holds', () => {
            const instance = create({ d: { ...firing('a'), match: true } });
            const run = spyOn(instance, '_runDetector').and.callThrough();
            jasmine.clock().tick(1000);
            expect(run).toHaveBeenCalledTimes(1);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('keeps the timers shared with a detector that is not done', () => {
            const instance = create({ done: detects(true, { triggers: auto }), running: firing('a') });
            jasmine.clock().tick(1000);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(3);
        });

        it('shares one task among the detectors of a timer or a report, and starts a new one for the next', () => {
            const instance = create({ a: firing('a'), b: firing('b') });
            const run = spyOn(instance, '_runDetector').and.callThrough();
            jasmine.clock().tick(100);
            jasmine.clock().tick(100);
            instance.runDetectors({ trigger: 'breakageReport' });
            const [first, second, third, fourth, fifth, sixth] = run.calls.allArgs().map((args) => args[2]);
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
            const instance = create({ d: { match: true, actions: fires({ x: { value: 2, buckets: { two: 2 } } }) } });
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
            const unparseable = { match: { element: { selector: 'img' }, using: 'length' }, actions: REPORT };

            it('compiles at init only the detectors a trigger runs in the frame', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const on = detects(true);
                create({
                    on,
                    disabled: detects(true, { state: 'disabled' }),
                    noTrigger: detects(true, { triggers: OFF }),
                    otherDomain: detects(true, { triggers: { breakageReport: { runConditions: [{ domain: 'other.com' }] } } }),
                    autoOnly,
                });
                expect(compile.calls.allArgs().map(([config]) => /** @type {unknown} */ (config.raw))).toEqual([on, autoOnly]);
            });

            it('compiles nothing in a frame where no detector runs', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                // @ts-expect-error - mocking for test
                globalThis.window.top = {};
                const instance = create({ d: detects(true), a: detects(true, { triggers: auto }) });
                jasmine.clock().tick(1000);
                expect(report(instance)).toEqual([]);
                expect(compile).not.toHaveBeenCalled();
            });

            it('compiles a detector once, however often it runs', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const instance = create({ d: firing('a') });
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
                const instance = create({ d: { ...unparseable, triggers: { ...OFF, ...auto } } });
                expect(report(instance)).toEqual([]);
                jasmine.clock().tick(100);
                expect(report(instance)).toEqual([{ detectorId: 'g.d', errors: { parse: 'error' } }]);
            });
        });

        describe('parsing at load and init', () => {
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

            /** A detector reading `wdTestPage.loaded`, so the reader captures. */
            const reads = detects({ api: 'wdTestPage.loaded' });

            it('parses once when init has the settings load parsed', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const instance = loadInstance({ d: reads });
                instance.init();
                expect(compile).toHaveBeenCalledTimes(1);
                expect(capture).toHaveBeenCalledTimes(1);
                testGlobal.wdTestPage = { loaded: true };
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });

            it('takes the detectors from settings init has that differ from those load parsed, and captures the names added', () => {
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const loaded = detects({ api: 'wdTestPage.loaded' });
                const instance = loadInstance({ a: loaded });
                initWith(instance, { a: loaded, b: detects({ api: 'wdTestPage.added' }) });
                expect(capture).toHaveBeenCalledTimes(2);
                expect([...capture.calls.mostRecent().args[0]]).toContain('added');
                testGlobal.wdTestPage = { loaded: true, added: true };
                expect(report(instance).map((entry) => entry.detectorId)).toEqual(['g.a', 'g.b']);
            });

            it('parses at init when load had no detectors', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.callThrough();
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                const instance = loadInstance(undefined);
                expect(compile).not.toHaveBeenCalled();
                initWith(instance, { d: reads });
                expect(compile).toHaveBeenCalledTimes(1);
                expect(capture).toHaveBeenCalledTimes(1);
                testGlobal.wdTestPage = { loaded: true };
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });

            it('captures nothing for detectors that read no name or path and test no node, however often they run', () => {
                const start = spyOn(NativeReader.prototype, '_start').and.callThrough();
                testGlobal.document = new JSDOM('<!DOCTYPE html><p>blocked</p>').window.document;
                try {
                    const instance = loadInstance({
                        text: detects({ text: { pattern: 'blocked' } }, { triggers: auto }),
                        element: detects({ element: { selector: 'p' } }),
                        either: detects({ any: [{ text: { pattern: 'other' } }, { element: { selector: 'p' } }] }),
                    });
                    instance.init();
                    jasmine.clock().tick(1000);
                    expect(report(instance).map((entry) => entry.detectorId)).toEqual(['g.text', 'g.element', 'g.either']);
                } finally {
                    delete testGlobal.document;
                }
                expect(start).not.toHaveBeenCalled();
            });

            it('captures at load for a detector with `root`, which reads no name or path', () => {
                const capture = spyOn(NativeReader.prototype, 'capture').and.callThrough();
                loadInstance({ d: detects({ element: { selector: 'p', root: 'body' } }) });
                expect(capture).toHaveBeenCalledTimes(1);
            });

            it('parses the settings init has when parsing at load throws', () => {
                const compile = spyOn(WebDetection.prototype, '_compile').and.throwError('parse');
                const instance = loadInstance({ d: detects(true) });
                compile.and.callThrough();
                initWith(instance, { d: detects(true) });
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });

            it('drops a group or detector whose config is not an object, and keeps the others', () => {
                const instance = createInstance({ empty: null, g: { nulled: null, listed: [], d: detects(true) } }, { load: true });
                instance.init();
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });

            it('does not run a detector whose runConditions throw, and runs the others', () => {
                const invalid = detects(true, { triggers: { breakageReport: { runConditions: { urlPattern: 'https://[' } } } });
                const instance = loadInstance({ invalid, d: detects(true) });
                instance.init();
                expect(report(instance)).toEqual([{ detectorId: 'g.d', detected: true }]);
            });
        });

        describe('a throw in a report-time run', () => {
            it('records a page value thrown past the reader at its path, calling none of its code', () => {
                testGlobal.wdTestPage = { x: 1 };
                const instance = create({ thrown: detects({ api: 'wdTestPage.x', is: 1 }), working: detects(true) });
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
                const instance = create({ thrown: { match: true, actions: { fireEvent: { type: 'a' } } }, working: detects(true) });
                throwOutsideRun(instance, 'g.thrown');
                expect(report(instance)).toEqual([
                    { detectorId: 'g.thrown', errors: { run: 'error' } },
                    { detectorId: 'g.working', detected: true },
                ]);
            });
        });

        describe('a throw in an `auto` run', () => {
            it('records a throw outside any expression under `run`, in the next report', () => {
                const instance = create({ thrown: autoOnly, working: autoOnly });
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
