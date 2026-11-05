import { isArray } from '../../../captured-globals.js';
import { ConfigParseError, DetectionError, isFailure } from '../model/core.js';
import { compileField, readField } from '../predicates/fields.js';
import { compileWhere, testPredicate } from '../predicates/predicates.js';

/**
 * @import { PredicateContext, PredicateHooks } from '../model/types.js'
 * @import { CompiledField } from '../predicates/fields.js'
 * @import { CompiledPredicate } from '../predicates/predicates.js'
 */

/**
 * The value of each item `where` holds for: its `field`, or the item itself without `field`. A failing
 * `where` or `field` gives its `Failure`, and ends the list.
 *
 * @param {Iterable<unknown>} items
 * @param {{ where?: CompiledPredicate, field?: CompiledField }} keys
 * @param {PredicateContext} ctx
 * @returns {Generator<unknown>}
 */
export function* selectItems(items, { where, field }, ctx) {
    for (const item of items) {
        if (where) {
            if (typeof item !== 'object' || item === null) throw new DetectionError('`where` on an item that is not an object');
            const held = testPredicate(where, item, ctx);
            if (isFailure(held)) {
                yield held;
                return;
            }
            if (!held) continue;
        }
        const value = field ? readField(ctx, item, field) : item;
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
