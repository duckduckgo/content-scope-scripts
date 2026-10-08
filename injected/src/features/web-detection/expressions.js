import { numberIsFinite } from '../../captured-globals.js';
import { DetectionError, NOT_READ, isFailure, typeName } from './core.js';
import { compileDetector } from './parse.js';
import { NativeReader, readPath } from './predicates.js';
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
 * An `if` branch enclosing an expression.
 *
 * @typedef {{ node: IfNode, branch: 'then' | 'else' }} Branch
 */

/**
 * @typedef {object} NodeBase
 * @property {string} path - JSON path in the detector config
 * @property {Position} position - the position this occurrence fills. With `is`, the value position the predicate tests
 * @property {string} [as]
 * @property {CompiledPredicate} [is]
 * @property {Branch[]} branches - the `if` branches enclosing this expression, outermost first
 * @property {ItemBinder} [binder] - the innermost `where` or `field` this expression sits in
 * @property {boolean} [perItem] - whether it reads `self` of `binder`, and so is computed per item
 */

/**
 * A `where` or `field`, which binds `self` to each value it tests or reads from. `node` is its item
 * node, created when an expression inside reads `self`.
 *
 * @typedef {{ node?: ItemNode }} ItemBinder
 */

/**
 * @typedef {NodeBase & { kind: 'literal', value: number | boolean | string | null }} LiteralNode
 * @typedef {NodeBase & { kind: 'source', source: Source<any>, bodies: unknown[] }} SourceNode
 * @typedef {NodeBase & { kind: 'length', operand: Node, bound: number }} LengthNode
 * @typedef {NodeBase & { kind: 'expr', operand: Node }} ExprNode
 * @typedef {NodeBase & { kind: 'only', operand: Node }} OnlyNode
 * @typedef {NodeBase & { kind: 'sum' | 'mul' | 'div', operands: Node[] }} ArithmeticNode
 * @typedef {NodeBase & { kind: 'any' | 'all' | 'none' | 'and', operands: Node[] }} LogicNode
 * @typedef {NodeBase & { kind: 'if', test: Node, then: Node, else: Node }} IfNode
 * @typedef {NodeBase & { kind: 'ref', name: string, target?: Node }} RefNode
 * @typedef {NodeBase & { kind: 'item', binder: ItemBinder }} ItemNode - the value `self` is bound to in a `where` or `field`
 * @typedef {LiteralNode | SourceNode | LengthNode | ExprNode | OnlyNode | ArithmeticNode | LogicNode | IfNode | RefNode | ItemNode} Node
 */

/**
 * @typedef {object} CompiledPayloadField
 * @property {string} key
 * @property {Node} value
 * @property {CompiledPredicate} [when]
 * @property {Array<[string, CompiledPredicate]>} [buckets]
 */

/**
 * Per-run state, threaded to every expression. Each expression is computed at most once per run, and
 * one that reads `self` in a `where` or `field` at most once per item.
 *
 * @implements {PredicateContext}
 */
export class EvaluationContext {
    /** @type {Map<Node, unknown>} each computed expression's value, or its failure */
    memo = new Map();
    /** @type {Map<object, ItemBuffer>} the buffer over each iterable value a list operator reads */
    lists = new Map();
    /** @type {Record<string, unknown>} scalar values read, by name, for the debug notification */
    measured = {};
    /** @type {Map<IfNode, 'then' | 'else'>} */
    branchTaken = new Map();
    /** @type {{ path: string, as?: string, message: string } | undefined} the innermost expression an error was thrown from */
    errorAt;
    /** @type {Map<ItemBinder, { value: unknown, memo: Map<Node, unknown> }>} the value each `where` and `field` is testing or reading from */
    frames = new Map();

    /**
     * @param {NativeReader} reader
     */
    constructor(reader) {
        this.reader = reader;
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
     * Run `fn` with `self` of a `where` or `field` bound to `value`. A binder no expression reads
     * `self` of binds nothing.
     *
     * @template T
     * @param {ItemBinder} binder
     * @param {unknown} value
     * @param {() => T} fn
     * @returns {T}
     */
    bind(binder, value, fn) {
        if (!binder.node) return fn();
        // Frames are keyed by binder: a list read once per run may be pulled from inside another's frame
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
 * The frame of the `where` or `field` a per-item expression reads `self` of.
 *
 * @param {ItemBinder} binder
 * @param {EvaluationContext} ctx
 */
function frameOf(binder, ctx) {
    const frame = ctx.frames.get(binder);
    if (!frame) throw new DetectionError('`self` read outside the `where` or `field` it is bound by');
    return frame;
}

/**
 * Where an expression's value is kept: per item when it reads `self` of a `where` or `field`, else per run.
 *
 * @param {Node} node
 * @param {EvaluationContext} ctx
 * @returns {Map<Node, unknown>}
 */
function memoFor(node, ctx) {
    return node.perItem && node.binder ? frameOf(node.binder, ctx).memo : ctx.memo;
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
    if (!node.is) return value;
    return node.is.test(forPredicate(value, node.is), ctx);
}

/**
 * Evaluate an expression's value in a position, without its `is`.
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
        if (node.kind === 'ref') {
            result = evaluateRef(node, position, ctx);
        } else if (node.kind === 'expr') {
            // `expr` gives its operand's value in its own position, or the boolean the operand's `is` gives
            result = node.operand.is ? evaluateOccurrence(node.operand, ctx) : evaluate(node.operand, position, ctx);
        } else if (node.kind === 'source') {
            result = readSource(node, position, ctx);
        } else if (node.kind === 'item') {
            result = frameOf(node.binder, ctx).value;
        } else {
            const memo = memoFor(node, ctx);
            if (memo.has(node)) {
                result = memo.get(node);
            } else {
                result = compute(node, ctx);
                memo.set(node, result);
            }
        }
        if (node.as && isScalar(result)) ctx.measured[node.as] = result;
        if (!isFailure(result)) checkType(result, position);
        return result;
    } catch (e) {
        ctx.errorAt ??= { path: node.path, as: node.as, message: e instanceof Error ? e.message : String(e) };
        throw e;
    }
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
 * @param {unknown} value
 * @returns {boolean}
 */
function isScalar(value) {
    return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Read a target from a `ref`, in the ref's position. A target inside an `if` branch not taken, and
 * not enclosing the ref, is not read.
 *
 * @param {RefNode} ref
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function evaluateRef(ref, position, ctx) {
    const target = /** @type {Node} */ (ref.target);
    for (const branch of target.branches) {
        if (ref.branches.includes(branch)) continue;
        const decided = evaluate(branch.node, branch.node.position, ctx);
        if (isFailure(decided)) return decided;
        if (ctx.branchTaken.get(branch.node) !== branch.branch) return NOT_READ;
    }
    return evaluate(target, position, ctx);
}

/**
 * A source's value, read once per run, or once per item when it reads `self`: a list's buffer, or the
 * value an `api` reads. In boolean position, a list gives whether it holds an item.
 *
 * @param {SourceNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function readSource(node, position, ctx) {
    const memo = memoFor(node, ctx);
    let value = memo.get(node);
    if (!memo.has(node)) {
        value = node.source.read(node.bodies, ctx);
        memo.set(node, value);
    }
    if (!(value instanceof ItemBuffer)) return value;
    // The condition leaf: `element` and `text` hold when they select an item
    if (position === 'boolean' && node.source.key !== 'api') return presence(value);
    if (position === 'number') return single(value);
    return value;
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
 * The buffer over a list: an `ItemBuffer` itself, or one over an iterable value's members, shared by
 * every operator reading that value.
 *
 * @param {unknown} value
 * @param {string} operator
 * @param {EvaluationContext} ctx
 * @returns {ItemBuffer}
 */
function listOf(value, operator, ctx) {
    if (value instanceof ItemBuffer) return value;
    if (!isList(value, ctx)) throw new DetectionError(`'${operator}' takes a list, got ${typeName(value)}`);
    const key = /** @type {object} */ (value);
    let buffer = ctx.lists.get(key);
    if (!buffer) {
        buffer = new ItemBuffer(eachMember(value, ctx));
        ctx.lists.set(key, buffer);
    }
    return buffer;
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
 * @param {Exclude<Node, RefNode | SourceNode | ExprNode | ItemNode>} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function compute(node, ctx) {
    switch (node.kind) {
        case 'literal':
            return node.value;
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
            const test = evaluateOccurrence(node.test, ctx);
            if (isFailure(test)) return test;
            const branch = test ? 'then' : 'else';
            ctx.branchTaken.set(node, branch);
            return evaluateOccurrence(node[branch], ctx);
        }
    }
}

/**
 * `"using": "length"`. A selected list's length reads items only up to the bound its predicates need;
 * any other value's `length` is read as `using` reads a path.
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
        const count = value.shortcuts.countAll?.();
        if (count !== undefined) return Math.min(count, node.bound);
    }
    return value.pull(node.bound) ?? Math.min(value.values.length, node.bound);
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
    if (operand.position === 'spread' && isList(value, ctx)) return { list: listOf(value, operator, ctx) };
    return { value };
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
 * Evaluate operands in order until one decides the result. A list operand contributes each value,
 * pulled one at a time.
 *
 * @param {LogicNode} node
 * @param {EvaluationContext} ctx
 * @returns {boolean | Failure}
 */
function computeLogic(node, ctx) {
    // The value that decides the result, and the result it gives
    const decider = node.kind === 'any' || node.kind === 'none';
    const decided = node.kind === 'any';
    for (const operand of node.operands) {
        const spread = readSpread(operand, node.kind, ctx);
        if (isFailure(spread)) return spread;
        if ('list' in spread) {
            const buffer = spread.list;
            for (let i = 0; ; i++) {
                const failure = buffer.pull(i + 1);
                if (failure) return failure;
                if (buffer.values.length <= i) break;
                if (expectBoolean(buffer.values[i], node.kind) === decider) return decided;
            }
        } else if (expectBoolean(spread.value, node.kind) === decider) {
            return decided;
        }
    }
    return !decided;
}

/** @typedef {true | false | 'aborted'} MatchResult */

/**
 * Evaluate a detector's `match`.
 *
 * @param {Node} match
 * @param {EvaluationContext} ctx
 * @returns {{ detected: MatchResult, abortError?: string }}
 */
export function evaluateMatchNode(match, ctx) {
    const result = evaluateOccurrence(match, ctx);
    if (isFailure(result)) return { detected: 'aborted', ...(result.error && { abortError: result.error }) };
    return { detected: result === true };
}

/**
 * @typedef {{ type: 'payloadEval', payloadKey: string }} DataError
 * @typedef {Record<string, string | number | boolean | null | DataError[]>} PayloadData
 */

const OMIT = Symbol('omit');

/**
 * Compute a payload after a match, through the run's memo and buffers.
 *
 * A key is omitted when its value fails or JSON cannot carry it as a scalar, when `when` does not hold
 * or fails, and with `buckets` when the value is in no bucket or a bucket fails. A key whose value,
 * `when` or bucket errors is omitted and recorded in `_errors`.
 *
 * @param {CompiledPayloadField[]} fields
 * @param {EvaluationContext} ctx
 * @returns {PayloadData}
 */
export function evaluatePayload(fields, ctx) {
    /** @type {PayloadData} */
    const data = {};
    /** @type {DataError[]} */
    const errors = [];
    for (const field of fields) {
        try {
            const value = payloadValue(field, ctx);
            if (value !== OMIT) data[field.key] = value;
        } catch {
            errors.push({ type: 'payloadEval', payloadKey: field.key });
        }
    }
    if (errors.length > 0) {
        data._errors = errors.sort((a, b) => (a.payloadKey < b.payloadKey ? -1 : a.payloadKey > b.payloadKey ? 1 : 0));
    }
    return data;
}

/**
 * @param {CompiledPayloadField} field
 * @param {EvaluationContext} ctx
 * @returns {string | number | boolean | null | typeof OMIT}
 */
function payloadValue(field, ctx) {
    const value = evaluateOccurrence(field.value, ctx);
    if (isFailure(value)) return OMIT;
    if (value instanceof ItemBuffer && !field.buckets)
        throw new DetectionError('a list is sent bucketed, through only, or as its length through using');
    /**
     * @param {CompiledPredicate} predicate
     * @returns {boolean | Failure}
     */
    const test = (predicate) => predicate.test(forPredicate(value, predicate), ctx);
    if (field.when && test(field.when) !== true) return OMIT;
    if (field.buckets) {
        for (const [name, bucket] of field.buckets) {
            const held = test(bucket);
            if (isFailure(held)) return OMIT;
            if (held) return name;
        }
        return OMIT;
    }
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && numberIsFinite(value)) return value;
    return OMIT;
}

/**
 * Compile and evaluate a `match` on its own.
 *
 * @param {unknown} match
 * @param {object} [global] - the global object reads go through
 * @returns {MatchResult} throws on a parse error or an error
 */
export function evaluateMatch(match, global = globalThis) {
    const compiled = compileDetector({ match: /** @type {any} */ (match) }, global);
    return evaluateMatchNode(compiled.match, new EvaluationContext(new NativeReader(global, compiled.names))).detected;
}
