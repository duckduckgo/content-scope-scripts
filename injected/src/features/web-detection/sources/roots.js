import { isArray } from '../../../captured-globals.js';
import { ConfigParseError, DetectionError, asArray, isFailure } from '../model/core.js';
import { ItemBuffer, isList, members } from '../model/lists.js';

/**
 * @typedef {import('../model/core.js').Failure} Failure
 * @typedef {import('../model/types.js').PredicateContext} PredicateContext
 * @typedef {import('../model/types.js').PredicateHooks} PredicateHooks
 */

/**
 * A `root`: compiled expressions, each giving a selector, a node or a list of nodes.
 *
 * @typedef {object} Root
 * @property {unknown[]} entries
 */

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {Root | undefined}
 */
export function parseRoot(raw, path, hooks) {
    if (raw === undefined) return undefined;
    if (isArray(raw) && raw.length === 0) throw new ConfigParseError(path, '`root` needs at least one entry');
    return { entries: asArray(raw).map((entry, i) => hooks.expression(entry, isArray(raw) ? `${path}.${i}` : path, 'root')) };
}

/**
 * The scope `root` gives: the union of its nodes, with a node inside another dropped. Without
 * `root`, the document.
 *
 * @param {Root | undefined} root
 * @param {PredicateContext} ctx
 * @returns {ParentNode[] | Failure}
 */
export function resolveRoots(root, ctx) {
    if (!root) return [document];
    /** @type {Node[]} */
    const nodes = [];
    for (const entry of root.entries) {
        const value = ctx.read(entry);
        if (isFailure(value)) return value;
        const failure = collectRootNodes(value, nodes, ctx);
        if (failure) return failure;
    }
    return outermost(nodes);
}

/**
 * Add the nodes one root value gives: a selector's matches in the document, a node, or each node
 * of a list. `null` and `undefined` give none.
 *
 * @param {unknown} value
 * @param {Node[]} nodes
 * @param {PredicateContext} ctx
 * @returns {Failure | undefined}
 */
function collectRootNodes(value, nodes, ctx) {
    if (value === null || value === undefined) return undefined;
    /** @type {Iterable<unknown>} */
    let values;
    if (typeof value === 'string') {
        values = document.querySelectorAll(value);
    } else if (value instanceof ItemBuffer) {
        const failure = value.pull(Infinity);
        if (failure) return failure;
        values = value.values;
    } else {
        values = isList(value, ctx) ? members(value, ctx) : [value];
    }
    for (const node of values) {
        if (!ctx.reader.isNode(node)) throw new DetectionError('a root is a selector, a node or a list of nodes');
        nodes.push(/** @type {Node} */ (node));
    }
    return undefined;
}

/**
 * @param {Node[]} nodes
 * @returns {ParentNode[]} the nodes in document order, without those inside another
 */
function outermost(nodes) {
    // In document order a node comes after any node containing it. 4 is `DOCUMENT_POSITION_FOLLOWING`,
    // inlined because the `Node` global is not present everywhere this runs
    nodes.sort((a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & 4 ? -1 : 1));
    /** @type {Node[]} */
    const roots = [];
    for (const node of nodes) {
        if (roots.some((kept) => kept.contains(node))) continue;
        roots.push(node);
    }
    return /** @type {ParentNode[]} */ (roots);
}
