import { compileDetector } from '../src/features/web-detection/parse.js';
import { EvaluationContext } from '../src/features/web-detection/expressions.js';
import { NativeReader } from '../src/features/web-detection/predicates.js';
import { ConfigParseError } from '../src/features/web-detection/core.js';
import { breakageEntry, createDetectorState, runActions } from '../src/features/web-detection/actions.js';
import WebDetection from '../src/features/web-detection.js';

/**
 * A page whose values the tests change between runs. `bad` throws while `throws` is set. The values sit
 * one level below `page`, since the reader captures the data properties of objects on the global.
 *
 * @returns {{ page: { live: { n: number, ready: boolean, label: string, throws: boolean, readonly bad: number } } }}
 */
function makeGlobal() {
    return {
        page: {
            live: {
                n: 0,
                ready: false,
                label: 'x',
                throws: true,
                get bad() {
                    if (this.throws) throw new TypeError('unreadable');
                    return 1;
                },
            },
        },
    };
}

/**
 * Compile a detector's items over `global`, and run them against one detector state.
 *
 * @param {unknown[]} actions
 * @param {object} [global]
 */
function detector(actions, global = makeGlobal()) {
    const compiled = compileDetector({ actions }, global);
    const reader = new NativeReader(global, compiled.names);
    const state = createDetectorState();
    /** @type {Array<{ type: string, data?: object }>} */
    const events = [];
    return {
        state,
        events,
        types: () => events.map((event) => event.type),
        run: () =>
            runActions(compiled, state, new EvaluationContext(reader, state.defined), (type, data) => {
                events.push({ type, ...(data && { data }) });
            }),
        entry: () => breakageEntry('g.d', state),
    };
}

/**
 * @param {unknown} actions
 * @param {string} message
 */
function expectParseError(actions, message) {
    expect(() => compileDetector(/** @type {any} */ ({ actions }), {})).toThrowMatching(
        (e) => e instanceof ConfigParseError && e.message.includes(message),
    );
}

/** The global `api` reads from in the feature tests. */
const testGlobal = /** @type {Record<string, any>} */ (globalThis);

const aborting = { api: 'page.live.bad', is: { gt: 0 } };
const erroring = { api: 'page.live.label' };

describe('WebDetection actions', () => {
    describe('items', () => {
        it('runs items in array order, and an item without `when` always', () => {
            const d = detector([{ fireEvent: { type: 'a' } }, { when: true, fireEvent: { type: 'b' } }]);
            expect(d.run().outcomes).toEqual(['ran', 'ran']);
            expect(d.types()).toEqual(['a', 'b']);
        });

        it('skips an item whose `when` is false, and evaluates the next', () => {
            const d = detector([{ when: false, fireEvent: { type: 'a' } }, { fireEvent: { type: 'b' } }]);
            expect(d.run().outcomes).toEqual(['skipped', 'ran']);
            expect(d.types()).toEqual(['b']);
        });

        it('ends the run on `exit`, skipping the items after it', () => {
            const d = detector([{ when: true, exit: true }, { fireEvent: { type: 'b' } }]);
            const run = d.run();
            expect(run.outcomes).toEqual(['ran']);
            expect(run.endedAt).toBe(0);
            expect(d.types()).toEqual([]);
        });

        it('runs an item without `exit` and goes on, so a later item runs in the same run', () => {
            const d = detector([{ fireEvent: { type: 'a' } }, { fireEvent: { type: 'b' }, exit: true }, { fireEvent: { type: 'c' } }]);
            expect(d.run().endedAt).toBe(1);
            expect(d.types()).toEqual(['a', 'b']);
        });

        it('sends the payload computed when the item runs', () => {
            const global = makeGlobal();
            global.page.live.n = 4;
            const d = detector([{ fireEvent: { type: 'a', data: { n: { value: { api: 'page.live.n' } } } } }], global);
            d.run();
            expect(d.events).toEqual([{ type: 'a', data: { n: 4 } }]);
        });

        it('reads a name from any item, before and after its `as`', () => {
            const global = makeGlobal();
            global.page.live.n = 2;
            const d = detector(
                [
                    { when: { ref: 'n', is: { gt: 1 } }, fireEvent: { type: 'big' } },
                    { when: { api: 'page.live.n', as: 'n', is: { gt: 0 } }, fireEvent: { type: 'positive' } },
                ],
                global,
            );
            d.run();
            expect(d.types()).toEqual(['big', 'positive']);
        });
    });

    describe('failures', () => {
        it('ends the run when a `when` aborts, keeping what earlier items did', () => {
            const d = detector([{ fireEvent: { type: 'a' } }, { when: aborting, fireEvent: { type: 'b' } }, { fireEvent: { type: 'c' } }]);
            const run = d.run();
            expect(run.outcomes).toEqual(['ran', 'aborted']);
            expect(run.endedAt).toBe(1);
            expect(run.failedAt).toBe('1.when');
            expect(run.abortError).toBe('TypeError');
            expect(d.types()).toEqual(['a']);
        });

        it('ends the run when a `when` errors', () => {
            const d = detector([{ when: erroring, fireEvent: { type: 'a' } }, { fireEvent: { type: 'b' } }]);
            const run = d.run();
            expect(run.outcomes).toEqual(['error']);
            expect(run.error).toContain('expected a boolean');
            expect(d.types()).toEqual([]);
        });

        it('ends the run on a failed payload value, leaving every action of the item undone', () => {
            const d = detector([
                {
                    fireEvent: { type: 'a', data: { x: { value: { api: 'page.live.bad' } } } },
                    breakageReportData: {},
                    define: { seen: true },
                },
                { fireEvent: { type: 'b' } },
            ]);
            const run = d.run();
            expect(run.outcomes).toEqual(['aborted']);
            expect(run.failedAt).toBe('0.fireEvent.x');
            expect(d.types()).toEqual([]);
            expect(d.state.defined.has('seen')).toBe(false);
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { '0.fireEvent.x': 'aborted' } });
        });

        it('keys a failed breakage value by its action', () => {
            const d = detector([{ breakageReportData: { data: { x: { value: { api: 'page.live.bad' } } } } }]);
            expect(d.run().failedAt).toBe('0.breakageReportData.x');
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { '0.breakageReportData.x': 'aborted' } });
        });

        it('sends a payload whose failed value a `when` testing `fails` handles', () => {
            const d = detector([{ fireEvent: { type: 'a', data: { x: { value: { api: 'page.live.bad' }, when: { fails: false } } } } }]);
            expect(d.run().outcomes).toEqual(['ran']);
            expect(d.events).toEqual([{ type: 'a', data: {} }]);
            expect(d.entry()).toBeUndefined();
        });

        it('keeps `done` an earlier item stored when a later item fails', () => {
            const d = detector([{ define: { done: true } }, { when: aborting, fireEvent: { type: 'a' } }]);
            d.run();
            expect(d.state.done).toBe(true);
        });

        it('ends the run when the `when` of an item holding `exit` fails, and runs again on the next trigger', () => {
            const global = makeGlobal();
            const d = detector([{ when: { none: [aborting] }, exit: true }, { fireEvent: { type: 'b' } }], global);
            const run = d.run();
            expect(run.outcomes).toEqual(['aborted']);
            expect(run.endedAt).toBe(0);
            expect(d.types()).toEqual([]);

            global.page.live.throws = false;
            expect(d.run().outcomes).toEqual(['skipped', 'ran']);
            expect(d.types()).toEqual(['b']);
        });

        it('ends the run with `done` unchanged when the `when` of an item defining `done` fails', () => {
            const d = detector([{ when: erroring, define: { done: true } }, { fireEvent: { type: 'b' } }]);
            const run = d.run();
            expect(run.outcomes).toEqual(['error']);
            expect(d.state.done).toBe(false);
            expect(d.state.defined.has('done')).toBe(false);
        });
    });

    describe('first-match chains', () => {
        const chain = [
            { when: { none: [{ api: 'page.live.n', as: 'n', is: { gt: 0 } }] }, exit: true },
            { breakageReportData: { data: { n: { value: { ref: 'n' } } } } },
            { when: { ref: 'n', is: { lt: 3 } }, fireEvent: { type: 'fast' }, define: { done: true }, exit: true },
            { when: { ref: 'n', is: { lt: 8 } }, fireEvent: { type: 'mid' }, define: { done: true }, exit: true },
            { fireEvent: { type: 'slow' }, define: { done: true }, exit: true },
        ];

        it('waits for the gate, then fires the first bucket that holds and ends the detector', () => {
            const global = makeGlobal();
            const d = detector(chain, global);
            expect(d.run().endedAt).toBe(0);
            expect(d.state.done).toBe(false);
            expect(d.entry()).toBeUndefined();

            global.page.live.n = 5;
            const run = d.run();
            expect(run.outcomes).toEqual(['skipped', 'ran', 'skipped', 'ran']);
            expect(run.endedAt).toBe(3);
            expect(d.types()).toEqual(['mid']);
            expect(d.state.done).toBe(true);
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true, data: { n: 5 } });
        });

        it('falls through to the last bucket', () => {
            const global = makeGlobal();
            global.page.live.n = 20;
            const d = detector(chain, global);
            d.run();
            expect(d.types()).toEqual(['slow']);
        });
    });

    describe('define', () => {
        const counter = {
            count: { if: { test: { ref: 'count', is: { type: 'undefined' } }, then: 1, else: { sum: [{ ref: 'count' }, 1] } } },
        };

        it('reads `undefined` for a name no `define` has stored', () => {
            const d = detector([{ when: { ref: 'x', is: { type: 'undefined' } }, fireEvent: { type: 'unset' } }, { define: { x: 1 } }]);
            d.run();
            d.run();
            expect(d.types()).toEqual(['unset']);
            expect(d.state.defined.get('x')).toBe(1);
        });

        it('keeps a value across runs, and counts up', () => {
            const d = detector([{ define: counter }]);
            d.run();
            d.run();
            d.run();
            expect(d.state.defined.get('count')).toBe(3);
        });

        it('stores after the item’s payloads, which read the value from before it', () => {
            const d = detector([
                { fireEvent: { type: 'a', data: { count: { value: { ref: 'count' } } } }, define: counter },
                { fireEvent: { type: 'b', data: { count: { value: { ref: 'count' } } } } },
            ]);
            d.run();
            d.run();
            expect(d.events).toEqual([
                { type: 'a', data: {} },
                { type: 'b', data: { count: 1 } },
                { type: 'a', data: { count: 1 } },
                { type: 'b', data: { count: 2 } },
            ]);
        });

        it('stores the boolean an `is` gives, not the value it tests', () => {
            const global = makeGlobal();
            const d = detector([{ define: { seen: { api: 'page.live.n', is: { gt: 0 } } } }], global);
            d.run();
            expect(d.state.defined.get('seen')).toBe(false);
            global.page.live.n = 3;
            d.run();
            expect(d.state.defined.get('seen')).toBe(true);
        });

        it('stores a list as an array, which `in` reads in later runs', () => {
            const global = makeGlobal();
            const d = detector(
                [
                    { when: { api: 'page.live.label', is: { in: { ref: 'seen' } } }, fireEvent: { type: 'seen' }, define: { done: true } },
                    { define: { seen: { expr: ['y', 'z'] } } },
                ],
                global,
            );
            d.run();
            expect(d.state.defined.get('seen')).toEqual(['y', 'z']);
            global.page.live.label = 'z';
            d.run();
            expect(d.types()).toEqual(['seen']);
        });

        it('computes every value in one `define` before storing any', () => {
            const d = detector([{ define: { a: 1, b: { ref: 'a' } } }]);
            d.run();
            expect(d.state.defined.get('b')).toBeUndefined();
            d.run();
            expect(d.state.defined.get('b')).toBe(1);
        });

        it('ends the run when a value fails, leaving the stored value unchanged', () => {
            const global = makeGlobal();
            global.page.live.throws = false;
            const d = detector([{ define: { x: { api: 'page.live.bad' } } }], global);
            d.run();
            expect(d.state.defined.get('x')).toBe(1);

            global.page.live.throws = true;
            const run = d.run();
            expect(run.outcomes).toEqual(['aborted']);
            expect(run.failedAt).toBe('0.define.x');
            expect(d.state.defined.get('x')).toBe(1);
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { '0.define.x': 'aborted' } });
        });

        it('guards an event sent once beside a measurement refreshed on every run', () => {
            const global = makeGlobal();
            const d = detector(
                [
                    { breakageReportData: { data: { n: { value: { api: 'page.live.n' } } } } },
                    { when: { none: [{ ref: 'sent', is: true }] }, fireEvent: { type: 'measured' }, define: { sent: true } },
                ],
                global,
            );
            d.run();
            global.page.live.n = 7;
            d.run();
            expect(d.types()).toEqual(['measured']);
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true, data: { n: 7 } });
            expect(d.state.done).toBe(false);
        });
    });

    describe('done', () => {
        it('finishes the run, then ends the detector', () => {
            const d = detector([{ define: { done: true } }, { fireEvent: { type: 'after' } }]);
            d.run();
            expect(d.types()).toEqual(['after']);
            expect(d.state.done).toBe(true);
        });

        it('takes a computed boolean, and leaves the detector running until it is `true`', () => {
            const global = makeGlobal();
            const d = detector([{ define: { done: { api: 'page.live.ready' } } }], global);
            d.run();
            expect(d.state.done).toBe(false);
            global.page.live.ready = true;
            d.run();
            expect(d.state.done).toBe(true);
        });

        it('takes a test, and ends the detector once it holds', () => {
            const global = makeGlobal();
            const d = detector([{ define: { done: { api: 'page.live.n', is: { gt: 0 } } } }], global);
            d.run();
            expect(d.state.done).toBe(false);
            global.page.live.n = 1;
            d.run();
            expect(d.state.done).toBe(true);
        });

        it('takes any value, and leaves the detector running on a value other than `true`', () => {
            const global = { page: { live: { list: [{ ready: true }] } } };
            const d = detector(
                [
                    { define: { done: 5 } },
                    { define: { done: { sum: [1, 2] } } },
                    { define: { done: { api: { path: 'page.live.list', where: {} } } } },
                ],
                global,
            );
            d.run();
            expect(d.state.defined.get('done')).toEqual([{ ready: true }]);
            expect(d.state.done).toBe(false);
        });
    });

    describe('breakage entries', () => {
        it('has no entry before a `breakageReportData` action runs or a failure is recorded', () => {
            const d = detector([{ when: false, breakageReportData: {} }]);
            d.run();
            expect(d.entry()).toBeUndefined();
        });

        it('writes `detected: true` from `{}`', () => {
            const d = detector([{ breakageReportData: {} }]);
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true });
        });

        it('merges `data` across writes, most recent per key, keeping a key a later write omits', () => {
            const global = makeGlobal();
            global.page.live.n = 1;
            const d = detector(
                [
                    {
                        breakageReportData: {
                            data: { n: { value: { api: 'page.live.n' } }, small: { value: { api: 'page.live.n' }, when: { lt: 3 } } },
                        },
                    },
                ],
                global,
            );
            d.run();
            global.page.live.n = 5;
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true, data: { n: 5, small: 1 } });
        });

        it('records a failure by where it arose, and keeps it after a clean run', () => {
            const global = makeGlobal();
            const d = detector([{ when: aborting, breakageReportData: {} }], global);
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { '0.when': 'aborted' } });
            global.page.live.throws = false;
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true, errors: { '0.when': 'aborted' } });
        });

        it('records an error as `error`, and only the failure that ended the run', () => {
            const d = detector([
                { when: erroring, fireEvent: { type: 'a' } },
                { when: aborting, breakageReportData: {} },
            ]);
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { '0.when': 'error' } });
        });

        it('keeps a failure when later runs end before reaching its item', () => {
            const global = makeGlobal();
            const d = detector(
                [
                    { when: { api: 'page.live.ready' }, exit: true },
                    { when: aborting, breakageReportData: {} },
                ],
                global,
            );
            d.run();
            global.page.live.ready = true;
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { '1.when': 'aborted' } });
        });
    });

    describe('validation', () => {
        it('rejects shapes that are not items', () => {
            expectParseError({ fireEvent: { type: 'a' } }, '`actions` takes an array');
            expectParseError(['x'], 'an item takes an object');
            expectParseError([{ when: true, match: {} }], "unknown key 'match'");
            expectParseError([{ when: true }], 'at least one of');
            expectParseError([{ exit: false }], '`exit` takes `true`');
        });

        it('rejects unknown keys in the actions', () => {
            expectParseError([{ fireEvent: { type: 'a', state: 'enabled' } }], "unknown key 'state'");
            expectParseError([{ breakageReportData: { state: 'enabled' } }], "unknown key 'state'");
            expectParseError([{ fireEvent: {} }], '`type` takes a string');
            expectParseError([{ fireEvent: 'a' }], '`fireEvent` takes an object');
        });

        it('rejects a `define` that is not an object of valid names', () => {
            expectParseError([{ define: {} }], '`define` takes an object of at least one name');
            expectParseError([{ define: true }], '`define` takes an object of at least one name');
            expectParseError([{ define: { '1x': 1 } }], 'invalid name');
            expectParseError([{ define: { x: { foo: 1 } } }], "unknown expression key 'foo'");
        });

        it('rejects a name both `define`d and given by `as`, and `done` given by `as`', () => {
            expectParseError([{ when: { api: 'page.live.n', as: 'x', is: 1 }, define: { x: 1 } }], 'a name is one or the other');
            expectParseError([{ when: { api: 'page.live.n', as: 'done', is: 1 }, exit: true }], "'done' is reserved");
        });

        it('reads a `define`d name through `ref` without an `as`', () => {
            expect(() => compileDetector({ actions: [{ when: { ref: 'seen', is: true }, define: { seen: true } }] }, {})).not.toThrow();
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

        it('cancels the timers of a detector once it is done', () => {
            const instance = createInstance({ d: { triggers: auto, actions: [{ fireEvent: { type: 'a' }, define: { done: true } }] } });
            const run = spyOn(instance, '_runDetector').and.callThrough();
            jasmine.clock().tick(1000);
            expect(run).toHaveBeenCalledTimes(1);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('keeps the timers shared with a detector that is not done', () => {
            const instance = createInstance({
                done: { triggers: auto, actions: [{ define: { done: true } }] },
                running: { triggers: auto, actions: [{ fireEvent: { type: 'a' } }] },
            });
            jasmine.clock().tick(1000);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(3);
        });

        it('returns entries written by `auto` runs, and does not run a done detector for the report', () => {
            testGlobal.wdTestPage = { n: 3 };
            const instance = createInstance({
                d: {
                    triggers: auto,
                    actions: [
                        {
                            fireEvent: { type: 'a' },
                            breakageReportData: { data: { n: { value: { api: 'wdTestPage.n' } } } },
                            define: { done: true },
                        },
                    ],
                },
            });
            jasmine.clock().tick(100);
            testGlobal.wdTestPage.n = 9;
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true, data: { n: 3 } }]);
            expect(instance.callFeatureMethod).toHaveBeenCalledTimes(1);
        });

        it('runs a detector that is not done for the report, which reads its `define`d values', () => {
            const instance = createInstance({
                d: {
                    triggers: auto,
                    actions: [
                        {
                            define: {
                                runs: {
                                    if: { test: { ref: 'runs', is: { type: 'undefined' } }, then: 1, else: { sum: [{ ref: 'runs' }, 1] } },
                                },
                            },
                        },
                        { breakageReportData: { data: { runs: { value: { ref: 'runs' } } } } },
                    ],
                },
            });
            jasmine.clock().tick(1000);
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                { detectorId: 'g.d', detected: true, data: { runs: 4 } },
            ]);
        });
    });
});
