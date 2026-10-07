import { isArray, objectKeys, ReflectApply } from '../../captured-globals.js';
import { ConfigParseError, DetectionError, isFailure, isPlainObject } from './core.js';
import { compileField, compilePath, compilePredicate, readField, readPath } from './predicates.js';

/**
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./core.js').Track} Track
 * @typedef {import('./predicates.js').CompiledField} CompiledField
 * @typedef {import('./predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./predicates.js').PredicateContext} PredicateContext
 * @typedef {import('./predicates.js').PredicateHooks} PredicateHooks
 * @typedef {import('./predicates.js').Arg} Arg
 * @typedef {import('./expressions.js').Position} Position
 */

/**
 * A source reads the page. `element` and `text` give a list, and `api` the value it reads: a list
 * with `where`, or with `field` on a list.
 *
 * @template Body
 * @typedef {object} Source
 * @property {string} key - the expression key in config
 * @property {(raw: unknown, path: string, hooks: PredicateHooks) => Body} parse - throws a `ConfigParseError`
 * @property {(body: Body) => ReadonlySet<Position>} fills - the positions config shows the source fills
 * @property {(bodies: Body[], ctx: PredicateContext, track: Track) => unknown} read - the value: an `ItemBuffer` for a list, or a `Failure` for the source as a whole
 */

/**
 * Reads that skip a list's iterator, each `undefined` where it does not apply.
 *
 * @typedef {object} ListShortcuts
 * @property {() => boolean | undefined} [hasAny]
 * @property {() => number | undefined} [countAll]
 */

/**
 * A list: the items read so far in one run, each as its value (`field`), the item itself without
 * `field`, or a `Failure` for an item whose `where` or `field` read failed. Every expression reading
 * a list shares its buffer, so each source walks the page at most once per run.
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
     * @param {ListShortcuts} [shortcuts]
     */
    constructor(iterator, track, shortcuts = {}) {
        this.track = track;
        this.shortcuts = shortcuts;
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
 * @property {unknown} [root] - a compiled expression giving the value `path` reads from
 * @property {CompiledPredicate} [where]
 * @property {CompiledField} [field]
 */

/** @type {ReadonlySet<Position>} */
const API_FILLS = new Set(['boolean', 'value', 'number', 'list']);
/** @type {ReadonlySet<Position>} */
const LIST_FILLS = new Set(['list', 'value', 'number']);

/**
 * Reads a Web API by path, from the global object or `root`, and gives the value it reads. With
 * `where`, or `field` on a list, it gives the list of the members that pass, or of their values.
 *
 * @param {object} global
 * @returns {Source<ApiBody>}
 */
export function apiSource(global) {
    return {
        key: 'api',
        parse(raw, path, hooks) {
            if (!isPlainObject(raw)) throw new ConfigParseError(path, '`api` takes an object');
            rejectUnknownKeys(raw, ['path', 'args', 'root', 'where', 'field'], path);
            const names = compilePath(raw.path, `${path}.path`);
            names.forEach((name) => hooks.names.add(name));
            /** @type {ApiBody} */
            const body = { names, ...parseItemKeys(raw, path, hooks) };
            if (raw.args !== undefined) {
                if (!isArray(raw.args)) throw new ConfigParseError(`${path}.args`, '`args` must be an array');
                body.args = /** @type {Arg[]} */ (raw.args);
            }
            if (raw.root !== undefined) body.root = hooks.expression(raw.root, `${path}.root`, 'value');
            return body;
        },
        fills: (body) => (body.where ? LIST_FILLS : API_FILLS),
        read(bodies, ctx, track) {
            // `api` takes one body
            const body = /** @type {ApiBody} */ (bodies[0]);
            let base = body.root === undefined ? global : ctx.read(body.root, track);
            if (isFailure(base)) return base;
            if (base instanceof ItemBuffer) {
                // A selected list reaches `path` as an array
                const failure = base.pull(Infinity);
                if (failure) return failure;
                if (!base.track.measured) track.measured = false;
                base = base.values;
            }
            const result = readPath(ctx.reader, base, body.names, body.args);
            if (isFailure(result)) return result;
            if (body.where || (body.field && isList(result, ctx))) {
                if (!isList(result, ctx)) throw new DetectionError('`where` on a value that is not a list');
                return new ItemBuffer(selectApiItems(members(result, ctx), body, ctx, track), track);
            }
            return body.field ? readField(ctx.reader, result, body.field) : result;
        },
    };
}

/**
 * Whether a value is a list: an `ItemBuffer`, or an iterable other than a string or a node.
 *
 * @param {unknown} value
 * @param {PredicateContext} ctx
 * @returns {boolean}
 */
export function isList(value, ctx) {
    if (value instanceof ItemBuffer || isArray(value)) return true;
    return ctx.reader.iteratorMethod(value) !== undefined && !ctx.reader.isNode(value);
}

/**
 * The members of an iterable value, through its iterator as captured or as it stands.
 *
 * @param {unknown} value - an array, or an iterable `isList` holds for
 * @param {PredicateContext} ctx
 * @returns {Iterable<unknown>}
 */
export function members(value, ctx) {
    if (isArray(value)) return value;
    const iteratorMethod = /** @type {Function} */ (ctx.reader.iteratorMethod(value));
    return {
        [Symbol.iterator]: () => /** @type {Iterator<unknown>} */ (ReflectApply(iteratorMethod, value, [])),
    };
}

/**
 * Iterate the members of an iterable value lazily, as a list.
 *
 * @param {unknown} value - an array, or an iterable `isList` holds for
 * @param {PredicateContext} ctx
 * @returns {Generator<unknown>}
 */
export function* eachMember(value, ctx) {
    yield* each(members(value, ctx));
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
