import { ReflectApply } from '../../../captured-globals.js';
import { getOrCreate, newMap } from '../model/core.js';

/**
 * @import { TaskReads } from '../model/types.js'
 */

/**
 * Page reads kept for the life of the cache, with no check for changes: the default of an
 * `EvaluationContext` that isn't given the feature's `FrameReadCache`, such as in a unit test.
 *
 * @implements {TaskReads}
 */
export class TaskReadCache {
    /** @type {Map<object, Map<string, unknown>>} */
    #byNode = new Map();

    /**
     * @template T
     * @param {object} node
     * @param {string} key
     * @param {() => T} compute - a throw keeps nothing, so each reader throws in turn
     * @returns {T}
     */
    of(node, key, compute) {
        const values = getOrCreate(this.#byNode, node, newMap);
        if (values.has(key)) return /** @type {T} */ (values.get(key));
        const value = compute();
        values.set(key, value);
        return value;
    }
}

/**
 * `MutationObserver` with the methods the cache calls, and `Node.prototype.getRootNode`, captured from
 * a global.
 *
 * @typedef {object} Watcher
 * @property {typeof MutationObserver} Observer
 * @property {Function} observe
 * @property {Function} takeRecords
 * @property {Function} disconnect
 * @property {Function} getRootNode
 */

/**
 * The timer functions the cache calls, captured from a global and bound to it.
 *
 * @typedef {object} Timers
 * @property {typeof setTimeout | undefined} setTimeout
 * @property {typeof clearTimeout | undefined} clearTimeout
 * @property {typeof queueMicrotask | undefined} queueMicrotask
 */

/**
 * The page reads of a frame, kept while the page is unchanged, so a read gives what a fresh read would.
 * `configure` sets how long a value is kept at most:
 *
 * - `0`: until the call stack that read it ends, so the detectors run together share it
 * - a number of ms: until that long after the first value was kept
 * - `null`: until the page changes or `release`
 * - `undefined`, before `configure` too: until the call stack that read it ends, with no check for changes
 *
 * Except with `undefined`, a `MutationObserver` watches the root of each node read: the document, a shadow root or a detached
 * subtree. A change in a watched tree drops every value, through the observer's callback, or through
 * the records not yet delivered that each read takes first. The callback disconnects the observer, so
 * a page that keeps changing pays for the records of each change until the end of the task that first
 * changes it after a value is kept.
 *
 * Where the global has no `MutationObserver`, every value is kept as with `undefined`.
 *
 * @implements {TaskReads}
 */
export class FrameReadCache {
    /** @type {Map<object, Map<string, unknown>>} */
    #byNode = new Map();

    /** @type {Map<Node, boolean>} each root observed, with whether its attributes are */
    #roots = new Map();

    /** @type {Watcher | undefined} */
    #watcher;

    /** @type {MutationObserver | undefined} created when the first value is kept */
    #observer;

    /** @type {Timers} */
    #timers;

    /** @type {number | null | undefined} the longest a value is kept, as `configure` sets it */
    #maxAgeMs;

    /** whether the expiry of the values kept is scheduled */
    #expiring = false;

    /** @type {ReturnType<typeof setTimeout> | undefined} the timer that drops the values kept */
    #expiry;

    /** whether `release` was called, after which nothing is kept */
    #released = false;

    /**
     * @param {Partial<Pick<typeof globalThis, 'MutationObserver' | 'Node' | 'setTimeout' | 'clearTimeout' | 'queueMicrotask'>>} global -
     * the global object to capture `MutationObserver`, `Node.prototype.getRootNode` and the timer functions
     * from, before page scripts can replace them. No observer is created until a value is kept.
     */
    constructor(global) {
        const Observer = global.MutationObserver;
        const getRootNode = global.Node?.prototype.getRootNode;
        if (typeof Observer === 'function' && typeof getRootNode === 'function') {
            const { observe, takeRecords, disconnect } = Observer.prototype;
            this.#watcher = { Observer, observe, takeRecords, disconnect, getRootNode };
        }
        this.#timers = {
            setTimeout: global.setTimeout?.bind(global),
            clearTimeout: global.clearTimeout?.bind(global),
            queueMicrotask: global.queueMicrotask?.bind(global),
        };
    }

    /**
     * Set how long a value is kept at most: `0` until the end of the call stack, a number of ms, `null`
     * until the page changes, or `undefined` until the end of the call stack with no check for changes.
     * Without a `MutationObserver`, every value is kept as with `undefined`.
     *
     * @param {number | null | undefined} maxAgeMs
     */
    configure(maxAgeMs) {
        this.#maxAgeMs = this.#watcher ? maxAgeMs : undefined;
    }

    /**
     * @template T
     * @param {object} node - a DOM node, whose tree is watched while the value is kept
     * @param {string} key
     * @param {() => T} compute - a throw keeps nothing, so each reader throws in turn
     * @param {boolean} [readsAttributes] - whether the value depends on attributes, so a change to one drops it
     * @returns {T}
     */
    of(node, key, compute, readsAttributes = false) {
        this._dropIfChanged();
        const values = this.#byNode.get(node);
        if (values?.has(key)) return /** @type {T} */ (values.get(key));
        const value = compute();
        if (this._keep(node, readsAttributes)) getOrCreate(this.#byNode, node, newMap).set(key, value);
        return value;
    }

    /**
     * Drop every value kept and keep nothing from now on, as no detector will read again.
     */
    release() {
        this.#released = true;
        this._clear();
    }

    /**
     * Drop the values kept when a watched tree changed since they were, including through a change whose
     * record the observer has not delivered yet.
     */
    _dropIfChanged() {
        const watcher = this.#watcher;
        if (!watcher || !this.#observer || this.#roots.size === 0) return;
        if (ReflectApply(watcher.takeRecords, this.#observer, []).length > 0) this._clear();
    }

    /**
     * Watch the tree of `node` and schedule the expiry of the values kept, before a value read from it is
     * kept. A throw while watching keeps nothing.
     *
     * @param {object} node
     * @param {boolean} attributes
     * @returns {boolean} whether the value can be kept
     */
    _keep(node, attributes) {
        if (this.#released) return false;
        this._watch(node, attributes);
        return this._scheduleExpiry();
    }

    /**
     * Observe the root of `node`, with its attributes when `attributes`, unless it is already.
     *
     * @param {object} node
     * @param {boolean} attributes
     */
    _watch(node, attributes) {
        const watcher = this.#watcher;
        if (!watcher || this.#maxAgeMs === undefined) return;
        const root = /** @type {Node} */ (ReflectApply(watcher.getRootNode, node, []));
        const observed = this.#roots.get(root);
        if (observed !== undefined && (observed || !attributes)) return;
        this.#observer ??= new watcher.Observer(() => this._clear());
        ReflectApply(watcher.observe, this.#observer, [root, { childList: true, characterData: true, subtree: true, attributes }]);
        this.#roots.set(root, attributes);
    }

    /**
     * Schedule the drop of the values kept, unless it is already: at the end of the call stack for a max
     * age of 0 or `undefined`, after the max age for another number, never for `null`.
     *
     * @returns {boolean} whether values can be kept, which needs the timer function for the max age
     */
    _scheduleExpiry() {
        if (this.#expiring) return true;
        const maxAgeMs = this.#maxAgeMs;
        const { setTimeout, queueMicrotask } = this.#timers;
        if (maxAgeMs === 0 || maxAgeMs === undefined) {
            if (!queueMicrotask) return false;
            queueMicrotask(() => this._clear());
        } else if (maxAgeMs !== null) {
            if (!setTimeout) return false;
            this.#expiry = setTimeout(() => this._clear(), maxAgeMs);
        }
        this.#expiring = true;
        return true;
    }

    /**
     * Drop every value kept and stop watching. Disconnecting discards the records not yet delivered.
     */
    _clear() {
        this.#byNode.clear();
        this.#roots.clear();
        if (this.#watcher && this.#observer) ReflectApply(this.#watcher.disconnect, this.#observer, []);
        if (this.#expiry !== undefined) this.#timers.clearTimeout?.(this.#expiry);
        this.#expiry = undefined;
        this.#expiring = false;
    }
}
