/** @typedef {import('./types.js').ParsedNode} ParsedNode */

// Captured at load: the page can replace these later. Both are missing outside a browser.
const DOMParserRef = globalThis.DOMParser;
const trustedTypesRef =
    /** @type {{ createPolicy?: (name: string, rules: { createHTML: (s: string) => string }) => { createHTML: (s: string) => unknown } } | undefined} */ (
        /** @type {any} */ (globalThis).trustedTypes
    );

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const UNSAFE = new Set(['script', 'style', 'template']);
const INVISIBLE = /^\p{Cf}*$/u;

/** @type {{ createHTML: (s: string) => unknown } | null | undefined} undefined until first use, null when refused */
let policy;

/**
 * Turns the engine's HTML into a tree of text and the elements we sent (by `data-t` id), or `null` when it isn't
 * the shape we sent. Parses into an inert document, through a Trusted Types policy where the page has Trusted Types.
 * A page whose CSP refuses our policy can't be parsed: its HTML units are skipped (plain-text units need no parsing).
 * @param {string} text
 * @param {boolean} wrapped - the unit was sent inside a `<div>`, which must come back as the only top-level element
 * @returns {ParsedNode[] | null}
 */
export function parseTranslation(text, wrapped) {
    if (!DOMParserRef) return null;
    if (trustedTypesRef?.createPolicy) {
        if (policy === undefined) {
            try {
                policy = trustedTypesRef.createPolicy('ddg-translation', { createHTML: (s) => s });
            } catch {
                policy = null;
            }
        }
        if (!policy) return null;
        const html = /** @type {string} */ (policy.createHTML(text));
        return fromDocument(new DOMParserRef().parseFromString(html, 'text/html').body, wrapped);
    }
    return fromDocument(new DOMParserRef().parseFromString(text, 'text/html').body, wrapped);
}

/**
 * Converts the body of an inert parsed document.
 * @param {Element} body
 * @param {boolean} wrapped
 * @returns {ParsedNode[] | null}
 */
export function fromDocument(body, wrapped) {
    // The parser moves a leading <script>, <style>, <title> or <meta> into <head>, leaving the body looking clean.
    if (body.ownerDocument.head?.hasChildNodes()) return null;
    if (!wrapped) return convertChildren(body);
    const elements = [...body.children];
    const wrapper = elements[0];
    if (elements.length !== 1 || !wrapper || wrapper.localName !== 'div' || wrapper.attributes.length > 0) return null;
    const nodes = [...body.childNodes];
    const at = nodes.indexOf(wrapper);
    const textOf = (/** @type {ChildNode[]} */ list) => list.map((n) => (n.nodeType === TEXT_NODE ? n.nodeValue : '')).join('');
    return withSurroundings(textOf(nodes.slice(0, at)), convertChildren(wrapper), textOf(nodes.slice(at + 1)));
}

/**
 * @param {Element} parent
 * @returns {ParsedNode[] | null}
 */
function convertChildren(parent) {
    /** @type {ParsedNode[]} */
    const out = [];
    for (const node of parent.childNodes) {
        if (node.nodeType === TEXT_NODE) {
            appendText(out, node.nodeValue || '');
        } else if (node.nodeType === ELEMENT_NODE) {
            const el = /** @type {Element} */ (node);
            const id = idOf(el.localName, el.attributes.length === 1 ? el.getAttribute('data-t') : null);
            if (id === null) return null;
            const children = convertChildren(el);
            if (!children) return null;
            out.push({ id, children });
        }
    }
    return out;
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
 * @param {string | null} rawId
 * @returns {number | null}
 */
function idOf(tag, rawId) {
    if (UNSAFE.has(tag) || rawId === null || !/^\d+$/.test(rawId)) return null;
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
