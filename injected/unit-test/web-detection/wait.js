import WebDetection from '../../src/features/web-detection.js';
import { createInstance, expectParseError, inTopFrame, instanceArgs, REPORT, testGlobal } from './support.js';

/**
 * A `MutationObserver` the tests deliver records to.
 */
class FakeMutationObserver {
    /** @type {FakeMutationObserver[]} */
    static instances = [];

    /** @param {(records: unknown[]) => void} callback */
    constructor(callback) {
        this.callback = callback;
        /** @type {unknown} */
        this.target = undefined;
        /** @type {unknown} */
        this.options = undefined;
        this.disconnected = false;
        FakeMutationObserver.instances.push(this);
    }

    /**
     * @param {unknown} target
     * @param {unknown} options
     */
    observe(target, options) {
        if (typeof target !== 'object' || target === null) throw new TypeError('not a node');
        this.target = target;
        this.options = options;
    }

    disconnect() {
        this.disconnected = true;
    }

    /** @param {unknown[]} records */
    deliver(records) {
        if (!this.disconnected) this.callback(records);
    }
}

describe('The wait source', () => {
    /** @type {Array<{ target: unknown, type: string, listener: (event: unknown) => void }>} */
    let listeners;
    /** @type {unknown} */
    let originalMutationObserver;

    beforeEach(() => {
        listeners = [];
        FakeMutationObserver.instances = [];
        originalMutationObserver = testGlobal.MutationObserver;
        testGlobal.MutationObserver = FakeMutationObserver;
        spyOn(EventTarget.prototype, 'addEventListener').and.callFake(function (type, listener) {
            listeners.push({ target: this, type, listener: /** @type {any} */ (listener) });
        });
        spyOn(EventTarget.prototype, 'removeEventListener').and.callFake(function (type, listener) {
            listeners = listeners.filter((entry) => !(entry.target === this && entry.type === type && entry.listener === listener));
        });
        spyOn(WebDetection.prototype, 'callFeatureMethod').and.resolveTo(undefined);
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        testGlobal.MutationObserver = originalMutationObserver;
    });

    inTopFrame();

    /**
     * @param {string} type
     * @param {Record<string, unknown>} [fields]
     * @param {unknown} [target] - only the listeners on this target, when given
     */
    function dispatch(type, fields = {}, target = undefined) {
        const event = { isTrusted: true, type, timeStamp: 1, target: { id: 'button' }, ...fields };
        for (const entry of listeners.filter((l) => l.type === type && (target === undefined || l.target === target)))
            entry.listener(event);
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

    const NO_REPORT = { breakageReport: { state: 'disabled' } };

    /**
     * A detector observing `click` with `sync`, which runs `actions`.
     *
     * @param {unknown} actions
     * @param {Record<string, unknown>} [on] - more keys of the `on` body
     */
    const onClick = (actions, on = {}) =>
        createInstance({
            g: { d: { triggers: { ...NO_REPORT, observe: { state: 'enabled', on: [{ event: 'click', sync: true, ...on }] } }, actions } },
        });

    /** Send `got` with the value the `wait` gave. */
    const SEND_GOT = { fireEvent: { type: 'got', data: { v: { value: { ref: 'got' } } } } };

    it('suspends until the next item arrives, and resumes with it', () => {
        const instance = onClick([{ define: { got: { wait: { event: 'scroll', field: 'type', timeoutMs: 1000 } } } }, SEND_GOT]);
        dispatch('click');
        expect(sent(instance)).toEqual([]);
        dispatch('scroll');
        expect(sent(instance)).toEqual([{ type: 'got', data: { v: 'scroll' } }]);
    });

    it('stays suspended through items its `where` rejects', () => {
        const instance = onClick([
            { define: { got: { wait: { event: 'scroll', where: { timeStamp: { gt: 5 } }, field: 'timeStamp', timeoutMs: 1000 } } } },
            SEND_GOT,
        ]);
        dispatch('click');
        dispatch('scroll', { timeStamp: 2 });
        expect(sent(instance)).toEqual([]);
        dispatch('scroll', { timeStamp: 9 });
        expect(sent(instance)).toEqual([{ type: 'got', data: { v: 9 } }]);
    });

    it('resumes with `undefined` once `timeoutMs` passes', () => {
        const instance = onClick([
            { define: { got: { wait: { event: 'scroll', timeoutMs: 500 } } } },
            { fireEvent: { type: 'timedOut', data: { v: { value: { ref: 'got', is: { type: 'undefined' } } } } } },
        ]);
        dispatch('click');
        jasmine.clock().tick(499);
        expect(sent(instance)).toEqual([]);
        jasmine.clock().tick(1);
        expect(sent(instance)).toEqual([{ type: 'timedOut', data: { v: true } }]);
        dispatch('scroll');
        expect(sent(instance).length).toBe(1);
    });

    it('takes no item that arrived before the wait started', () => {
        const instance = createInstance({
            g: {
                d: {
                    triggers: { ...NO_REPORT, observe: { state: 'enabled', on: [{ event: 'click', delayMs: 10 }] } },
                    actions: [{ define: { got: { wait: { event: 'scroll', field: 'type', timeoutMs: 100 } } } }, SEND_GOT],
                },
            },
        });
        dispatch('click');
        dispatch('scroll');
        jasmine.clock().tick(10);
        jasmine.clock().tick(100);
        expect(sent(instance)).toEqual([{ type: 'got', data: {} }]);
    });

    it('listens on a `target` of its own while the wait is open', () => {
        testGlobal.wdButton = { id: 'b' };
        try {
            const instance = onClick([
                { define: { got: { wait: { event: 'pointerup', target: { api: 'wdButton' }, field: 'type', timeoutMs: 100 } } } },
                SEND_GOT,
            ]);
            const before = listeners.length;
            dispatch('click');
            expect(listeners.length).toBe(before + 1);
            expect(listeners[listeners.length - 1].target).toBe(testGlobal.wdButton);
            dispatch('pointerup', {}, testGlobal.wdButton);
            expect(sent(instance)).toEqual([{ type: 'got', data: { v: 'pointerup' } }]);
            expect(listeners.length).toBe(before);
        } finally {
            delete testGlobal.wdButton;
        }
    });

    it('observes mutations of a `target`, giving records with the time of the callback', () => {
        testGlobal.wdRegion = { id: 'region' };
        try {
            const instance = onClick([
                { define: { got: { wait: { mutation: { childList: true }, target: { api: 'wdRegion' }, timeoutMs: 1000 } } } },
                {
                    fireEvent: {
                        type: 'got',
                        data: {
                            type: { value: { ref: 'got', using: 'type' } },
                            timed: { value: { ref: 'got', using: 'timeStamp', is: { type: 'number' } } },
                        },
                    },
                },
            ]);
            dispatch('click');
            const [observer] = FakeMutationObserver.instances;
            expect(observer.target).toBe(testGlobal.wdRegion);
            expect(observer.options).toEqual({ childList: true });
            observer.deliver([{ type: 'childList' }]);
            expect(sent(instance)).toEqual([{ type: 'got', data: { type: 'childList', timed: true } }]);
            expect(observer.disconnected).toBe(true);
        } finally {
            delete testGlobal.wdRegion;
        }
    });

    it('resumes with the failure when its `target` fails', () => {
        const instance = onClick([
            { define: { got: { wait: { event: 'scroll', target: { api: { path: 'JSON.parse', args: ['{'] } }, timeoutMs: 100 } } } },
            SEND_GOT,
        ]);
        dispatch('click');
        expect(sent(instance)).toEqual([]);
        expect(instance.getBreakageReportData()).toEqual([
            { detectorId: 'g.d', errors: { 'actions.0.define.got.wait.target.api': 'aborted' } },
        ]);
    });

    /** @type {Array<[string, Record<string, unknown>]>} */
    const unobservable = [
        ['observing mutations on it throws', { mutation: { childList: true }, target: { api: 'wdMissing' } }],
        ['it is not an event target', { event: 'scroll', target: { api: 'wdCount' } }],
    ];
    for (const [name, body] of unobservable) {
        it(`fails at its \`target\` straight away when ${name}`, () => {
            testGlobal.wdCount = 3;
            try {
                const instance = onClick([{ define: { got: { wait: { ...body, timeoutMs: 1000 } } } }, SEND_GOT]);
                dispatch('click');
                expect(sent(instance)).toEqual([]);
                expect(instance.getBreakageReportData()).toEqual([
                    { detectorId: 'g.d', errors: { 'actions.0.define.got.wait.target.api': 'aborted' } },
                ]);
            } finally {
                delete testGlobal.wdCount;
            }
        });
    }

    it('lets `fails` catch a `target` it cannot observe', () => {
        const instance = onClick({
            if: { wait: { mutation: { childList: true }, target: { api: 'wdMissing' }, timeoutMs: 1000 }, is: { fails: true } },
            then: { fireEvent: { type: 'caught' } },
        });
        dispatch('click');
        expect(sent(instance)).toEqual([{ type: 'caught' }]);
    });

    describe('while a run is suspended', () => {
        const WAIT = { define: { got: { wait: { event: 'scroll', timeoutMs: 1000 } } } };
        const RAN = { fireEvent: { type: 'ran' } };

        it('queues a run for each arrival, by default, and runs them in order after it ends', () => {
            const instance = onClick([WAIT, RAN], { whenBusy: 'queue', sync: false });
            dispatch('click');
            jasmine.clock().tick(0);
            dispatch('click');
            dispatch('click');
            jasmine.clock().tick(0);
            expect(sent(instance)).toEqual([]);
            // The first run ends, and the next queued run suspends in its own wait
            dispatch('scroll');
            expect(sent(instance).length).toBe(1);
            dispatch('scroll');
            dispatch('scroll');
            expect(sent(instance).length).toBe(3);
        });

        it('skips arrivals with `whenBusy: "skip"`', () => {
            const instance = onClick([WAIT, RAN], { whenBusy: 'skip' });
            dispatch('click');
            dispatch('click');
            dispatch('scroll');
            dispatch('scroll');
            expect(sent(instance).length).toBe(1);
        });

        it('abandons the run with `whenBusy: "interrupt"`, keeping its detector names and `done`s', () => {
            const instance = onClick([{ define: { 'this.started': { sum: [{ expr: 1 }] } } }, WAIT, RAN], { whenBusy: 'interrupt' });
            dispatch('click');
            dispatch('click');
            expect(sent(instance)).toEqual([]);
            dispatch('scroll');
            // Only the second run reaches its end
            expect(sent(instance).length).toBe(1);
        });

        /** @type {Array<[string, { n: number, first: number }]>} */
        const queuedRuns = [
            ['skip', { n: 1, first: 1 }],
            ['batch', { n: 3, first: 1 }],
            ['replace', { n: 1, first: 3 }],
        ];
        for (const [whenPending, data] of queuedRuns) {
            it(`queues one run for arrivals with \`whenPending: "${whenPending}"\`, which acts on the queued run`, () => {
                const ranWith = {
                    fireEvent: {
                        type: 'ran',
                        data: {
                            n: { value: { trigger: { event: 'click' }, using: 'length' } },
                            first: { value: { trigger: { event: 'click', field: 'clientX' }, using: { path: 'at', args: [0] } } },
                        },
                    },
                };
                const instance = onClick([WAIT, ranWith], { sync: false, whenBusy: 'queue', whenPending });
                dispatch('click', { clientX: 0 });
                jasmine.clock().tick(0);
                for (const clientX of [1, 2, 3]) {
                    dispatch('click', { clientX });
                    jasmine.clock().tick(0);
                }
                // The first run ends, and the one queued run suspends in its own wait
                dispatch('scroll');
                dispatch('scroll');
                dispatch('scroll');
                expect(sent(instance).map((event) => event.data)).toEqual([{ n: 1, first: 0 }, data]);
            });
        }

        it('makes the detector done when an abandoned run held a `done`', () => {
            const instance = onClick([{ done: true }, WAIT, RAN], { whenBusy: 'interrupt' });
            dispatch('click');
            dispatch('click');
            dispatch('scroll');
            expect(sent(instance)).toEqual([]);
            expect(listeners.filter((l) => l.type === 'click')).toEqual([]);
        });
    });

    describe('detectorPerf', () => {
        /**
         * @param {unknown} actions
         */
        function timedInstance(actions) {
            const args = instanceArgs({
                g: { d: { triggers: { ...NO_REPORT, observe: { state: 'enabled', on: [{ event: 'click', sync: true }] } }, actions } },
            });
            args.featureSettings = { ...args.featureSettings, detectorPerf: {} };
            const instance = new WebDetection('webDetection', undefined, {}, args);
            instance.init();
            return instance;
        }

        /** @param {WebDetection} instance */
        const slices = (instance) =>
            /** @type {jasmine.Spy} */ (instance.callFeatureMethod).calls
                .allArgs()
                .filter((args) => args[1] === 'record')
                .map((args) => ({ slice: args[7], dispatch: args[6] }));

        it('records a first slice, a wait miss per arrival that resumes nothing, and the slice that resumes the run', () => {
            const instance = timedInstance([
                { define: { got: { wait: { event: 'scroll', where: { timeStamp: { gt: 5 } }, timeoutMs: 1000 } } } },
            ]);
            dispatch('click');
            dispatch('scroll', { timeStamp: 1 });
            dispatch('scroll', { timeStamp: 9 });
            const recorded = slices(instance);
            expect(recorded.map(({ slice }) => slice)).toEqual(['start', 'miss', 'continue']);
            // Each callback is a dispatch of its own
            expect(new Set(recorded.map(({ dispatch }) => dispatch)).size).toBe(3);
        });

        it('records the slice a resumed run ends on a failure in as failed', () => {
            const instance = timedInstance([
                { define: { got: { wait: { event: 'scroll', timeoutMs: 1000 } } } },
                { define: { x: { sum: [{ ref: 'got' }] } } },
            ]);
            dispatch('click');
            dispatch('scroll');
            const failed = /** @type {jasmine.Spy} */ (instance.callFeatureMethod).calls
                .allArgs()
                .filter((args) => args[1] === 'record')
                .map((args) => ({ slice: args[7], failed: args[5] }));
            expect(failed).toEqual([
                { slice: 'start', failed: false },
                { slice: 'continue', failed: true },
            ]);
        });

        it('records the resume at `timeoutMs` as a later slice', () => {
            const instance = timedInstance([{ define: { got: { wait: { event: 'scroll', timeoutMs: 10 } } } }]);
            dispatch('click');
            jasmine.clock().tick(10);
            expect(slices(instance).map(({ slice }) => slice)).toEqual(['start', 'continue']);
        });
    });

    describe('in config', () => {
        it('needs `timeoutMs`', () => expectParseError({ actions: { define: { x: { wait: { event: 'click' } } } } }, 'needs `timeoutMs`'));
        it('needs a `target` for `mutation`', () =>
            expectParseError({ actions: { define: { x: { wait: { mutation: { childList: true }, timeoutMs: 1 } } } } }, 'needs `target`'));
        it('takes `timeoutMs: null`', () =>
            expect(() =>
                createInstance({ g: { d: { actions: { define: { x: { wait: { event: 'click', timeoutMs: null } } } } } } }),
            ).not.toThrow());
        it('is rejected under `any`', () =>
            expectParseError({ actions: { define: { x: { any: [{ wait: { event: 'click', timeoutMs: 1 } }] } } } }, 'suspends the run'));
        it('is rejected in `match`', () =>
            expectParseError({ match: { wait: { event: 'click', timeoutMs: 1 } }, actions: REPORT }, 'suspends the run'));
        it('takes `whenBusy` of "queue", "interrupt" or "skip" on an `on` body', () =>
            expectParseError(
                { triggers: { observe: { state: 'enabled', on: [{ event: 'click', whenBusy: 'later' }] } }, actions: REPORT },
                '`whenBusy`',
            ));
    });
});
