import {
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
    getPrototypeOf,
    isArray,
    numberIsFinite,
    numberIsNaN,
    objectKeys,
    ReflectApply,
} from '../../captured-globals.js';
import { ABSENT, ConfigParseError, DENIED, DetectionError, asArray, isFailure, isPlainObject, typeName } from './core.js';
import { FEATURES, isFeatureName } from './features.js';

/**
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./core.js').Track} Track
 * @typedef {import('./features.js').FeatureName} FeatureName
 * @typedef {string | number | boolean | null} Arg
 */

/**
 * Reads properties and calls methods, preferring the getters and methods captured when the reader is
 * created, so one a page replaces afterwards is not called.
 *
 * Holders are the global object, each namespace object such as `CSS`, and the prototype of every global
 * interface constructor. For each name config uses, the reader records the own accessor, method or
 * value with that name on each holder. A read walks the object and its prototype chain for a holder
 * with a record. With none, it reads the property as it stands on the object or its chain, whoever
 * defined it.
 *
 * A getter runs only when the read allows getters; a data value needs no permission.
 */
export class NativeReader {
    /** @type {Map<object, Map<PropertyKey, PropertyDescriptor>>} */
    #holders = new Map();

    /**
     * @param {object} global - the global object to capture from
     * @param {Iterable<string>} names - every name config reads or calls
     */
    constructor(global, names) {
        /** @type {PropertyKey[]} */
        const keys = [...names, Symbol.iterator];
        /** @type {object[]} */
        const holders = [global];
        for (const name of getOwnPropertyNames(global)) {
            const descriptor = getOwnPropertyDescriptor(global, name);
            if (!descriptor || !('value' in descriptor)) continue;
            const value = descriptor.value;
            if (typeof value === 'function') {
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
     * Read one property.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @param {boolean} allowGetter - whether an accessor's getter may run
     * @returns {unknown} the value, or a `Failure`
     */
    read(target, name, allowGetter) {
        const record = this._find(target, name);
        if (!record) return ABSENT;
        if ('value' in record) return record.value;
        if (!record.get) return ABSENT;
        if (!allowGetter) throw new DetectionError(`'${name}' is a getter, and the read does not set allowGetter`);
        try {
            return ReflectApply(record.get, target, []);
        } catch {
            return DENIED;
        }
    }

    /**
     * Call a method.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @param {readonly unknown[]} args
     * @returns {unknown} the result, or a `Failure`
     */
    call(target, name, args) {
        const record = this._find(target, name);
        const method = record && 'value' in record ? record.value : undefined;
        if (typeof method !== 'function') return ABSENT;
        try {
            return ReflectApply(method, target, args);
        } catch {
            return DENIED;
        }
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

/** A `readPath` result: the path read `null` or `undefined` before its last name. */
export const NO_VALUE = Symbol('noValue');

/**
 * Read a path of names from a root, calling the last name with `args` when given.
 *
 * `length` on a string or an array reads it directly. A name after `null` or `undefined` gives
 * `undefined` when `onNullish` is `'undefined'` (`field` and property paths), and `NO_VALUE` when it
 * is `'noValue'` (`api`, which then selects no items).
 *
 * @param {NativeReader} reader
 * @param {unknown} root
 * @param {readonly string[]} names
 * @param {readonly Arg[] | undefined} args
 * @param {'undefined' | 'noValue'} onNullish
 * @param {boolean} allowGetter
 * @returns {unknown} the value, `NO_VALUE`, or a `Failure`
 */
export function readPath(reader, root, names, args, onNullish, allowGetter) {
    let current = root;
    for (let i = 0; i < names.length; i++) {
        if (current === null || current === undefined) {
            return onNullish === 'undefined' ? undefined : NO_VALUE;
        }
        const name = /** @type {string} */ (names[i]);
        if (args && i === names.length - 1) {
            current = reader.call(current, name, args);
        } else if (name === 'length' && (typeof current === 'string' || isArray(current))) {
            current = current.length;
        } else {
            current = reader.read(current, name, allowGetter);
        }
        if (isFailure(current)) return current;
    }
    return current;
}

/**
 * @typedef {object} CompiledField
 * @property {string[]} names - empty when the value is the item itself
 * @property {Arg[]} [args]
 * @property {FeatureName} [feature]
 * @property {boolean} allowGetter - set on the `field` or on the source around it
 */

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {Arg[]}
 */
function compileArgs(raw, path) {
    if (!isArray(raw)) throw new ConfigParseError(path, '`args` must be an array');
    for (const arg of raw) {
        if (arg !== null && typeof arg !== 'string' && typeof arg !== 'number' && typeof arg !== 'boolean') {
            throw new ConfigParseError(path, '`args` entries must be strings, numbers, booleans or null');
        }
    }
    return /** @type {Arg[]} */ (raw);
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
 * Compile a `field`: a string, short for `{path}`, or an object of `path`, `args`, `feature` and
 * `allowGetter`.
 *
 * @param {unknown} raw
 * @param {string} path
 * @param {Set<string>} names - collects every name read, for the reader's capture
 * @param {boolean} allowGetter - set by the source around the `field`
 * @returns {CompiledField}
 */
export function compileField(raw, path, names, allowGetter) {
    if (typeof raw === 'string') {
        const pathNames = compilePath(raw, path);
        pathNames.forEach((name) => names.add(name));
        return { names: pathNames, allowGetter };
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, '`field` must be a string or an object');
    for (const key of objectKeys(raw)) {
        if (key !== 'path' && key !== 'args' && key !== 'feature' && key !== 'allowGetter') {
            throw new ConfigParseError(path, `unknown key '${key}' in field`);
        }
    }
    if (raw.allowGetter !== undefined && typeof raw.allowGetter !== 'boolean') {
        throw new ConfigParseError(`${path}.allowGetter`, 'expected a boolean');
    }
    if (raw.path === undefined && raw.args === undefined && raw.feature === undefined) {
        throw new ConfigParseError(path, '`field` needs at least one of path, args and feature');
    }
    if (raw.args !== undefined && raw.path === undefined) {
        throw new ConfigParseError(path, '`args` needs `path`');
    }
    /** @type {CompiledField} */
    const field = {
        names: raw.path === undefined ? [] : compilePath(raw.path, `${path}.path`),
        allowGetter: allowGetter || raw.allowGetter === true,
    };
    field.names.forEach((name) => names.add(name));
    if (raw.args !== undefined) field.args = compileArgs(raw.args, `${path}.args`);
    if (raw.feature !== undefined) {
        if (typeof raw.feature !== 'string' || !isFeatureName(raw.feature)) {
            throw new ConfigParseError(path, `unknown feature '${String(raw.feature)}'`);
        }
        field.feature = raw.feature;
    }
    return field;
}

/**
 * Read a compiled `field` from an item or value.
 *
 * @param {NativeReader} reader
 * @param {unknown} root
 * @param {CompiledField} field
 * @returns {unknown} the value, or a `Failure`
 */
export function readField(reader, root, field) {
    const value = readPath(reader, root, field.names, field.args, 'undefined', field.allowGetter);
    if (isFailure(value) || !field.feature) return value;
    return FEATURES[field.feature](value);
}

/**
 * What a predicate needs from the evaluation it runs in.
 *
 * @typedef {object} PredicateContext
 * @property {NativeReader} reader
 * @property {(operand: unknown, track: Track) => unknown} operand - evaluates a compiled operand expression once per run, giving its value or a `Failure`
 */

/**
 * @typedef {(subject: unknown, ctx: PredicateContext, track: Track) => boolean | Failure} PredicateTest
 */

/**
 * @typedef {object} CompiledPredicate
 * @property {PredicateTest} test - `subject` may be a `Failure`, which `exists` and `type` read
 * @property {number} bound - the count from which the result on a count is fixed ([Early exit](implementation.md))
 */

/**
 * @typedef {object} PredicateHooks
 * @property {(raw: unknown, path: string) => unknown} operand - compiles an operand expression in number position
 * @property {Set<string>} names - collects every name read, for the native reader
 */

/** @typedef {'item' | 'value'} Level */

const OPERATORS = new Set(['eq', 'lt', 'lte', 'gt', 'gte', 'exists', 'type', 'finite', 'nan']);
/** Tested before the other keys of their object, whatever the key order. */
/** @type {string[]} */
const FIRST_OPERATORS = ['exists', 'type', 'finite', 'nan'];
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
    };
}

/**
 * Compile a predicate.
 *
 * At item level an object's keys other than the reserved ones are property paths; at value level the
 * operator names are operators. Arrays and `any` / `all` / `none` keep the level.
 *
 * @param {unknown} raw
 * @param {Level} level
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @param {boolean} [allowGetter] - whether the predicate's reads may run getters, as the source around it sets
 * @returns {CompiledPredicate}
 */
export function compilePredicate(raw, level, path, hooks, allowGetter = false) {
    if (isScalar(raw)) return equalsLiteral(raw);
    if (isArray(raw)) {
        return combine(
            'any',
            raw.map((entry, i) => compilePredicate(entry, level, `${path}[${i}]`, hooks, allowGetter)),
        );
    }
    if (!isPlainObject(raw)) throw new ConfigParseError(path, 'a predicate must be a literal, an array or an object');
    return compileObject(raw, level, path, hooks, allowGetter);
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
        test = (subject, ctx, track) => {
            for (const entry of entries) {
                const result = entry.test(subject, ctx, track);
                if (result !== false) return result;
            }
            return false;
        };
    } else if (combinator === 'all') {
        test = (subject, ctx, track) => {
            for (const entry of entries) {
                const result = entry.test(subject, ctx, track);
                if (result !== true) return result;
            }
            return true;
        };
    } else {
        test = (subject, ctx, track) => {
            for (const entry of entries) {
                const result = entry.test(subject, ctx, track);
                if (isFailure(result)) return result;
                if (result) return false;
            }
            return true;
        };
    }
    return { test, bound };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {Level} level
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @param {boolean} allowGetter
 * @returns {CompiledPredicate}
 */
function compileObject(raw, level, path, hooks, allowGetter) {
    const keys = objectKeys(raw);
    const hasField = keys.includes('field');
    const hasIs = keys.includes('is');
    if (hasField !== hasIs) {
        throw new ConfigParseError(path, '`field` and `is` go together in a predicate');
    }

    // `exists`, `type`, `finite` and `nan` first, then the rest in config order
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
                    asArray(value).map((entry, i) => compilePredicate(entry, level, `${keyPath}[${i}]`, hooks, allowGetter)),
                ),
            );
        } else if (key === 'field') {
            const field = compileField(value, keyPath, hooks.names, allowGetter);
            entries.push(readThen(field, compilePredicate(raw.is, 'value', `${path}.is`, hooks, allowGetter)));
        } else if (level === 'value' && OPERATORS.has(key)) {
            entries.push(compileOperator(key, value, keyPath, hooks));
        } else {
            const names = compilePath(key, keyPath);
            names.forEach((name) => hooks.names.add(name));
            entries.push(readThen({ names, allowGetter }, compilePredicate(value, 'value', keyPath, hooks, allowGetter)));
        }
    }
    if (entries.length === 0) {
        return { test: (subject) => (isFailure(subject) ? subject : true), bound: 0 };
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
        test: (subject, ctx, track) => {
            if (isFailure(subject)) return subject;
            return next.test(readField(ctx.reader, subject, field), ctx, track);
        },
        // A property of a count is not a count
        bound: Infinity,
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
        case 'exists': {
            const expected = expectBoolean(raw, path);
            return fixed((subject) => {
                if (isFailure(subject)) return subject.kind === 'absent' ? !expected : subject;
                return expected;
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
                if (isFailure(subject)) return subject.kind === 'absent' ? names.includes('undefined') : subject;
                return names.includes(typeName(subject));
            });
        }
        case 'finite': {
            const expected = expectBoolean(raw, path);
            return fixed((subject) => (isFailure(subject) ? subject : numberIsFinite(subject) === expected));
        }
        case 'nan': {
            const expected = expectBoolean(raw, path);
            return fixed((subject) => (isFailure(subject) ? subject : numberIsNaN(subject) === expected));
        }
        case 'eq': {
            if (raw === null || typeof raw === 'string' || typeof raw === 'boolean' || typeof raw === 'number') {
                return equalsLiteral(raw);
            }
            const operand = hooks.operand(raw, path);
            return {
                test: (subject, ctx, track) => {
                    if (isFailure(subject)) return subject;
                    const value = ctx.operand(operand, track);
                    if (isFailure(value)) return value;
                    return subject === value;
                },
                bound: Infinity,
            };
        }
        default:
            return compileComparison(/** @type {'lt' | 'lte' | 'gt' | 'gte'} */ (operator), raw, path, hooks);
    }
}

/**
 * A predicate whose result is the same for every count.
 *
 * @param {(subject: unknown) => boolean | Failure} test
 * @returns {CompiledPredicate}
 */
function fixed(test) {
    return { test, bound: 0 };
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

/** @type {Record<'lt' | 'lte' | 'gt' | 'gte', (a: number, b: number) => boolean>} */
const COMPARE = {
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
};

/**
 * The count from which a comparison against `n` is fixed.
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
            test: (subject) => {
                if (isFailure(subject)) return subject;
                return compare(expectNumber(subject, operator), raw);
            },
            bound: Math.max(0, COMPARISON_BOUND[operator](raw)),
        };
    }
    const operand = hooks.operand(raw, path);
    return {
        test: (subject, ctx, track) => {
            if (isFailure(subject)) return subject;
            const value = ctx.operand(operand, track);
            if (isFailure(value)) return value;
            return compare(expectNumber(subject, operator), expectNumber(value, operator));
        },
        bound: Infinity,
    };
}

/**
 * @param {unknown} value
 * @param {string} operator
 * @returns {number}
 */
function expectNumber(value, operator) {
    if (typeof value !== 'number') {
        throw new DetectionError(`'${operator}' takes a number, got ${typeName(value)}`);
    }
    return value;
}
