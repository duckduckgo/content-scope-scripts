import { JSONparse } from '../../captured-globals.js';

/** @typedef {import('./types.js').ParsedNode} ParsedNode */

const UNSAFE = new Set(['script', 'style', 'template']);
const INVISIBLE = /^\p{Cf}*$/u;

/**
 * Reads the translated HTML of a unit from TranslateKit's JSON tree (native parses the engine's HTML, so the page
 * never does), and returns text plus the elements we sent (by `data-t` id). Returns `null` when the tree isn't the
 * shape we sent: anything but `data-t` on an element, a tag that runs code, or TranslateKit's `null` for malformed HTML.
 * @param {string} json - an array of `{"text"}` and `{"tag", "attrs", "children"}` nodes, or `null`
 * @param {boolean} wrapped - the unit was sent inside a `<div>`, which must come back as the only top-level element
 * @returns {ParsedNode[] | null}
 */
export function parseTree(json, wrapped) {
    let nodes;
    try {
        nodes = JSONparse(json);
    } catch {
        return null;
    }
    if (!Array.isArray(nodes)) return null;
    if (!wrapped) return convert(nodes);
    const at = nodes.findIndex((n) => !isText(n));
    const wrapper = nodes[at];
    if (at === -1 || nodes.slice(at + 1).some((n) => !isText(n))) return null;
    if (!isElement(wrapper) || wrapper.tag !== 'div' || Object.keys(wrapper.attrs).length > 0) return null;
    return withSurroundings(textOf(nodes.slice(0, at)), convert(wrapper.children), textOf(nodes.slice(at + 1)));
}

/**
 * @param {unknown[]} nodes
 * @returns {ParsedNode[] | null}
 */
function convert(nodes) {
    /** @type {ParsedNode[]} */
    const out = [];
    for (const node of nodes) {
        if (isText(node)) {
            appendText(out, node.text);
            continue;
        }
        if (!isElement(node)) return null;
        const names = Object.keys(node.attrs);
        const id = idOf(node.tag, names.length === 1 && names[0] === 'data-t' ? node.attrs['data-t'] : null);
        if (id === null) return null;
        const children = convert(node.children);
        if (!children) return null;
        out.push({ id, children });
    }
    return out;
}

/**
 * @param {unknown} node
 * @returns {node is { text: string }}
 */
function isText(node) {
    return typeof node === 'object' && node !== null && typeof (/** @type {any} */ (node).text) === 'string';
}

/**
 * @param {unknown} node
 * @returns {node is { tag: string, attrs: Record<string, unknown>, children: unknown[] }}
 */
function isElement(node) {
    const el = /** @type {any} */ (node);
    return (
        typeof el === 'object' &&
        el !== null &&
        typeof el.tag === 'string' &&
        typeof el.attrs === 'object' &&
        el.attrs !== null &&
        Array.isArray(el.children)
    );
}

/** @param {unknown[]} nodes */
function textOf(nodes) {
    return nodes.map((n) => (isText(n) ? n.text : '')).join('');
}

/**
 * The wrapper's children, or null when real text sits outside the wrapper. Whitespace outside it is dropped;
 * invisible formatting characters (bidi marks, which Bergamot can move past `</div>`) are put back inside.
 * @param {string} before
 * @param {ParsedNode[] | null} children
 * @param {string} after
 * @returns {ParsedNode[] | null}
 */
function withSurroundings(before, children, after) {
    const lead = before.replace(/\s/g, '');
    const trail = after.replace(/\s/g, '');
    if (!children || !INVISIBLE.test(lead) || !INVISIBLE.test(trail)) return null;
    /** @type {ParsedNode[]} */
    const out = lead ? [{ text: lead }] : [];
    for (const node of children) {
        if ('text' in node) {
            appendText(out, node.text);
        } else {
            out.push(node);
        }
    }
    appendText(out, trail);
    return out;
}

/**
 * The id of an element we sent, or null when the tag or id isn't one we'd send.
 * @param {string} tag
 * @param {unknown} rawId
 * @returns {number | null}
 */
function idOf(tag, rawId) {
    if (UNSAFE.has(tag) || typeof rawId !== 'string' || !/^\d+$/.test(rawId)) return null;
    return Number(rawId);
}

/**
 * @param {ParsedNode[]} nodes
 * @param {string} text
 */
function appendText(nodes, text) {
    if (!text) return;
    const last = nodes[nodes.length - 1];
    if (last && 'text' in last) {
        last.text += text;
    } else {
        nodes.push({ text });
    }
}
