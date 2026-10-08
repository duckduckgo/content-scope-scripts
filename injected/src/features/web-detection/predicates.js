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
    EXPRESSION_KEYS,
    Failure,
    NOT_READ,
    asArray,
    isExpressionObject,
    isFailure,
    isPlainObject,
    typeName,
} from './core.js';

/**
 * @typedef {import('./expressions.js').ItemBinder} ItemBinder
 */

/**
 * A compiled `args` entry: an expression in value position, or an array of entries.
 *
 * @typedef {{ expression: unknown } | { array: CompiledArg[] }} CompiledArg
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
        if (typeof nodeConstructor === 'function') this.#nodePrototype = getOwnPropertyDescriptor(nodeConstructor, 'prototype')?.value;
        /** @type {object[]} */
        const holders = [global];
        for (const name of getOwnPropertyNames(global)) {
            const descriptor = getOwnPropertyDescriptor(global, name);
            if (!descriptor || !('value' in descriptor)) continue;
            const value = descriptor.value;
            if (typeof value === 'function') {
                holders.push(value);
                const prototype = getOwnPropertyDescriptor(value, 'prototype')?.value;
                if (typeof prototype === 'object' && prototype !== null) holders.push(prototype);
            } else if (typeof value === 'object' && value !== null && value !== global) {
                holders.push(value);
            }
        }
        for (const holder of holders) {
            /** @type {Map<PropertyKey, PropertyDescriptor> | undefined} */
            let records;
            for (const key of keys) {
                const descriptor = getOwnPropertyDescriptor(holder, key);
                if (!descriptor) continue;
                records ??= new Map();
                records.set(key, descriptor);
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
 * @property {string[]} names - empty for an expression
 * @property {CompiledArg[]} [args]
 * @property {unknown} [expression] - a compiled expression in value position, in place of `names` and `args`
 * @property {ItemBinder} [binder] - binds `self` in `args` or `expression` to the value the field reads from
 */

/**
 * Compile `args`: an array is a JS array of its entries, and any other entry is an expression in value
 * position.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledArg[]}
 */
export function compileArgs(raw, path, hooks) {
    if (!isArray(raw)) throw new ConfigParseError(path, '`args` must be an array');
    return raw.map((entry, i) => compileArg(entry, `${path}[${i}]`, hooks));
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledArg}
 */
function compileArg(raw, path, hooks) {
    if (isArray(raw)) return { array: raw.map((entry, i) => compileArg(entry, `${path}[${i}]`, hooks)) };
    return { expression: hooks.expression(raw, path, 'value') };
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
        /** @type {unknown} */
        let value;
        if ('expression' in arg) value = ctx.arg(arg.expression);
        else value = evaluateArgs(arg.array, ctx);
        if (isFailure(value)) return value;
        values.push(value);
    }
    return values;
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {string[]}
 */
export function compilePath(raw, path) {
    if (typeof raw !== 'string' || raw === '') throw new ConfigParseError(path, 'a path must be a non-empty string');
    const names = raw.split('.');
    if (names.some((name) => name === '')) throw new ConfigParseError(path, `empty name in path '${raw}'`);
    return names;
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
    if (typeof raw === 'string') {
        const pathNames = compilePath(raw, path);
        pathNames.forEach((name) => hooks.names.add(name));
        return { names: pathNames };
    }
    if (isExpressionObject(raw)) {
        return hooks.item((binder) => ({ names: [], binder, expression: hooks.expression(raw, path, 'value') }));
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, '`field` must be a string, an object or an expression');
    for (const key of objectKeys(raw)) {
        if (key !== 'path' && key !== 'args') {
            throw new ConfigParseError(path, `unknown key '${key}' in field`);
        }
    }
    if (raw.path === undefined) {
        throw new ConfigParseError(path, raw.args === undefined ? '`field` needs `path`' : '`args` needs `path`');
    }
    /** @type {CompiledField} */
    const field = { names: compilePath(raw.path, `${path}.path`) };
    field.names.forEach((name) => hooks.names.add(name));
    if (raw.args !== undefined) {
        const rawArgs = raw.args;
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
    if (!field.binder) return readFieldOf(ctx, root, field);
    return ctx.bind(field.binder, root, () => readFieldOf(ctx, root, field));
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
        return { ...predicate, test: (subject, ctx) => ctx.bind(binder, subject, () => predicate.test(subject, ctx)) };
    });
}

/**
 * What a predicate needs from the evaluation it runs in.
 *
 * @typedef {object} PredicateContext
 * @property {NativeReader} reader
 * @property {(operand: unknown) => unknown} operand - evaluates a compiled operand expression once per run, giving its value or a `Failure`
 * @property {(expression: unknown) => unknown} read - evaluates a compiled expression in the position it was compiled for, giving its value or a `Failure`
 * @property {(expression: unknown) => unknown} arg - evaluates a compiled `args` expression, giving a selected list as an array, or a `Failure`
 * @property {(expression: unknown) => unknown} test - evaluates a compiled boolean expression with its `is`, giving the boolean or a `Failure`
 * @property {<T>(binder: ItemBinder, value: unknown, fn: () => T) => T} bind - runs `fn` with `self` of a `where` or `field` bound to `value`
 */

/**
 * @typedef {(subject: unknown, ctx: PredicateContext) => boolean | Failure} PredicateTest
 */

/**
 * @typedef {object} CompiledPredicate
 * @property {PredicateTest} test - `subject` may be a `Failure`, which `fails` reads
 * @property {number} bound - the length from which the result on a list's length is fixed ([Early exit](implementation.md))
 * @property {boolean} scalar - whether it compares the value: a literal, `eq`, `lt`, `lte`, `gt` or `gte` at its top level or in its combinators. A selected list under it gives its one item
 */

/**
 * @typedef {object} PredicateHooks
 * @property {(raw: unknown, path: string, position: import('./expressions.js').Position) => unknown} expression - compiles an expression in a position: a source's `root`, an `args` entry, an operand of `eq` or a comparison, a `field` expression, or an expression in `where`
 * @property {<T>(fn: (binder: ItemBinder) => T) => T} item - compiles a `where` or `field` that binds `self`
 * @property {Set<string>} names - collects every name read, for the native reader
 */

/** @typedef {'item' | 'value'} Level */

const OPERATORS = new Set(['eq', 'lt', 'lte', 'gt', 'gte', 'fails', 'type']);
/** Keys a predicate and an expression share, with the same meaning. */
const COMBINATORS = new Set(['any', 'all', 'none']);
/** Tested before the other keys of their object, whatever the key order. */
/** @type {string[]} */
const FIRST_OPERATORS = ['fails', 'type'];
const TYPE_NAMES = new Set(['number', 'string', 'boolean', 'null', 'undefined', 'array', 'object']);
/** Keys reserved for later extensions. */
const RESERVED_LATER = new Set(['match']);

/**
 * @param {unknown} raw
 * @returns {raw is string | number | boolean | null}
 */
function isScalar(raw) {
    return raw === null || typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean';
}

/**
 * @param {unknown} literal
 * @returns {CompiledPredicate}
 */
function equalsLiteral(literal) {
    return {
        test: (subject) => (isFailure(subject) ? subject : subject === literal),
        bound: typeof literal === 'number' ? Math.max(0, Math.floor(literal) + 1) : 0,
        scalar: true,
    };
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
 * level the operator names are operators. Arrays and `any` / `all` / `none` keep the level.
 *
 * @param {unknown} raw
 * @param {Level} level
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
export function compilePredicate(raw, level, path, hooks) {
    if (isScalar(raw)) return equalsLiteral(raw);
    if (isArray(raw)) {
        return combine(
            'any',
            raw.map((entry, i) => compilePredicate(entry, level, `${path}[${i}]`, hooks)),
        );
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, 'a predicate must be a literal, an array or an object');
    if (level === 'item' && isItemExpression(raw)) {
        const node = hooks.expression(raw, path, 'boolean');
        return {
            test: (subject, ctx) => (isFailure(subject) ? subject : /** @type {boolean | Failure} */ (ctx.test(node))),
            bound: Infinity,
            scalar: false,
        };
    }
    return compileObject(raw, level, path, hooks);
}

/**
 * @param {'any' | 'all' | 'none'} combinator
 * @param {CompiledPredicate[]} entries
 * @returns {CompiledPredicate}
 */
function combine(combinator, entries) {
    const bound = entries.reduce((max, entry) => Math.max(max, entry.bound), 0);
    /** @type {PredicateTest} */
    let test;
    if (combinator === 'any') {
        test = (subject, ctx) => {
            for (const entry of entries) {
                const result = entry.test(subject, ctx);
                if (result !== false) return result;
            }
            return false;
        };
    } else if (combinator === 'all') {
        test = (subject, ctx) => {
            for (const entry of entries) {
                const result = entry.test(subject, ctx);
                if (result !== true) return result;
            }
            return true;
        };
    } else {
        test = (subject, ctx) => {
            for (const entry of entries) {
                const result = entry.test(subject, ctx);
                if (isFailure(result)) return result;
                if (result) return false;
            }
            return true;
        };
    }
    return { test, bound, scalar: entries.some((entry) => entry.scalar) };
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

    // `fails` and `type` first, then the rest in config order
    const isFirst = (/** @type {string} */ key) => level === 'value' && FIRST_OPERATORS.includes(key);
    const ordered = [...FIRST_OPERATORS.filter((key) => isFirst(key) && keys.includes(key)), ...keys.filter((key) => !isFirst(key))];

    /** @type {CompiledPredicate[]} */
    const entries = [];
    for (const key of ordered) {
        const keyPath = `${path}.${key}`;
        const value = raw[key];
        if (RESERVED_LATER.has(key)) throw new ConfigParseError(keyPath, `'${key}' is reserved`);
        if (key === 'is') continue;
        if (key === 'any' || key === 'all' || key === 'none') {
            entries.push(
                combine(
                    key,
                    asArray(value).map((entry, i) => compilePredicate(entry, level, `${keyPath}[${i}]`, hooks)),
                ),
            );
        } else if (key === 'field') {
            const field = compileField(value, keyPath, hooks);
            entries.push(readThen(field, compilePredicate(raw.is, 'value', `${path}.is`, hooks)));
        } else if (level === 'value' && OPERATORS.has(key)) {
            entries.push(compileOperator(key, value, keyPath, hooks));
        } else {
            const names = compilePath(key, keyPath);
            names.forEach((name) => hooks.names.add(name));
            entries.push(readThen({ names }, compilePredicate(value, 'value', keyPath, hooks)));
        }
    }
    if (entries.length === 0) {
        return { test: (subject) => (isFailure(subject) ? subject : true), bound: 0, scalar: false };
    }
    return combine('all', entries);
}

/**
 * @param {CompiledField} field
 * @param {CompiledPredicate} next
 * @returns {CompiledPredicate}
 */
function readThen(field, next) {
    return {
        test: (subject, ctx) => {
            if (isFailure(subject)) return subject;
            return next.test(readField(ctx, subject, field), ctx);
        },
        // A property of a length is not a length
        bound: Infinity,
        scalar: false,
    };
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
        case 'fails': {
            const expected = expectBoolean(raw, path);
            return fixed((subject) => {
                if (isFailure(subject)) return subject === NOT_READ ? subject : expected;
                return !expected;
            });
        }
        case 'type': {
            const names = asArray(raw);
            for (const name of names) {
                if (typeof name !== 'string' || !TYPE_NAMES.has(name)) {
                    throw new ConfigParseError(path, `unknown type name '${String(name)}'`);
                }
            }
            return fixed((subject) => {
                if (isFailure(subject)) return subject;
                return names.includes(typeName(subject));
            });
        }
        case 'eq': {
            if (raw === null || typeof raw === 'string' || typeof raw === 'boolean' || typeof raw === 'number') {
                return equalsLiteral(raw);
            }
            const operand = hooks.expression(raw, path, 'value');
            return {
                test: (subject, ctx) => {
                    if (isFailure(subject)) return subject;
                    const value = ctx.operand(operand);
                    if (isFailure(value)) return value;
                    return subject === value;
                },
                bound: Infinity,
                scalar: true,
            };
        }
        default:
            return compileComparison(/** @type {'lt' | 'lte' | 'gt' | 'gte'} */ (operator), raw, path, hooks);
    }
}

/**
 * A predicate whose result is the same for every length.
 *
 * @param {(subject: unknown) => boolean | Failure} test
 * @returns {CompiledPredicate}
 */
function fixed(test) {
    return { test, bound: 0, scalar: false };
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
 * The JS operators, which coerce what they compare. Values reach them as read, typed as numbers here.
 *
 * @type {Record<'lt' | 'lte' | 'gt' | 'gte', (a: number, b: number) => boolean>}
 */
const COMPARE = {
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
};

/**
 * The length from which a comparison against `n` is fixed.
 *
 * @type {Record<'lt' | 'lte' | 'gt' | 'gte', (n: number) => number>}
 */
const COMPARISON_BOUND = {
    gte: (n) => Math.ceil(n),
    gt: (n) => Math.floor(n) + 1,
    lt: (n) => Math.ceil(n),
    lte: (n) => Math.floor(n) + 1,
};

/**
 * @param {'lt' | 'lte' | 'gt' | 'gte'} operator
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {CompiledPredicate}
 */
function compileComparison(operator, raw, path, hooks) {
    const compare = COMPARE[operator];
    if (typeof raw === 'number') {
        return {
            test: (subject) => (isFailure(subject) ? subject : compare(/** @type {number} */ (subject), raw)),
            bound: Math.max(0, COMPARISON_BOUND[operator](raw)),
            scalar: true,
        };
    }
    const operand = hooks.expression(raw, path, 'value');
    return {
        test: (subject, ctx) => {
            if (isFailure(subject)) return subject;
            const value = ctx.operand(operand);
            if (isFailure(value)) return value;
            return compare(/** @type {number} */ (subject), /** @type {number} */ (value));
        },
        bound: Infinity,
        scalar: true,
    };
}
