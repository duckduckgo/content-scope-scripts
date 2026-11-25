import WebDetection from '../../src/features/web-detection.js';
import { Recorder } from '../../src/features/web-detection/evaluate/recorders.js';
import { createInstance, expectParseError, inTopFrame, REPORT, testGlobal } from './support.js';

/**
 * A `PerformanceObserver` the tests deliver entries to.
 */
class FakeObserver {
    static supportedEntryTypes = ['event', 'long-animation-frame'];
    /** @type {FakeObserver[]} */
    static instances = [];

    /** @param {(list: { getEntries: () => unknown[] }) => void} callback */
    constructor(callback) {
        this.callback = callback;
        /** @type {Record<string, unknown> | undefined} */
        this.options = undefined;
        this.disconnected = false;
        FakeObserver.instances.push(this);
    }

    /** @param {Record<string, unknown>} options */
    observe(options) {
        this.options = options;
    }

    disconnect() {
        this.disconnected = true;
    }

    /** @param {unknown[]} entries */
    deliver(entries) {
        this.callback({ getEntries: () => entries });
    }
}

describe('Recorder windows', () => {
    let now = 0;
    const recorder = () => new Recorder('event', 'click', {}, () => now);
    /** @param {unknown} keep */
    const body = (keep) => /** @type {any} */ ({ kind: 'event', type: 'click', keep });

    beforeEach(() => {
        now = 0;
    });

    it('keeps no log while no body reads it', () => {
        const r = recorder();
        r.record([1, 2]);
        expect(r.log).toEqual([]);
    });

    it('gives each body its own window: by count, by age, by both, or every item', () => {
        const r = recorder();
        const byCount = body({ count: 2 });
        const byAge = body({ withinMs: 100 });
        const both = body({ count: 1, withinMs: 100 });
        const all = body(null);
        for (const b of [byCount, byAge, both, all]) r.bodies.add(b);
        r.record([1]);
        now = 50;
        r.record([2]);
        now = 120;
        r.record([3]);
        expect(r.window(byCount)).toEqual([2, 3]);
        expect(r.window(byAge)).toEqual([2, 3]);
        expect(r.window(both)).toEqual([3]);
        expect(r.window(all)).toEqual([1, 2, 3]);
    });

    it('drops items from the front that no body reaches', () => {
        const r = recorder();
        r.bodies.add(body({ count: 2 }));
        r.bodies.add(body({ withinMs: 10 }));
        r.record([1, 2, 3]);
        now = 100;
        r.record([4]);
        expect(r.log.map(({ item }) => item)).toEqual([3, 4]);
    });

    it('ages items from when they were received', () => {
        const r = recorder();
        const b = body({ withinMs: 100 });
        r.bodies.add(b);
        r.record([{ timeStamp: -5000 }]);
        expect(r.window(b).length).toBe(1);
    });
});

describe('Recorded types in detectors', () => {
    it('compiles `observed`, `trigger` and `done`', () => {
        expect(() =>
            createInstance({
                g: {
                    d: {
                        triggers: { observe: { state: 'enabled', on: [{ event: 'click' }] } },
                        actions: [
                            { define: { clicks: { observed: { event: 'click', keep: { count: 4 } }, using: 'length' } } },
                            { done: { trigger: { event: 'click' } } },
                        ],
                    },
                },
            }),
        ).not.toThrow();
    });

    /** @type {Array<[string, unknown, string]>} */
    const errors = [
        ['`observed` without `keep`', { observed: { event: 'click' } }, 'needs `keep`'],
        ['an empty `keep`', { observed: { event: 'click', keep: {} } }, '`count`, `withinMs` or both'],
        ['two types', { observed: { event: 'click', entryType: 'event', keep: null } }, 'one of `entryType` and `event`'],
        [
            '`durationThreshold` off `event` entries',
            { observed: { event: 'click', durationThreshold: 16, keep: null } },
            '`event` entries only',
        ],
        ['`target` on an entry type', { observed: { entryType: 'event', target: { api: 'window' }, keep: null } }, '`event` bodies only'],
        ['`trigger` naming a type and `auto`', { trigger: { event: 'click', auto: {} } }, 'one of'],
        ['`auto` with a body', { trigger: { auto: { x: 1 } } }, 'takes `{}`'],
        ['`observed` with several bodies', { observed: [{ event: 'click', keep: null }] }, 'takes one body'],
    ];
    for (const [name, actions, message] of errors) {
        it(`rejects ${name}`, () => expectParseError({ actions: { define: { x: actions } } }, message));
    }

    it('rejects `sync` with `delayMs`, and on a body that is not an event', () => {
        const on = (/** @type {unknown} */ body) => ({ triggers: { observe: { state: 'enabled', on: [body] } }, actions: REPORT });
        expectParseError(on({ event: 'click', sync: true, delayMs: 10 }), '`sync` is for');
        expectParseError(on({ entryType: 'event', sync: true }), '`sync` is for');
        expectParseError(on({ event: 'click', field: 'type' }), "unknown key 'field'");
    });

    it('rejects `whenPending` with `sync`, and a value it does not take', () => {
        const on = (/** @type {unknown} */ body) => ({ triggers: { observe: { state: 'enabled', on: [body] } }, actions: REPORT });
        expectParseError(on({ event: 'click', sync: true, whenPending: 'run' }), '`whenPending` is for bodies with no `sync`');
        expectParseError(on({ event: 'click', whenPending: 'queue' }), '`whenPending` takes');
    });
});

describe('The observe trigger', () => {
    inTopFrame();

    /** @type {Array<{ target: unknown, type: string, listener: (event: unknown) => void, options: unknown }>} */
    let listeners;
    /** @type {Array<{ target: unknown, type: string }>} */
    let removed;
    /** @type {unknown} */
    let originalObserver;

    beforeEach(() => {
        listeners = [];
        removed = [];
        FakeObserver.instances = [];
        originalObserver = testGlobal.PerformanceObserver;
        testGlobal.PerformanceObserver = FakeObserver;
        // Captured at construction, so these stand in for the browser's listener methods
        spyOn(EventTarget.prototype, 'addEventListener').and.callFake(function (type, listener, options) {
            listeners.push({ target: this, type, listener: /** @type {any} */ (listener), options });
        });
        spyOn(EventTarget.prototype, 'removeEventListener').and.callFake(function (type) {
            removed.push({ target: this, type });
        });
        spyOn(WebDetection.prototype, 'callFeatureMethod').and.resolveTo(undefined);
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        testGlobal.PerformanceObserver = originalObserver;
    });

    /**
     * Dispatch a trusted event to the listeners for its type.
     *
     * @param {string} type
     * @param {Record<string, unknown>} [fields]
     */
    function dispatch(type, fields = {}) {
        const event = { isTrusted: true, type, timeStamp: 1, target: { id: 'button' }, ...fields };
        for (const entry of listeners.filter((l) => l.type === type)) entry.listener(event);
    }

    /**
     * @param {WebDetection} instance
     * @returns {Array<{ type: string, data?: Record<string, unknown> }>}
     */
    function sent(instance) {
        return /** @type {jasmine.Spy} */ (instance.callFeatureMethod).calls
            .allArgs()
            .filter((args) => args[0] === 'webEvents')
            .map((args) => args[2]);
    }

    /**
     * @param {unknown[]} on
     * @param {unknown} actions
     * @param {Record<string, unknown>} [rest]
     */
    const observing = (on, actions, rest = {}) =>
        createInstance({ g: { d: { triggers: { observe: { state: 'enabled', on } }, actions, ...rest } } });

    const COUNT = { fireEvent: { type: 'clicks', data: { n: { value: { trigger: { event: 'click' }, using: 'length' } } } } };

    it('listens in the capture phase, passively, on the window by default', () => {
        observing([{ event: 'click' }], COUNT);
        expect(listeners.length).toBe(1);
        expect(listeners[0]).toEqual(
            jasmine.objectContaining({ target: globalThis, type: 'click', options: { capture: true, passive: true } }),
        );
    });

    it('runs a detector `delayMs` after an arrival, reading the arrival through `trigger`', () => {
        const instance = observing([{ event: 'click', delayMs: 50 }], COUNT);
        dispatch('click');
        jasmine.clock().tick(49);
        expect(sent(instance)).toEqual([]);
        jasmine.clock().tick(1);
        expect(sent(instance)).toEqual([{ type: 'clicks', data: { n: 1 } }]);
    });

    it('runs a `sync` detector in the listener', () => {
        const instance = observing([{ event: 'click', sync: true }], COUNT);
        dispatch('click');
        expect(sent(instance)).toEqual([{ type: 'clicks', data: { n: 1 } }]);
    });

    it('runs once per arrival', () => {
        const instance = observing([{ event: 'click' }], COUNT);
        dispatch('click');
        dispatch('click');
        jasmine.clock().tick(0);
        expect(sent(instance).length).toBe(2);
    });

    it('ignores untrusted events', () => {
        const instance = observing([{ event: 'click', sync: true }], COUNT);
        dispatch('click', { isTrusted: false });
        expect(sent(instance)).toEqual([]);
    });

    it('schedules no run for an arrival its `where` rejects', () => {
        const instance = observing([{ event: 'click', sync: true, where: { clientX: { gt: 10 } } }], COUNT);
        dispatch('click', { clientX: 5 });
        dispatch('click', { clientX: 20 });
        expect(sent(instance).length).toBe(1);
    });

    it('reads earlier arrivals through `observed`, over its window', () => {
        const instance = observing([{ event: 'click', sync: true }], {
            fireEvent: { type: 'clicks', data: { n: { value: { observed: { event: 'click', keep: { count: 2 } }, using: 'length' } } } },
        });
        dispatch('click');
        dispatch('click');
        dispatch('click');
        expect(sent(instance).map(({ data }) => data?.n)).toEqual([1, 2, 2]);
    });

    it('gives the target an event had during dispatch', () => {
        const instance = observing([{ event: 'click', sync: true }], {
            fireEvent: {
                type: 'clicked',
                data: { id: { value: { trigger: { event: 'click', field: 'target.id' }, using: { path: 'at', args: [0] } } } },
            },
        });
        dispatch('click');
        expect(sent(instance)).toEqual([{ type: 'clicked', data: { id: 'button' } }]);
    });

    it('gives a `trigger` naming another type no item', () => {
        const instance = observing([{ event: 'click', sync: true }], {
            fireEvent: {
                type: 'x',
                data: {
                    scroll: { value: { trigger: { event: 'scroll' }, using: 'length' } },
                    click: { value: { any: [{ trigger: { event: 'click' } }] } },
                },
            },
        });
        dispatch('click');
        expect(sent(instance)).toEqual([{ type: 'x', data: { scroll: 0, click: true } }]);
    });

    it('reads `auto` and `breakageReport` arrivals through `trigger`', () => {
        const instance = createInstance({
            g: {
                d: {
                    triggers: { auto: { state: 'enabled', when: { intervalMs: [10] } } },
                    actions: {
                        fireEvent: {
                            type: 'x',
                            data: {
                                auto: { value: { trigger: { auto: {} }, using: 'length' } },
                                report: { value: { trigger: { breakageReport: {} }, using: 'length' } },
                            },
                        },
                    },
                },
            },
        });
        jasmine.clock().tick(10);
        instance.runDetectors({ trigger: 'breakageReport' });
        expect(sent(instance).map(({ data }) => data)).toEqual([
            { auto: 1, report: 0 },
            { auto: 0, report: 1 },
        ]);
    });

    it('ends a detector at a `done` that held, removing its listener', () => {
        const instance = observing(
            [{ event: 'click', sync: true }],
            [COUNT, { done: { ref: 'this.seen' } }, { define: { 'this.seen': true } }],
        );
        dispatch('click');
        expect(removed).toEqual([]);
        // `this.seen` is bound in the first run, so `done` holds in the second
        dispatch('click');
        expect(sent(instance).length).toBe(2);
        expect(removed).toEqual([jasmine.objectContaining({ type: 'click' })]);
        dispatch('click');
        expect(sent(instance).length).toBe(2);
    });

    it('keeps a `done` that held when the run fails later', () => {
        const instance = observing(
            [{ event: 'click', sync: true }],
            [{ done: true }, { define: { x: { api: { path: 'JSON.parse', args: ['{'] } } } }, COUNT],
        );
        dispatch('click');
        dispatch('click');
        expect(sent(instance)).toEqual([]);
        expect(removed.length).toBe(1);
    });

    it('leaves the detector running when `done` does not hold', () => {
        const instance = observing([{ event: 'click', sync: true }], [{ done: false }, COUNT]);
        dispatch('click');
        dispatch('click');
        expect(sent(instance).length).toBe(2);
    });

    it('runs detectors due at the same delay in one task, as one dispatch', () => {
        const instance = createInstance({
            g: {
                a: { triggers: { observe: { state: 'enabled', on: [{ event: 'click', delayMs: 10 }] } }, actions: COUNT },
                b: { triggers: { observe: { state: 'enabled', on: [{ event: 'click', delayMs: 10 }] } }, actions: COUNT },
            },
        });
        const runAll = spyOn(instance, '_runAll').and.callThrough();
        dispatch('click');
        jasmine.clock().tick(10);
        expect(runAll).toHaveBeenCalledTimes(1);
        expect(sent(instance).length).toBe(2);
    });

    it('shares one listener per event type and target between detectors', () => {
        createInstance({
            g: {
                a: { triggers: { observe: { state: 'enabled', on: [{ event: 'click' }] } }, actions: COUNT },
                b: { actions: { define: { n: { observed: { event: 'click', keep: null } } } } },
            },
        });
        expect(listeners.length).toBe(1);
    });

    it('listens on a target the body names', () => {
        testGlobal.wdTarget = { name: 'target' };
        try {
            observing([{ event: 'resize', target: { api: 'wdTarget' } }], COUNT);
            expect(listeners[0].target).toBe(testGlobal.wdTarget);
        } finally {
            delete testGlobal.wdTarget;
        }
    });

    it('registers nothing for a target that is not an object', () => {
        observing([{ event: 'resize', target: { api: 'wdMissing' } }], COUNT);
        expect(listeners).toEqual([]);
    });

    it('registers nothing when the trigger is disabled, or for a `trigger` body alone', () => {
        createInstance({ g: { d: { triggers: { observe: { state: 'disabled', on: [{ event: 'click' }] } }, actions: COUNT } } });
        createInstance({ g: { d: { actions: { define: { x: { trigger: { event: 'click' } } } } } } });
        expect(listeners).toEqual([]);
    });

    describe('pending runs', () => {
        /**
         * Fire an event per run with what its `trigger` gives from clicks, and how many clicks `observed` has.
         *
         * @param {string} [type]
         */
        const reading = (type = 'clicks') => ({
            fireEvent: {
                type,
                data: {
                    n: { value: { trigger: { event: 'click' }, using: 'length' } },
                    first: { value: { trigger: { event: 'click', field: 'clientX' }, using: { path: 'at', args: [0] } } },
                    last: { value: { trigger: { event: 'click', field: 'clientX' }, using: { path: 'at', args: [-1] } } },
                    seen: { value: { observed: { event: 'click', keep: { count: 10 } }, using: 'length' } },
                },
            },
        });

        it('runs once for arrivals while a run is pending with `skip`, reading the first, and again after it', () => {
            const instance = observing([{ event: 'click', delayMs: 50, whenPending: 'skip' }], reading());
            dispatch('click', { clientX: 1 });
            jasmine.clock().tick(20);
            dispatch('click', { clientX: 2 });
            jasmine.clock().tick(30);
            expect(sent(instance).map(({ data }) => data)).toEqual([{ n: 1, first: 1, last: 1, seen: 2 }]);
            dispatch('click', { clientX: 3 });
            jasmine.clock().tick(50);
            expect(sent(instance).length).toBe(2);
        });

        it('runs once for arrivals while a run is pending with `batch`, reading every one in order', () => {
            const instance = observing([{ event: 'click', delayMs: 50, whenPending: 'batch' }], reading());
            for (const clientX of [1, 2, 3]) {
                dispatch('click', { clientX });
                jasmine.clock().tick(10);
            }
            jasmine.clock().tick(20);
            expect(sent(instance).map(({ data }) => data)).toEqual([{ n: 3, first: 1, last: 3, seen: 3 }]);
        });

        it('gives a batched run the items of each arrival under its own type', () => {
            const instance = observing(
                [
                    { event: 'click', delayMs: 50, whenPending: 'batch' },
                    { event: 'keydown', delayMs: 50, whenPending: 'batch' },
                ],
                {
                    fireEvent: {
                        type: 'x',
                        data: {
                            clicks: { value: { trigger: { event: 'click' }, using: 'length' } },
                            keys: { value: { trigger: { event: 'keydown' }, using: 'length' } },
                        },
                    },
                },
            );
            dispatch('click');
            dispatch('keydown');
            dispatch('keydown');
            jasmine.clock().tick(50);
            expect(sent(instance)).toEqual([{ type: 'x', data: { clicks: 1, keys: 2 } }]);
        });

        it('runs `delayMs` after the last of arrivals with `replace`, reading it', () => {
            const instance = observing([{ event: 'click', delayMs: 50, whenPending: 'replace' }], reading());
            dispatch('click', { clientX: 1 });
            jasmine.clock().tick(30);
            dispatch('click', { clientX: 2 });
            jasmine.clock().tick(49);
            expect(sent(instance)).toEqual([]);
            jasmine.clock().tick(1);
            expect(sent(instance).map(({ data }) => data)).toEqual([{ n: 1, first: 2, last: 2, seen: 2 }]);
        });

        it('leaves the other runs due at a timer when `replace` cancels one', () => {
            const instance = createInstance({
                g: {
                    a: {
                        triggers: { observe: { state: 'enabled', on: [{ event: 'click', delayMs: 50, whenPending: 'replace' }] } },
                        actions: reading('a'),
                    },
                    b: { triggers: { observe: { state: 'enabled', on: [{ event: 'click', delayMs: 50 }] } }, actions: reading('b') },
                },
            });
            dispatch('click');
            jasmine.clock().tick(30);
            dispatch('click');
            jasmine.clock().tick(20);
            expect(sent(instance).map(({ type }) => type)).toEqual(['b']);
            jasmine.clock().tick(30);
            expect(sent(instance).map(({ type }) => type)).toEqual(['b', 'a', 'b']);
        });

        it("acts on a run another of the detector's bodies scheduled", () => {
            const instance = observing(
                [
                    { event: 'click', delayMs: 50 },
                    { event: 'keydown', delayMs: 50, whenPending: 'skip' },
                ],
                reading(),
            );
            dispatch('click', { clientX: 1 });
            dispatch('keydown');
            jasmine.clock().tick(50);
            expect(sent(instance).map(({ data }) => data)).toEqual([{ n: 1, first: 1, last: 1, seen: 1 }]);
        });

        it('schedules its own run with `run`, while another is pending', () => {
            const instance = observing([{ event: 'click', delayMs: 50, whenPending: 'run' }], reading());
            dispatch('click', { clientX: 1 });
            jasmine.clock().tick(20);
            dispatch('click', { clientX: 2 });
            jasmine.clock().tick(50);
            expect(sent(instance).map(({ data }) => data?.first)).toEqual([1, 2]);
        });
    });

    describe('entries', () => {
        const entries = (/** @type {number | undefined} */ durationThreshold) => ({
            fireEvent: { type: 'entries', data: { n: { value: { trigger: { entryType: 'event', durationThreshold }, using: 'length' } } } },
        });
        const ENTRIES = entries(undefined);

        it('observes buffered at the lowest `durationThreshold` of the bodies reading the type', () => {
            createInstance({
                g: {
                    a: {
                        triggers: { observe: { state: 'enabled', on: [{ entryType: 'event', durationThreshold: 40 }] } },
                        actions: ENTRIES,
                    },
                    b: { actions: { define: { x: { observed: { entryType: 'event', durationThreshold: 16, keep: null } } } } },
                },
            });
            expect(FakeObserver.instances.length).toBe(1);
            expect(FakeObserver.instances[0].options).toEqual({ type: 'event', buffered: true, durationThreshold: 16 });
        });

        it('runs once per delivered batch, giving each body only entries at its threshold', () => {
            const instance = observing([{ entryType: 'event', durationThreshold: 50 }], entries(50));
            FakeObserver.instances[0].deliver([{ duration: 40 }, { duration: 60 }, { duration: 80 }]);
            jasmine.clock().tick(0);
            expect(sent(instance)).toEqual([{ type: 'entries', data: { n: 2 } }]);
        });

        it('gives `event` entries at the engine default of 104 ms to a body with no threshold', () => {
            const instance = observing([{ entryType: 'event' }], ENTRIES);
            FakeObserver.instances[0].deliver([{ duration: 100 }]);
            FakeObserver.instances[0].deliver([{ duration: 104 }]);
            jasmine.clock().tick(0);
            expect(sent(instance)).toEqual([{ type: 'entries', data: { n: 1 } }]);
        });

        it('registers no observer for an entry type the engine does not support', () => {
            observing([{ entryType: 'longtask' }], ENTRIES);
            expect(FakeObserver.instances).toEqual([]);
        });

        it('disconnects once every detector reading the type is done', () => {
            observing([{ entryType: 'long-animation-frame' }], { done: true });
            FakeObserver.instances[0].deliver([{ duration: 100 }]);
            jasmine.clock().tick(0);
            expect(FakeObserver.instances[0].disconnected).toBe(true);
        });
    });
});
