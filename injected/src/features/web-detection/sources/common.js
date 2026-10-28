import { isArray } from '../../../captured-globals.js';
import { ConfigParseError, DetectionError, isFailure } from '../model/core.js';
import { compileField, readField } from '../predicates/fields.js';
import { compileWhere, testPredicate } from '../predicates/predicates.js';

/**
 * @import { PredicateContext, PredicateHooks } from '../model/types.js'
 * @import { CompiledField } from '../predicates/fields.js'
 * @import { CompiledPredicate } from '../predicates/predicates.js'
 */

/** What `selectItem` gives for an item `where` does not hold for. */
export const SKIP = Symbol('skip');

/**
 * The value of an item `where` holds for: its `field`, or the item itself without `field`. A failing
 * `where` or `field` gives its `Failure`.
 *
 * A failed item, such as a page iterator's throw, fails the list. A `where` in expression form that
 * reads `self` is tested on it first, with `self` the failure, so `fails` there can exclude it.
 *
 * @param {unknown} item - an item, or a `Failure`
 * @param {{ where?: CompiledPredicate, field?: CompiledField }} keys
 * @param {PredicateContext} ctx
 * @returns {unknown} the value, a `Failure` or `SKIP`
 */
export function selectItem(item, { where, field }, ctx) {
    if (where) {
        const expression = isExpressionWhere(where);
        if (isFailure(item) && !expression) return item;
        // The expression form reads the item through `self`, so it takes any value
        if (!expression && (typeof item !== 'object' || item === null))
            throw new DetectionError('`where` on an item that is not an object');
        const held = testPredicate(where, item, ctx);
        if (isFailure(held)) return held;
        if (!held) return SKIP;
    }
    if (isFailure(item)) return item;
    return field ? readField(ctx, item, field) : item;
}

/**
 * Whether `where` is one boolean expression over `self`.
 *
 * @param {CompiledPredicate} where
 * @returns {boolean}
 */
function isExpressionWhere(where) {
    return where.kind === 'where' && where.binder.readsSelf === true && where.predicate.kind === 'expression';
}

/**
 * The value of each item `where` holds for, as `selectItem` gives it. A failing item, `where` or
 * `field` gives its `Failure`, and ends the list.
 *
 * @param {Iterable<unknown>} items
 * @param {{ where?: CompiledPredicate, field?: CompiledField }} keys
 * @param {PredicateContext} ctx
 * @returns {Generator<unknown>}
 */
export function* selectItems(items, keys, ctx) {
    for (const item of items) {
        const value = selectItem(item, keys, ctx);
        if (value === SKIP) continue;
        yield value;
        if (isFailure(value)) return;
    }
}

/**
 * Parse `where` and `field`, the keys `element` and `api` share.
 *
 * @param {Record<string, unknown>} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {{ where?: CompiledPredicate, field?: CompiledField }}
 */
export function parseItemKeys(raw, path, hooks) {
    /** @type {{ where?: CompiledPredicate, field?: CompiledField }} */
    const keys = {};
    if (raw.where !== undefined) keys.where = compileWhere(raw.where, `${path}.where`, hooks);
    if (raw.field !== undefined) keys.field = compileField(raw.field, `${path}.field`, hooks);
    return keys;
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {string[]}
 */
export function stringList(raw, path) {
    const list = isArray(raw) ? raw : [raw];
    if (list.some((entry) => typeof entry !== 'string')) throw new ConfigParseError(path, 'expected a string or an array of strings');
    return /** @type {string[]} */ (list);
}
