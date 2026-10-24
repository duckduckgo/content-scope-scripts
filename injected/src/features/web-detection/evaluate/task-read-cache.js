/**
 * @typedef {import('../model/types.js').TaskReads} TaskReads
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
        let values = this.#byNode.get(node);
        if (!values) {
            values = new Map();
            this.#byNode.set(node, values);
        }
        if (values.has(key)) return /** @type {T} */ (values.get(key));
        const value = compute();
        values.set(key, value);
        return value;
    }
}
