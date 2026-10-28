/**
 * @typedef {import('./types.js').UnitTarget} UnitTarget
 * @typedef {import('./types.js').ParsedNode} ParsedNode
 */

/**
 * Everything a write changed, so revert can put it back. The first snapshot of each node wins: that's the original.
 * @typedef {{
 *   children: Map<Node, ChildNode[]>,
 *   texts: Map<CharacterData, string>,
 *   attributes: Map<Element, Map<string, string | null>>,
 * }} Journal
 */

// Captured at load: the page can replace these later.
const insertBefore = Node.prototype.insertBefore;
const removeChild = Node.prototype.removeChild;
const createTextNode = Document.prototype.createTextNode;
const ReflectApply = Reflect.apply;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/** @returns {Journal} */
export function createJournal() {
    return { children: new Map(), texts: new Map(), attributes: new Map() };
}

/**
 * Writes a plain-text translation.
 * @param {UnitTarget} target
 * @param {string} text
 * @param {Journal} journal
 */
export function writeText(target, text, journal) {
    if (target.kind === 'attribute') {
        recordAttribute(journal, target.element, target.attribute);
        target.element.setAttribute(target.attribute, text);
        return;
    }
    const nodes = target.kind === 'run' ? target.nodes : [...target.element.childNodes];
    const texts = /** @type {Text[]} */ (nodes.filter((node) => node.nodeType === TEXT_NODE));
    texts.forEach((node, i) => setText(journal, node, i === 0 ? text : ''));
}

/**
 * Writes an HTML translation onto the unit's original nodes: elements are moved, never recreated, and text goes into
 * the existing text nodes.
 * @param {UnitTarget} target
 * @param {Element[]} elements - live element for each `data-t` id
 * @param {ParsedNode[]} parsed
 * @param {Journal} journal
 * @param {(el: Element) => boolean} isExcluded
 */
export function mergeUnit(target, elements, parsed, journal, isExcluded) {
    const merge = new Merge(elements, journal, isExcluded);
    if (target.kind === 'element') {
        merge.into(target.element, [...target.element.childNodes], parsed, null);
    } else if (target.kind === 'run') {
        const last = target.nodes[target.nodes.length - 1];
        const anchor = last ? last.nextSibling : null;
        target.nodes = merge.into(target.parent, target.nodes, parsed, anchor);
    }
}

/**
 * Puts back everything recorded in the journal.
 * @param {Journal} journal
 */
export function revertJournal(journal) {
    for (const [el, attributes] of journal.attributes) {
        for (const [name, value] of attributes) {
            if (value === null) {
                el.removeAttribute(name);
            } else {
                el.setAttribute(name, value);
            }
        }
    }
    for (const [node, data] of journal.texts) node.data = data;
    for (const [parent, children] of journal.children) replaceChildren(parent, [...parent.childNodes], children, null);
    journal.children.clear();
    journal.texts.clear();
    journal.attributes.clear();
}

class Merge {
    /**
     * @param {Element[]} elements
     * @param {Journal} journal
     * @param {(el: Element) => boolean} isExcluded
     */
    constructor(elements, journal, isExcluded) {
        this.elements = elements;
        this.journal = journal;
        this.isExcluded = isExcluded;
        /** @type {Set<number>} */
        this.used = new Set();
    }

    /**
     * Rebuilds `current` (children of `parent`, before `anchor`) from the translation. Returns the new node list.
     * @param {Node} parent
     * @param {ChildNode[]} current
     * @param {ParsedNode[]} parsed
     * @param {ChildNode | null} anchor
     * @returns {ChildNode[]}
     */
    into(parent, current, parsed, anchor) {
        const texts = /** @type {Text[]} */ (current.filter((node) => node.nodeType === TEXT_NODE));
        /** @type {ChildNode[]} */
        const next = [];
        for (const item of parsed) {
            if ('text' in item) {
                next.push(this.text(texts, item.text));
                continue;
            }
            const el = this.elements[item.id];
            if (!el || this.used.has(item.id)) {
                // Not an element we sent (or sent once): keep its words, never create an element.
                next.push(this.text(texts, textOf(item.children)));
                continue;
            }
            this.used.add(item.id);
            if (!this.isExcluded(el)) this.into(el, [...el.childNodes], item.children, null);
            next.push(el);
        }
        // Comments and other non-content nodes stay, at the end of the range.
        for (const node of current) {
            if (node.nodeType !== TEXT_NODE && node.nodeType !== ELEMENT_NODE) next.push(node);
        }
        if (!sameList(current, next)) {
            if (!this.journal.children.has(parent)) this.journal.children.set(parent, [...parent.childNodes]);
            replaceChildren(parent, current, next, anchor);
        }
        return next;
    }

    /**
     * The next unused original text node, with `text` written into it, or a new one.
     * @param {Text[]} texts
     * @param {string} text
     * @returns {Text}
     */
    text(texts, text) {
        const node = texts.shift();
        if (node) {
            setText(this.journal, node, text);
            return node;
        }
        return /** @type {Text} */ (ReflectApply(createTextNode, document, [text]));
    }
}

/**
 * Replaces `current` (children of `parent`) with `next`, inserting before `anchor`.
 * @param {Node} parent
 * @param {ChildNode[]} current
 * @param {ChildNode[]} next
 * @param {ChildNode | null} anchor
 */
function replaceChildren(parent, current, next, anchor) {
    const keep = new Set(next);
    for (const node of current) {
        if (!keep.has(node) && node.parentNode === parent) ReflectApply(removeChild, parent, [node]);
    }
    for (const node of next) ReflectApply(insertBefore, parent, [node, anchor]);
}

/**
 * @param {Journal} journal
 * @param {CharacterData} node
 * @param {string} data
 */
function setText(journal, node, data) {
    if (node.data === data) return;
    if (!journal.texts.has(node)) journal.texts.set(node, node.data);
    node.data = data;
}

/**
 * @param {Journal} journal
 * @param {Element} el
 * @param {string} name
 */
function recordAttribute(journal, el, name) {
    let attributes = journal.attributes.get(el);
    if (!attributes) {
        attributes = new Map();
        journal.attributes.set(el, attributes);
    }
    if (!attributes.has(name)) attributes.set(name, el.getAttribute(name));
}

/**
 * @param {ParsedNode[]} nodes
 * @returns {string}
 */
function textOf(nodes) {
    return nodes.map((node) => ('text' in node ? node.text : textOf(node.children))).join('');
}

/**
 * @param {ChildNode[]} a
 * @param {ChildNode[]} b
 */
function sameList(a, b) {
    return a.length === b.length && a.every((node, i) => node === b[i]);
}
