import { numberIsFinite, objectKeys } from '../../captured-globals.js';
import { DetectionError, decides, errorPath, isFailure, isScalar, typeName } from './core.js';
import { compileDetector } from './parse.js';
import { NativeReader, readPath, testPredicate } from './predicates.js';
import { ItemBuffer, eachMember, isList } from './sources.js';

/**
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./predicates.js').PredicateContext} PredicateContext
 */

/**
 * @template Body
 * @typedef {import('./sources.js').Source<Body>} Source
 */

/**
 * What an expression's position expects. `spread` is an operand of `sum`, `mul`, `any`, `all` and
 * `none` that may be a list, contributing each item. `root` is a node or a list of nodes.
 *
 * @typedef {'boolean' | 'value' | 'number' | 'list' | 'spread' | 'root'} Position
 */

/**
 * @typedef {object} NodeBase
 * @property {string} path - the config path of the key the expression compiles from, which a failure or error arising at it takes
 * @property {Position} position - the position this occurrence fills. With `is`, the value position the predicate tests
 * @property {CompiledPredicate} [is]
 * @property {ItemBinder} [binder] - the innermost `using`, `where` or `field` this expression sits in
 * @property {boolean} [perItem] - whether it reads `self` of `binder`, and so is computed per item
 * @property {'number' | 'boolean'} [single] - for an operand of `sum`, `mul`, `any`, `all` or `none`, what it gives when it is not a list
 */

/**
 * A `using`, `where` or `field`, which binds `self` to each value it reads from or tests. `node` is its
 * item node, created when an expression inside reads `self`.
 *
 * @typedef {{ node?: ItemNode }} ItemBinder
 */

/**
 * @typedef {NodeBase & { kind: 'literal', value: number | boolean | string | null }} LiteralNode
 * @typedef {NodeBase & { kind: 'source', source: Source<any>, bodies: unknown[], binders: ItemBinder[] }} SourceNode - `binders`: the `where` and `field` its bodies hold
 * @typedef {NodeBase & { kind: 'length', operand: Node }} LengthNode
 * @typedef {NodeBase & { kind: 'expr', operand: Node }} ExprNode
 * @typedef {NodeBase & { kind: 'using', root: Node, operand: Node, binds: ItemBinder }} UsingNode - `operand` reads `root`'s value through `self`
 * @typedef {NodeBase & { kind: 'list', entries: Node[] }} ListNode - `{"expr": [...]}`, each entry in value position
 * @typedef {NodeBase & { kind: 'only', operand: Node }} OnlyNode
 * @typedef {NodeBase & { kind: 'sum' | 'mul' | 'div', operands: Node[] }} ArithmeticNode
 * @typedef {NodeBase & { kind: 'any' | 'all' | 'none' | 'and', operands: Node[] }} LogicNode
 * @typedef {NodeBase & { kind: 'if', test: Node, then: Node, else?: Node }} IfNode
 * @typedef {NodeBase & { kind: 'sequence', elements: Node[] }} SequenceNode - its elements in order, giving the last one's value
 * @typedef {NodeBase & { kind: 'ref', name: string }} RefNode
 * @typedef {NodeBase & { kind: 'item', binder: ItemBinder }} ItemNode - the value `self` is bound to in a `using`, `where` or `field`
 * @typedef {NodeBase & { kind: 'define', name: string, value: Node }} DefineNode
 * @typedef {NodeBase & { kind: 'fireEvent', type: string, data?: CompiledPayloadField[] }} FireEventNode
 * @typedef {NodeBase & { kind: 'breakageReportData', data?: CompiledPayloadField[] }} BreakageReportDataNode
 * @typedef {DefineNode | FireEventNode | BreakageReportDataNode} ActionNode
 * @typedef {LiteralNode | SourceNode | LengthNode | ExprNode | UsingNode | ListNode | OnlyNode | ArithmeticNode | LogicNode | IfNode | SequenceNode | RefNode | ItemNode | ActionNode} Node
 */

/**
 * @typedef {object} CompiledPayloadField
 * @property {string} key
 * @property {string} path - the config path of the field, `<action>.data.<key>`
 * @property {Node} value
 * @property {CompiledPredicate} [when]
 * @property {Array<[string, CompiledPredicate]>} [buckets]
 */

/**
 * What an action did in a run: it sent or wrote or bound, or a value it computes failed or errored.
 *
 * @typedef {'ran' | 'aborted' | 'error'} ActionOutcome
 */

/**
 * @typedef {Record<string, string | number | boolean | null>} PayloadData
 */

/**
 * The breakage entry `breakageReportData` writes: whether it has written, and the merged `data`.
 *
 * @typedef {{ written: boolean, data: PayloadData }} EntryWrites
 */

/**
 * One run's state, threaded to every expression. An expression is computed each time evaluation
 * reaches it, and one that reads `self` of a `using`, `where` or `field` once per value bound.
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
     * @param {NativeReader} reader
     * @param {Map<string, unknown>} [detectorNames] - the detector's names, which outlive the run
     * @param {EntryWrites} [entry] - the detector's breakage entry, which `breakageReportData` writes
     */
    constructor(reader, detectorNames = new Map(), entry = { written: false, data: {} }) {
        this.reader = reader;
        reader.beginRun();
        this.detectorNames = detectorNames;
        this.entry = entry;
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
     * Run `fn` with `self` of a `using`, `where` or `field` bound to `value`. A binder no expression
     * reads `self` of binds nothing.
     *
     * @template T
     * @param {ItemBinder} binder
     * @param {unknown} value
     * @param {() => T} fn
     * @returns {T}
     */
    bind(binder, value, fn) {
        if (!binder.node) return fn();
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

/**
 * The frame of the `using`, `where` or `field` a per-item expression reads `self` of.
 *
 * @param {ItemBinder} binder
 * @param {EvaluationContext} ctx
 */
function frameOf(binder, ctx) {
    const frame = ctx.frames.get(binder);
    if (!frame) throw new DetectionError('`self` read outside the `using`, `where` or `field` it is bound by');
    return frame;
}

/**
 * Evaluate an expression where it sits: with `is`, the boolean its predicate gives.
 *
 * @param {Node} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
export function evaluateOccurrence(node, ctx) {
    const value = evaluate(node, node.position, ctx);
    const is = node.is;
    if (!is) return value;
    try {
        const held = testPredicate(is, forPredicate(value, is), ctx);
        return isFailure(held) ? held.at(`${node.path}.is`) : held;
    } catch (e) {
        throw atPath(e, node.path, ctx);
    }
}

/**
 * Evaluate an expression's value in a position, without its `is`. A failure takes the path of the
 * expression it arose at, and an error the path of the innermost expression it left.
 *
 * @param {Node} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
export function evaluate(node, position, ctx) {
    try {
        /** @type {unknown} */
        let result;
        switch (node.kind) {
            case 'ref':
                result = positioned((node.name.startsWith('this.') ? ctx.detectorNames : ctx.runNames).get(node.name), position);
                break;
            case 'expr':
                // `expr` gives its operand's value in its own position, or the boolean the operand's `is` gives
                result = node.operand.is ? evaluateOccurrence(node.operand, ctx) : evaluate(node.operand, position, ctx);
                break;
            case 'using':
                result = computeUsing(node, position, ctx);
                break;
            case 'source':
                result = readSource(node, position, ctx);
                break;
            case 'item':
                result = frameOf(node.binder, ctx).value;
                break;
            default:
                result = node.binder ? withinBinder(node, node.binder, ctx) : compute(node, ctx);
        }
        if (isFailure(result)) return result.at(node.path);
        checkType(result, position);
        return result;
    } catch (e) {
        throw atPath(e, node.path, ctx);
    }
}

/**
 * Name an error by the innermost expression it leaves, and record it for the debug notification.
 *
 * @param {unknown} error
 * @param {string} path
 * @param {EvaluationContext} ctx
 * @returns {unknown} the error
 */
function atPath(error, path, ctx) {
    const at = errorPath(error, path);
    ctx.errorAt ??= { path: at, message: error instanceof Error ? error.message : String(error) };
    return error;
}

/**
 * Where the value of an expression inside a `using`, `where` or `field` is kept: per value bound when it
 * reads `self`, else per evaluation of the source holding a `where` or `field`.
 *
 * @param {Node} node
 * @param {ItemBinder} binder
 * @param {EvaluationContext} ctx
 * @returns {Map<Node, unknown> | undefined}
 */
function memoOf(node, binder, ctx) {
    return node.perItem ? frameOf(binder, ctx).memo : ctx.shared.get(binder);
}

/**
 * The value of an expression inside a `using`, `where` or `field`, computed once where `memoOf` keeps it.
 *
 * @param {Exclude<Node, RefNode | SourceNode | ExprNode | UsingNode | ItemNode>} node
 * @param {ItemBinder} binder
 * @param {EvaluationContext} ctx
 * @returns {unknown}
 */
function withinBinder(node, binder, ctx) {
    const memo = memoOf(node, binder, ctx);
    if (!memo) return compute(node, ctx);
    if (memo.has(node)) return memo.get(node);
    const result = compute(node, ctx);
    memo.set(node, result);
    return result;
}

/**
 * @param {unknown} value
 * @param {Position} position
 */
function checkType(value, position) {
    if (value instanceof ItemBuffer && position === 'boolean') {
        throw new DetectionError('a list is read through any, all, none or only, or its length through using');
    }
    if (position === 'number' && typeof value !== 'number') throw new DetectionError(`expected a number, got ${typeName(value)}`);
    if (position === 'boolean' && typeof value !== 'boolean') throw new DetectionError(`expected a boolean, got ${typeName(value)}`);
}

/**
 * A value in a position: a selected list gives its one item in number position, and the condition
 * leaf in boolean position whether it holds an item.
 *
 * @param {unknown} value
 * @param {Position} position
 * @returns {unknown} the value, or a `Failure`
 */
function positioned(value, position) {
    if (!(value instanceof ItemBuffer)) return value;
    if (position === 'boolean' && value.leaf) return presence(value);
    if (position === 'number') return single(value);
    return value;
}

/**
 * `using`: the value beside it, computed once, then the expression over it with `self` bound to it.
 *
 * @param {UsingNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function computeUsing(node, position, ctx) {
    const value = evaluate(node.root, node.root.position, ctx);
    if (isFailure(value)) return value;
    const operand = node.operand;
    return ctx.bind(node.binds, value, () => (operand.is ? evaluateOccurrence(operand, ctx) : evaluate(operand, position, ctx)));
}

/**
 * A source's value, read each time evaluation reaches it, or once per item when it reads `self`: a
 * list's buffer, or the value an `api` reads. In boolean position, the condition leaf gives whether it
 * holds an item.
 *
 * @param {SourceNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function readSource(node, position, ctx) {
    /** @type {unknown} */
    let value;
    const memo = node.binder ? memoOf(node, node.binder, ctx) : undefined;
    if (memo?.has(node)) {
        value = memo.get(node);
    } else {
        // A new evaluation of the source: what its `where` and `field` read once is read again
        for (const binder of node.binders) ctx.shared.set(binder, new Map());
        value = node.source.read(node.bodies, ctx);
        if (value instanceof ItemBuffer) {
            const key = node.source.key;
            value.leaf =
                key === 'text' || (key === 'element' && node.bodies.every((body) => !(/** @type {{ field?: unknown }} */ (body).field)));
        }
        memo?.set(node, value);
    }
    return positioned(value, position);
}

/**
 * A selected list where a scalar is needed: its one item.
 *
 * @param {ItemBuffer} buffer
 * @returns {unknown} the item, or a `Failure`
 */
function single(buffer) {
    const failure = buffer.pull(2);
    if (failure) return failure;
    if (buffer.values.length !== 1) {
        throw new DetectionError(`a list where one value is needed holds ${buffer.values.length === 0 ? 'no item' : 'several items'}`);
    }
    return buffer.values[0];
}

/**
 * What a predicate tests when an expression gives a selected list: its one item when the predicate
 * compares, else the list as an array.
 *
 * @param {unknown} value - a value or a `Failure`
 * @param {CompiledPredicate} predicate
 * @returns {unknown}
 */
function forPredicate(value, predicate) {
    if (!(value instanceof ItemBuffer)) return value;
    return predicate.scalar ? single(value) : allItems(value);
}

/**
 * @param {ItemBuffer} buffer
 * @returns {boolean | Failure} whether the list holds an item
 */
function presence(buffer) {
    if (!buffer.started) {
        const any = buffer.shortcuts.hasAny?.();
        if (any !== undefined) return any;
    }
    return buffer.pull(1) ?? buffer.values.length > 0;
}

/**
 * The buffer over a list: an `ItemBuffer` itself, or one over an iterable value's members, for the
 * operator reading it.
 *
 * @param {unknown} value
 * @param {string} operator
 * @param {EvaluationContext} ctx
 * @returns {ItemBuffer}
 */
function listOf(value, operator, ctx) {
    if (value instanceof ItemBuffer) return value;
    if (!isList(value, ctx)) throw new DetectionError(`'${operator}' takes a list, got ${typeName(value)}`);
    return new ItemBuffer(eachMember(value, ctx));
}

/**
 * @param {Node} operand - in list position
 * @param {string} operator
 * @param {EvaluationContext} ctx
 * @returns {ItemBuffer | Failure}
 */
function readList(operand, operator, ctx) {
    const value = evaluate(operand, operand.position, ctx);
    if (isFailure(value)) return value;
    return listOf(value, operator, ctx);
}

/**
 * Every item of a list.
 *
 * @param {ItemBuffer} buffer
 * @returns {unknown[] | Failure}
 */
function allItems(buffer) {
    return buffer.pull(Infinity) ?? buffer.values;
}

/**
 * @param {unknown} value
 * @param {string} operator
 * @returns {number}
 */
function expectNumber(value, operator) {
    if (typeof value !== 'number') throw new DetectionError(`'${operator}' takes numbers, got ${typeName(value)}`);
    return value;
}

/**
 * @param {unknown} value
 * @param {string} operator
 * @returns {boolean}
 */
function expectBoolean(value, operator) {
    if (typeof value !== 'boolean') throw new DetectionError(`'${operator}' takes booleans, got ${typeName(value)}`);
    return value;
}

/**
 * @param {Exclude<Node, RefNode | SourceNode | ExprNode | UsingNode | ItemNode>} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function compute(node, ctx) {
    switch (node.kind) {
        case 'literal':
            return node.value;
        case 'list': {
            // Every entry, in order, as `args` passes it: a selected list as an array of its items
            /** @type {unknown[]} */
            const values = [];
            for (const entry of node.entries) {
                const value = ctx.arg(entry);
                if (isFailure(value)) return value;
                values.push(value);
            }
            return values;
        }
        case 'length':
            return computeLength(node, ctx);
        case 'only': {
            const buffer = readList(node.operand, node.kind, ctx);
            if (isFailure(buffer)) return buffer;
            const failure = buffer.pull(2);
            if (failure) return failure;
            const values = buffer.values;
            if (values.length === 0) throw new DetectionError(`'only' over no items`);
            if (values.length > 1) throw new DetectionError(`'only' over several items`);
            return values[0];
        }
        case 'sum':
        case 'mul':
        case 'div':
            return computeArithmetic(node, ctx);
        case 'any':
        case 'all':
        case 'none':
        case 'and':
            return computeLogic(node, ctx);
        case 'if': {
            // The one expression that skips part of its config: only the branch taken is evaluated
            const test = evaluateOccurrence(node.test, ctx);
            if (isFailure(test)) return test;
            const branch = test ? node.then : node.else;
            return branch ? evaluateOccurrence(branch, ctx) : undefined;
        }
        case 'sequence': {
            /** @type {unknown} */
            let value;
            for (const element of node.elements) {
                value = evaluateOccurrence(element, ctx);
                if (isFailure(value)) return value;
            }
            return value;
        }
        case 'define':
        case 'fireEvent':
        case 'breakageReportData':
            return runAction(node, ctx);
    }
}

/**
 * Run an action, recording what it did by its path. A value it computes that fails or errors ends it
 * before it sends, writes or binds.
 *
 * @param {ActionNode} node
 * @param {EvaluationContext} ctx
 * @returns {undefined | Failure}
 */
function runAction(node, ctx) {
    try {
        const failure = applyAction(node, ctx);
        ctx.outcomes[node.path] = failure ? 'aborted' : 'ran';
        return failure;
    } catch (e) {
        ctx.outcomes[node.path] = 'error';
        throw e;
    }
}

/**
 * @param {ActionNode} node
 * @param {EvaluationContext} ctx
 * @returns {Failure | undefined}
 */
function applyAction(node, ctx) {
    if (node.kind === 'define') {
        const value = evaluate(node.value, node.value.position, ctx);
        if (isFailure(value)) return value;
        // A list is held as its buffer, read in full now, so every `ref` reads the same items
        if (value instanceof ItemBuffer) {
            const failure = value.pull(Infinity);
            if (failure) return failure.at(node.value.path);
        }
        (node.name.startsWith('this.') ? ctx.detectorNames : ctx.runNames).set(node.name, value);
        if (isScalar(value)) ctx.measured[node.name] = value;
        return undefined;
    }
    const data = node.data && evaluatePayload(node.data, ctx);
    if (isFailure(data)) return data;
    if (node.kind === 'fireEvent') {
        ctx.events.push({ type: node.type, ...(data && { data }) });
    } else {
        ctx.entry.written = true;
        // A key takes its most recent value, and a key the write omits keeps its value
        if (data) for (const key of objectKeys(data)) ctx.entry.data[key] = /** @type {PayloadData[string]} */ (data[key]);
    }
    return undefined;
}

/**
 * `"using": "length"`. A selected list's length reads every item; any other value's `length` is read
 * as `using` reads a path.
 *
 * @param {LengthNode} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function computeLength(node, ctx) {
    const value = evaluate(node.operand, node.operand.position, ctx);
    if (isFailure(value)) return value;
    if (!(value instanceof ItemBuffer)) return readPath(ctx.reader, value, ['length'], undefined);
    if (!value.started) {
        const count = value.shortcuts.count?.();
        if (count !== undefined) return count;
    }
    return value.pull(Infinity) ?? value.values.length;
}

/**
 * An operand that may be a list: its items when it is one, else itself.
 *
 * @param {Node} operand
 * @param {string} operator
 * @param {EvaluationContext} ctx
 * @returns {{ list: ItemBuffer } | { value: unknown } | Failure}
 */
function readSpread(operand, operator, ctx) {
    const value = operand.position === 'spread' ? evaluate(operand, 'spread', ctx) : evaluateOccurrence(operand, ctx);
    if (isFailure(value)) return value;
    if (operand.position !== 'spread') return { value };
    // A bound condition leaf under any / all / none is a boolean, as the leaf itself is
    if (value instanceof ItemBuffer && value.leaf && operand.single === 'boolean') {
        const held = presence(value);
        return isFailure(held) ? held.at(operand.path) : { value: held };
    }
    return isList(value, ctx) ? { list: listOf(value, operator, ctx) } : { value };
}

/**
 * @param {ArithmeticNode} node
 * @param {EvaluationContext} ctx
 * @returns {number | Failure}
 */
function computeArithmetic(node, ctx) {
    /** @type {number[]} */
    const values = [];
    for (const operand of node.operands) {
        const spread = readSpread(operand, node.kind, ctx);
        if (isFailure(spread)) return spread;
        if ('list' in spread) {
            const items = allItems(spread.list);
            if (isFailure(items)) return items;
            for (const value of items) values.push(expectNumber(value, node.kind));
        } else {
            values.push(expectNumber(spread.value, node.kind));
        }
    }
    switch (node.kind) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        case 'mul':
            return values.reduce((a, b) => a * b, 1);
        case 'div':
            return /** @type {number} */ (values[0]) / /** @type {number} */ (values[1]);
    }
}

/**
 * Evaluate every operand in order. A list operand contributes each value. A failure ends evaluation
 * where it arises.
 *
 * @param {LogicNode} node
 * @param {EvaluationContext} ctx
 * @returns {boolean | Failure}
 */
function computeLogic(node, ctx) {
    const [decider, decided] = decides(node.kind);
    let result = !decided;
    for (const operand of node.operands) {
        const spread = readSpread(operand, node.kind, ctx);
        if (isFailure(spread)) return spread;
        if ('list' in spread) {
            const items = allItems(spread.list);
            if (isFailure(items)) return items.at(operand.path);
            for (let i = 0; i < items.length; i++) if (expectBoolean(items[i], node.kind) === decider) result = decided;
        } else if (expectBoolean(spread.value, node.kind) === decider) {
            result = decided;
        }
    }
    return result;
}

const OMIT = Symbol('omit');

/**
 * Compute a payload, every key in order.
 *
 * A key is omitted when its value is not a JSON scalar, when `when` does not hold, and with `buckets`
 * when the value is in no bucket. A failed value reaches `when` and the buckets, where `fails` handles
 * it. A value, `when` or bucket that fails unhandled fails the payload at the first such key, and one
 * that errors throws.
 *
 * @param {CompiledPayloadField[]} fields
 * @param {EvaluationContext} ctx
 * @returns {PayloadData | Failure}
 */
export function evaluatePayload(fields, ctx) {
    /** @type {PayloadData} */
    const data = {};
    for (const field of fields) {
        /** @type {ReturnType<typeof payloadValue>} */
        let value;
        try {
            value = payloadValue(field, ctx);
        } catch (e) {
            throw atPath(e, `${field.path}.value`, ctx);
        }
        if (isFailure(value)) return value;
        if (value !== OMIT) data[field.key] = value;
    }
    return data;
}

/**
 * @param {CompiledPayloadField} field
 * @param {EvaluationContext} ctx
 * @returns {string | number | boolean | null | Failure | typeof OMIT}
 */
function payloadValue(field, ctx) {
    const value = evaluateOccurrence(field.value, ctx);
    if (value instanceof ItemBuffer && !field.buckets)
        throw new DetectionError('a list is sent bucketed, through only, or as its length through using');
    /**
     * @param {CompiledPredicate} predicate
     * @param {string} path
     * @returns {boolean | Failure}
     */
    const test = (predicate, path) => {
        const held = testPredicate(predicate, forPredicate(value, predicate), ctx);
        return isFailure(held) ? held.at(path) : held;
    };
    if (field.when) {
        const held = test(field.when, `${field.path}.when`);
        if (isFailure(held)) return held;
        if (held !== true) return OMIT;
    }
    if (field.buckets) {
        for (const [name, bucket] of field.buckets) {
            const held = test(bucket, `${field.path}.buckets.${name}`);
            if (isFailure(held)) return held;
            if (held) return name;
        }
        return isFailure(value) ? value : OMIT;
    }
    if (isFailure(value)) return value;
    return isScalar(value) && (typeof value !== 'number' || numberIsFinite(value)) ? value : OMIT;
}

/** @typedef {true | false | 'aborted'} ConditionResult */

/**
 * Compile and evaluate a condition on its own, as a detector's `match`.
 *
 * @param {unknown} match
 * @param {object} [global] - the global object reads go through
 * @returns {ConditionResult} throws on a parse error or an error
 */
export function evaluateCondition(match, global = globalThis) {
    const compiled = compileDetector({ match, actions: { breakageReportData: {} } }, global);
    const value = evaluateOccurrence(/** @type {Node} */ (compiled.match), new EvaluationContext(new NativeReader(global, compiled.names)));
    return isFailure(value) ? 'aborted' : value === true;
}
