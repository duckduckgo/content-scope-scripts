import { compileDetector } from '../../src/features/web-detection/compile/compile.js';
import { EvaluationContext } from '../../src/features/web-detection/evaluate/context.js';
import { createDetectorState, runDetector, runDetectorSteps } from '../../src/features/web-detection/evaluate/run.js';
import { ConfigParseError, Failure } from '../../src/features/web-detection/model/core.js';
import { pageSources } from '../../src/features/web-detection/sources/index.js';
import { readerFor } from './support.js';

/**
 * The page sources, with `api` replaced by a source that suspends the run on its path, and resumes
 * with the value passed to `next`.
 */
function suspendingSources() {
    const sources = pageSources({});
    return {
        ...sources,
        api: {
            ...sources.api,
            suspends: /** @type {true} */ (true),
            read: (/** @type {any[]} */ bodies) => ({ waitingOn: bodies[0].names.join('.') }),
        },
    };
}

/**
 * Compile a detector over the suspending sources, and start a run of it.
 *
 * @param {unknown} actions
 * @param {Record<string, unknown>} [rest]
 */
function start(actions, rest = {}) {
    const compiled = compileDetector(/** @type {any} */ ({ actions, ...rest }), /** @type {any} */ (suspendingSources()));
    const state = createDetectorState();
    /** @type {Array<{ type: string, data?: unknown }>} */
    const sent = [];
    const ctx = new EvaluationContext(readerFor({}, compiled), state.names, undefined, {
        fireEvent: (type, data) => sent.push({ type, ...(data && { data }) }),
        breakageReportData() {},
    });
    const steps = runDetectorSteps(compiled, state, ctx);
    return { compiled, state, ctx, steps, sent };
}

describe('Runs that suspend', () => {
    it('suspend at the source, and resume with the value passed to `next`', () => {
        const { steps, ctx } = start([{ define: { x: { api: 'a' } } }, { define: { y: { sum: [{ ref: 'x' }, 1] } } }]);
        expect(steps.next()).toEqual({ done: false, value: { waitingOn: 'a' } });
        const end = steps.next(4);
        expect(end.done).toBe(true);
        expect(ctx.runNames.get('x')).toBe(4);
        expect(ctx.runNames.get('y')).toBe(5);
    });

    it('suspend in each source they reach, in order', () => {
        const { steps, ctx } = start({ define: { x: { api: 'a' }, y: { api: 'b' } } });
        expect(steps.next().value).toEqual({ waitingOn: 'a' });
        expect(steps.next(1).value).toEqual({ waitingOn: 'b' });
        expect(steps.next(2).done).toBe(true);
        expect([ctx.runNames.get('x'), ctx.runNames.get('y')]).toEqual([1, 2]);
    });

    it('suspend in an `if` condition, and take the branch the resumed value gives', () => {
        const { steps, sent } = start({
            if: { api: 'a', is: true },
            then: { fireEvent: { type: 'yes' } },
            else: { fireEvent: { type: 'no' } },
        });
        steps.next();
        steps.next(false);
        expect(sent).toEqual([{ type: 'no' }]);
    });

    it('suspend in an `if` branch only when it is taken', () => {
        const { steps, ctx } = start({ if: false, then: { define: { x: { api: 'a' } } }, else: { define: { x: 1 } } });
        expect(steps.next()).toEqual(jasmine.objectContaining({ done: true }));
        expect(ctx.runNames.get('x')).toBe(1);
    });

    it('suspend in a payload value, sending once the run resumes', () => {
        const { steps, sent } = start({ fireEvent: { type: 't', data: { v: { value: { api: 'a' } }, w: { value: 2 } } } });
        steps.next();
        expect(sent).toEqual([]);
        steps.next(1);
        expect(sent).toEqual([{ type: 't', data: { v: 1, w: 2 } }]);
    });

    it('suspend beside `using`, and in a `done`', () => {
        const { steps, state } = start({ done: { api: 'a', using: 'length', is: { gt: 0 } } });
        steps.next();
        steps.next([1]);
        expect(state.done).toBe(true);
    });

    it('end with the failure a resumed value gives', () => {
        const { steps } = start([{ define: { x: { api: 'a' } } }, { fireEvent: { type: 't' } }]);
        steps.next();
        const end = steps.next(new Failure('TypeError'));
        expect(end.value).toEqual(jasmine.objectContaining({ failedAt: 'actions.0.define.x.api', failure: 'aborted' }));
    });

    it('end with the error thrown after resuming', () => {
        const { steps } = start([{ define: { x: { api: 'a' } } }, { define: { y: { sum: [{ ref: 'x' }] } } }]);
        steps.next();
        const end = steps.next('not a number');
        expect(end.value).toEqual(jasmine.objectContaining({ failedAt: 'actions.1.define.y.sum', failure: 'error' }));
    });

    it('keep run names bound before the suspension', () => {
        const { steps, ctx } = start([
            { define: { before: 1 } },
            { define: { x: { api: 'a' } } },
            { define: { after: { ref: 'before' } } },
        ]);
        steps.next();
        steps.next(0);
        expect(ctx.runNames.get('after')).toBe(1);
    });

    it('are marked from `actions` down to the source, and nowhere else', () => {
        const { compiled } = start([{ define: { x: 1 } }, { if: { api: 'a' }, then: { define: { y: 2 } } }]);
        const actions = /** @type {any} */ (compiled.actions);
        expect(actions.suspends).toBe(true);
        expect(actions.elements[0].suspends).toBeUndefined();
        expect(actions.elements[1].suspends).toBe(true);
    });

    it('are not started by a detector with no source that suspends, which ends in one step', () => {
        const compiled = compileDetector({ actions: { define: { x: 1 } } }, pageSources({}));
        expect(/** @type {any} */ (compiled.actions).suspends).toBeUndefined();
        const state = createDetectorState();
        const run = runDetector(compiled, state, new EvaluationContext(readerFor({}, compiled), state.names));
        expect(run.failure).toBeUndefined();
    });

    it('throw from `runDetector`, which has no scheduler to resume them', () => {
        const { compiled, state, ctx } = start({ define: { x: { api: 'a' } } });
        expect(() => runDetector(compiled, state, ctx)).toThrowError(/needs a scheduler/);
    });

    /** @type {Array<[string, unknown, Record<string, unknown>?]>} */
    const rejected = [
        ['under `any`', { define: { x: { any: [{ api: 'a' }] } } }],
        ['under `sum`', { define: { x: { sum: [{ api: 'a' }, 1] } } }],
        ['in a list', { define: { x: { expr: [{ api: 'a' }] } } }],
        ['in a `using` operand', { define: { x: { expr: 1, using: { api: 'a' } } } }],
        ['in `match`', { breakageReportData: {} }, { match: { api: 'a', is: true } }],
    ];
    for (const [name, actions, rest] of rejected) {
        it(`are rejected ${name}`, () => {
            expect(() =>
                compileDetector(/** @type {any} */ ({ actions, ...rest }), /** @type {any} */ (suspendingSources())),
            ).toThrowMatching((e) => e instanceof ConfigParseError && /suspends the run/.test(e.message));
        });
    }
});
