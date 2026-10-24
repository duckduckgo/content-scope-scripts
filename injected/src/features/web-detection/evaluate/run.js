import { isFailure, isScalar, thrownMessage } from '../model/core.js';
import { evaluateOccurrence } from './evaluate.js';

/**
 * @typedef {import('./context.js').EvaluationContext} EvaluationContext
 * @typedef {import('../model/types.js').ActionOutcome} ActionOutcome
 * @typedef {import('../model/types.js').Node} Node
 * @typedef {import('../compile/compile.js').CompiledDetector} CompiledDetector
 */

/** @typedef {'aborted' | 'error'} RunFailure */

/**
 * A detector's state in the frame, kept across its runs.
 *
 * @typedef {object} DetectorState
 * @property {Map<string, unknown>} names - the detector names `define` has bound, `this.x`
 * @property {boolean} done - whether a run's `match` has held, so the detector runs no more
 */

/**
 * One run of a detector.
 *
 * @typedef {object} DetectorRun
 * @property {boolean | RunFailure} [match] - the `match` result, when the detector has one
 * @property {Record<string, ActionOutcome>} actions - each action evaluated, by config path
 * @property {string} [failedAt] - the config path of the failure that ended the run
 * @property {RunFailure} [failure] - that failure
 * @property {string} [abortError] - for an abort by a throw, the thrown value's constructor name
 * @property {string} [error] - an error's message
 */

/**
 * @returns {DetectorState}
 */
export function createDetectorState() {
    return { names: new Map(), done: false };
}

/**
 * Run a detector: `match` first, when it has one, then `actions` when it holds or is absent. A `match`
 * that holds makes the detector done, whether or not `actions` runs to its end. A failure no `fails`
 * handles ends the run where it arises, and the run gives it with its config path; what the actions
 * before it sent, wrote and bound stands.
 *
 * @param {CompiledDetector} compiled
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx - created for this run, over `state.names`
 * @returns {DetectorRun}
 */
export function runDetector(compiled, state, ctx) {
    /** @type {DetectorRun} */
    const run = { actions: ctx.outcomes };
    if (compiled.match) {
        const matched = evaluatePart(compiled.match, ctx, run);
        run.match = matched === true || matched === 'aborted' || matched === 'error' ? matched : false;
        if (run.match !== true) return run;
        state.done = true;
    }
    evaluatePart(compiled.actions, ctx, run);
    return run;
}

/**
 * Evaluate `match` or `actions`, recording in `run` a failure or error that reaches the top.
 *
 * @param {Node} node
 * @param {EvaluationContext} ctx
 * @param {DetectorRun} run
 * @returns {unknown} the value, or the failure that ended the run
 */
function evaluatePart(node, ctx, run) {
    /** @type {string} */
    let path;
    /** @type {RunFailure} */
    let failure;
    try {
        const value = evaluateOccurrence(node, ctx);
        if (!isFailure(value)) return value;
        path = value.path ?? node.path;
        failure = 'aborted';
        if (value.error) run.abortError = value.error;
    } catch (e) {
        path = ctx.errorAt?.path ?? node.path;
        failure = 'error';
        run.error = thrownMessage(e);
    }
    run.failedAt = path;
    run.failure = failure;
    return failure;
}

/**
 * The scalar detector names, for the debug notification.
 *
 * @param {DetectorState} state
 * @returns {Record<string, string | number | boolean | null>}
 */
export function detectorNameScalars(state) {
    /** @type {Record<string, string | number | boolean | null>} */
    const values = {};
    for (const [name, value] of state.names) {
        if (isScalar(value)) values[name] = value;
    }
    return values;
}
