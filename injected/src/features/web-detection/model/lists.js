import { isArray, ReflectApply } from '../../../captured-globals.js';
import { DetectionError, isFailure, thrownFailure } from './core.js';

/**
 * @import { Failure } from './core.js'
 * @import { IterNode, PredicateContext } from './types.js'
 */

/**
 * Reads that skip a list's iterator, each `undefined` where it does not apply.
 *
 * @typedef {object} ListShortcuts
 * @property {() => boolean | undefined} [hasAny]
 * @property {() => number | undefined} [count]
 */

/**
 * A list: the items read so far, each as its value (`field`), the item itself without `field`, or a
 * `Failure` for an item whose `where` or `field` read failed. One evaluation of a source gives one
 * buffer, which every read of that value shares: `self` under `using`, and each `ref` to a name bound
 * to it.
 */
export class ItemBuffer {
    /** @type {unknown[]} */
    values = [];
    /** Whether it is the condition leaf, `element` without `field` or `text`, which holds in boolean position when it has an item */
    leaf = false;
    /** @type {Failure | undefined} */
    failure;
    done = false;
    /** @type {Iterator<unknown> | undefined} */
    #iterator;
    /** Whether the source failed as a whole, which every placement reaches, a length cut at 0 included */
    #failedWhole = false;
    /** Whether `take` handed the iterator over */
    #taken = false;

    /**
     * @param {object} value
     * @returns {boolean}
     */
    static has(value) {
        return #iterator in value;
    }

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
        if (this.#taken) throw new DetectionError('a list read as it streams is read once');
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

    /**
     * Hand over the iterator of a list no read has started, so its items are read without being kept.
     * The buffer is then read through the iterator only.
     *
     * @returns {Iterator<unknown> | undefined} `undefined` once a read has started, or for a source that failed as a whole
     */
    take() {
        if (this.started) return undefined;
        this.#taken = true;
        this.done = true;
        return this.#iterator;
    }
}

/**
 * The items of an `iter` an operand of `sum`, `mul`, `any`, `all` or `none` reads, as they are produced
 * and kept nowhere. A `Failure` item ends them.
 */
export class ItemStream {
    #brand = true;

    /**
     * @param {Iterable<unknown>} items
     */
    constructor(items) {
        /** @readonly */
        this.items = items;
    }

    /**
     * @param {object} value
     * @returns {boolean}
     */
    static has(value) {
        return #brand in value;
    }
}

/**
 * @param {unknown} value
 * @returns {value is ItemStream}
 */
export function isItemStream(value) {
    return typeof value === 'object' && value !== null && ItemStream.has(value);
}

/**
 * What `define` binds for an `iter`: the expression, which each `ref` evaluates again.
 */
export class IterRecipe {
    #brand = true;

    /**
     * @param {IterNode} node
     */
    constructor(node) {
        /** @readonly */
        this.node = node;
    }

    /**
     * @param {object} value
     * @returns {boolean}
     */
    static has(value) {
        return #brand in value;
    }
}

/**
 * @param {unknown} value
 * @returns {value is IterRecipe}
 */
export function isIterRecipe(value) {
    return typeof value === 'object' && value !== null && IterRecipe.has(value);
}

/**
 * A brand check, so no trap of a page's Proxy is called.
 *
 * @param {unknown} value
 * @returns {value is ItemBuffer}
 */
export function isItemBuffer(value) {
    return typeof value === 'object' && value !== null && ItemBuffer.has(value);
}

/**
 * The members of a list, an array or an iterable other than a string or a node, read lazily: an array
 * by index, so a page override of `Array.prototype[Symbol.iterator]` is not called, and an iterable
 * through its iterator as captured or as it stands. `undefined` for any other value, and a `Failure`
 * where a page's Proxy trap throws on the lookup. A throw from the page while iterating gives a
 * `Failure` and ends the members.
 *
 * @param {unknown} value - any value but an `ItemBuffer`
 * @param {PredicateContext} ctx
 * @returns {Generator<unknown> | Failure | undefined}
 */
export function listMembers(value, ctx) {
    if (isArray(value)) return arrayMembers(value);
    const iteratorMethod = ctx.reader.iteratorMethod(value);
    if (iteratorMethod === undefined || isFailure(iteratorMethod)) return iteratorMethod;
    const node = ctx.reader.isNode(value);
    if (isFailure(node)) return node;
    return node ? undefined : iteratedMembers(value, iteratorMethod);
}

/**
 * The list a value is: an `ItemBuffer` itself, or a new one over a list's members, failed where
 * looking them up fails. `undefined` for any other value.
 *
 * @param {unknown} value
 * @param {PredicateContext} ctx
 * @returns {ItemBuffer | undefined}
 */
export function asList(value, ctx) {
    if (isItemBuffer(value)) return value;
    const members = listMembers(value, ctx);
    return members === undefined ? undefined : new ItemBuffer(members);
}

/**
 * @param {unknown[]} array
 * @returns {Generator<unknown>}
 */
function* arrayMembers(array) {
    for (let i = 0; ; i++) {
        /** @type {unknown} */
        let item;
        try {
            if (i >= array.length) return;
            item = array[i];
        } catch (e) {
            yield thrownFailure(e);
            return;
        }
        yield item;
    }
}

/**
 * @param {unknown} value
 * @param {Function} iteratorMethod
 * @returns {Generator<unknown>}
 */
function* iteratedMembers(value, iteratorMethod) {
    /** @type {Iterator<unknown> | undefined} */
    let iterator;
    for (;;) {
        /** @type {unknown} */
        let item;
        try {
            iterator ??= /** @type {Iterator<unknown>} */ (ReflectApply(iteratorMethod, value, []));
            const next = iterator.next();
            if (next.done) return;
            item = next.value;
        } catch (e) {
            yield thrownFailure(e);
            return;
        }
        yield item;
    }
}
