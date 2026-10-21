import { objectKeys } from '../../../captured-globals.js';
import { isFailure, isScalar } from '../model/core.js';
import { evaluateOccurrence } from './evaluate.js';

/**
 * @typedef {import('./context.js').EvaluationContext} EvaluationContext
 * @typedef {import('../model/types.js').PayloadData} PayloadData
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
 * @property {boolean} written - whether a `breakageReportData` action has run
 * @property {PayloadData} data - the merged `breakageReportData` payloads, most recent write per key
 * @property {Map<string, RunFailure>} errors - each failure that ended a run, the latest per config path
 */

/**
 * The detector's entry in `breakageData.webDetection`.
 *
 * @typedef {object} BreakageEntry
 * @property {string} detectorId
 * @property {true} [detected] - once a `breakageReportData` action has written
 * @property {PayloadData} [data]
 * @property {Record<string, RunFailure>} [errors] - by the config path of the expression the failure arose at, or `parse`
 */

/**
 * One run of a detector.
 *
 * @typedef {object} DetectorRun
 * @property {boolean | RunFailure} [match] - the `match` result, when the detector has one
 * @property {Record<string, ActionOutcome>} actions - each action evaluated, by config path
 * @property {string} [failedAt] - the config path of the failure that ended the run
 * @property {string} [abortError] - for an abort by a throw, the thrown value's constructor name
 * @property {string} [error] - an error's message
 */

/**
 * @returns {DetectorState}
 */
export function createDetectorState() {
    return { names: new Map(), done: false, written: false, data: {}, errors: new Map() };
}

/**
 * Run a detector: `match` first, when it has one, then `actions` when it holds or is absent. A `match`
 * that holds makes the detector done, whether or not `actions` runs to its end. A failure no `fails`
 * handles ends the run where it arises, and is recorded in `state.errors` under its config path; what
 * the actions before it sent, wrote and bound stands.
 *
 * @param {CompiledDetector} compiled
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx - created for this run, over `state.names` and `state`
 * @returns {DetectorRun}
 */
export function runDetector(compiled, state, ctx) {
    /** @type {DetectorRun} */
    const run = { actions: ctx.outcomes };
    if (compiled.match) {
        const matched = evaluatePart(compiled.match, state, ctx, run);
        run.match = matched === true || matched === 'aborted' || matched === 'error' ? matched : false;
        if (run.match !== true) return run;
        state.done = true;
    }
    evaluatePart(compiled.actions, state, ctx, run);
    return run;
}

/**
 * Evaluate `match` or `actions`, recording a failure or error that reaches the top.
 *
 * @param {Node} node
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx
 * @param {DetectorRun} run
 * @returns {unknown} the value, or the failure that ended the run
 */
function evaluatePart(node, state, ctx, run) {
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
        run.error = e instanceof Error ? e.message : String(e);
    }
    state.errors.set(path, failure);
    run.failedAt = path;
    return failure;
}

/**
 * The detector's breakage entry, or `undefined` when no `breakageReportData` action has run and no
 * failure is recorded.
 *
 * @param {string} detectorId
 * @param {DetectorState} state
 * @returns {BreakageEntry | undefined}
 */
export function breakageEntry(detectorId, state) {
    if (!state.written && state.errors.size === 0) return undefined;
    /** @type {BreakageEntry} */
    const entry = { detectorId };
    if (state.written) entry.detected = true;
    if (objectKeys(state.data).length > 0) entry.data = { ...state.data };
    if (state.errors.size > 0) {
        /** @type {Record<string, RunFailure>} */
        const errors = {};
        for (const [path, failure] of state.errors) errors[path] = failure;
        entry.errors = errors;
    }
    return entry;
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
