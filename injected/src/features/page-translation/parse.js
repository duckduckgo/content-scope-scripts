/** @typedef {import('./types.js').ParsedNode} ParsedNode */

// Captured at load: the page can replace these later. Both are missing outside a browser.
const DOMParserRef = globalThis.DOMParser;
const trustedTypesRef =
    /** @type {{ createPolicy?: (name: string, rules: { createHTML: (s: string) => string }) => { createHTML: (s: string) => unknown } } | undefined} */ (
        /** @type {any} */ (globalThis).trustedTypes
    );

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const VOID = new Set(['area', 'br', 'hr', 'img', 'input', 'wbr']);
const UNSAFE = new Set(['script', 'style', 'template']);
const INVISIBLE = /^\p{Cf}*$/u;
const ENTITIES = /** @type {Record<string, string>} */ ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' });

/** @type {{ createHTML: (s: string) => unknown } | null | undefined} undefined until first use, null when refused */
let policy;

/**
 * Turns the engine's HTML into a tree of text and the elements we sent (by `data-t` id), or `null` when it isn't
 * the shape we sent. Uses the browser's parser through a Trusted Types policy when it can; on pages whose CSP
 * refuses our policy, our own parser, which never touches an HTML sink.
 * @param {string} text
 * @param {boolean} wrapped - the unit was sent inside a `<div>`, which must come back as the only top-level element
 * @returns {ParsedNode[] | null}
 */
export function parseTranslation(text, wrapped) {
    if (!DOMParserRef) return parseOwn(text, wrapped);
    if (trustedTypesRef?.createPolicy) {
        if (policy === undefined) {
            try {
                policy = trustedTypesRef.createPolicy('ddg-translation', { createHTML: (s) => s });
            } catch {
                policy = null;
            }
        }
        if (!policy) return parseOwn(text, wrapped);
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
 * Our own parser: reads only the shape we sent (tags carrying nothing but `data-t`, text, entities).
 * @param {string} text
 * @param {boolean} wrapped
 * @returns {ParsedNode[] | null}
 */
export function parseOwn(text, wrapped) {
    /** @type {{ tag: string, children: ParsedNode[], id: number }[]} */
    const stack = [{ tag: '', children: [], id: -1 }];
    let wrappers = 0;
    let i = 0;
    while (i < text.length) {
        const top = stack[stack.length - 1];
        if (!top) return null;
        const lt = text.indexOf('<', i);
        if (lt !== i) {
            const end = lt === -1 ? text.length : lt;
            appendText(top.children, decodeEntities(text.slice(i, end)));
            i = end;
            continue;
        }
        const gt = text.indexOf('>', i);
        if (gt === -1) return null;
        const tagText = text.slice(i + 1, gt);
        i = gt + 1;
        const close = /^\/([a-z][a-z0-9-]*)\s*$/.exec(tagText);
        if (close) {
            if (stack.length < 2 || top.tag !== close[1]) return null;
            stack.pop();
            const parent = stack[stack.length - 1];
            if (!parent) return null;
            parent.children.push({ id: top.id, children: top.children });
            continue;
        }
        const open = /^([a-z][a-z0-9-]*)(?:\s+data-t="(\d+)")?\s*(\/?)$/.exec(tagText);
        if (!open) return null;
        const [, tag = '', rawId, selfClosing] = open;
        if (wrapped && stack.length === 1 && tag === 'div' && rawId === undefined) {
            wrappers++;
            stack.push({ tag, children: [], id: -1 });
            continue;
        }
        const id = idOf(tag, rawId ?? null);
        if (id === null) return null;
        if (VOID.has(tag)) {
            top.children.push({ id, children: [] });
        } else if (selfClosing) {
            return null;
        } else {
            stack.push({ tag, children: [], id });
        }
    }
    const root = stack[0];
    if (stack.length !== 1 || !root) return null;
    if (!wrapped) return root.children;
    // Exactly one wrapper.
    const at = root.children.findIndex((n) => 'id' in n);
    const only = root.children[at];
    if (wrappers !== 1 || !only || !('children' in only) || root.children.filter((n) => 'id' in n).length !== 1) return null;
    const textOf = (/** @type {ParsedNode[]} */ list) => list.map((n) => ('text' in n ? n.text : '')).join('');
    return withSurroundings(textOf(root.children.slice(0, at)), only.children, textOf(root.children.slice(at + 1)));
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

/** @param {string} text */
function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, name) => {
        if (name[0] === '#') {
            const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
            return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        return ENTITIES[name] ?? match;
    });
}
