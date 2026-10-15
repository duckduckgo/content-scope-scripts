import { objectKeys } from '../../captured-globals.js';
import { isFailure, isScalar } from './core.js';
import { evaluatePayload, evaluateWhen } from './expressions.js';

/**
 * @typedef {import('./expressions.js').EvaluationContext} EvaluationContext
 * @typedef {import('./expressions.js').PayloadData} PayloadData
 * @typedef {import('./parse.js').CompiledDetector} CompiledDetector
 * @typedef {import('./parse.js').CompiledItem} CompiledItem
 */

/**
 * What an item did in one run: its actions ran, its `when` was false, or its `when`, a payload or a
 * `define` value failed, which ended the run.
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
 * @property {Map<string, ItemFailure>} errors - each failure that ended a run, the latest per key: `<index>.when`,
 *   `<index>.fireEvent.<key>`, `<index>.breakageReportData.<key>` or `<index>.define.<name>`
 * @property {boolean} done - whether `done` held `true` when a run ended, so the detector runs no more
 */

/**
 * The detector's entry in `breakageData.webDetection`.
 *
 * @typedef {object} BreakageEntry
 * @property {string} detectorId
 * @property {true} [detected] - once a `breakageReportData` action has written
 * @property {PayloadData} [data]
 * @property {Record<string, ItemFailure>} [errors] - by the key of where the failure arose
 */

/**
 * One run of a detector's items.
 *
 * @typedef {object} ActionRun
 * @property {ItemOutcome[]} outcomes - for each item evaluated, in order
 * @property {number} [endedAt] - the index of the item that ended the run, through `exit` or a failure
 * @property {string} [failedAt] - the key of the failure that ended the run
 * @property {string} [abortError] - for the first abort by a throw, the thrown value's constructor name
 * @property {string} [error] - the first error's message
 */

/**
 * A failure that ends the run, keyed by where it arose.
 *
 * @typedef {{ key: string, result: ItemFailure }} RunFailure
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
 * A failure no `fails` handles ends the run: the items before it keep what they did, and the failure
 * is recorded in `state.errors`.
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
            run.outcomes.push('skipped');
            continue;
        }
        const failure = condition === true ? runItem(item, index, state, ctx, run, fire) : { key: `${index}.when`, result: condition };
        if (failure) {
            state.errors.set(failure.key, failure.result);
            run.outcomes.push(failure.result);
            run.endedAt = index;
            run.failedAt = failure.key;
            break;
        }
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
 * Compute the item's payloads and `define` values, then apply its actions. A failure in any value
 * leaves every action undone.
 *
 * @param {CompiledItem} item
 * @param {number} index
 * @param {DetectorState} state
 * @param {EvaluationContext} ctx
 * @param {ActionRun} run
 * @param {(type: string, data: PayloadData | undefined) => void} fire
 * @returns {RunFailure | undefined}
 */
function runItem(item, index, state, ctx, run, fire) {
    // Payloads are computed before `define` stores, so they read the values from before the item
    /** @type {PayloadData | undefined} */
    let eventData;
    if (item.fireEvent?.data) {
        const payload = evaluatePayload(item.fireEvent.data, ctx);
        if ('failure' in payload) return payloadFailure(`${index}.fireEvent`, payload.failure, run);
        eventData = payload.data;
    }
    /** @type {PayloadData | undefined} */
    let entryData;
    if (item.breakageReportData?.data) {
        const payload = evaluatePayload(item.breakageReportData.data, ctx);
        if ('failure' in payload) return payloadFailure(`${index}.breakageReportData`, payload.failure, run);
        entryData = payload.data;
    }

    /** @type {Array<[string, unknown]>} */
    const values = [];
    for (const [name, node] of item.define ?? []) {
        try {
            // Stored as read, a list as an array
            const value = ctx.arg(node);
            if (isFailure(value)) {
                if (value.error) run.abortError ??= value.error;
                return { key: `${index}.define.${name}`, result: 'aborted' };
            }
            values.push([name, value]);
        } catch (e) {
            run.error ??= e instanceof Error ? e.message : String(e);
            return { key: `${index}.define.${name}`, result: 'error' };
        }
    }

    if (item.fireEvent) fire(item.fireEvent.type, eventData);
    if (item.breakageReportData) {
        state.written = true;
        if (entryData) mergeEntryData(state.data, entryData);
    }
    for (const [name, value] of values) state.defined.set(name, value);
    return undefined;
}

/**
 * @param {string} prefix - `<index>.fireEvent` or `<index>.breakageReportData`
 * @param {import('./expressions.js').PayloadFailure} failure
 * @param {ActionRun} run
 * @returns {RunFailure}
 */
function payloadFailure(prefix, failure, run) {
    if (failure.abortError) run.abortError ??= failure.abortError;
    if (failure.error) run.error ??= failure.error;
    return { key: `${prefix}.${failure.key}`, result: failure.result };
}

/**
 * Merge a write into the entry's data: a key takes its most recent value, and a key the write omits
 * keeps its value.
 *
 * @param {PayloadData} data
 * @param {PayloadData} write
 */
function mergeEntryData(data, write) {
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
    /** @type {BreakageEntry} */
    const entry = { detectorId };
    if (state.written) entry.detected = true;
    if (objectKeys(state.data).length > 0) entry.data = { ...state.data };
    if (state.errors.size > 0) {
        /** @type {Record<string, ItemFailure>} */
        const errors = {};
        for (const [key, failure] of state.errors) errors[key] = failure;
        entry.errors = errors;
    }
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
