import { isArray, ReflectApply } from '../../../captured-globals.js';
import { isFailure } from './core.js';

/**
 * @typedef {import('./core.js').Failure} Failure
 * @typedef {import('./types.js').PredicateContext} PredicateContext
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
