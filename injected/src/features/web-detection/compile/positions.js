import { ConfigParseError, FILLS } from '../model/core.js';

/**
 * @import { Node, Position, SourceNode } from '../model/types.js'
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
            return new Set([...(first ?? [])].filter((position) => rest.every((fills) => fills.has(position))));
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
            return new Set([...occurrenceFills(node.then)].filter((p) => elseFills.has(p) && p !== 'list'));
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
 * Mark the expressions computed per item: those reading `self` of the `using`, `where` or `field` they
 * sit in, or a `ref` inside one, since a `define` there can bind the name again for each item. One
 * reading neither inside a `where` is computed once per evaluation of the source.
 *
 * @param {Scope} scope
 */
function markPerItem(scope) {
    /** @type {Map<Node, boolean>} */
    const marked = new Map();
    /**
     * @param {Node} node
     * @returns {boolean}
     */
    const visit = (node) => {
        const seen = marked.get(node);
        if (seen !== undefined) return seen;
        const perItem =
            node.kind === 'item' ||
            (node.kind === 'ref' && node.binder !== undefined) ||
            (node.binder !== undefined && (scope.deps.get(node) ?? []).some((dep) => dep.binder === node.binder && visit(dep)));
        marked.set(node, perItem);
        if (perItem) {
            node.perItem = true;
            if (node.binder) node.binder.framed = true;
        }
        return perItem;
    };
    scope.nodes.forEach(visit);
}

/**
 * Settle each operand slot's position, then check every expression fills its position.
 *
 * @param {Scope} scope
 */
export function finish(scope) {
    markPerItem(scope);
    for (const { node, single } of scope.slots) {
        // `element` without `field` and `text` are the condition leaf under any / all / none: a boolean
        const leaf = single === 'boolean' && isPresenceLeaf(node);
        node.position = fillsOf(node).has('list') && !leaf ? 'spread' : single;
        node.single = single;
    }
    for (const node of scope.nodes) {
        if (!fits(fillsOf(node), node.position)) {
            const what =
                node.kind === 'source'
                    ? `'${/** @type {SourceNode} */ (node).source.key}'${node.bodies.some((b) => /** @type {any} */ (b).field) ? ' with field' : ''}`
                    : `'${node.kind}'`;
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
    if (current.kind !== 'source') return false;
    const key = current.source.key;
    return key === 'text' || (key === 'element' && current.bodies.every((body) => !(/** @type {{ field?: unknown }} */ (body).field)));
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
