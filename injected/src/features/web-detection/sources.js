import { isArray, ReflectApply } from '../../captured-globals.js';
import { DetectionError, FILLS, isFailure } from './core.js';
import { compileArgs, compileField, compileWhere, evaluateArgs, parsePathBody, readField, readPath } from './predicates.js';

/**
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./predicates.js').CompiledField} CompiledField
 * @typedef {import('./predicates.js').CompiledPredicate} CompiledPredicate
 * @typedef {import('./predicates.js').PredicateContext} PredicateContext
 * @typedef {import('./predicates.js').PredicateHooks} PredicateHooks
 * @typedef {import('./predicates.js').CompiledArg} CompiledArg
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
 * @property {(bodies: Body[], ctx: PredicateContext) => unknown} read - the value: an `ItemBuffer` for a list, or a `Failure` for the source as a whole
 */

/**
 * Reads that skip a list's iterator, each `undefined` where it does not apply.
 *
 * @typedef {object} ListShortcuts
 * @property {() => boolean | undefined} [hasAny]
 * @property {(bound: number) => number | undefined} [countUpTo] - the number of items, or any number from `bound` up
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
    /** Whether the source failed as a whole, which every placement reaches, a length cut at 0 included */
    #failedWhole = false;

    /**
     * @param {Iterator<unknown> | Failure} iterator
     * @param {ListShortcuts} [shortcuts]
     */
    constructor(iterator, shortcuts = {}) {
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
            const held = where.test(item, ctx);
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
 * @typedef {object} ApiBody
 * @property {string[]} names
 * @property {CompiledArg[]} [args]
 * @property {unknown} [root] - the compiled expression giving the value `path` reads from, for `self`
 * @property {CompiledPredicate} [where]
 * @property {CompiledField} [field]
 */

/**
 * Parse an `api` body: a path, or an object of `path`, `args`, `where` and `field`. A `self` body may
 * leave out `path`, and then reads from the bound value itself.
 *
 * @param {unknown} rawBody
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @param {string} key - the expression key, for messages
 * @returns {ApiBody}
 */
export function parseApiBody(rawBody, path, hooks, key = 'api') {
    const { raw, names } = parsePathBody(rawBody, path, hooks, key, ['path', 'args', 'where', 'field']);
    /** @type {ApiBody} */
    const body = { names, ...parseItemKeys(raw, path, hooks) };
    if (raw.args !== undefined) body.args = compileArgs(raw.args, `${path}.args`, hooks);
    return body;
}

/**
 * Reads a Web API by path, from the global object or, through `self`, from a bound value, and gives
 * the value it reads. With `where`, or `field` on a list, it gives the list of the members that pass,
 * or of their values.
 *
 * @param {object} global
 * @returns {Source<ApiBody>}
 */
export function apiSource(global) {
    return {
        key: 'api',
        parse: (raw, path, hooks) => parseApiBody(raw, path, hooks),
        fills: (body) => (body.where ? FILLS.list : FILLS.any),
        read(bodies, ctx) {
            // `api` takes one body
            const body = /** @type {ApiBody} */ (bodies[0]);
            let base = body.root === undefined ? global : ctx.read(body.root);
            if (isFailure(base)) return base;
            if (base instanceof ItemBuffer) {
                // A selected list reaches `path` as an array
                const failure = base.pull(Infinity);
                if (failure) return failure;
                base = base.values;
            }
            const args = body.args && evaluateArgs(body.args, ctx);
            if (isFailure(args)) return args;
            const result = readPath(ctx.reader, base, body.names, args);
            if (isFailure(result)) return result;
            if (body.where || (body.field && isList(result, ctx))) {
                if (!isList(result, ctx)) throw new DetectionError('`where` on a value that is not a list');
                return new ItemBuffer(selectItems(eachMember(result, ctx), body, ctx));
            }
            return body.field ? readField(ctx, result, body.field) : result;
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
