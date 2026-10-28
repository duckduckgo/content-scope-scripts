/**
 * @typedef {import('./types.js').UnitTarget} UnitTarget
 * @typedef {import('./types.js').Serialized} Serialized
 */

import { isExcluded } from './units.js';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const VOID = new Set(['area', 'br', 'hr', 'img', 'input', 'wbr']);
// Not sent at all, not even as an empty tag: the parser rejects them, and the merge puts them back where they were.
const NEVER_SENT = new Set(['script', 'style', 'template']);

/**
 * What to send the engine for a unit: plain text when it has no child elements, otherwise HTML where each
 * element is reduced to its tag and a per-unit `data-t` id. Attributes stay on the live nodes.
 * Excluded elements inside a unit go as empty tags: the engine never sees their text and they're put back as they are.
 * @param {UnitTarget} target
 * @returns {Serialized}
 */
export function serializeUnit(target) {
    /** @type {Element[]} */
    const elements = [];
    if (target.kind === 'attribute') {
        return { text: stripSoftHyphens(target.element.getAttribute(target.attribute) || ''), html: false, wrapped: false, elements };
    }
    const nodes = target.kind === 'run' ? target.nodes : [...target.element.childNodes];
    const html = serializeNodes(nodes, elements);
    if (elements.length === 0) {
        return {
            text: stripSoftHyphens(nodes.map((node) => (node.nodeType === TEXT_NODE ? node.nodeValue : '')).join('')),
            html: false,
            wrapped: false,
            elements,
        };
    }
    // Bergamot mistranslates a fragment that opens with a tag splitting a word (a drop cap: `<span>A</span>iwa`).
    // A neutral wrapper fixes it; never the unit's own tag, since a bare `<td>` is dropped by HTML parsers.
    const first = nodes.find(
        (node) =>
            (node.nodeType === ELEMENT_NODE && !NEVER_SENT.has(/** @type {Element} */ (node).localName)) ||
            (node.nodeType === TEXT_NODE && (node.nodeValue || '').trim()),
    );
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
            out += escapeHtml(stripSoftHyphens(node.nodeValue || ''));
        } else if (node.nodeType === ELEMENT_NODE) {
            const el = /** @type {Element} */ (node);
            const tag = el.localName;
            if (NEVER_SENT.has(tag)) continue;
            const id = elements.push(el) - 1;
            if (VOID.has(tag)) {
                out += `<${tag} data-t="${id}">`;
            } else {
                const inner = isExcluded(el) ? '' : serializeNodes(el.childNodes, elements);
                out += `<${tag} data-t="${id}">${inner}</${tag}>`;
            }
        }
    }
    return out;
}

/** @param {string} text */
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Soft hyphens are invisible hyphenation hints that split words for the engine.
 * @param {string} text
 */
function stripSoftHyphens(text) {
    return text.replace(/\u00AD/g, '');
}
