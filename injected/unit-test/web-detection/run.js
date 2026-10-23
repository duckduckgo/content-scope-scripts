import { aborting, counter, detector, erroring, expectParseError, makeGlobal } from './support.js';
import { thrownMessage } from '../../src/features/web-detection/model/core.js';

describe('WebDetection run', () => {
    describe('actions', () => {
        it('runs a sequence in order', () => {
            const d = detector({ actions: [{ fireEvent: { type: 'a' } }, { fireEvent: { type: 'b' } }] });
            const run = d.run();
            expect(run.actions).toEqual({ 'actions.0.fireEvent': 'ran', 'actions.1.fireEvent': 'ran' });
            expect(d.types()).toEqual(['a', 'b']);
        });

        it('runs several action keys in one object in config order', () => {
            const d = detector({ actions: { fireEvent: { type: 'a' }, breakageReportData: {}, define: { x: 1 } } });
            const run = d.run();
            expect(Object.keys(run.actions)).toEqual(['actions.fireEvent', 'actions.breakageReportData', 'actions.define.x']);
            expect(d.types()).toEqual(['a']);
            expect(d.entry()).toEqual({ detectorId: 'g.d' });
            expect(run.ctx.runNames.get('x')).toBe(1);
        });

        it('binds the names of one `define` in order, so a later value reads an earlier name', () => {
            const d = detector({ actions: { define: { a: 1, b: { sum: [{ ref: 'a' }, 1] } } } });
            expect(d.run().ctx.runNames.get('b')).toBe(2);
        });

        it('sends the payload computed when the action runs', () => {
            const global = makeGlobal();
            global.page.live.n = 4;
            const d = detector({ actions: { fireEvent: { type: 'a', data: { n: { value: { api: 'page.live.n' } } } } } }, global);
            d.run();
            expect(d.events).toEqual([{ type: 'a', data: { n: 4 } }]);
        });

        it('gives `undefined` for an action in value position, and rejects one in boolean and number position', () => {
            const d = detector({ actions: [{ define: { x: { expr: { define: { y: 1 } } } } }] });
            const run = d.run();
            expect(run.ctx.runNames.has('x')).toBe(true);
            expect(run.ctx.runNames.get('x')).toBeUndefined();
            expect(run.ctx.runNames.get('y')).toBe(1);
            expectParseError(
                { match: { fireEvent: { type: 'a' } }, actions: { breakageReportData: {} } },
                "'fireEvent' does not fill boolean position",
            );
            expectParseError({ actions: { define: { x: { sum: [{ define: { y: 1 } }] } } } }, "'define' does not fill number position");
        });
    });

    describe('match', () => {
        it('runs `actions` once when `match` holds, and the detector is done', () => {
            const global = makeGlobal();
            const d = detector({ match: { api: 'page.live.ready' }, actions: { fireEvent: { type: 'a' } } }, global);
            expect(d.run().match).toBe(false);
            expect(d.state.done).toBe(false);
            expect(d.types()).toEqual([]);

            global.page.live.ready = true;
            const run = d.run();
            expect(run.match).toBe(true);
            expect(d.state.done).toBe(true);
            expect(d.types()).toEqual(['a']);
        });

        it('runs `actions` on every run without `match`, and is never done', () => {
            const d = detector({ actions: { fireEvent: { type: 'a' } } });
            d.run();
            const run = d.run();
            expect(run.match).toBeUndefined();
            expect(d.types()).toEqual(['a', 'a']);
            expect(d.state.done).toBe(false);
        });

        it('records an aborted `match` under its path, runs no actions, and runs again', () => {
            const global = makeGlobal();
            const d = detector({ match: { all: [true, aborting] }, actions: { breakageReportData: {} } }, global);
            const run = d.run();
            expect(run.match).toBe('aborted');
            expect(run.failedAt).toBe('match.all.1.api');
            expect(run.abortError).toBe('TypeError');
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'match.all.1.api': 'aborted' } });
            expect(d.state.done).toBe(false);

            global.page.live.throws = false;
            expect(d.run().match).toBe(true);
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true, errors: { 'match.all.1.api': 'aborted' } });
        });

        it('records an erroring `match` under the path of the expression that erred', () => {
            const d = detector({ match: { if: erroring, then: true, else: false }, actions: { breakageReportData: {} } });
            const run = d.run();
            expect(run.match).toBe('error');
            expect(run.failedAt).toBe('match.if.api');
            expect(run.error).toContain('expected a boolean');
            expect(d.state.done).toBe(false);
        });

        it('is done after a failing action once `match` has held', () => {
            const d = detector({ match: true, actions: [{ fireEvent: { type: 'a' } }, { define: { x: { api: 'page.live.bad' } } }] });
            const run = d.run();
            expect(run.failedAt).toBe('actions.1.define.x.api');
            expect(d.state.done).toBe(true);
            expect(d.types()).toEqual(['a']);
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
            const { ctx } = d.run();
            expect(ctx.runNames.get('before')).toBe(true);
            expect(ctx.runNames.get('after')).toBe(1);
        });

        it('rebinds a name, the latest binding winning', () => {
            const d = detector({ actions: [{ define: { x: 1 } }, { define: { y: { ref: 'x' } } }, { define: { x: 2 } }] });
            const { ctx } = d.run();
            expect(ctx.runNames.get('x')).toBe(2);
            expect(ctx.runNames.get('y')).toBe(1);
        });

        it('reads a run name `undefined` in the next run', () => {
            const d = detector({ actions: [{ define: { seen: { ref: 'x', is: { type: 'undefined' } } } }, { define: { x: 1 } }] });
            d.run();
            expect(d.run().ctx.runNames.get('seen')).toBe(true);
        });

        it('keeps a detector name across runs, and counts up', () => {
            const d = detector({ actions: { define: { 'this.count': counter } } });
            d.run();
            d.run();
            d.run();
            expect(d.state.names.get('this.count')).toBe(3);
        });

        it('binds the boolean an `is` gives, not the value it tests', () => {
            const global = makeGlobal();
            const d = detector({ actions: { define: { 'this.seen': { api: 'page.live.n', is: { gt: 0 } } } } }, global);
            d.run();
            expect(d.state.names.get('this.seen')).toBe(false);
            global.page.live.n = 3;
            d.run();
            expect(d.state.names.get('this.seen')).toBe(true);
        });

        it('binds a list, which `in` reads in a later run', () => {
            const global = makeGlobal();
            const d = detector(
                {
                    actions: [
                        { if: { api: 'page.live.label', is: { in: { ref: 'this.seen' } } }, then: { fireEvent: { type: 'seen' } } },
                        { define: { 'this.seen': { expr: ['y', 'z'] } } },
                    ],
                },
                global,
            );
            d.run();
            expect(d.state.names.get('this.seen')).toEqual(['y', 'z']);
            global.page.live.label = 'z';
            d.run();
            expect(d.types()).toEqual(['seen']);
        });

        it('binds a selected list once, so every `ref` reads the same items, and the leaf as a boolean', () => {
            const global = { page: { live: { list: [{ ok: true }, { ok: false }] } } };
            const d = detector(
                {
                    actions: [
                        { define: { oks: { api: { path: 'page.live.list', where: { ok: true } } } } },
                        { define: { count: { ref: 'oks', using: 'length' } } },
                    ],
                },
                global,
            );
            expect(d.run().ctx.runNames.get('count')).toBe(1);
        });

        it('ends the run on a failed value, leaving the name with its earlier binding', () => {
            const global = makeGlobal();
            global.page.live.throws = false;
            const d = detector({ actions: [{ define: { 'this.x': { api: 'page.live.bad' } } }, { fireEvent: { type: 'after' } }] }, global);
            d.run();
            expect(d.state.names.get('this.x')).toBe(1);

            global.page.live.throws = true;
            const run = d.run();
            expect(run.actions['actions.0.define.this.x']).toBe('aborted');
            expect(run.failedAt).toBe('actions.0.define.this.x.api');
            expect(d.state.names.get('this.x')).toBe(1);
            expect(d.types()).toEqual(['after']);
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'actions.0.define.this.x.api': 'aborted' } });
        });

        it('sends an event once beside a measurement refreshed on every run', () => {
            const global = makeGlobal();
            const d = detector(
                {
                    actions: [
                        { breakageReportData: { data: { n: { value: { api: 'page.live.n' } } } } },
                        {
                            if: { none: [{ ref: 'this.sent', is: true }] },
                            then: { fireEvent: { type: 'measured' }, define: { 'this.sent': true } },
                        },
                    ],
                },
                global,
            );
            d.run();
            global.page.live.n = 7;
            d.run();
            expect(d.types()).toEqual(['measured']);
            expect(d.entry()).toEqual({ detectorId: 'g.d', data: { n: 7 } });
            expect(d.state.done).toBe(false);
        });

        it('stops reading once `this.finished` is bound', () => {
            const global = makeGlobal();
            const d = detector(
                {
                    actions: {
                        if: { none: [{ ref: 'this.finished', is: true }] },
                        then: [{ define: { n: { api: 'page.live.n' } } }, { define: { 'this.finished': { ref: 'n', is: { gt: 0 } } } }],
                    },
                },
                global,
            );
            d.run();
            global.page.live.n = 1;
            d.run();
            global.page.live.throws = true;
            const run = d.run();
            expect(run.actions).toEqual({});
            expect(d.state.names.get('this.finished')).toBe(true);
        });
    });

    describe('if', () => {
        it('evaluates the branch the condition takes only', () => {
            const d = detector({
                actions: { if: true, then: { fireEvent: { type: 'a' } }, else: { define: { x: { api: 'page.live.bad' } } } },
            });
            const run = d.run();
            expect(run.failedAt).toBeUndefined();
            expect(d.types()).toEqual(['a']);
        });

        it('gives `undefined` with no `else` and the condition false', () => {
            const d = detector({ actions: { define: { x: { if: false, then: 1 } } } });
            const { ctx } = d.run();
            expect(ctx.runNames.has('x')).toBe(true);
            expect(ctx.runNames.get('x')).toBeUndefined();
        });

        it('gives the last value of a sequence in a branch', () => {
            const d = detector({ actions: { define: { x: { if: true, then: [{ define: { y: 1 } }, 2] } } } });
            const { ctx } = d.run();
            expect(ctx.runNames.get('x')).toBe(2);
            expect(ctx.runNames.get('y')).toBe(1);
        });

        it('reads `undefined` for a name bound in the branch not taken, and a payload reading it omits its key', () => {
            const d = detector({
                actions: [{ if: false, then: { define: { x: 1 } } }, { fireEvent: { type: 'a', data: { x: { value: { ref: 'x' } } } } }],
            });
            d.run();
            expect(d.events).toEqual([{ type: 'a', data: {} }]);
        });

        it('fires one bucket from a nested chain', () => {
            const global = makeGlobal();
            global.page.live.n = 5;
            const d = detector(
                {
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
                },
                global,
            );
            d.run();
            expect(d.types()).toEqual(['mid']);
        });

        it('passes a failure in the condition up, taking no branch', () => {
            const d = detector({ actions: { if: aborting, then: { fireEvent: { type: 'a' } }, else: { fireEvent: { type: 'b' } } } });
            expect(d.run().failedAt).toBe('actions.if.api');
            expect(d.types()).toEqual([]);
        });

        it('rejects `then` or `else` without `if`, `if` without `then`, and `if` without `else` outside value position', () => {
            expectParseError({ actions: { then: { fireEvent: { type: 'a' } } } }, "'then' sits beside 'if' only");
            expectParseError({ actions: { api: 'x', else: 1 } }, "'else' sits beside 'if' only");
            expectParseError({ actions: { if: true } }, "'if' needs 'then'");
            expectParseError({ actions: { if: true, then: 1, api: 'x' } }, "'if' takes no other expression key");
            expectParseError(
                { match: { if: true, then: true }, actions: { breakageReportData: {} } },
                "'if' does not fill boolean position",
            );
            expectParseError({ actions: { define: { x: { sum: [{ if: true, then: 1 }] } } } }, "'if' does not fill number position");
        });
    });

    describe('failures', () => {
        it('ends the run at a failing element, keeping what earlier elements did', () => {
            const d = detector({
                actions: [{ fireEvent: { type: 'a' } }, { if: aborting, then: { fireEvent: { type: 'b' } } }, { fireEvent: { type: 'c' } }],
            });
            const run = d.run();
            expect(run.actions).toEqual({ 'actions.0.fireEvent': 'ran' });
            expect(run.failedAt).toBe('actions.1.if.api');
            expect(run.abortError).toBe('TypeError');
            expect(d.types()).toEqual(['a']);
        });

        it('sends and writes nothing for an action whose payload value fails', () => {
            const d = detector({
                actions: {
                    breakageReportData: {},
                    fireEvent: { type: 'a', data: { x: { value: { api: 'page.live.bad' } } } },
                    define: { seen: true },
                },
            });
            const run = d.run();
            expect(run.actions).toEqual({ 'actions.breakageReportData': 'ran', 'actions.fireEvent': 'aborted' });
            expect(run.failedAt).toBe('actions.fireEvent.data.x.value.api');
            expect(d.types()).toEqual([]);
            expect(run.ctx.runNames.has('seen')).toBe(false);
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'actions.fireEvent.data.x.value.api': 'aborted' } });
        });

        it('sends a payload whose failed value a `when` testing `fails` handles', () => {
            const d = detector({
                actions: { fireEvent: { type: 'a', data: { x: { value: { api: 'page.live.bad' }, when: { fails: false } } } } },
            });
            expect(d.run().actions).toEqual({ 'actions.fireEvent': 'ran' });
            expect(d.events).toEqual([{ type: 'a', data: {} }]);
            expect(d.entry()).toBeUndefined();
        });

        it('records an error in a payload as `error` under the path of the expression that erred', () => {
            const d = detector({ actions: { fireEvent: { type: 'a', data: { x: { value: { div: [1, { api: 'page.live.label' }] } } } } } });
            const run = d.run();
            expect(run.actions).toEqual({ 'actions.fireEvent': 'error' });
            expect(run.failedAt).toBe('actions.fireEvent.data.x.value.div.1.api');
            expect(d.entry()?.errors).toEqual({ 'actions.fireEvent.data.x.value.div.1.api': 'error' });
        });

        it('keys a failed `when` and bucket by their paths', () => {
            const failing = { field: { api: 'page.live.bad' }, is: 1 };
            const when = detector({ actions: { fireEvent: { type: 'a', data: { x: { value: 1, when: failing } } } } });
            expect(when.run().failedAt).toBe('actions.fireEvent.data.x.when.field.api');
            const bucket = detector({ actions: { fireEvent: { type: 'a', data: { x: { value: 1, buckets: { one: failing } } } } } });
            expect(bucket.run().failedAt).toBe('actions.fireEvent.data.x.buckets.one.field.api');
        });

        it('keys a failure inside `where` by the key that failed', () => {
            const global = {
                page: {
                    live: {
                        items: [
                            {
                                get bad() {
                                    throw new TypeError('x');
                                },
                            },
                        ],
                    },
                },
            };
            const d = detector(
                { actions: { define: { n: { api: { path: 'page.live.items', where: { bad: 1 } }, using: 'length' } } } },
                global,
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
            const d = detector({ actions: { if: false, then: { breakageReportData: {} } } });
            d.run();
            expect(d.entry()).toBeUndefined();
        });

        it('writes a bare entry from `{}`, with no `detected` when there is no `match`', () => {
            const d = detector({ actions: { breakageReportData: {} } });
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d' });
        });

        it('writes `detected: true` once `match` has held and `breakageReportData` has run', () => {
            const d = detector({ match: true, actions: { breakageReportData: {} } });
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', detected: true });
        });

        it('has no entry when `match` holds and no `breakageReportData` action runs', () => {
            const d = detector({ match: true, actions: { fireEvent: { type: 'a' } } });
            d.run();
            expect(d.types()).toEqual(['a']);
            expect(d.entry()).toBeUndefined();
        });

        it('is not `detected` when `match` holds and the run fails before `breakageReportData`', () => {
            const d = detector({ match: true, actions: [{ if: aborting, then: 1 }, { breakageReportData: {} }] });
            d.run();
            expect(d.state.done).toBe(true);
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'actions.0.if.api': 'aborted' } });
        });

        it('merges `data` across writes, most recent per key, keeping a key a later write omits', () => {
            const global = makeGlobal();
            global.page.live.n = 1;
            const d = detector(
                {
                    actions: {
                        breakageReportData: {
                            data: { n: { value: { api: 'page.live.n' } }, small: { value: { api: 'page.live.n' }, when: { lt: 3 } } },
                        },
                    },
                },
                global,
            );
            d.run();
            global.page.live.n = 5;
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', data: { n: 5, small: 1 } });
        });

        it('records the failure that ended the run, and keeps it after a clean run', () => {
            const global = makeGlobal();
            const d = detector({ actions: [{ if: aborting, then: 1 }, { breakageReportData: {} }] }, global);
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'actions.0.if.api': 'aborted' } });
            global.page.live.throws = false;
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'actions.0.if.api': 'aborted' } });
        });

        it('records only the failure that ended the run', () => {
            const d = detector({
                actions: [
                    { if: erroring, then: 1 },
                    { if: aborting, then: 1 },
                ],
            });
            d.run();
            expect(d.entry()).toEqual({ detectorId: 'g.d', errors: { 'actions.0.if.api': 'error' } });
        });
    });
});
