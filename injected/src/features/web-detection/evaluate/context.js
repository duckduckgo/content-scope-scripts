import { isFailure } from '../model/core.js';
import { ItemBuffer, isList } from '../model/lists.js';
import { allItems, evaluate, evaluateOccurrence, listOf, single } from './evaluate.js';
import { TaskReadCache } from './task-read-cache.js';

/**
 * @typedef {import('../model/core.js').Failure} Failure
 * @typedef {import('../model/types.js').ActionOutcome} ActionOutcome
 * @typedef {import('../model/types.js').ItemBinder} ItemBinder
 * @typedef {import('../model/types.js').Node} Node
 * @typedef {import('../model/types.js').PayloadData} PayloadData
 * @typedef {import('../model/types.js').PredicateContext} PredicateContext
 * @typedef {import('../model/types.js').Reader} Reader
 * @typedef {import('../model/types.js').TaskReads} TaskReads
 */

/**
 * The breakage entry `breakageReportData` writes: whether it has written, and the merged `data`.
 *
 * @typedef {{ written: boolean, data: PayloadData }} EntryWrites
 */

/**
 * One run's state, threaded to every expression. An expression is computed each time evaluation
 * reaches it, and one that reads `self` of a `using`, `where` or `field`, or a `ref` inside one, once
 * per value bound. One inside a `where` or `field` reading neither is computed once per evaluation of
 * the source, so a call or action there runs once for all its items.
 *
 * @implements {PredicateContext}
 */
export class EvaluationContext {
    /** @type {Map<string, unknown>} the run names `define` has bound */
    runNames = new Map();
    /** @type {Record<string, unknown>} scalar values bound, by name, for the debug notification */
    measured = {};
    /** @type {Array<{ type: string, data?: PayloadData }>} the events `fireEvent` has sent, in order */
    events = [];
    /** @type {Record<string, ActionOutcome>} each action evaluated, by config path */
    outcomes = {};
    /** @type {{ path: string, message: string } | undefined} the innermost expression an error was thrown from */
    errorAt;
    /** @type {Map<ItemBinder, { value: unknown, memo: Map<Node, unknown> }>} the value each `using`, `where` and `field` is binding */
    frames = new Map();
    /** @type {Map<ItemBinder, Map<Node, unknown>>} per `where` and `field`, the values of the expressions inside reading no `self`, for one evaluation of the source */
    shared = new Map();

    /**
     * @param {Reader} reader
     * @param {Map<string, unknown>} [detectorNames] - the detector's names, which outlive the run
     * @param {EntryWrites} [entry] - the detector's breakage entry, which `breakageReportData` writes
     * @param {TaskReads} [task] - the page reads shared with the other detectors of the task
     */
    constructor(reader, detectorNames = new Map(), entry = { written: false, data: {} }, task = new TaskReadCache()) {
        this.reader = reader;
        reader.beginRun();
        this.detectorNames = detectorNames;
        this.entry = entry;
        this.task = task;
    }

    /**
     * @param {unknown} operand - a compiled operand of `eq` or a comparison, in value position. A selected
     * list gives its one item
     * @returns {unknown}
     */
    operand(operand) {
        const node = /** @type {Node} */ (operand);
        const value = evaluate(node, node.position, this);
        return value instanceof ItemBuffer ? single(value) : value;
    }

    /**
     * @param {unknown} expression - a compiled expression, read in the position it was compiled for
     * @returns {unknown}
     */
    read(expression) {
        const node = /** @type {Node} */ (expression);
        return evaluate(node, node.position, this);
    }

    /**
     * @param {unknown} expression - a compiled expression in boolean position, such as one in `where`
     * @returns {unknown} the boolean, with `is` the one its predicate gives, or a `Failure`
     */
    test(expression) {
        return evaluateOccurrence(/** @type {Node} */ (expression), this);
    }

    /**
     * @param {unknown} expression - a compiled `args` expression in value position
     * @returns {unknown} the value, with a selected list as a new array of its items, or a `Failure`
     */
    arg(expression) {
        const value = this.read(expression);
        if (!(value instanceof ItemBuffer)) return value;
        const items = allItems(value);
        if (isFailure(items)) return items;
        // Copied by index: a method may change its argument, and the buffer is shared
        /** @type {unknown[]} */
        const array = [];
        for (let i = 0; i < items.length; i++) array.push(items[i]);
        return array;
    }

    /**
     * @param {unknown} value - a value read, such as an operand of `in`
     * @param {string} operator
     * @returns {unknown[] | Failure | undefined} the items of a list, or `undefined` for any other value
     */
    items(value, operator) {
        if (!isList(value, this)) return undefined;
        return allItems(listOf(value, operator, this));
    }

    /**
     * Run `fn` with `self` of a `using`, `where` or `field` bound to `value`. A binder with no expression
     * inside computed per item binds nothing.
     *
     * @template T
     * @param {ItemBinder} binder
     * @param {unknown} value
     * @param {() => T} fn
     * @returns {T}
     */
    bind(binder, value, fn) {
        if (!binder.framed) return fn();
        // Frames are keyed by binder: a list may be pulled from inside another binder's frame
        const previous = this.frames.get(binder);
        this.frames.set(binder, { value, memo: new Map() });
        try {
            return fn();
        } finally {
            if (previous) this.frames.set(binder, previous);
            else this.frames.delete(binder);
        }
    }
}
