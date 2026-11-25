import WebDetection from '../../src/features/web-detection.js';
import { bound, expectParseError, inTopFrame, instanceArgs } from './support.js';

describe('The object operator', () => {
    it('gives an object with a field per key, in value position', () => {
        expect(bound({}, { define: { x: { object: { a: 1, b: { sum: [1, 2] } } } } }, 'x')).toEqual({ a: 1, b: 3 });
    });

    it('defines `__proto__` as a field like any other', () => {
        const value = /** @type {Record<string, unknown>} */ (bound({}, { define: { x: { object: { ['__proto__']: 1 } } } }, 'x'));
        expect(Object.getOwnPropertyDescriptor(value, '__proto__')?.value).toBe(1);
        expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    });

    it('gives a list field as an array of its items', () => {
        expect(bound({}, { define: { x: { object: { a: { expr: [1, 2] } } } } }, 'x')).toEqual({ a: [1, 2] });
    });

    it('reads fields through `using`', () => {
        expect(bound({}, { define: { x: { object: { a: { object: { b: 4 } } }, using: 'a.b' } } }, 'x')).toBe(4);
    });

    it('takes an object of fields', () => expectParseError({ actions: { define: { x: { object: [1] } } } }, '`object` takes an object'));
});

describe('Detector events', () => {
    inTopFrame();

    beforeEach(() => {
        spyOn(WebDetection.prototype, 'callFeatureMethod').and.resolveTo(undefined);
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    /**
     * An instance over the detectors of group `g`, with `detectorEventMaxDepth` set.
     *
     * @param {Record<string, unknown>} detectors
     * @param {number} [maxDepth]
     */
    function create(detectors, maxDepth = 4) {
        const args = instanceArgs({ g: detectors });
        args.featureSettings = { webDetection: { detectors: { g: detectors }, detectorEventMaxDepth: maxDepth } };
        const instance = new WebDetection('webDetection', undefined, {}, args);
        instance.init();
        return instance;
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

    const OFF = { breakageReport: { state: 'disabled' } };
    /** Runs at 10 ms, once */
    const at10 = (/** @type {unknown} */ actions) => ({
        triggers: { ...OFF, auto: { state: 'enabled', when: { intervalMs: [10] } } },
        actions,
    });
    /** Runs on each `name` event */
    const on = (/** @type {string} */ name, /** @type {unknown} */ actions, /** @type {Record<string, unknown>} */ body = {}) => ({
        triggers: { ...OFF, observe: { state: 'enabled', on: [{ detectorEvent: name, ...body }] } },
        actions,
    });
    const fire = (/** @type {string} */ type, /** @type {unknown} */ value) => ({ fireEvent: { type, data: { v: { value } } } });
    const triggerData = (/** @type {string} */ name) => ({
        trigger: { detectorEvent: name, field: 'data' },
        using: { path: 'at', args: [0] },
    });

    it('run their observers in the emitting task, once the emitting run ends, with the item', () => {
        const instance = create({
            a: at10([{ emit: { name: 'ping', data: { object: { n: 1 } } } }, { fireEvent: { type: 'emitted' } }]),
            b: on('ping', fire('pinged', { expr: triggerData('ping'), using: 'n' })),
        });
        jasmine.clock().tick(10);
        expect(sent(instance)).toEqual([{ type: 'emitted' }, { type: 'pinged', data: { v: 1 } }]);
    });

    it('give the emitting detector and the event name', () => {
        const instance = create({
            a: at10({ emit: { name: 'ping' } }),
            b: on('ping', {
                fireEvent: {
                    type: 'from',
                    data: {
                        detector: { value: { trigger: { detectorEvent: 'ping', field: 'detector' }, using: { path: 'at', args: [0] } } },
                        name: { value: { trigger: { detectorEvent: 'ping', field: 'name' }, using: { path: 'at', args: [0] } } },
                    },
                },
            }),
        });
        jasmine.clock().tick(10);
        expect(sent(instance)).toEqual([{ type: 'from', data: { detector: 'g.a', name: 'ping' } }]);
    });

    it('run observers with `delayMs` on a timer', () => {
        const instance = create({ a: at10({ emit: { name: 'ping' } }), b: on('ping', { fireEvent: { type: 'later' } }, { delayMs: 50 }) });
        jasmine.clock().tick(10);
        expect(sent(instance)).toEqual([]);
        jasmine.clock().tick(50);
        expect(sent(instance)).toEqual([{ type: 'later' }]);
    });

    it('start no runs in the emitting task past `detectorEventMaxDepth`, and still start runs with `delayMs`', () => {
        const instance = create(
            {
                a: at10({ emit: { name: 'one' } }),
                b: on('one', [{ fireEvent: { type: 'b' } }, { emit: { name: 'two' } }]),
                c: on('two', { fireEvent: { type: 'c' } }),
                d: on('two', { fireEvent: { type: 'd' } }, { delayMs: 5 }),
            },
            1,
        );
        jasmine.clock().tick(10);
        expect(sent(instance).map(({ type }) => type)).toEqual(['b']);
        jasmine.clock().tick(5);
        expect(sent(instance).map(({ type }) => type)).toEqual(['b', 'd']);
    });

    it('start no runs in the emitting task without `detectorEventMaxDepth`', () => {
        const instance = create({ a: at10({ emit: { name: 'ping' } }), b: on('ping', { fireEvent: { type: 'b' } }) }, 0);
        jasmine.clock().tick(10);
        expect(sent(instance)).toEqual([]);
    });

    it('are read from the log by `observed`', () => {
        const instance = create({
            a: { triggers: { ...OFF, auto: { state: 'enabled', when: { intervalMs: [10, 20] } } }, actions: { emit: { name: 'tick' } } },
            b: {
                triggers: { ...OFF, auto: { state: 'enabled', when: { intervalMs: [30] } } },
                actions: fire('ticks', { observed: { detectorEvent: 'tick', keep: null }, using: 'length' }),
            },
        });
        jasmine.clock().tick(30);
        expect(sent(instance)).toEqual([{ type: 'ticks', data: { v: 2 } }]);
    });

    it('answer a request in the same task: the callee runs once the caller suspends, and the caller resumes on its reply', () => {
        const instance = create({
            caller: at10([
                { emit: { name: 'request', data: { object: { n: 2 } } } },
                {
                    define: {
                        reply: { wait: { detectorEvent: 'reply', where: { 'data.to': 'g.caller' }, field: 'data.value', timeoutMs: 500 } },
                    },
                },
                fire('answered', { ref: 'reply' }),
            ]),
            callee: on('request', [
                { define: { request: { trigger: { detectorEvent: 'request' }, using: { path: 'at', args: [0] } } } },
                {
                    emit: {
                        name: 'reply',
                        data: {
                            object: {
                                to: { ref: 'request', using: 'detector' },
                                value: { mul: [{ ref: 'request', using: 'data.n' }, 10] },
                            },
                        },
                    },
                },
            ]),
        });
        jasmine.clock().tick(10);
        expect(sent(instance)).toEqual([{ type: 'answered', data: { v: 20 } }]);
    });

    it('time a request and its reply as one dispatch: the caller, the callee, and the caller resuming', () => {
        const detectors = {
            caller: at10([{ emit: { name: 'request' } }, { define: { reply: { wait: { detectorEvent: 'reply', timeoutMs: 500 } } } }]),
            callee: on('request', { emit: { name: 'reply' } }),
        };
        const args = instanceArgs({ g: detectors });
        args.featureSettings = { webDetection: { detectors: { g: detectors }, detectorEventMaxDepth: 4 }, detectorPerf: {} };
        const instance = new WebDetection('webDetection', undefined, {}, args);
        instance.init();
        jasmine.clock().tick(10);
        const records = /** @type {jasmine.Spy} */ (instance.callFeatureMethod).calls
            .allArgs()
            .filter((call) => call[1] === 'record')
            .map((call) => ({ detector: call[4], dispatch: call[6], slice: call[7] }));
        expect(records.map(({ detector, slice }) => [detector, slice])).toEqual([
            ['g.caller', 'start'],
            ['g.callee', 'start'],
            ['g.caller', 'continue'],
        ]);
        expect(new Set(records.map(({ dispatch }) => dispatch)).size).toBe(1);
    });

    it('record nothing for a name no detector reads', () => {
        const instance = create({ a: at10([{ emit: { name: 'unread' } }, { fireEvent: { type: 'ran' } }]) });
        jasmine.clock().tick(10);
        expect(sent(instance)).toEqual([{ type: 'ran' }]);
    });

    it('take a name', () => {
        expectParseError({ actions: { emit: { name: '1bad' } } }, '`name` takes a name');
        expectParseError({ actions: { emit: { name: 'ok', to: 'x' } } }, "unknown key 'to'");
        expectParseError(
            { actions: { define: { x: { observed: { detectorEvent: 'x', target: { api: 'window' }, keep: null } } } } },
            '`event` bodies only',
        );
    });
});
