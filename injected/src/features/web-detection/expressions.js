import { numberIsFinite } from '../../captured-globals.js';
import { DetectionError, Failure, isFailure, typeName } from './core.js';
import { compileDetector } from './parse.js';
import { NativeReader } from './predicates.js';
import { ItemBuffer } from './sources.js';

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
 * What an expression's position expects. `values` is a list of values: each value a source gives.
 *
 * @typedef {'boolean' | 'value' | 'number' | 'items' | 'values'} Position
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
 * @typedef {NodeBase & { kind: 'first' | 'last', operand: Node }} PickNode
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
 * A source in items or values position: the shared buffer and what can skip it.
 *
 * @typedef {{ buffer: ItemBuffer, node: SourceNode }} ItemsHandle
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
    /** @type {Map<SourceNode, ItemBuffer>} */
    buffers = new Map();
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
    const read = evaluate(node, node.position, ctx);
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
            result = withCatch(node, ctx, readSource(node, position, ctx));
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
        if (position === 'number' && !isFailure(result) && typeof result.value !== 'number') {
            throw new DetectionError(`expected a number, got ${typeName(result.value)}`);
        }
        return result;
    } catch (e) {
        ctx.errorAt ??= { path: node.path, as: node.as, message: e instanceof Error ? e.message : String(e) };
        throw e;
    }
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
 * @param {SourceNode} node
 * @param {EvaluationContext} ctx
 * @returns {ItemBuffer}
 */
function bufferFor(node, ctx) {
    let buffer = ctx.buffers.get(node);
    if (!buffer) {
        /** @type {Track} */
        const track = { measured: true };
        buffer = new ItemBuffer(node.source.items(node.bodies, ctx, track), track);
        ctx.buffers.set(node, buffer);
    }
    return buffer;
}

/**
 * @param {SourceNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure}
 */
function readSource(node, position, ctx) {
    switch (position) {
        case 'boolean': {
            if (!ctx.buffers.has(node)) {
                const any = node.source.hasAny?.(node.bodies);
                if (any !== undefined) return { value: any, measured: true };
            }
            const buffer = bufferFor(node, ctx);
            const failure = buffer.pull(1);
            if (failure) return failure;
            return { value: buffer.values.length > 0, measured: buffer.track.measured };
        }
        case 'value':
        case 'number': {
            const buffer = bufferFor(node, ctx);
            const failure = buffer.pull(2);
            if (failure) return failure;
            if (buffer.values.length !== 1) {
                throw new DetectionError(`a source in value position selected ${buffer.values.length === 0 ? 'no item' : 'several items'}`);
            }
            return { value: buffer.values[0], measured: buffer.track.measured };
        }
        default:
            return { value: /** @type {ItemsHandle} */ ({ buffer: bufferFor(node, ctx), node }), measured: true };
    }
}

/**
 * @param {Node} operand - in items or values position
 * @param {EvaluationContext} ctx
 * @returns {ItemsHandle | Failure}
 */
function itemsOf(operand, ctx) {
    const read = evaluate(operand, operand.position, ctx);
    if (isFailure(read)) return read;
    return /** @type {ItemsHandle} */ (read.value);
}

/**
 * Every value a list operand gives.
 *
 * @param {Node} operand
 * @param {EvaluationContext} ctx
 * @returns {Read | Failure} a `Read` of an array
 */
function allValues(operand, ctx) {
    const handle = itemsOf(operand, ctx);
    if (isFailure(handle)) return handle;
    const failure = handle.buffer.pull(Infinity);
    if (failure) return failure;
    return { value: handle.buffer.values, measured: handle.buffer.track.measured };
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
        case 'first':
        case 'last': {
            const handle = itemsOf(node.operand, ctx);
            if (isFailure(handle)) return handle;
            const failure = handle.buffer.pull(node.kind === 'first' ? 1 : Infinity);
            if (failure) return failure;
            const values = handle.buffer.values;
            if (values.length === 0) throw new DetectionError(`'${node.kind}' over no values`);
            return { value: node.kind === 'first' ? values[0] : values[values.length - 1], measured: handle.buffer.track.measured };
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
    const handle = itemsOf(node.operand, ctx);
    if (isFailure(handle)) return handle;
    const { buffer, node: source } = handle;
    if (!buffer.started) {
        const count = source.source.countAll?.(source.bodies);
        if (count !== undefined) return { value: Math.min(count, node.bound), measured: true };
    }
    const failure = buffer.pull(node.bound);
    if (failure) return failure;
    return { value: Math.min(buffer.values.length, node.bound), measured: buffer.track.measured };
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
        const read = operand.position === 'values' ? allValues(operand, ctx) : evaluateOccurrence(operand, ctx);
        if (isFailure(read)) return read;
        measured &&= read.measured;
        if (operand.position === 'values') {
            for (const value of /** @type {unknown[]} */ (read.value)) values.push(expectNumber(value, node.kind));
        } else {
            values.push(expectNumber(read.value, node.kind));
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
        if (operand.position === 'values') {
            const handle = itemsOf(operand, ctx);
            if (isFailure(handle)) return handle;
            const { buffer } = handle;
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
            const read = evaluateOccurrence(operand, ctx);
            if (isFailure(read)) return read;
            measured &&= read.measured;
            if (expectBoolean(read.value, node.kind) === decider) return { value: decided, measured };
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
    /** @type {Track} */
    const track = { measured: true };
    if (field.when && field.when.test(value, ctx, track) !== true) return OMIT;
    if (field.buckets) {
        for (const [name, bucket] of field.buckets) {
            const held = bucket.test(value, ctx, track);
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
