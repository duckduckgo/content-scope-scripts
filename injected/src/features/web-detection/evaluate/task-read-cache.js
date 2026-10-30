import { NativeMap, getOrCreate, newMap } from '../model/core.js';

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
    #byNode = new NativeMap();

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
