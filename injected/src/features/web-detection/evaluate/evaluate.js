import { JSONparse, JSONstringify } from '../../../captured-globals.js';
import { DetectionError, decides, errorPath, isFailure, isScalar, thrownFailure, thrownMessage, typeName } from '../model/core.js';
import { IterRecipe, ItemBuffer, ItemStream, asList, isItemBuffer, isItemStream, isIterRecipe, listMembers } from '../model/lists.js';
import { evaluateArgs, readPath } from '../predicates/fields.js';
import { testPredicate } from '../predicates/predicates.js';
import { selectItems } from '../sources/common.js';

/**
 * @import { Failure } from '../model/core.js'
 * @import { ActionNode, ArithmeticNode, CompiledPayloadField, IfNode, ItemBinder, IterNode, LengthNode, LogicNode } from '../model/types.js'
 * @import { Node, OnlyNode, PayloadData, Position, SequenceNode, SourceNode, UsingNode } from '../model/types.js'
 * @import { CompiledPredicate } from '../predicates/predicates.js'
 * @import { EvaluationContext } from './context.js'
 */

/**
 * The value the `using`, `where` or `field` an expression reads `self` of is binding.
 *
 * @param {ItemBinder} binder
 * @param {EvaluationContext} ctx
 * @returns {unknown}
 */
function boundValue(binder, ctx) {
    if (!ctx.frames.has(binder)) throw new DetectionError('`self` read outside the `using`, `where` or `field` it is bound by');
    return ctx.frames.get(binder);
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
            case 'ref': {
                const value = (node.name.startsWith('this.') ? ctx.detectorNames : ctx.runNames).get(node.name);
                result = isIterRecipe(value) ? readIter(value.node, position, ctx) : positioned(value, position);
                break;
            }
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
                result = boundValue(node.binder, ctx);
                break;
            case 'literal':
                result = node.value;
                break;
            case 'list':
                // Every entry, in order, as `args` passes it: a selected list as an array of its items
                result = evaluateArgs(node.entries, ctx);
                break;
            case 'iter':
                result = readIter(node, position, ctx);
                break;
            case 'length':
                result = computeLength(node, ctx);
                break;
            case 'only':
                result = computeOnly(node, ctx);
                break;
            case 'sum':
            case 'mul':
            case 'div':
                result = computeArithmetic(node, ctx);
                break;
            case 'any':
            case 'all':
            case 'none':
            case 'and':
                result = computeLogic(node, ctx);
                break;
            case 'if':
                result = computeIf(node, ctx);
                break;
            case 'sequence':
                result = computeSequence(node, ctx);
                break;
            case 'define':
            case 'fireEvent':
            case 'breakageReportData':
                result = runAction(node, ctx);
                break;
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
    ctx.errorAt ??= { path: at, message: thrownMessage(error) };
    return error;
}

/**
 * @param {unknown} value
 * @param {Position} position
 */
function checkType(value, position) {
    if (isItemBuffer(value) && position === 'boolean') {
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
    if (!isItemBuffer(value)) return value;
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
 * A source's value, read each time evaluation reaches it: a list's buffer, or the value an `api` reads.
 * In boolean position, the condition leaf gives whether it holds an item.
 *
 * @param {SourceNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function readSource(node, position, ctx) {
    const value = node.source.read(node.bodies, ctx);
    if (isItemBuffer(value)) value.leaf = node.leaf;
    return positioned(value, position);
}

/**
 * An `iter` where it is read: as it streams for an operand of `sum`, `mul`, `any`, `all` and `none`,
 * else a list read in full, whose length a new stream of it counts.
 *
 * @param {IterNode} node
 * @param {Position} position
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function readIter(node, position, ctx) {
    if (position === 'stream' || position === 'spread') return new ItemStream(iterItems(node, ctx));
    return positioned(new ItemBuffer(iterItems(node, ctx), { count: () => countIter(node, ctx) }), position);
}

/**
 * An `iter`'s values, each read when the reader asks for it: the source's items or the entries'
 * values, through `where` then `field`. A `Failure` ends them.
 *
 * @param {IterNode} node
 * @param {EvaluationContext} ctx
 * @returns {Generator<unknown>}
 */
function* iterItems(node, ctx) {
    const items = node.source ? sourceItems(evaluate(node.source, node.source.position, ctx), ctx) : entryItems(node.entries ?? [], ctx);
    yield* selectItems(items, node, ctx);
}

/**
 * The items of a source's value: a list's buffer, read without keeping them, or an iterable's members.
 *
 * @param {unknown} value - the value, or a `Failure`
 * @param {EvaluationContext} ctx
 * @returns {Generator<unknown>}
 */
function* sourceItems(value, ctx) {
    if (isFailure(value)) {
        yield value;
        return;
    }
    if (isItemBuffer(value)) {
        // A source gives a new buffer each time evaluation reaches it, so no other read shares it
        yield* bufferItems(value, true);
        return;
    }
    const members = listMembers(value, ctx);
    if (members === undefined) throw new DetectionError(`'iter' takes a list, got ${typeName(value)}`);
    if (isFailure(members)) yield members;
    else yield* members;
}

/**
 * Each entry's value, evaluated when the one before it has been read. A list entry contributes each item.
 *
 * @param {Node[]} entries
 * @param {EvaluationContext} ctx
 * @returns {Generator<unknown>}
 */
function* entryItems(entries, ctx) {
    for (const entry of entries) {
        const spread = readSpread(entry, ctx);
        if (isFailure(spread)) yield spread;
        else if ('stream' in spread) yield* spread.stream.items;
        else if ('list' in spread) yield* bufferItems(spread.list, entry.kind === 'source');
        else if (isItemBuffer(spread.value)) yield* bufferItems(spread.value, entry.kind === 'source');
        else {
            // In value position, a list such as `{"expr": [...]}` contributes each item, as an operand's does
            const members = listMembers(spread.value, ctx);
            if (members === undefined) yield spread.value;
            else if (isFailure(members)) yield members.at(entry.path);
            else yield* members;
        }
    }
}

/**
 * A buffer's items: through its iterator when `take` is set and no read has started, keeping none,
 * else as the buffer keeps them. A `Failure` ends them.
 *
 * @param {ItemBuffer} buffer
 * @param {boolean} take - whether no other read shares the buffer
 * @returns {Generator<unknown>}
 */
function* bufferItems(buffer, take) {
    const iterator = take ? buffer.take() : undefined;
    if (iterator) {
        for (let next = iterator.next(); !next.done; next = iterator.next()) {
            yield next.value;
            if (isFailure(next.value)) return;
        }
        return;
    }
    for (let i = 0; ; i++) {
        const failure = buffer.pull(i + 1);
        if (failure) {
            yield failure;
            return;
        }
        if (i >= buffer.values.length) return;
        yield buffer.values[i];
    }
}

/**
 * The number of an `iter`'s values, read as they stream, or through the source's own count without
 * `where` or `field`.
 *
 * @param {IterNode} node
 * @param {EvaluationContext} ctx
 * @returns {number | undefined} `undefined` where a value fails, for the list read in full to report it
 */
function countIter(node, ctx) {
    /** @type {Iterable<unknown>} */
    let items;
    if (node.source && !node.where && !node.field) {
        const value = evaluate(node.source, node.source.position, ctx);
        if (isItemBuffer(value) && !value.started) {
            const count = value.shortcuts.count?.();
            if (count !== undefined) return count;
        }
        items = sourceItems(value, ctx);
    } else {
        items = iterItems(node, ctx);
    }
    let count = 0;
    for (const item of items) {
        if (isFailure(item)) return undefined;
        count++;
    }
    return count;
}

/**
 * A selected list where a scalar is needed: its one item.
 *
 * @param {ItemBuffer} buffer
 * @returns {unknown} the item, or a `Failure`
 */
export function single(buffer) {
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
    if (!isItemBuffer(value)) return value;
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
export function listOf(value, operator, ctx) {
    const list = asList(value, ctx);
    if (!list) throw new DetectionError(`'${operator}' takes a list, got ${typeName(value)}`);
    return list;
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
export function allItems(buffer) {
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
 * @param {OnlyNode} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the one item, or a `Failure`
 */
function computeOnly(node, ctx) {
    const buffer = readList(node.operand, node.kind, ctx);
    if (isFailure(buffer)) return buffer;
    const failure = buffer.pull(2);
    if (failure) return failure;
    const values = buffer.values;
    if (values.length === 0) throw new DetectionError(`'only' over no items`);
    if (values.length > 1) throw new DetectionError(`'only' over several items`);
    return values[0];
}

/**
 * The one expression that skips part of its config: only the branch taken is evaluated.
 *
 * @param {IfNode} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the value, or a `Failure`
 */
function computeIf(node, ctx) {
    const test = evaluateOccurrence(node.test, ctx);
    if (isFailure(test)) return test;
    const branch = test ? node.then : node.else;
    return branch ? evaluateOccurrence(branch, ctx) : undefined;
}

/**
 * @param {SequenceNode} node
 * @param {EvaluationContext} ctx
 * @returns {unknown} the last element's value, or a `Failure`
 */
function computeSequence(node, ctx) {
    /** @type {unknown} */
    let value;
    for (const element of node.elements) {
        value = evaluateOccurrence(element, ctx);
        if (isFailure(value)) return value;
    }
    return value;
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
        const names = node.name.startsWith('this.') ? ctx.detectorNames : ctx.runNames;
        // An `iter` is bound as its expression, which each `ref` evaluates again
        if (node.value.kind === 'iter') {
            names.set(node.name, new IterRecipe(node.value));
            return undefined;
        }
        const value = evaluate(node.value, node.value.position, ctx);
        if (isFailure(value)) return value;
        // A list is held as its buffer, read in full now, so every `ref` reads the same items
        if (isItemBuffer(value)) {
            const failure = value.pull(Infinity);
            if (failure) return failure.at(node.value.path);
        }
        names.set(node.name, value);
        if (isScalar(value)) ctx.measured[node.name] = value;
        return undefined;
    }
    const data = node.data && evaluatePayload(node.data, ctx);
    if (isFailure(data)) return data;
    if (node.kind === 'fireEvent') ctx.sink.fireEvent(node.type, data);
    else ctx.sink.breakageReportData(data ?? {});
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
    if (!isItemBuffer(value)) return readPath(ctx.reader, value, ['length'], undefined);
    if (!value.started) {
        const count = value.shortcuts.count?.();
        if (count !== undefined) return count;
    }
    return value.pull(Infinity) ?? value.values.length;
}

/**
 * An operand that may be a list: its items when it is one, an `iter`'s as they stream, else itself.
 *
 * @param {Node} operand
 * @param {EvaluationContext} ctx
 * @returns {{ list: ItemBuffer } | { stream: ItemStream } | { value: unknown } | Failure}
 */
function readSpread(operand, ctx) {
    const spreads = operand.position === 'spread' || operand.position === 'stream';
    const value = spreads ? evaluate(operand, operand.position, ctx) : evaluateOccurrence(operand, ctx);
    if (isFailure(value)) return value;
    if (!spreads) return { value };
    if (isItemStream(value)) return { stream: value };
    // A bound condition leaf under any / all / none is a boolean, as the leaf itself is
    if (isItemBuffer(value) && value.leaf && operand.single === 'boolean') {
        const held = presence(value);
        return isFailure(held) ? held.at(operand.path) : { value: held };
    }
    if (isItemBuffer(value)) return { list: value };
    const members = listMembers(value, ctx);
    if (isFailure(members)) return members.at(operand.path);
    return members ? { list: new ItemBuffer(members) } : { value };
}

/**
 * @param {ArithmeticNode} node
 * @param {EvaluationContext} ctx
 * @returns {number | Failure}
 */
function computeArithmetic(node, ctx) {
    /** @type {number[]} */
    const values = [];
    // `sum` and `mul` fold each value as it is read, so an `iter` operand keeps none
    let result = node.kind === 'mul' ? 1 : 0;
    /** @param {unknown} value */
    const add = (value) => {
        const number = expectNumber(value, node.kind);
        if (node.kind === 'sum') result += number;
        else if (node.kind === 'mul') result *= number;
        else values.push(number);
    };
    for (const operand of node.operands) {
        const spread = readSpread(operand, ctx);
        if (isFailure(spread)) return spread;
        if ('stream' in spread) {
            for (const item of spread.stream.items) {
                if (isFailure(item)) return item;
                add(item);
            }
        } else if ('list' in spread) {
            const items = allItems(spread.list);
            if (isFailure(items)) return items;
            for (const value of items) add(value);
        } else {
            add(spread.value);
        }
    }
    return node.kind === 'div' ? /** @type {number} */ (values[0]) / /** @type {number} */ (values[1]) : result;
}

/**
 * Evaluate every operand in order. A list operand contributes each value, and an `iter` operand its
 * values until one decides the result. A failure ends evaluation where it arises.
 *
 * @param {LogicNode} node
 * @param {EvaluationContext} ctx
 * @returns {boolean | Failure}
 */
function computeLogic(node, ctx) {
    const [decider, decided] = decides(node.kind);
    let result = !decided;
    for (const operand of node.operands) {
        const spread = readSpread(operand, ctx);
        if (isFailure(spread)) return spread;
        if ('list' in spread) {
            const items = allItems(spread.list);
            if (isFailure(items)) return items.at(operand.path);
            for (let i = 0; i < items.length; i++) if (expectBoolean(items[i], node.kind) === decider) result = decided;
        } else if ('stream' in spread) {
            for (const item of spread.stream.items) {
                if (isFailure(item)) return item.at(operand.path);
                if (expectBoolean(item, node.kind) === decider) {
                    result = decided;
                    break;
                }
            }
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
 * A value is sent as JSON writes it, a list as the array of its items. A key is omitted when JSON writes
 * its value as nothing, when `when` does not hold, and with `buckets` when the value is in no bucket. A
 * failed value reaches `when` and the buckets, where `fails` handles it. A value, `when` or bucket that
 * fails unhandled fails the payload at the first such key, and one that errors throws.
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
 * @returns {unknown} the value as JSON parses it, a bucket name, a `Failure` or `OMIT`
 */
function payloadValue(field, ctx) {
    const value = evaluateOccurrence(field.value, ctx);
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
    return payloadJson(value, `${field.path}.value`);
}

/**
 * A value as JSON writes it, parsed back so the payload holds plain data from when the action ran and
 * no page object reaches the breakage entry or messaging. A throw while writing it, such as from a cycle
 * or a page getter, fails at the value.
 *
 * @param {unknown} value
 * @param {string} path - the config path of the value
 * @returns {unknown} the value as JSON parses it, a `Failure` or `OMIT`
 */
function payloadJson(value, path) {
    const items = isItemBuffer(value) ? allItems(value) : value;
    if (isFailure(items)) return items.at(path);
    try {
        /** @type {string | undefined} */
        const json = JSONstringify(items);
        return json === undefined ? OMIT : JSONparse(json);
    } catch (e) {
        return thrownFailure(e).at(path);
    }
}
