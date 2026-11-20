import { ReflectApply } from '../../../captured-globals.js';
import { getOrCreate, newMap } from '../model/core.js';

/**
 * @import { TaskReads } from '../model/types.js'
 */

/**
 * The page reads one task shares: one `runDetectors` call, for a timer of the auto trigger or for a
 * breakage report. A task runs its detectors synchronously, so each reads the page as the task's
 * first read of it found it.
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
 * A `MutationObserver` with the methods the cache calls, and `Node.prototype.getRootNode`, captured
 * from a global.
 *
 * @typedef {object} Watcher
 * @property {MutationObserver} observer
 * @property {Function} observe
 * @property {Function} takeRecords
 * @property {Function} disconnect
 * @property {Function} getRootNode
 */

/**
 * The page reads the tasks of a frame share while the page is unchanged. A value is kept from the
 * task that computed it until a node changes in the tree of a node read, or until `maxAgeMs` after
 * the first value was kept, so a read gives what a fresh read would.
 *
 * A `MutationObserver` watches the root of each node read: the document, a shadow root or a detached
 * subtree. Its first record drops every value and disconnects it, so a page that keeps changing costs
 * one record per task that reads it. A task takes the records not yet delivered before its first
 * read, and within a task values are shared as in `TaskReadCache`.
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

    /** @type {ReturnType<typeof setTimeout> | undefined} the timer that drops the values kept */
    #release;

    #maxAgeMs = 0;

    /**
     * @param {{ MutationObserver?: typeof MutationObserver, Node?: typeof Node }} global - the global object to capture
     * `MutationObserver` and `Node.prototype.getRootNode` from, before page scripts can replace them
     */
    constructor(global) {
        const Observer = global.MutationObserver;
        const getRootNode = global.Node?.prototype.getRootNode;
        if (typeof Observer !== 'function' || typeof getRootNode !== 'function') return;
        const { observe, takeRecords, disconnect } = Observer.prototype;
        this.#watcher = { observer: new Observer(() => this._clear()), observe, takeRecords, disconnect, getRootNode };
    }

    /**
     * The reads of a new task: the values kept, unless a node changed since, or a task-only cache where
     * the global has no `MutationObserver`.
     *
     * @param {number} maxAgeMs - how long values are kept after the first one is, at most
     * @returns {TaskReads}
     */
    beginTask(maxAgeMs) {
        const watcher = this.#watcher;
        if (!watcher) return new TaskReadCache();
        this.#maxAgeMs = maxAgeMs;
        if (ReflectApply(watcher.takeRecords, watcher.observer, []).length > 0) this._clear();
        return this;
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
        const values = getOrCreate(this.#byNode, node, newMap);
        if (values.has(key)) return /** @type {T} */ (values.get(key));
        const value = compute();
        values.set(key, value);
        this._watch(node, readsAttributes);
        return value;
    }

    /**
     * Observe the root of `node`, with its attributes when `attributes`, unless it is already.
     *
     * @param {object} node
     * @param {boolean} attributes
     */
    _watch(node, attributes) {
        const watcher = this.#watcher;
        if (!watcher) return;
        const root = /** @type {Node} */ (ReflectApply(watcher.getRootNode, node, []));
        const observed = this.#roots.get(root);
        if (observed !== undefined && (observed || !attributes)) return;
        this.#roots.set(root, attributes);
        ReflectApply(watcher.observe, watcher.observer, [root, { childList: true, characterData: true, subtree: true, attributes }]);
        this.#release ??= setTimeout(() => this._clear(), this.#maxAgeMs);
    }

    /**
     * Drop every value kept and stop watching. Disconnecting discards the records not yet delivered.
     */
    _clear() {
        this.#byNode.clear();
        this.#roots.clear();
        if (this.#watcher) ReflectApply(this.#watcher.disconnect, this.#watcher.observer, []);
        clearTimeout(this.#release);
        this.#release = undefined;
    }
}
