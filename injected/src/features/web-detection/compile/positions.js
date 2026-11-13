import { ConfigParseError, FILLS, NativeSet } from '../model/core.js';

/**
 * @import { Node, Position } from '../model/types.js'
 * @import { Scope } from './compile.js'
 */

/**
 * The positions an expression fills.
 *
 * @param {Node} node
 * @returns {ReadonlySet<Position>}
 */
function fillsOf(node) {
    switch (node.kind) {
        case 'literal':
            if (typeof node.value === 'number') return FILLS.number;
            return typeof node.value === 'boolean' ? FILLS.boolean : FILLS.value;
        case 'source': {
            const [first, ...rest] = node.bodies.map((body) => node.source.fills(body));
            return new NativeSet([...(first ?? [])].filter((position) => rest.every((fills) => fills.has(position))));
        }
        case 'length':
        case 'only':
        case 'sum':
        case 'mul':
        case 'div':
            return FILLS.number;
        case 'any':
        case 'all':
        case 'none':
        case 'and':
            return FILLS.boolean;
        case 'if': {
            // With no branch taken, `undefined`, which fills value position only
            const elseFills = node.else ? occurrenceFills(node.else) : FILLS.value;
            return new NativeSet([...occurrenceFills(node.then)].filter((p) => elseFills.has(p) && p !== 'list'));
        }
        case 'sequence':
            return occurrenceFills(/** @type {Node} */ (node.elements[node.elements.length - 1]));
        case 'ref':
        case 'item':
            // A bound value may be any value, and is checked where it is read
            return FILLS.any;
        case 'expr':
        case 'using':
            return occurrenceFills(node.operand);
        case 'list':
            return FILLS.array;
        case 'define':
        case 'fireEvent':
        case 'breakageReportData':
            // An action gives `undefined`
            return FILLS.value;
    }
}

/**
 * The positions an expression fills where it sits: with `is`, a boolean.
 *
 * @param {Node} node
 * @returns {ReadonlySet<Position>}
 */
function occurrenceFills(node) {
    return node.is ? FILLS.boolean : fillsOf(node);
}

/**
 * Settle each operand slot's position, then check every expression fills its position.
 *
 * @param {Scope} scope
 */
export function finish(scope) {
    for (const { node, single } of scope.slots) {
        // `element` without `field` and `text` are the condition leaf under any / all / none: a boolean
        const leaf = single === 'boolean' && isPresenceLeaf(node);
        node.position = fillsOf(node).has('list') && !leaf ? 'spread' : single;
        node.single = single;
    }
    for (const node of scope.nodes) {
        if (!fits(fillsOf(node), node.position)) {
            const what = node.kind === 'source' ? `'${node.source.key}'${node.withField ? ' with field' : ''}` : `'${node.kind}'`;
            const hint =
                node.position === 'boolean' && fillsOf(node).has('number')
                    ? '; numbers become booleans only through `is`'
                    : node.kind === 'if' && !node.else
                      ? '; without `else` it gives `undefined` when the condition does not hold'
                      : '';
            throw new ConfigParseError(node.path, `${what} does not fill ${node.position} position${hint}`);
        }
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
 * @param {ReadonlySet<Position>} fills
 * @param {Position} position
 * @returns {boolean}
 */
function fits(fills, position) {
    if (position === 'spread') return fills.has('list');
    if (position === 'root') return fills.has('list') || fills.has('value');
    return fills.has(position);
}
