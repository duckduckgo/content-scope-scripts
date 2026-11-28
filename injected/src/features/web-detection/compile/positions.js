/**
 * @import { Node } from '../model/types.js'
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
        case 'iter':
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
        if (node.kind === 'iter') node.position = 'stream';
        else node.position = givesList(node) && !leaf ? 'spread' : single;
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
