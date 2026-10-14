import { objectKeys } from '../../captured-globals.js';
import { isFailure, isScalar } from './core.js';
import { evaluateOccurrence, evaluatePayload, evaluateWhen } from './expressions.js';

/**
 * @typedef {import('./expressions.js').EvaluationContext} EvaluationContext
 * @typedef {import('./expressions.js').PayloadData} PayloadData
 * @typedef {import('./parse.js').CompiledDetector} CompiledDetector
 * @typedef {import('./parse.js').CompiledItem} CompiledItem
 */

/**
 * What an item did in one run: its actions ran, its `when` was false, or its `when` or a `define`
 * value failed.
 *
 * @typedef {'ran' | 'skipped' | 'aborted' | 'error'} ItemOutcome
 */

/** @typedef {'aborted' | 'error'} ItemFailure */

/**
 * A detector's state in the frame, kept across its runs.
 *
 * @typedef {object} DetectorState
 * @property {Map<string, unknown>} defined - the values `define` stored, `done` included
 * @property {boolean} written - whether a `breakageReportData` action has run
 * @property {PayloadData} data - the merged `breakageReportData` payloads, most recent write per key
 * @property {Map<number, ItemFailure>} errors - the latest failure of each item's `when` or `define`, by index
 * @property {boolean} done - whether `done` held `true` when a run ended, so the detector runs no more
 */

/**
 * The detector's entry in `breakageData.webDetection`.
 *
 * @typedef {object} BreakageEntry
 * @property {string} detectorId
 * @property {true | 'error' | 'aborted'} detected
 * @property {PayloadData} [data]
 * @property {Record<string, ItemFailure>} [errors] - by item index
 */

/**
 * One run of a detector's items.
 *
 * @typedef {object} ActionRun
 * @property {ItemOutcome[]} outcomes - for each item evaluated, in order
 * @property {number} [endedAt] - the index of the item that ended the run, through `exit` or a gate that failed
 * @property {string} [abortError] - for the first abort by a throw, the thrown value's constructor name
 * @property {string} [error] - the first error's message
 */

/**
 * @returns {DetectorState}
 */
export function createDetectorState() {
    return { defined: new Map(), written: false, data: {}, errors: new Map(), done: false };
}

/**
 * Evaluate a detector's items in order. An item whose `when` holds, or that has none, sends its
 * `fireEvent`, writes its `breakageReportData`, stores its `define` values, then applies its `exit`.
 *
 * @param {CompiledDetector} compiled
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx - created for this run, over `state.defined`
 * @param {(type: string, data: PayloadData | undefined) => void} fire - sends one `fireEvent`
 * @returns {ActionRun}
 */
export function runActions(compiled, state, ctx, fire) {
    /** @type {ActionRun} */
    const run = { outcomes: [] };
    for (let index = 0; index < compiled.items.length; index++) {
        const item = /** @type {CompiledItem} */ (compiled.items[index]);
        const condition = item.when ? testWhen(item.when, ctx, run) : true;
        if (condition === false) {
            state.errors.delete(index);
            run.outcomes.push('skipped');
            continue;
        }
        if (condition !== true) {
            state.errors.set(index, condition);
            run.outcomes.push(condition);
            // A gate never passes a value it cannot read: the run ends, and the next trigger retries
            if (item.gate) {
                run.endedAt = index;
                break;
            }
            continue;
        }
        runItem(item, index, state, ctx, run, fire);
        run.outcomes.push('ran');
        if (item.exit) {
            run.endedAt = index;
            break;
        }
    }
    state.done = state.defined.get('done') === true;
    return run;
}

/**
 * @param {import('./expressions.js').Node} when
 * @param {EvaluationContext} ctx
 * @param {ActionRun} run
 * @returns {boolean | ItemFailure}
 */
function testWhen(when, ctx, run) {
    try {
        const { result, abortError } = evaluateWhen(when, ctx);
        if (abortError) run.abortError ??= abortError;
        return result;
    } catch (e) {
        run.error ??= e instanceof Error ? e.message : String(e);
        return 'error';
    }
}

/**
 * @param {CompiledItem} item
 * @param {number} index
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx
 * @param {ActionRun} run
 * @param {(type: string, data: PayloadData | undefined) => void} fire
 */
function runItem(item, index, state, ctx, run, fire) {
    // Payloads are computed before `define` stores, so they read the values from before the item
    if (item.fireEvent) {
        fire(item.fireEvent.type, item.fireEvent.data && evaluatePayload(item.fireEvent.data, ctx));
    }
    if (item.breakageReportData) {
        state.written = true;
        if (item.breakageReportData.data) mergeEntryData(state.data, evaluatePayload(item.breakageReportData.data, ctx));
    }
    if (!item.define) {
        state.errors.delete(index);
        return;
    }

    /** @type {Array<[string, unknown]>} */
    const values = [];
    /** @type {ItemFailure | undefined} */
    let failure;
    for (const [name, node] of item.define) {
        try {
            // `done` is a boolean in boolean position; any other value is stored as read, a list as an array
            const value = name === 'done' ? evaluateOccurrence(node, ctx) : ctx.arg(node);
            if (isFailure(value)) {
                failure ??= 'aborted';
                if (value.error) run.abortError ??= value.error;
            } else {
                values.push([name, value]);
            }
        } catch (e) {
            failure = 'error';
            run.error ??= e instanceof Error ? e.message : String(e);
        }
    }
    // Every value is computed before any is stored, and one that failed leaves its stored value unchanged
    for (const [name, value] of values) state.defined.set(name, value);
    if (failure) state.errors.set(index, failure);
    else state.errors.delete(index);
}

/**
 * Merge a write into the entry's data: a key takes its most recent value, and a key the write omits
 * keeps its value. `_errors` describes the latest write only.
 *
 * @param {PayloadData} data
 * @param {PayloadData} write
 */
function mergeEntryData(data, write) {
    delete data._errors;
    for (const key of objectKeys(write)) data[key] = /** @type {PayloadData[string]} */ (write[key]);
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
    /** @type {Record<string, ItemFailure>} */
    const errors = {};
    let errored = false;
    for (const [index, failure] of state.errors) {
        errors[String(index)] = failure;
        if (failure === 'error') errored = true;
    }
    /** @type {BreakageEntry} */
    const entry = { detectorId, detected: state.written ? true : errored ? 'error' : 'aborted' };
    if (objectKeys(state.data).length > 0) entry.data = { ...state.data };
    if (state.errors.size > 0) entry.errors = errors;
    return entry;
}

/**
 * The scalar `define`d values, for the debug notification.
 *
 * @param {DetectorState} state
 * @returns {Record<string, string | number | boolean | null>}
 */
export function definedScalars(state) {
    /** @type {Record<string, string | number | boolean | null>} */
    const values = {};
    for (const [name, value] of state.defined) {
        if (isScalar(value)) values[name] = value;
    }
    return values;
}
