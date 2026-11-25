import { ConfigParseError } from '../model/core.js';

/**
 * @import { Node, SourceNode } from '../model/types.js'
 * @import { Scope } from './compile.js'
 */

/**
 * Whether an expression may give a list. The config validator checks what each position takes; a value
 * of a type its position does not take fails as it is read.
 *
 * @param {Node} node
 * @returns {boolean}
 */
function givesList(node) {
    switch (node.kind) {
        case 'source':
        case 'ref':
        case 'item':
        case 'only':
        case 'list':
            return true;
        case 'if':
            return occurrenceGivesList(node.then) || (node.else !== undefined && occurrenceGivesList(node.else));
        case 'sequence': {
            const last = node.elements[node.elements.length - 1];
            return last !== undefined && occurrenceGivesList(last);
        }
        case 'expr':
        case 'using':
            return occurrenceGivesList(node.operand);
        default:
            return false;
    }
}

/**
 * Whether an expression may give a list where it sits: with `is`, it gives a boolean.
 *
 * @param {Node} node
 * @returns {boolean}
 */
function occurrenceGivesList(node) {
    return !node.is && givesList(node);
}

/**
 * Settle each operand slot's position: `spread` when the operand may give a list.
 *
 * @param {Scope} scope
 */
export function finish(scope) {
    for (const { node, single } of scope.slots) {
        // `element` without `field` and `text` are the condition leaf under any / all / none: a boolean
        const leaf = single === 'boolean' && isPresenceLeaf(node);
        node.position = givesList(node) && !leaf ? 'spread' : single;
        node.single = single;
    }
}

/**
 * Whether an expression is the condition leaf: `element` without `field`, or `text`, directly or
 * through `expr`.
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isPresenceLeaf(node) {
    let current = node;
    while ((current.kind === 'expr' || current.kind === 'using') && !current.operand.is) current = current.operand;
    return current.kind === 'source' && current.leaf;
}

/**
 * The expressions a run can suspend in, with the operands it suspends through: the elements of a
 * sequence, an `if`'s condition and branches, `expr`'s operand, the value beside `using`, and the values
 * of actions. Other expressions, and the bodies of sources and predicates, evaluate synchronously.
 *
 * @param {Node} node
 * @returns {Node[]}
 */
export function suspendingOperands(node) {
    switch (node.kind) {
        case 'sequence':
            return node.elements;
        case 'if':
            return node.else ? [node.test, node.then, node.else] : [node.test, node.then];
        case 'expr':
            return [node.operand];
        case 'using':
            return [node.root];
        case 'define':
        case 'done':
            return [node.value];
        case 'emit':
            return node.data ? [node.data] : [];
        case 'fireEvent':
        case 'breakageReportData':
            return (node.data ?? []).map((field) => field.value);
        default:
            return [];
    }
}

/**
 * Mark the expressions a run can suspend in, from `actions` down to each source that suspends, and
 * reject a source that suspends anywhere else. `match` never suspends.
 *
 * @param {Scope} scope
 * @param {Node} actions
 */
export function markSuspensions(scope, actions) {
    const suspending = /** @type {SourceNode[]} */ (scope.nodes.filter((node) => node.kind === 'source' && node.source.suspends));
    if (suspending.length === 0) return;
    /** @type {Set<Node>} */
    const reached = new Set();
    /**
     * @param {Node} node
     * @returns {boolean} whether the node suspends
     */
    const visit = (node) => {
        reached.add(node);
        let suspends = node.kind === 'source' && node.source.suspends === true;
        for (const operand of suspendingOperands(node)) if (visit(operand)) suspends = true;
        if (suspends) node.suspends = true;
        return suspends;
    };
    visit(actions);
    for (const node of suspending) {
        if (!reached.has(node)) {
            throw new ConfigParseError(
                node.path,
                `\`${node.source.key}\` suspends the run, so it goes in a sequence, an \`if\`, \`expr\`, beside \`using\`, or an action's value, in \`actions\``,
            );
        }
    }
}
