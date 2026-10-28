/**
 * @typedef {import('./types.js').UnitTarget} UnitTarget
 * @typedef {import('./types.js').Serialized} Serialized
 */

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const VOID = new Set(['area', 'br', 'hr', 'img', 'input', 'wbr']);

/**
 * What to send the engine for a unit: plain text when it has no child elements, otherwise HTML where each
 * element is reduced to its tag and a per-unit `data-t` id. Attributes stay on the live nodes.
 * @param {UnitTarget} target
 * @returns {Serialized}
 */
export function serializeUnit(target) {
    /** @type {Element[]} */
    const elements = [];
    if (target.kind === 'attribute') {
        return { text: target.element.getAttribute(target.attribute) || '', html: false, wrapped: false, elements };
    }
    const nodes = target.kind === 'run' ? target.nodes : [...target.element.childNodes];
    const html = serializeNodes(nodes, elements);
    if (elements.length === 0) {
        return {
            text: nodes.map((node) => (node.nodeType === TEXT_NODE ? node.nodeValue : '')).join(''),
            html: false,
            wrapped: false,
            elements,
        };
    }
    // Bergamot mistranslates a fragment that opens with a tag splitting a word (a drop cap: `<span>A</span>iwa`).
    // A neutral wrapper fixes it; never the unit's own tag, since a bare `<td>` is dropped by HTML parsers.
    const first = nodes.find((node) => node.nodeType === ELEMENT_NODE || (node.nodeType === TEXT_NODE && (node.nodeValue || '').trim()));
    if (first?.nodeType === ELEMENT_NODE) {
        return { text: `<div>${html}</div>`, html: true, wrapped: true, elements };
    }
    return { text: html, html: true, wrapped: false, elements };
}

/**
 * @param {Iterable<ChildNode>} nodes
 * @param {Element[]} elements
 * @returns {string}
 */
function serializeNodes(nodes, elements) {
    let out = '';
    for (const node of nodes) {
        if (node.nodeType === TEXT_NODE) {
            out += escapeHtml(node.nodeValue || '');
        } else if (node.nodeType === ELEMENT_NODE) {
            const el = /** @type {Element} */ (node);
            const tag = el.localName;
            const id = elements.push(el) - 1;
            out += VOID.has(tag) ? `<${tag} data-t="${id}">` : `<${tag} data-t="${id}">${serializeNodes(el.childNodes, elements)}</${tag}>`;
        }
    }
    return out;
}

/** @param {string} text */
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
