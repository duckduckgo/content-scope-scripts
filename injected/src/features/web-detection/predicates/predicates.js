import { isArray, objectKeys } from '../../../captured-globals.js';
import {
    ConfigParseError,
    DetectionError,
    EXPRESSION_KEYS,
    asArray,
    decides,
    getOrCreate,
    isFailure,
    isPlainObject,
    isScalar,
    typeName,
} from '../model/core.js';
import { compileField, compilePath, readField } from './fields.js';

/**
 * @import { Failure } from '../model/core.js'
 * @import { ItemBinder, PredicateContext, PredicateHooks } from '../model/types.js'
 * @import { CompiledField } from './fields.js'
 */

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

/** @typedef {'item' | 'value'} Level */

const OPERATORS = new Set(['eq', 'in', 'lt', 'lte', 'gt', 'gte', 'fails', 'type']);
/** Keys a predicate and an expression share, with the same meaning. */
const COMBINATORS = new Set(['any', 'all', 'none']);
/** Tested before the other keys of their object, whatever the key order. */
/** @type {string[]} */
const FIRST_OPERATORS = ['fails', 'type'];
const TYPE_NAMES = new Set(['number', 'string', 'boolean', 'null', 'undefined', 'array', 'object']);

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
    return lowered(predicate)(subject, ctx);
}

/** @typedef {(subject: unknown, ctx: PredicateContext) => boolean | Failure} PredicateTest */

/**
 * Each predicate's test, lowered the first time it is tested and kept beside the compiled tree, which
 * holds no function.
 *
 * @type {WeakMap<CompiledPredicate, PredicateTest>}
 */
const LOWERED = new WeakMap();

/**
 * @param {CompiledPredicate} predicate
 * @returns {PredicateTest}
 */
function lowered(predicate) {
    return getOrCreate(LOWERED, predicate, lower);
}

/**
 * A predicate as a function closing over its parts and the tests of the predicates it holds.
 *
 * @param {CompiledPredicate} predicate
 * @returns {PredicateTest}
 */
function lower(predicate) {
    switch (predicate.kind) {
        case 'compare': {
            const compare = COMPARE[predicate.op];
            if (!('operand' in predicate)) {
                const literal = /** @type {number} */ (predicate.value);
                return (subject) => (isFailure(subject) ? subject : compare(/** @type {number} */ (subject), literal));
            }
            const operand = predicate.operand;
            return (subject, ctx) => {
                if (isFailure(subject)) return subject;
                const value = ctx.operand(operand);
                return isFailure(value) ? value : compare(/** @type {number} */ (subject), /** @type {number} */ (value));
            };
        }
        case 'combine': {
            const [decider, decided] = decides(predicate.combinator);
            const entries = predicate.entries.map(lowered);
            // Every entry is tested, in order. A failure ends the test where it arises
            return (subject, ctx) => {
                let result = !decided;
                for (const entry of entries) {
                    const held = entry(subject, ctx);
                    if (isFailure(held)) return held;
                    if (held === decider) result = decided;
                }
                return result;
            };
        }
        case 'read': {
            const field = predicate.field;
            const next = lowered(predicate.next);
            return (subject, ctx) => (isFailure(subject) ? subject : next(readField(ctx, subject, field), ctx));
        }
        case 'where': {
            const binder = predicate.binder;
            const inner = lowered(predicate.predicate);
            return (subject, ctx) => ctx.bind(binder, subject, () => inner(subject, ctx));
        }
        case 'in': {
            const entries = predicate.entries;
            return (subject, ctx) => (isFailure(subject) ? subject : testIn(entries, subject, ctx));
        }
        case 'guarded': {
            const guard = lowered(predicate.guard);
            const rest = lowered(predicate.rest);
            // When a guard does not hold, the object is `false`
            return (subject, ctx) => {
                const held = guard(subject, ctx);
                if (held !== true) return held;
                return rest(subject, ctx);
            };
        }
        case 'fails': {
            const expected = predicate.expected;
            return (subject) => (isFailure(subject) ? expected : !expected);
        }
        case 'type': {
            const names = predicate.names;
            return (subject) => (isFailure(subject) ? subject : names.includes(typeName(subject)));
        }
        case 'always':
            return (subject) => (isFailure(subject) ? subject : true);
        case 'expression': {
            const expression = predicate.expression;
            return (subject, ctx) => (isFailure(subject) ? subject : /** @type {boolean | Failure} */ (ctx.test(expression)));
        }
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
        const items = ctx.items(value);
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
 * At item level an object's keys other than `any`, `all`, `none`, `field` and `is` are property
 * paths, and an object with an expression key other than `any`, `all` and `none` is a boolean
 * expression over `self`; at value level the operator names are operators. `any` / `all` / `none` keep the level. An array is not a
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
