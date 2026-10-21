import {
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
    getPrototypeOf,
    isArray,
    objectKeys,
    ReflectApply,
} from '../../captured-globals.js';
import {
    ConfigParseError,
    DetectionError,
    EXPRESSION_KEYS,
    Failure,
    asArray,
    decides,
    isExpressionObject,
    isFailure,
    isPlainObject,
    isScalar,
    rejectUnknownKeys,
    typeName,
} from './core.js';

/**
 * @typedef {import('./expressions.js').ItemBinder} ItemBinder
 */

/**
 * A compiled `args` entry: an expression in value position.
 *
 * @typedef {{ expression: unknown }} CompiledArg
 */

/**
 * Reads properties and calls methods, preferring the getters and methods captured when the reader is
 * created, so one a page replaces afterwards is not called.
 *
 * Holders are the global object, each namespace object such as `CSS`, and every global constructor and
 * its prototype, so static methods such as `Number.isFinite` are captured too. For each name config uses, the reader records the own accessor, method or
 * value with that name on each holder. A read walks the object and its prototype chain for a holder
 * with a record. With none, it reads the property as it stands on the object or its chain, whoever
 * defined it.
 */
export class NativeReader {
    /** @type {Map<object, Map<PropertyKey, PropertyDescriptor>>} */
    #holders = new Map();
    /** @type {object | undefined} */
    #nodePrototype;

    /**
     * @param {object} global - the global object to capture from
     * @param {Iterable<string>} names - every name config reads or calls
     */
    constructor(global, names) {
        /** @type {PropertyKey[]} */
        const keys = [...names, Symbol.iterator];
        const nodeConstructor = getOwnPropertyDescriptor(global, 'Node')?.value;
        if (typeof nodeConstructor === 'function') this.#nodePrototype = tryOwnDescriptor(nodeConstructor, 'prototype')?.value;
        /** @type {object[]} */
        const holders = [global];
        // A cross-origin frame's WindowProxy, reached as `window[0]`, and a page's Proxy can throw on
        // any descriptor read. Such a value is not a holder.
        for (const name of getOwnPropertyNames(global)) {
            const descriptor = getOwnPropertyDescriptor(global, name);
            if (!descriptor || !('value' in descriptor)) continue;
            const value = descriptor.value;
            if (typeof value === 'function') {
                holders.push(value);
                const prototype = tryOwnDescriptor(value, 'prototype')?.value;
                if (typeof prototype === 'object' && prototype !== null) holders.push(prototype);
            } else if (typeof value === 'object' && value !== null && value !== global) {
                holders.push(value);
            }
        }
        for (const holder of holders) {
            /** @type {Map<PropertyKey, PropertyDescriptor> | undefined} */
            let records;
            try {
                for (const key of keys) {
                    const descriptor = getOwnPropertyDescriptor(holder, key);
                    if (!descriptor) continue;
                    records ??= new Map();
                    records.set(key, descriptor);
                }
            } catch {
                continue;
            }
            if (records) this.#holders.set(holder, records);
        }
    }

    /**
     * The captured record for a key on the target's chain, else the property as it stands.
     *
     * @param {unknown} target
     * @param {PropertyKey} key
     * @returns {PropertyDescriptor | undefined}
     */
    _find(target, key) {
        const start = typeof target === 'object' || typeof target === 'function' ? target : getPrototypeOf(target);
        /** @type {unknown} */
        let current = start;
        while (current !== null && current !== undefined) {
            const record = this.#holders.get(/** @type {object} */ (current))?.get(key);
            if (record) return record;
            current = getPrototypeOf(current);
        }
        current = start;
        while (current !== null && current !== undefined) {
            const descriptor = getOwnPropertyDescriptor(current, key);
            if (descriptor) return descriptor;
            current = getPrototypeOf(current);
        }
        return undefined;
    }

    /**
     * Read one property, as JS reads it: a name present nowhere, or an accessor with no getter, reads
     * `undefined`. A getter that throws fails.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @returns {unknown} the value, or a `Failure`
     */
    read(target, name) {
        const record = this._find(target, name);
        if (!record) return undefined;
        if ('value' in record) return record.value;
        if (!record.get) return undefined;
        try {
            return ReflectApply(record.get, target, []);
        } catch (e) {
            return new Failure(errorName(e));
        }
    }

    /**
     * Call a method. A name whose value is not a function fails with `TypeError`, as the call throws in
     * JS, and so does a method that throws.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @param {readonly unknown[]} args
     * @returns {unknown} the result, or a `Failure`
     */
    call(target, name, args) {
        const record = this._find(target, name);
        const method = record && 'value' in record ? record.value : undefined;
        if (typeof method !== 'function') return new Failure('TypeError');
        try {
            return ReflectApply(method, target, args);
        } catch (e) {
            return new Failure(errorName(e));
        }
    }

    /**
     * Whether a value is a DOM node: the global's `Node.prototype` is on its prototype chain.
     *
     * @param {unknown} target
     * @returns {boolean}
     */
    isNode(target) {
        return hasPrototype(target, this.#nodePrototype ? [this.#nodePrototype] : []);
    }

    /**
     * The iterator method of a value, when it has one.
     *
     * @param {unknown} target
     * @returns {Function | undefined}
     */
    iteratorMethod(target) {
        if (target === null || target === undefined || typeof target === 'string') return undefined;
        const record = this._find(target, Symbol.iterator);
        const method = record && 'value' in record ? record.value : undefined;
        return typeof method === 'function' ? method : undefined;
    }
}

/**
 * @param {object} target
 * @param {PropertyKey} key
 * @returns {PropertyDescriptor | undefined} the own descriptor, or `undefined` where reading it throws
 */
function tryOwnDescriptor(target, key) {
    try {
        return getOwnPropertyDescriptor(target, key);
    } catch {
        return undefined;
    }
}

/**
 * The name of a thrown value's constructor, read from own data properties through captured globals so
 * no page getter is called.
 *
 * @param {unknown} thrown
 * @returns {string | undefined}
 */
function errorName(thrown) {
    try {
        for (let current = getPrototypeOf(thrown); current !== null; current = getPrototypeOf(current)) {
            const constructor = getOwnPropertyDescriptor(current, 'constructor')?.value;
            const name = typeof constructor === 'function' ? getOwnPropertyDescriptor(constructor, 'name')?.value : undefined;
            if (typeof name === 'string') return name;
        }
    } catch {
        // A proxy's traps may throw, and `null` or `undefined` has no prototype
    }
    return undefined;
}

/**
 * Whether one of the prototypes is on a value's prototype chain, read through the captured
 * `getPrototypeOf` so a page override of `Symbol.hasInstance` is not called.
 *
 * @param {unknown} target
 * @param {readonly object[]} prototypes
 * @returns {boolean}
 */
function hasPrototype(target, prototypes) {
    if (prototypes.length === 0 || typeof target !== 'object' || target === null) return false;
    for (let current = getPrototypeOf(target); current !== null; current = getPrototypeOf(current)) {
        if (prototypes.includes(current)) return true;
    }
    return false;
}

/**
 * Read a path of names from a root, calling the last name with `args` when given.
 *
 * `length` on a string or an array reads it directly. A name after `null` or `undefined` gives
 * `undefined`, as `?.` does.
 *
 * @param {NativeReader} reader
 * @param {unknown} root
 * @param {readonly string[]} names
 * @param {readonly unknown[] | undefined} args - the evaluated arguments
 * @returns {unknown} the value, or a `Failure`
 */
export function readPath(reader, root, names, args) {
    let current = root;
    for (let i = 0; i < names.length; i++) {
        if (current === null || current === undefined) return undefined;
        const name = /** @type {string} */ (names[i]);
        if (args && i === names.length - 1) {
            current = reader.call(current, name, args);
        } else if (name === 'length' && (typeof current === 'string' || isArray(current))) {
            current = current.length;
        } else {
            current = reader.read(current, name);
        }
        if (isFailure(current)) return current;
    }
    return current;
}

/**
 * @typedef {object} CompiledField
 * @property {string} path - the config path a failed read is reported at
 * @property {string[]} names - empty for an expression
 * @property {CompiledArg[]} [args]
 * @property {unknown} [expression] - a compiled expression in value position, in place of `names` and `args`
 * @property {ItemBinder} [binder] - binds `self` in `args` or `expression` to the value the field reads from
 */

/**
 * Compile `args`: a JS array of its entries, each an expression in value position. An inner array is
 * `{"expr": [...]}`, since an array is never an expression.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledArg[]}
 */
export function compileArgs(raw, path, hooks) {
    if (!isArray(raw)) throw new ConfigParseError(path, '`args` must be an array');
    return raw.map((entry, i) => ({ expression: hooks.expression(entry, `${path}.${i}`, 'value') }));
}

/**
 * Evaluate compiled `args`.
 *
 * @param {readonly CompiledArg[]} args
 * @param {PredicateContext} ctx
 * @returns {unknown[] | Failure}
 */
export function evaluateArgs(args, ctx) {
    /** @type {unknown[]} */
    const values = [];
    for (const arg of args) {
        const value = ctx.arg(arg.expression);
        if (isFailure(value)) return value;
        values.push(value);
    }
    return values;
}

/**
 * Compile a path, adding its names to those the native reader captures.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {string[]}
 */
function compilePath(raw, path, hooks) {
    if (typeof raw !== 'string' || raw === '') throw new ConfigParseError(path, 'a path must be a non-empty string');
    const names = raw.split('.');
    if (names.some((name) => name === '')) throw new ConfigParseError(path, `empty name in path '${raw}'`);
    names.forEach((name) => hooks.names.add(name));
    return names;
}

/**
 * Parse a body naming a path: a string, short for `{path}`, or an object of `path`, `args` and the
 * other keys allowed. The caller compiles `args`. A `self` body may leave out `path`, and then reads
 * from the bound value itself.
 *
 * @param {unknown} rawBody
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @param {string} key - the key the body sits under, for messages
 * @param {readonly string[]} allowed
 * @returns {{ raw: Record<string, unknown>, names: string[] }}
 */
export function parsePathBody(rawBody, path, hooks, key, allowed) {
    const raw = typeof rawBody === 'string' ? { path: rawBody } : rawBody;
    if (!isPlainObject(raw)) throw new ConfigParseError(path, `\`${key}\` takes a path or an object`);
    rejectUnknownKeys(raw, allowed, path);
    if (raw.path !== undefined) return { raw, names: compilePath(raw.path, `${path}.path`, hooks) };
    if (raw.args !== undefined) throw new ConfigParseError(path, '`args` needs `path`');
    if (key !== 'self') throw new ConfigParseError(path, `\`${key}\` needs \`path\``);
    return { raw, names: [] };
}

/**
 * Compile a `field`: a string, short for `{path}`, an object of `path` and `args`, or an expression. `self` in `args` or the expression is the value the field reads from.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledField}
 */
export function compileField(raw, path, hooks) {
    if (isExpressionObject(raw)) {
        return hooks.item((binder) => ({ path, names: [], binder, expression: hooks.expression(raw, path, 'value') }));
    }
    const body = parsePathBody(raw, path, hooks, 'field', ['path', 'args']);
    /** @type {CompiledField} */
    const field = { path, names: body.names };
    const rawArgs = body.raw.args;
    if (rawArgs !== undefined) {
        hooks.item((binder) => {
            field.binder = binder;
            field.args = compileArgs(rawArgs, `${path}.args`, hooks);
        });
    }
    return field;
}

/**
 * Read a compiled `field` from an item or value.
 *
 * @param {PredicateContext} ctx
 * @param {unknown} root
 * @param {CompiledField} field
 * @returns {unknown} the value, or a `Failure`
 */
export function readField(ctx, root, field) {
    const binder = field.binder;
    const value = binder ? ctx.bind(binder, root, () => readFieldOf(ctx, root, field)) : readFieldOf(ctx, root, field);
    return isFailure(value) ? value.at(field.path) : value;
}

/**
 * @param {PredicateContext} ctx
 * @param {unknown} root
 * @param {CompiledField} field
 * @returns {unknown} the value, or a `Failure`
 */
function readFieldOf(ctx, root, field) {
    // A selected list reaches the predicate as an array, as it does in `args`
    if (field.expression !== undefined) return ctx.arg(field.expression);
    const args = field.args && evaluateArgs(field.args, ctx);
    if (isFailure(args)) return args;
    return readPath(ctx.reader, root, field.names, args);
}

/**
 * Compile a `where`, which binds `self` to each item it tests.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
export function compileWhere(raw, path, hooks) {
    return hooks.item((binder) => {
        const predicate = compilePredicate(raw, 'item', path, hooks);
        return { kind: 'where', binder, predicate, path, scalar: predicate.scalar };
    });
}

/**
 * What a predicate needs from the evaluation it runs in.
 *
 * @typedef {object} PredicateContext
 * @property {NativeReader} reader
 * @property {(operand: unknown) => unknown} operand - evaluates a compiled operand expression, giving its value or a `Failure`
 * @property {(expression: unknown) => unknown} read - evaluates a compiled expression in the position it was compiled for, giving its value or a `Failure`
 * @property {(expression: unknown) => unknown} arg - evaluates a compiled `args` expression, giving a selected list as an array, or a `Failure`
 * @property {(expression: unknown) => unknown} test - evaluates a compiled boolean expression with its `is`, giving the boolean or a `Failure`
 * @property {(value: unknown, operator: string) => unknown[] | Failure | undefined} items - the items of a list value, or `undefined` for any other value
 * @property {<T>(binder: ItemBinder, value: unknown, fn: () => T) => T} bind - runs `fn` with `self` of a `where` or `field` bound to `value`
 */

/**
 * A compiled predicate, which `testPredicate` tests. Its `kind`s differ from the expression kinds, so a
 * walker of the compiled tree tells the two apart.
 *
 * @typedef {object} PredicateBase
 * @property {string} path - the config path it compiles from
 * @property {boolean} scalar - whether it compares the value: a literal, `eq`, `in`, `lt`, `lte`, `gt` or `gte` at its top level or in its combinators. A selected list under it gives its one item
 */

/**
 * @typedef {PredicateBase & { kind: 'compare', op: Comparison, value: unknown }} LiteralComparePredicate - against a literal
 * @typedef {PredicateBase & { kind: 'compare', op: Comparison, operand: unknown }} OperandComparePredicate - against an expression in value position
 * @typedef {PredicateBase & { kind: 'in', entries: Array<{ literal: unknown } | { operand: unknown }> }} InPredicate
 * @typedef {PredicateBase & { kind: 'combine', combinator: 'any' | 'all' | 'none', entries: CompiledPredicate[] }} CombinePredicate
 * @typedef {PredicateBase & { kind: 'guarded', guard: CompiledPredicate, rest: CompiledPredicate }} GuardedPredicate - `fails` and `type`, tested before the other keys of their object
 * @typedef {PredicateBase & { kind: 'read', field: CompiledField, next: CompiledPredicate }} ReadPredicate - `field` with `is`, or a property path at item level
 * @typedef {PredicateBase & { kind: 'fails', expected: boolean }} FailsPredicate
 * @typedef {PredicateBase & { kind: 'type', names: unknown[] }} TypePredicate
 * @typedef {PredicateBase & { kind: 'always' }} AlwaysPredicate - an object with no keys
 * @typedef {PredicateBase & { kind: 'expression', expression: unknown }} ExpressionPredicate - a boolean expression over `self`, at item level
 * @typedef {PredicateBase & { kind: 'where', binder: ItemBinder, predicate: CompiledPredicate }} WherePredicate - binds `self` to the item it tests
 * @typedef {LiteralComparePredicate | OperandComparePredicate | InPredicate | CombinePredicate | GuardedPredicate | ReadPredicate | FailsPredicate | TypePredicate | AlwaysPredicate | ExpressionPredicate | WherePredicate} CompiledPredicate
 */

/**
 * @typedef {object} PredicateHooks
 * @property {(raw: unknown, path: string, position: import('./expressions.js').Position) => unknown} expression - compiles an expression in a position: a source's `root`, an `args` entry, an operand of `eq` or a comparison, a `field` expression, or an expression in `where`
 * @property {<T>(fn: (binder: ItemBinder) => T) => T} item - compiles a `where` or `field` that binds `self`
 * @property {Set<string>} names - collects every name read, for the native reader
 */

/** @typedef {'item' | 'value'} Level */

const OPERATORS = new Set(['eq', 'in', 'lt', 'lte', 'gt', 'gte', 'fails', 'type']);
/** Keys a predicate and an expression share, with the same meaning. */
const COMBINATORS = new Set(['any', 'all', 'none']);
/** Tested before the other keys of their object, whatever the key order. */
/** @type {string[]} */
const FIRST_OPERATORS = ['fails', 'type'];
const TYPE_NAMES = new Set(['number', 'string', 'boolean', 'null', 'undefined', 'array', 'object']);
/** Keys reserved for later extensions. */
const RESERVED_LATER = new Set(['match']);

/**
 * Test a predicate against a value. A failure passes up, except through `fails`, which reads it, and
 * through the predicates holding others, which pass it to them.
 *
 * @param {CompiledPredicate} predicate
 * @param {unknown} subject - a value, or a `Failure`
 * @param {PredicateContext} ctx
 * @returns {boolean | Failure}
 */
export function testPredicate(predicate, subject, ctx) {
    switch (predicate.kind) {
        case 'compare': {
            if (isFailure(subject)) return subject;
            const compare = COMPARE[predicate.op];
            if (!('operand' in predicate)) return compare(/** @type {number} */ (subject), /** @type {number} */ (predicate.value));
            const value = ctx.operand(predicate.operand);
            return isFailure(value) ? value : compare(/** @type {number} */ (subject), /** @type {number} */ (value));
        }
        case 'combine': {
            // Every entry is tested, in order. A failure ends the test where it arises
            const [decider, decided] = decides(predicate.combinator);
            let result = !decided;
            for (const entry of predicate.entries) {
                const held = testPredicate(entry, subject, ctx);
                if (isFailure(held)) return held;
                if (held === decider) result = decided;
            }
            return result;
        }
        case 'read':
            if (isFailure(subject)) return subject;
            return testPredicate(predicate.next, readField(ctx, subject, predicate.field), ctx);
        case 'where':
            return ctx.bind(predicate.binder, subject, () => testPredicate(predicate.predicate, subject, ctx));
        case 'in':
            if (isFailure(subject)) return subject;
            return testIn(predicate.entries, subject, ctx);
        case 'guarded': {
            // When a guard does not hold, the object is `false`
            const held = testPredicate(predicate.guard, subject, ctx);
            if (held !== true) return held;
            return testPredicate(predicate.rest, subject, ctx);
        }
        case 'fails':
            return isFailure(subject) ? predicate.expected : !predicate.expected;
        case 'type':
            if (isFailure(subject)) return subject;
            return predicate.names.includes(typeName(subject));
        case 'always':
            return isFailure(subject) ? subject : true;
        case 'expression':
            if (isFailure(subject)) return subject;
            return /** @type {boolean | Failure} */ (ctx.test(predicate.expression));
        default:
            throw new DetectionError(`unknown predicate '${/** @type {{ kind: string }} */ (predicate).kind}'`);
    }
}

/**
 * `in`: the value `===` one of the entries. Every entry is read, in order. A literal entry is compared
 * as written, and an expression entry giving a list contributes each item.
 *
 * @param {InPredicate['entries']} entries
 * @param {unknown} subject
 * @param {PredicateContext} ctx
 * @returns {boolean | Failure}
 */
function testIn(entries, subject, ctx) {
    let found = false;
    for (const entry of entries) {
        if ('literal' in entry) {
            if (subject === entry.literal) found = true;
            continue;
        }
        const value = ctx.read(entry.operand);
        if (isFailure(value)) return value;
        const items = ctx.items(value, 'in');
        if (isFailure(items)) return items;
        if (!items) {
            if (subject === value) found = true;
            continue;
        }
        // By index and `===`, so `NaN` is in no list and a page's `Array.prototype` is not called
        for (let j = 0; j < items.length; j++) if (items[j] === subject) found = true;
    }
    return found;
}

/**
 * Whether config at item level is a boolean expression over `self`: an object with an expression key
 * other than `any`, `all` and `none`, which a predicate shares.
 *
 * @param {unknown} raw
 * @returns {raw is Record<string, unknown>}
 */
function isItemExpression(raw) {
    return isPlainObject(raw) && objectKeys(raw).some((key) => EXPRESSION_KEYS.has(key) && !COMBINATORS.has(key));
}

/**
 * Compile a predicate.
 *
 * At item level an object's keys other than the reserved ones are property paths, and an object with
 * an expression key other than `any`, `all` and `none` is a boolean expression over `self`; at value
 * level the operator names are operators. `any` / `all` / `none` keep the level. An array is not a
 * predicate: `in` owns a list of values, and `any` combines predicates.
 *
 * @param {unknown} raw
 * @param {Level} level
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
export function compilePredicate(raw, level, path, hooks) {
    if (isScalar(raw)) return compileComparison('eq', raw, path, hooks);
    if (isArray(raw)) {
        throw new ConfigParseError(
            path,
            'an array is not a predicate: `{"in": [...]}` tests for one of several values, and `{"any": [...]}` one of several predicates',
        );
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, 'a predicate must be a literal or an object');
    if (level === 'item' && isItemExpression(raw)) {
        return { kind: 'expression', expression: hooks.expression(raw, path, 'boolean'), path, scalar: false };
    }
    return compileObject(raw, level, path, hooks);
}

/**
 * @param {'any' | 'all' | 'none'} combinator
 * @param {CompiledPredicate[]} entries
 * @param {string} path
 * @returns {CompiledPredicate}
 */
function combine(combinator, entries, path) {
    return { kind: 'combine', combinator, entries, path, scalar: entries.some((entry) => entry.scalar) };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {Level} level
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
function compileObject(raw, level, path, hooks) {
    const keys = objectKeys(raw);
    const hasField = keys.includes('field');
    const hasIs = keys.includes('is');
    if (hasField !== hasIs) {
        throw new ConfigParseError(path, '`field` and `is` go together in a predicate');
    }

    // `fails` and `type` guard the rest: when either does not hold, the object is `false`
    const isFirst = (/** @type {string} */ key) => level === 'value' && FIRST_OPERATORS.includes(key);

    /** @type {CompiledPredicate[]} */
    const first = [];
    /** @type {CompiledPredicate[]} */
    const rest = [];
    for (const key of [...FIRST_OPERATORS.filter((key) => isFirst(key) && keys.includes(key)), ...keys.filter((key) => !isFirst(key))]) {
        const keyPath = `${path}.${key}`;
        const value = raw[key];
        if (RESERVED_LATER.has(key)) throw new ConfigParseError(keyPath, `'${key}' is reserved`);
        if (key === 'is') continue;
        const entries = isFirst(key) ? first : rest;
        if (key === 'any' || key === 'all' || key === 'none') {
            entries.push(
                combine(
                    key,
                    asArray(value).map((entry, i) => compilePredicate(entry, level, isArray(value) ? `${keyPath}.${i}` : keyPath, hooks)),
                    keyPath,
                ),
            );
        } else if (key === 'field') {
            const field = compileField(value, keyPath, hooks);
            entries.push(readThen(field, compilePredicate(raw.is, 'value', `${path}.is`, hooks), keyPath));
        } else if (level === 'value' && OPERATORS.has(key)) {
            entries.push(compileOperator(key, value, keyPath, hooks));
        } else {
            const names = compilePath(key, keyPath, hooks);
            entries.push(readThen({ path: keyPath, names }, compilePredicate(value, 'value', keyPath, hooks), keyPath));
        }
    }
    if (first.length === 0 && rest.length === 0) return { kind: 'always', path, scalar: false };
    if (first.length === 0) return combine('all', rest, path);
    const guard = combine('all', first, path);
    const others = combine('all', rest, path);
    return { kind: 'guarded', guard, rest: others, path, scalar: guard.scalar || others.scalar };
}

/**
 * @param {CompiledField} field
 * @param {CompiledPredicate} next
 * @param {string} path
 * @returns {CompiledPredicate}
 */
function readThen(field, next, path) {
    return { kind: 'read', field, next, path, scalar: false };
}

/**
 * @param {string} operator
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
function compileOperator(operator, raw, path, hooks) {
    switch (operator) {
        case 'fails':
            return { kind: 'fails', expected: expectBoolean(raw, path), path, scalar: false };
        case 'type': {
            const names = asArray(raw);
            for (const name of names) {
                if (typeof name !== 'string' || !TYPE_NAMES.has(name)) {
                    throw new ConfigParseError(path, `unknown type name '${String(name)}'`);
                }
            }
            return { kind: 'type', names, path, scalar: false };
        }
        case 'in':
            return compileIn(raw, path, hooks);
        default:
            return compileComparison(/** @type {Comparison} */ (operator), raw, path, hooks);
    }
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {boolean}
 */
function expectBoolean(raw, path) {
    if (typeof raw !== 'boolean') throw new ConfigParseError(path, 'expected a boolean');
    return raw;
}

/**
 * `in`, whose entries are literals or expressions in value position.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
function compileIn(raw, path, hooks) {
    /** @type {InPredicate['entries']} */
    const entries = asArray(raw).map((entry, i) =>
        isScalar(entry) ? { literal: entry } : { operand: hooks.expression(entry, isArray(raw) ? `${path}.${i}` : path, 'value') },
    );
    return { kind: 'in', entries, path, scalar: true };
}

/** @typedef {'eq' | 'lt' | 'lte' | 'gt' | 'gte'} Comparison */

/**
 * The JS operators, which coerce what `lt`, `lte`, `gt` and `gte` compare. Values reach them as read,
 * typed as numbers here.
 *
 * @type {Record<Comparison, (a: number, b: number) => boolean>}
 */
const COMPARE = {
    eq: (a, b) => a === b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
};

/**
 * A comparison against a literal, or against an operand read each time it is tested. `eq` takes any
 * scalar literal, and the others a number.
 *
 * @param {Comparison} operator
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
function compileComparison(operator, raw, path, hooks) {
    if (operator === 'eq' ? isScalar(raw) : typeof raw === 'number') {
        return { kind: 'compare', op: operator, value: raw, path, scalar: true };
    }
    return { kind: 'compare', op: operator, operand: hooks.expression(raw, path, 'value'), path, scalar: true };
}
