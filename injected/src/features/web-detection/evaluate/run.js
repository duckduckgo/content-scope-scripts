import { DetectionError, isFailure, isScalar, thrownMessage } from '../model/core.js';
import { evaluateOccurrence, occurrenceSteps } from './evaluate.js';

/**
 * @import { EvaluationContext } from './context.js'
 * @import { ActionOutcome, Node } from '../model/types.js'
 * @import { CompiledDetector } from '../compile/compile.js'
 */

/** @typedef {'aborted' | 'error'} RunFailure */

/**
 * A detector's state in the frame, kept across its runs.
 *
 * @typedef {object} DetectorState
 * @property {Map<string, unknown>} names - the detector names `define` has bound, `this.x`
 * @property {boolean} done - whether a run's `match` or `done` action has held, so the detector runs no more
 */

/**
 * One run of a detector.
 *
 * @typedef {object} DetectorRun
 * @property {boolean | RunFailure} [match] - the `match` result, when the detector has one
 * @property {Record<string, ActionOutcome>} actions - each action evaluated, by config path
 * @property {string} [failedAt] - the config path of the failure that ended the run
 * @property {RunFailure} [failure] - that failure
 * @property {string} [abortError] - for an abort, the thrown value's constructor name, or what did not fit the config
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
    if (compiled.actions.suspends) throw new DetectionError('a run that can suspend needs a scheduler to resume it');
    /** @type {DetectorRun} */
    const run = { actions: ctx.outcomes };
    if (!runMatch(compiled, state, ctx, run)) return run;
    finishPart(compiled.actions, () => evaluateOccurrence(compiled.actions, ctx), ctx, run);
    // A `done` that held before a failure stays in effect, as a `match` that held does
    if (ctx.done) state.done = true;
    return run;
}

/**
 * Evaluate `match`, when the detector has one, recording its result in `run`. A `match` that holds
 * makes the detector done.
 *
 * @param {CompiledDetector} compiled
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx
 * @param {DetectorRun} run
 * @returns {boolean} whether `actions` runs
 */
function runMatch(compiled, state, ctx, run) {
    const match = compiled.match;
    if (!match) return true;
    const matched = finishPart(match, () => evaluateOccurrence(match, ctx), ctx, run);
    run.match = matched === true || matched === 'aborted' || matched === 'error' ? matched : false;
    if (run.match !== true) return false;
    state.done = true;
    return true;
}

/**
 * `runDetector` for a detector that can suspend, as a generator: a source that suspends yields what it
 * read, and the run resumes with the value passed to `next`. `match` never suspends, and a run that
 * reaches no source that suspends ends in its first `next()`.
 *
 * @param {CompiledDetector} compiled
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx - created for this run, over `state.names`
 * @returns {Generator<unknown, DetectorRun, unknown>}
 */
export function* runDetectorSteps(compiled, state, ctx) {
    /** @type {DetectorRun} */
    const run = { actions: ctx.outcomes };
    if (!runMatch(compiled, state, ctx, run)) return run;
    /** @type {{ value: unknown } | { error: unknown }} */
    let outcome;
    try {
        outcome = { value: yield* occurrenceSteps(compiled.actions, ctx) };
    } catch (e) {
        outcome = { error: e };
    }
    finishPart(
        compiled.actions,
        () => {
            if ('error' in outcome) throw outcome.error;
            return outcome.value;
        },
        ctx,
        run,
    );
    // A `done` that held before a failure stays in effect, as a `match` that held does
    if (ctx.done) state.done = true;
    return run;
}

/**
 * Evaluate `match` or `actions`, recording in `run` a failure or error that reaches the top.
 *
 * @param {Node} node
 * @param {() => unknown} evaluate - gives the part's value, or throws its error
 * @param {EvaluationContext} ctx
 * @param {DetectorRun} run
 * @returns {unknown} the value, or the failure that ended the run
 */
function finishPart(node, evaluate, ctx, run) {
    /** @type {string} */
    let path;
    /** @type {RunFailure} */
    let failure;
    try {
        const value = evaluate();
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
