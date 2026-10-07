import { isArray, objectKeys, ReflectApply } from '../../captured-globals.js';
import { ConfigParseError, DetectionError, isFailure, isPlainObject } from './core.js';
import { NO_VALUE, compileField, compilePath, compilePredicate, readField, readPath } from './predicates.js';

/**
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./core.js').Track} Track
 * @typedef {import('./predicates.js').CompiledField} CompiledField
 * @typedef {import('./predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./predicates.js').PredicateContext} PredicateContext
 * @typedef {import('./predicates.js').PredicateHooks} PredicateHooks
 * @typedef {import('./predicates.js').Arg} Arg
 */

/**
 * What a source in a given position gives: a boolean, its only item's value, its items, or each
 * item's value.
 *
 * @typedef {'boolean' | 'value' | 'items' | 'values'} Placement
 */

/**
 * A source reads the page. It yields items lazily, each as its value (`field`), the item itself
 * without `field`, or a `Failure` for an item whose `where` or `field` read failed.
 *
 * @template Body
 * @typedef {object} Source
 * @property {string} key - the expression key in config
 * @property {(raw: unknown, path: string, hooks: PredicateHooks) => Body} parse - throws a `ConfigParseError`
 * @property {(body: Body) => ReadonlySet<Placement>} placements
 * @property {(bodies: Body[], ctx: PredicateContext, track: Track) => Iterator<unknown> | Failure} items - a `Failure` for the source as a whole
 * @property {(bodies: Body[]) => boolean | undefined} [hasAny] - a boolean placement that skips the iterator, or `undefined` where it does not apply
 * @property {(bodies: Body[]) => number | undefined} [countAll] - a count that skips the iterator, or `undefined` where it does not apply
 */

/**
 * The items a source expression has read so far in one run. Placements of one expression share it,
 * so each source walks the page at most once per run.
 */
export class ItemBuffer {
    /** @type {unknown[]} */
    values = [];
    /** @type {Failure | undefined} */
    failure;
    done = false;
    /** @type {Iterator<unknown> | undefined} */
    #iterator;
    /** Whether the source failed as a whole, which every placement reaches, a count cut at 0 included */
    #failedWhole = false;

    /**
     * @param {Iterator<unknown> | Failure} iterator
     * @param {Track} track - cleared when a `where` operand is not measured
     */
    constructor(iterator, track) {
        this.track = track;
        if (isFailure(iterator)) {
            this.failure = iterator;
            this.done = true;
            this.#failedWhole = true;
        } else {
            this.#iterator = iterator;
        }
    }

    /** Whether any item has been pulled, or the source failed as a whole. */
    get started() {
        return this.values.length > 0 || this.done;
    }

    /**
     * Pull items until `count` values are held, the source ends, or an item fails.
     *
     * @param {number} count
     * @returns {Failure | undefined} the failure reached before `count` values, if any
     */
    pull(count) {
        while (this.values.length < count && !this.done) {
            const next = /** @type {Iterator<unknown>} */ (this.#iterator).next();
            if (next.done) {
                this.done = true;
            } else if (isFailure(next.value)) {
                this.failure = next.value;
                this.done = true;
            } else {
                this.values.push(next.value);
            }
        }
        return this.values.length < count || this.#failedWhole ? this.failure : undefined;
    }
}

/**
 * Test `where` on an item and read its `field`.
 *
 * @param {unknown} item
 * @param {CompiledPredicate | undefined} where
 * @param {CompiledField | undefined} field
 * @param {PredicateContext} ctx
 * @param {Track} track
 * @returns {unknown} the item's value, `SKIP` when `where` does not hold, or a `Failure`
 */
export function selectItem(item, where, field, ctx, track) {
    if (where) {
        const held = where.test(item, ctx, track);
        if (isFailure(held)) return held;
        if (!held) return SKIP;
    }
    return field ? readField(ctx.reader, item, field) : item;
}

/** A `selectItem` result: `where` does not hold for the item. */
export const SKIP = Symbol('skip');

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
    if (raw.where !== undefined) keys.where = compilePredicate(raw.where, 'item', `${path}.where`, hooks);
    if (raw.field !== undefined) keys.field = compileField(raw.field, `${path}.field`, hooks.names);
    return keys;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {readonly string[]} allowed
 * @param {string} path
 */
export function rejectUnknownKeys(raw, allowed, path) {
    for (const key of objectKeys(raw)) {
        if (!allowed.includes(key)) throw new ConfigParseError(path, `unknown key '${key}'`);
    }
}

/**
 * @typedef {object} ApiBody
 * @property {string[]} names
 * @property {Arg[]} [args]
 * @property {CompiledPredicate} [where]
 * @property {CompiledField} [field]
 */

/** @type {ReadonlySet<Placement>} */
const API_PLACEMENTS = new Set(['value', 'items', 'values']);

/**
 * Reads a Web API by path from the global object. Its items are the members of an iterable result
 * other than a string, or the result as one item.
 *
 * @param {object} global
 * @returns {Source<ApiBody>}
 */
export function apiSource(global) {
    return {
        key: 'api',
        parse(raw, path, hooks) {
            if (!isPlainObject(raw)) throw new ConfigParseError(path, '`api` takes an object');
            rejectUnknownKeys(raw, ['path', 'args', 'where', 'field'], path);
            const names = compilePath(raw.path, `${path}.path`);
            names.forEach((name) => hooks.names.add(name));
            /** @type {ApiBody} */
            const body = { names, ...parseItemKeys(raw, path, hooks) };
            if (raw.args !== undefined) {
                if (!isArray(raw.args)) throw new ConfigParseError(`${path}.args`, '`args` must be an array');
                body.args = /** @type {Arg[]} */ (raw.args);
            }
            return body;
        },
        placements: () => API_PLACEMENTS,
        items(bodies, ctx, track) {
            // `api` takes one body
            const body = /** @type {ApiBody} */ (bodies[0]);
            const result = readPath(ctx.reader, global, body.names, body.args, 'noValue');
            if (isFailure(result)) return result;
            if (result === NO_VALUE) return [][Symbol.iterator]();
            return selectApiItems(members(result, ctx), body, ctx, track);
        },
    };
}

/**
 * @param {unknown} result
 * @param {PredicateContext} ctx
 * @returns {Iterable<unknown>}
 */
function members(result, ctx) {
    if (isArray(result)) return result;
    const iteratorMethod = ctx.reader.iteratorMethod(result);
    if (!iteratorMethod) return [result];
    return {
        [Symbol.iterator]: () => /** @type {Iterator<unknown>} */ (ReflectApply(iteratorMethod, result, [])),
    };
}

/**
 * Iterate an array by index, so a page override of `Array.prototype[Symbol.iterator]` is not called.
 *
 * @param {Iterable<unknown>} items
 * @returns {Iterable<unknown>}
 */
function* each(items) {
    if (isArray(items)) {
        for (let i = 0; i < items.length; i++) yield items[i];
    } else {
        yield* items;
    }
}

/**
 * @param {Iterable<unknown>} items
 * @param {ApiBody} body
 * @param {PredicateContext} ctx
 * @param {Track} track
 * @returns {Generator<unknown>}
 */
function* selectApiItems(items, body, ctx, track) {
    for (const item of each(items)) {
        if (body.where && (typeof item !== 'object' || item === null)) {
            throw new DetectionError('`where` on an item that is not an object');
        }
        const value = selectItem(item, body.where, body.field, ctx, track);
        if (value === SKIP) continue;
        yield value;
        if (isFailure(value)) return;
    }
}
