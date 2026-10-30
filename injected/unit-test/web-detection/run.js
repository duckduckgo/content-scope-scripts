import {
    REPORT,
    aborting,
    bindings,
    counter,
    defineGetter,
    detector,
    erroring,
    expectParseError,
    expectRun,
    fires,
    rejectsMatch,
    throwing,
} from './support.js';
import { thrownMessage } from '../../src/features/web-detection/model/core.js';

describe('WebDetection run', () => {
    describe('actions', () => {
        it('runs a sequence in order', () => {
            const d = detector({ actions: [{ fireEvent: { type: 'a' } }, { fireEvent: { type: 'b' } }] });
            expectRun(d.run(), { actions: { 'actions.0.fireEvent': 'ran', 'actions.1.fireEvent': 'ran' }, types: ['a', 'b'] });
        });

        it('runs several action keys in one object in config order', () => {
            const run = detector({ actions: { fireEvent: { type: 'a' }, breakageReportData: {}, define: { x: 1 } } }).run();
            expect(Object.keys(run.actions)).toEqual(['actions.fireEvent', 'actions.breakageReportData', 'actions.define.x']);
            expectRun(run, { types: ['a'], entry: { detectorId: 'g.d' } });
            expect(bindings(run)).toEqual({ x: 1 });
        });

        it('binds the names of one `define` in order, so a later value reads an earlier name', () => {
            expect(bindings(detector({ actions: { define: { a: 1, b: { sum: [{ ref: 'a' }, 1] } } } }).run())).toEqual({ a: 1, b: 2 });
        });

        it('sends the payload computed when the action runs', () => {
            const d = detector({ actions: fires({ n: { value: { api: 'page.live.n' } } }) });
            d.run({ n: 4 });
            expect(d.events).toEqual([{ type: 't', data: { n: 4 } }]);
        });

        it('gives `undefined` for an action in value position, and rejects one in boolean and number position', () => {
            const d = detector({ actions: [{ define: { x: { expr: { define: { y: 1 } } } } }] });
            expect(bindings(d.run())).toEqual({ x: undefined, y: 1 });
            rejectsMatch({ fireEvent: { type: 'a' } }, "'fireEvent' does not fill boolean position");
            expectParseError({ actions: { define: { x: { sum: [{ define: { y: 1 } }] } } } }, "'define' does not fill number position");
        });
    });

    describe('match', () => {
        it('runs `actions` once when `match` holds, and the detector is done', () => {
            const d = detector({ match: { api: 'page.live.ready' }, actions: { fireEvent: { type: 'a' } } });
            expectRun(d.run(), { match: false, done: false, types: [] });
            expectRun(d.run({ ready: true }), { match: true, done: true, types: ['a'] });
        });

        it('runs `actions` on every run without `match`, and is never done', () => {
            const d = detector({ actions: { fireEvent: { type: 'a' } } });
            d.run();
            const run = d.run();
            expect(run.match).toBeUndefined();
            expectRun(run, { types: ['a', 'a'], done: false });
        });

        it('records an aborted `match` under its path, runs no actions, and runs again', () => {
            const d = detector({ match: { all: [true, aborting] }, actions: REPORT });
            const errors = { 'match.all.1.api': 'aborted' };
            expectRun(d.run(), {
                match: 'aborted',
                failedAt: 'match.all.1.api',
                abortError: 'TypeError',
                done: false,
                entry: { detectorId: 'g.d', errors },
            });
            expectRun(d.run({ throws: false }), { match: true, entry: { detectorId: 'g.d', detected: true, errors } });
        });

        it('records an erroring `match` under the path of the expression that erred', () => {
            const run = detector({ match: { if: erroring, then: true, else: false }, actions: REPORT }).run();
            expectRun(run, { match: 'error', failedAt: 'match.if.api', done: false });
            expect(run.error).toContain('expected a boolean');
        });

        it('is done after a failing action once `match` has held, and not `detected` without `breakageReportData` running', () => {
            const d = detector({
                match: true,
                actions: [{ fireEvent: { type: 'a' } }, { define: { x: { api: 'page.live.bad' } } }, REPORT],
            });
            const errors = { 'actions.1.define.x.api': 'aborted' };
            expectRun(d.run(), { failedAt: 'actions.1.define.x.api', done: true, types: ['a'], entry: { detectorId: 'g.d', errors } });
        });
    });

    describe('names', () => {
        it('reads `undefined` for a run name before its `define`, and the binding at the time of the read after', () => {
            const d = detector({
                actions: [
                    { define: { before: { ref: 'x', is: { type: 'undefined' } } } },
                    { define: { x: 1 } },
                    { define: { after: { ref: 'x' } } },
                ],
            });
            expect(bindings(d.run())).toEqual({ before: true, x: 1, after: 1 });
        });

        it('rebinds a name, the latest binding winning', () => {
            const d = detector({ actions: [{ define: { x: 1 } }, { define: { y: { ref: 'x' } } }, { define: { x: 2 } }] });
            expect(bindings(d.run())).toEqual({ x: 2, y: 1 });
        });

        it('reads a run name `undefined` in the next run', () => {
            const d = detector({ actions: [{ define: { seen: { ref: 'x', is: { type: 'undefined' } } } }, { define: { x: 1 } }] });
            d.run();
            expect(d.run().names.get('seen')).toBe(true);
        });

        it('keeps a detector name across runs, and counts up', () => {
            const d = detector({ actions: { define: { 'this.count': counter } } });
            d.run();
            d.run();
            d.run();
            expect(d.state.names.get('this.count')).toBe(3);
        });

        it('binds the boolean an `is` gives, not the value it tests', () => {
            const d = detector({ actions: { define: { 'this.seen': { api: 'page.live.n', is: { gt: 0 } } } } });
            d.run();
            expect(d.state.names.get('this.seen')).toBe(false);
            d.run({ n: 3 });
            expect(d.state.names.get('this.seen')).toBe(true);
        });

        it('binds a list, which `in` reads in a later run', () => {
            const d = detector({
                actions: [
                    { if: { api: 'page.live.label', is: { in: { ref: 'this.seen' } } }, then: { fireEvent: { type: 'seen' } } },
                    { define: { 'this.seen': { expr: ['y', 'z'] } } },
                ],
            });
            d.run();
            expect(d.state.names.get('this.seen')).toEqual(['y', 'z']);
            expect(d.run({ label: 'z' }).types).toEqual(['seen']);
        });

        it('ends the run on a failed value, leaving the name with its earlier binding', () => {
            const d = detector({ actions: [{ define: { 'this.x': { api: 'page.live.bad' } } }, { fireEvent: { type: 'after' } }] });
            d.run({ throws: false });
            expect(d.state.names.get('this.x')).toBe(1);

            const run = d.run({ throws: true });
            const errors = { 'actions.0.define.this.x.api': 'aborted' };
            expect(run.actions['actions.0.define.this.x']).toBe('aborted');
            expectRun(run, { failedAt: 'actions.0.define.this.x.api', types: ['after'], entry: { detectorId: 'g.d', errors } });
            expect(d.state.names.get('this.x')).toBe(1);
        });

        it('sends an event once beside a measurement refreshed on every run', () => {
            const d = detector({
                actions: [
                    { breakageReportData: { data: { n: { value: { api: 'page.live.n' } } } } },
                    {
                        if: { none: [{ ref: 'this.sent', is: true }] },
                        then: { fireEvent: { type: 'measured' }, define: { 'this.sent': true } },
                    },
                ],
            });
            d.run();
            expectRun(d.run({ n: 7 }), { types: ['measured'], entry: { detectorId: 'g.d', data: { n: 7 } }, done: false });
        });

        it('stops reading once `this.finished` is bound', () => {
            const d = detector({
                actions: {
                    if: { none: [{ ref: 'this.finished', is: true }] },
                    then: [{ define: { n: { api: 'page.live.n' } } }, { define: { 'this.finished': { ref: 'n', is: { gt: 0 } } } }],
                },
            });
            d.run();
            d.run({ n: 1 });
            expect(d.run({ throws: true }).actions).toEqual({});
            expect(d.state.names.get('this.finished')).toBe(true);
        });
    });

    describe('if', () => {
        it('gives `undefined` with no `else` and the condition false', () => {
            expect(bindings(detector({ actions: { define: { x: { if: false, then: 1 } } } }).run())).toEqual({ x: undefined });
        });

        it('binds a name in the branch taken, and reads `undefined` for one in the branch not taken, whose payload key is omitted', () => {
            const d = detector({
                actions: [
                    { if: false, then: { define: { x: 1 } }, else: { define: { y: 2 } } },
                    fires({ x: { value: { ref: 'x' } }, y: { value: { ref: 'y' } } }),
                ],
            });
            d.run();
            expect(d.events).toEqual([{ type: 't', data: { y: 2 } }]);
        });

        it('fires one bucket from a nested chain', () => {
            const d = detector({
                actions: [
                    { define: { n: { api: 'page.live.n' } } },
                    {
                        if: { ref: 'n', is: { lt: 3 } },
                        then: { fireEvent: { type: 'fast' } },
                        else: {
                            if: { ref: 'n', is: { lt: 8 } },
                            then: { fireEvent: { type: 'mid' } },
                            else: { fireEvent: { type: 'slow' } },
                        },
                    },
                ],
            });
            expect(d.run({ n: 5 }).types).toEqual(['mid']);
        });

        it('passes a failure in the condition up, taking no branch', () => {
            const d = detector({ actions: { if: aborting, then: { fireEvent: { type: 'a' } }, else: { fireEvent: { type: 'b' } } } });
            expectRun(d.run(), { failedAt: 'actions.if.api', types: [] });
        });

        it('rejects `then` or `else` without `if`, `if` without `then`, and `if` without `else` outside value position', () => {
            expectParseError({ actions: { then: { fireEvent: { type: 'a' } } } }, "'then' sits beside 'if' only");
            expectParseError({ actions: { api: 'x', else: 1 } }, "'else' sits beside 'if' only");
            expectParseError({ actions: { if: true } }, "'if' needs 'then'");
            expectParseError({ actions: { if: true, then: 1, api: 'x' } }, "'if' takes no other expression key");
            rejectsMatch({ if: true, then: true }, "'if' does not fill boolean position");
            expectParseError({ actions: { define: { x: { sum: [{ if: true, then: 1 }] } } } }, "'if' does not fill number position");
        });
    });

    describe('failures', () => {
        it('ends the run at a failing element, keeping what earlier elements did', () => {
            const d = detector({
                actions: [{ fireEvent: { type: 'a' } }, { if: aborting, then: { fireEvent: { type: 'b' } } }, { fireEvent: { type: 'c' } }],
            });
            expectRun(d.run(), {
                actions: { 'actions.0.fireEvent': 'ran' },
                failedAt: 'actions.1.if.api',
                abortError: 'TypeError',
                types: ['a'],
            });
        });

        it('sends and writes nothing for an action whose payload value fails', () => {
            const run = detector({
                actions: { breakageReportData: {}, ...fires({ x: { value: { api: 'page.live.bad' } } }), define: { seen: true } },
            }).run();
            const path = 'actions.fireEvent.data.x.value.api';
            expectRun(run, {
                actions: { 'actions.breakageReportData': 'ran', 'actions.fireEvent': 'aborted' },
                failedAt: path,
                types: [],
                entry: { detectorId: 'g.d', errors: { [path]: 'aborted' } },
            });
            expect(run.names.has('seen')).toBe(false);
        });

        it('sends a payload whose failed value a `when` testing `fails` handles', () => {
            const d = detector({ actions: fires({ x: { value: { api: 'page.live.bad' }, when: { fails: false } } }) });
            expectRun(d.run(), { actions: { 'actions.fireEvent': 'ran' }, entry: undefined });
            expect(d.events).toEqual([{ type: 't', data: {} }]);
        });

        it('records an error in a payload as `error` under the path of the expression that erred', () => {
            const run = detector({ actions: fires({ x: { value: { div: [1, { api: 'page.live.label' }] } } }) }).run();
            const path = 'actions.fireEvent.data.x.value.div.1.api';
            expectRun(run, { actions: { 'actions.fireEvent': 'error' }, failedAt: path });
            expect(run.entry?.errors).toEqual({ [path]: 'error' });
        });

        it('keys a failed `when` and bucket by their paths', () => {
            const failing = { field: { api: 'page.live.bad' }, is: 1 };
            expect(detector({ actions: fires({ x: { value: 1, when: failing } }) }).run().failedAt).toBe(
                'actions.fireEvent.data.x.when.field.api',
            );
            expect(detector({ actions: fires({ x: { value: 1, buckets: [{ name: 'one', is: failing }] } }) }).run().failedAt).toBe(
                'actions.fireEvent.data.x.buckets.0.is.field.api',
            );
        });

        it('keys a failure inside `where` by the key that failed', () => {
            const items = [defineGetter({}, 'bad', throwing(new TypeError('x')))];
            const d = detector(
                { actions: { define: { n: { api: { path: 'page.live.items', where: { bad: 1 } }, using: 'length' } } } },
                { page: { live: { items } } },
            );
            expect(d.run().failedAt).toBe('actions.define.n.api.where.bad');
        });
    });

    describe('thrownMessage', () => {
        it("gives an object's own string `message`, else its constructor's name", () => {
            expect(thrownMessage(new TypeError('boom'))).toBe('boom');
            expect(thrownMessage(new RangeError())).toBe('RangeError');
            expect(thrownMessage({ message: 3 })).toBe('Object');
        });

        it('gives a primitive as a string', () => {
            expect(thrownMessage('boom')).toBe('boom');
            expect(thrownMessage(null)).toBe('null');
            expect(thrownMessage(undefined)).toBe('undefined');
            expect(thrownMessage(Symbol('s'))).toBe('Symbol(s)');
        });

        it('calls no code of the thrown value', () => {
            const called = jasmine.createSpy('called').and.throwError('called');
            const getter = Object.create(Error.prototype, { message: { get: called } });
            const traps = new Proxy({}, { getOwnPropertyDescriptor: called, getPrototypeOf: called, get: called });
            expect(thrownMessage({ toString: called, [Symbol.toPrimitive]: called })).toBe('Object');
            expect(thrownMessage(getter)).toBe('Error');
            expect(thrownMessage(traps)).toBe('unknown');
            expect(called).toHaveBeenCalledTimes(2);
        });
    });

    describe('breakage entries', () => {
        it('has no entry before a `breakageReportData` action runs or a failure is recorded', () => {
            expect(detector({ actions: { if: false, then: REPORT } }).run().entry).toBeUndefined();
        });

        it('has no entry when `match` holds and no `breakageReportData` action runs', () => {
            expectRun(detector({ match: true, actions: { fireEvent: { type: 'a' } } }).run(), { types: ['a'], entry: undefined });
        });

        it('writes an object as it was when the action ran', () => {
            const d = detector({ actions: { breakageReportData: { data: { live: { value: { api: 'page.live' } } } } } });
            d.run({ throws: false });
            d.global.page.live.n = 5;
            expect(d.entry()).toEqual({ detectorId: 'g.d', data: { live: { n: 0, ready: false, label: 'x', throws: false, bad: 1 } } });
        });

        it('merges `data` across writes, most recent per key, keeping a key a later write omits', () => {
            const n = { api: 'page.live.n' };
            const d = detector({ actions: { breakageReportData: { data: { n: { value: n }, small: { value: n, when: { lt: 3 } } } } } });
            d.run({ n: 1 });
            expect(d.run({ n: 5 }).entry).toEqual({ detectorId: 'g.d', data: { n: 5, small: 1 } });
        });

        it('records only the failure that ended the run', () => {
            const d = detector({
                actions: [
                    { if: erroring, then: 1 },
                    { if: aborting, then: 1 },
                ],
            });
            expect(d.run().entry).toEqual({ detectorId: 'g.d', errors: { 'actions.0.if.api': 'error' } });
        });
    });
});
