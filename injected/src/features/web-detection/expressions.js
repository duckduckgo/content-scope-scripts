import { numberIsFinite } from '../../captured-globals.js';
import { DetectionError, Failure, isFailure, typeName } from './core.js';
import { compileDetector } from './parse.js';
import { NativeReader } from './predicates.js';
import { ItemBuffer, eachMember, isList } from './sources.js';

/**
 * @typedef {import('./core.js').FailureKind} FailureKind
 * @typedef {import('./core.js').Track} Track
 * @typedef {import('./predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./predicates.js').PredicateContext} PredicateContext
 */

/**
 * @template Body
 * @typedef {import('./sources.js').Source<Body>} Source
 */

/**
 * What an expression's position expects. `spread` is an operand of `sum`, `mul`, `min`, `max`, `any`,
 * `all` and `none` that may be a list, contributing each item. `root` is a node or a list of nodes.
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
 * @property {Partial<Record<FailureKind, Node>>} [catch]
 * @property {CompiledPredicate} [is]
 * @property {Branch[]} branches - the `if` branches enclosing this expression, outermost first
 */

/**
 * @typedef {NodeBase & { kind: 'literal', value: number | boolean }} LiteralNode
 * @typedef {NodeBase & { kind: 'source', source: Source<any>, bodies: unknown[] }} SourceNode
 * @typedef {NodeBase & { kind: 'count', operand: Node, bound: number }} CountNode
 * @typedef {NodeBase & { kind: 'only' | 'first' | 'last', operand: Node }} PickNode
 * @typedef {NodeBase & { kind: 'sum' | 'mul' | 'min' | 'max' | 'sub' | 'div', operands: Node[] }} ArithmeticNode
 * @typedef {NodeBase & { kind: 'any' | 'all' | 'none' | 'and', operands: Node[] }} LogicNode
 * @typedef {NodeBase & { kind: 'if', test: Node, then: Node, else: Node }} IfNode
 * @typedef {NodeBase & { kind: 'ref', name: string, target?: Node }} RefNode
 * @typedef {LiteralNode | SourceNode | CountNode | PickNode | ArithmeticNode | LogicNode | IfNode | RefNode} Node
 */

/**
 * @typedef {object} CompiledPayloadField
 * @property {string} key
 * @property {Node} value
 * @property {CompiledPredicate} [when]
 * @property {Array<[string, CompiledPredicate]>} [buckets]
 */

/**
 * A value an expression read, and whether it was measured: read from the page rather than taken from
 * a `catch` handler or computed from one.
 *
 * @typedef {{ value: unknown, measured: boolean }} Read
 */

/**
 * A list an operator reads, and whether the value holding it was measured.
 *
 * @typedef {{ buffer: ItemBuffer, measured: boolean }} ListRead
 */

/** A payload reading an expression inside an `if` branch not taken. Never reaches `catch`. */
export const NOT_READ = new Failure(/** @type {FailureKind} */ (/** @type {unknown} */ ('notRead')));

/**
 * Per-run state, threaded to every expression. Each expression is computed at most once per run.
 *
 * @implements {PredicateContext}
 */
export class EvaluationContext {
    /** @type {Map<Node, Read | Failure>} each computed expression's value after its `catch`, or its failure */
    memo = new Map();
    /** @type {Map<object, ItemBuffer>} the buffer over each iterable value a list operator reads */
    lists = new Map();
    /** @type {Record<string, unknown>} measured scalar values by name */
    measured = {};
    /** @type {Array<{ kind: FailureKind, as?: string, path: string }>} failures a `catch` handled */
    handled = [];
    /** @type {Map<IfNode, 'then' | 'else'>} */
    branchTaken = new Map();
    /** @type {{ path: string, as?: string, message: string } | undefined} the innermost expression an error was thrown from */
    errorAt;

    /**
     * @param {NativeReader} reader
     */
    constructor(reader) {
        this.reader = reader;
    }

    /**
     * @param {unknown} operand - a compiled expression in number position
     * @param {Track} track
     * @returns {unknown}
     */
    operand(operand, track) {
        const read = evaluate(/** @type {Node} */ (operand), 'number', this);
        if (isFailure(read)) return read;
        if (!read.measured) track.measured = false;
        return read.value;
    }

    /**
     * @param {unknown} expression - a compiled expression, read in the position it was compiled for
     * @param {Track} track
     * @returns {unknown}
     */
    read(expression, track) {
        const node = /** @type {Node} */ (expression);
        const read = evaluate(node, node.position, this);
        if (isFailure(read)) return read;
        if (!read.measured) track.measured = false;
        return read.value;
    }
}

/**
 * Evaluate an expression where it sits: with `is`, the boolean its predicate gives.
 *
 * @param {Node} node
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
export function evaluateOccurrence(node, ctx) {
    if (!node.is) return evaluate(node, node.position, ctx);
    const read = forPredicate(node, evaluate(node, node.position, ctx), node.is, ctx);
    /** @type {Track} */
    const track = { measured: true };
    const result = node.is.test(isFailure(read) ? read : read.value, ctx, track);
    if (isFailure(result)) return result;
    return { value: result, measured: (isFailure(read) || read.measured) && track.measured };
}

/**
 * Evaluate an expression's value in a position, without its `is`.
 *
 * @param {Node} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
export function evaluate(node, position, ctx) {
    try {
        /** @type {Read | Failure} */
        let result;
        if (node.kind === 'ref') {
            result = evaluateRef(node, position, ctx);
        } else if (node.kind === 'source') {
            result = readSource(node, position, ctx);
        } else {
            const memoized = ctx.memo.get(node);
            if (memoized) {
                result = memoized;
            } else {
                result = withCatch(node, ctx, compute(node, ctx));
                ctx.memo.set(node, result);
            }
        }
        if (node.as && !isFailure(result) && result.measured && isScalar(result.value)) {
            ctx.measured[node.as] = result.value;
        }
        if (!isFailure(result)) checkType(result.value, position);
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
        throw new DetectionError('a list is read through any, all, none, count, only, first or last');
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
 * Apply an expression's `catch`: a failure of a listed kind takes the handler's value, which is not
 * measured.
 *
 * @param {Node} node
 * @param {EvaluationContext} ctx
 * @param {Read | Failure} result
 * @returns {Read | Failure}
 */
function withCatch(node, ctx, result) {
    if (!isFailure(result) || !node.catch) return result;
    const handler = node.catch[result.kind];
    if (!handler) return result;
    ctx.handled.push({ kind: result.kind, as: node.as, path: node.path });
    const handled = evaluateOccurrence(handler, ctx);
    if (isFailure(handled)) return handled;
    return { value: handled.value, measured: false };
}

/**
 * Read a target from a `ref`, in the ref's position. A target inside an `if` branch not taken, and
 * not enclosing the ref, is not read.
 *
 * @param {RefNode} ref
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
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
 * A source's value, read once per run: a list's buffer, or the value an `api` reads. In boolean
 * position, a list gives whether it holds an item.
 *
 * @param {SourceNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function readSource(node, position, ctx) {
    let read = ctx.memo.get(node);
    if (!read) {
        /** @type {Track} */
        const track = { measured: true };
        const value = node.source.read(node.bodies, ctx, track);
        read = withCatch(node, ctx, isFailure(value) ? value : { value, measured: track.measured });
        ctx.memo.set(node, read);
    }
    if (isFailure(read) || !(read.value instanceof ItemBuffer)) return read;
    // The condition leaf: `element` and `text` hold when they select an item
    if (position === 'boolean' && node.source.key !== 'api') return withCatch(node, ctx, presence(read.value));
    if (position === 'number') return withCatch(node, ctx, single(read.value));
    return read;
}

/**
 * A selected list where a scalar is needed: its one item.
 *
 * @param {ItemBuffer} buffer
 * @returns {Read | Failure}
 */
function single(buffer) {
    const failure = buffer.pull(2);
    if (failure) return failure;
    if (buffer.values.length !== 1) {
        throw new DetectionError(`a list where one value is needed holds ${buffer.values.length === 0 ? 'no item' : 'several items'}`);
    }
    return { value: buffer.values[0], measured: buffer.track.measured };
}

/**
 * What a predicate tests when an expression gives a selected list: its one item when the predicate
 * compares, else the list as an array.
 *
 * @param {Node} node
 * @param {Read | Failure} read
 * @param {CompiledPredicate} predicate
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function forPredicate(node, read, predicate, ctx) {
    if (isFailure(read) || !(read.value instanceof ItemBuffer)) return read;
    const buffer = read.value;
    const result = withCatch(node, ctx, predicate.scalar ? single(buffer) : allItems({ buffer, measured: true }));
    if (isFailure(result)) return result;
    return { value: result.value, measured: read.measured && result.measured };
}

/**
 * @param {ItemBuffer} buffer
 * @returns {Read | Failure} whether the list holds an item
 */
function presence(buffer) {
    if (!buffer.started) {
        const any = buffer.shortcuts.hasAny?.();
        if (any !== undefined) return { value: any, measured: true };
    }
    const failure = buffer.pull(1);
    if (failure) return failure;
    return { value: buffer.values.length > 0, measured: buffer.track.measured };
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
        buffer = new ItemBuffer(eachMember(value, ctx), { measured: true });
        ctx.lists.set(key, buffer);
    }
    return buffer;
}

/**
 * @param {Node} operand - in list position
 * @param {string} operator
 * @param {EvaluationContext} ctx
 * @returns {ListRead | Failure}
 */
function readList(operand, operator, ctx) {
    const read = evaluate(operand, operand.position, ctx);
    if (isFailure(read)) return read;
    return { buffer: listOf(read.value, operator, ctx), measured: read.measured };
}

/**
 * Every item of a list.
 *
 * @param {ListRead} list
 * @returns {Read | Failure} a `Read` of an array
 */
function allItems(list) {
    const failure = list.buffer.pull(Infinity);
    if (failure) return failure;
    return { value: list.buffer.values, measured: list.measured && list.buffer.track.measured };
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
 * @param {Exclude<Node, RefNode | SourceNode>} node
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function compute(node, ctx) {
    switch (node.kind) {
        case 'literal':
            return { value: node.value, measured: true };
        case 'count':
            return computeCount(node, ctx);
        case 'only':
        case 'first':
        case 'last': {
            const list = readList(node.operand, node.kind, ctx);
            if (isFailure(list)) return list;
            const failure = list.buffer.pull(node.kind === 'only' ? 2 : node.kind === 'first' ? 1 : Infinity);
            if (failure) return failure;
            const values = list.buffer.values;
            if (values.length === 0) throw new DetectionError(`'${node.kind}' over no items`);
            if (node.kind === 'only' && values.length > 1) throw new DetectionError(`'only' over several items`);
            const value = node.kind === 'last' ? values[values.length - 1] : values[0];
            return { value, measured: list.measured && list.buffer.track.measured };
        }
        case 'sum':
        case 'mul':
        case 'min':
        case 'max':
        case 'sub':
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
            const branch = test.value ? 'then' : 'else';
            ctx.branchTaken.set(node, branch);
            const result = evaluateOccurrence(node[branch], ctx);
            if (isFailure(result)) return result;
            return { value: result.value, measured: test.measured && result.measured };
        }
    }
}

/**
 * @param {CountNode} node
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function computeCount(node, ctx) {
    const list = readList(node.operand, 'count', ctx);
    if (isFailure(list)) return list;
    const { buffer } = list;
    if (!buffer.started) {
        const count = buffer.shortcuts.countAll?.();
        if (count !== undefined) return { value: Math.min(count, node.bound), measured: list.measured };
    }
    const failure = buffer.pull(node.bound);
    if (failure) return failure;
    return { value: Math.min(buffer.values.length, node.bound), measured: list.measured && buffer.track.measured };
}

/**
 * An operand that may be a list: its items when it is one, else itself.
 *
 * @param {Node} operand
 * @param {string} operator
 * @param {EvaluationContext} ctx
 * @returns {{ list: ListRead } | { read: Read } | Failure}
 */
function readSpread(operand, operator, ctx) {
    const read = operand.position === 'spread' ? evaluate(operand, 'spread', ctx) : evaluateOccurrence(operand, ctx);
    if (isFailure(read)) return read;
    if (operand.position === 'spread' && isList(read.value, ctx)) {
        return { list: { buffer: listOf(read.value, operator, ctx), measured: read.measured } };
    }
    return { read };
}

/**
 * @param {ArithmeticNode} node
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function computeArithmetic(node, ctx) {
    /** @type {number[]} */
    const values = [];
    let measured = true;
    for (const operand of node.operands) {
        const spread = readSpread(operand, node.kind, ctx);
        if (isFailure(spread)) return spread;
        if ('list' in spread) {
            const items = allItems(spread.list);
            if (isFailure(items)) return items;
            measured &&= items.measured;
            for (const value of /** @type {unknown[]} */ (items.value)) values.push(expectNumber(value, node.kind));
        } else {
            measured &&= spread.read.measured;
            values.push(expectNumber(spread.read.value, node.kind));
        }
    }
    /** @type {number} */
    let value;
    switch (node.kind) {
        case 'sum':
            value = values.reduce((a, b) => a + b, 0);
            break;
        case 'mul':
            value = values.reduce((a, b) => a * b, 1);
            break;
        case 'min':
        case 'max':
            if (values.length === 0) throw new DetectionError(`'${node.kind}' over no values`);
            value = node.kind === 'min' ? Math.min(...values) : Math.max(...values);
            break;
        case 'sub':
            value = /** @type {number} */ (values[0]) - /** @type {number} */ (values[1]);
            break;
        case 'div':
            value = /** @type {number} */ (values[0]) / /** @type {number} */ (values[1]);
            break;
    }
    return { value, measured };
}

/**
 * Evaluate operands in order until one decides the result. A list operand contributes each value,
 * pulled one at a time.
 *
 * @param {LogicNode} node
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function computeLogic(node, ctx) {
    // The value that decides the result, and the result it gives
    const decider = node.kind === 'any' || node.kind === 'none';
    const decided = node.kind === 'any';
    let measured = true;
    for (const operand of node.operands) {
        const spread = readSpread(operand, node.kind, ctx);
        if (isFailure(spread)) return spread;
        if ('list' in spread) {
            const { buffer } = spread.list;
            measured &&= spread.list.measured;
            for (let i = 0; ; i++) {
                const failure = buffer.pull(i + 1);
                if (failure) return failure;
                if (buffer.values.length <= i) break;
                if (expectBoolean(buffer.values[i], node.kind) === decider) {
                    return { value: decided, measured: measured && buffer.track.measured };
                }
            }
            measured &&= buffer.track.measured;
        } else {
            measured &&= spread.read.measured;
            if (expectBoolean(spread.read.value, node.kind) === decider) return { value: decided, measured };
        }
    }
    return { value: !decided, measured };
}

/** @typedef {true | false | 'aborted'} MatchResult */

/**
 * Evaluate a detector's `match`.
 *
 * @param {Node} match
 * @param {EvaluationContext} ctx
 * @returns {{ detected: MatchResult, abortKind?: FailureKind }}
 */
export function evaluateMatchNode(match, ctx) {
    const read = evaluateOccurrence(match, ctx);
    if (isFailure(read)) return { detected: 'aborted', abortKind: read.kind };
    return { detected: read.value === true };
}

/**
 * @typedef {{ type: 'payloadEval', payloadKey: string }} DataError
 * @typedef {Record<string, string | number | boolean | null | DataError[]>} PayloadData
 */

const OMIT = Symbol('omit');

/**
 * Compute a payload after a match, through the run's memo and buffers.
 *
 * A key is omitted when its value fails, is not measured or JSON cannot carry it as a scalar, when
 * `when` does not hold or fails, and with `buckets` when the value is in no bucket or a bucket fails.
 * A key whose value, `when` or bucket errors is omitted and recorded in `_errors`.
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
    const read = evaluateOccurrence(field.value, ctx);
    if (isFailure(read) || !read.measured) return OMIT;
    const value = read.value;
    if (value instanceof ItemBuffer && !field.buckets)
        throw new DetectionError('a list is sent bucketed, or through count, only, first or last');
    /** @type {Track} */
    const track = { measured: true };
    /**
     * @param {CompiledPredicate} predicate
     * @returns {boolean | Failure | typeof OMIT}
     */
    const test = (predicate) => {
        const subject = forPredicate(field.value, read, predicate, ctx);
        if (!isFailure(subject) && !subject.measured) return OMIT;
        return predicate.test(isFailure(subject) ? subject : subject.value, ctx, track);
    };
    if (field.when && test(field.when) !== true) return OMIT;
    if (field.buckets) {
        for (const [name, bucket] of field.buckets) {
            const held = test(bucket);
            if (held === OMIT || isFailure(held)) return OMIT;
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
