import { ReflectApply } from '../../captured-globals.js';

/**
 * @typedef {import('./types.js').UnitTarget} UnitTarget
 * @typedef {import('./types.js').ParsedNode} ParsedNode
 */

// Captured at load: the page can replace these later.
const insertBefore = Node.prototype.insertBefore;
const removeChild = Node.prototype.removeChild;
const createTextNode = Document.prototype.createTextNode;
const cloneNode = Node.prototype.cloneNode;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * Writes a plain-text translation.
 * @param {UnitTarget} target
 * @param {string} text
 */
export function writeText(target, text) {
    if (target.kind === 'attribute') {
        target.element.setAttribute(target.attribute, text);
        return;
    }
    const nodes = target.kind === 'run' ? target.nodes : [...target.element.childNodes];
    const texts = /** @type {Text[]} */ (nodes.filter((node) => node.nodeType === TEXT_NODE));
    texts.forEach((node, i) => setText(node, i === 0 ? text : ''));
}

/**
 * Writes an HTML translation onto the unit's original nodes: elements are moved, never recreated, and text goes into
 * the existing text nodes.
 * @param {UnitTarget} target
 * @param {Element[]} elements - live element for each `data-t` id
 * @param {ParsedNode[]} parsed
 * @param {(el: Element) => boolean} isExcluded
 */
export function mergeUnit(target, elements, parsed, isExcluded) {
    const merge = new Merge(elements, isExcluded);
    if (target.kind === 'element') {
        merge.into(target.element, [...target.element.childNodes], parsed, null);
    } else if (target.kind === 'run') {
        const last = target.nodes[target.nodes.length - 1];
        const anchor = last ? last.nextSibling : null;
        target.nodes = merge.into(target.parent, target.nodes, parsed, anchor);
    }
}

class Merge {
    /**
     * @param {Element[]} elements
     * @param {(el: Element) => boolean} isExcluded
     */
    constructor(elements, isExcluded) {
        this.elements = elements;
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
     * @param {boolean} [copying] - building a copy: every element in it is a copy too, never a live node
     * @returns {ChildNode[]}
     */
    into(parent, current, parsed, anchor, copying = false) {
        const texts = /** @type {Text[]} */ (current.filter((node) => node.nodeType === TEXT_NODE));
        /** @type {ChildNode[]} */
        const next = [];
        for (const item of parsed) {
            if ('text' in item) {
                next.push(this.text(texts, item.text));
                continue;
            }
            const live = this.elements[item.id];
            // Not an element we sent, or one that would end up inside itself (the engine turned the nesting inside
            // out): keep its words, never create or move an element.
            if (!live || live.contains(parent)) {
                next.push(this.text(texts, textOf(item.children)));
                continue;
            }
            // The engine can split one tag into two (`<b>red car</b>` → `<b>voiture</b> … <b>rouge</b>`). The second
            // gets a copy built only from copies, so every live node stays in the first.
            if (copying || this.used.has(item.id)) {
                const excluded = this.isExcluded(live);
                const copy = /** @type {Element} */ (ReflectApply(cloneNode, live, [excluded]));
                if (!excluded) this.into(copy, [], item.children, null, true);
                next.push(copy);
                continue;
            }
            this.used.add(item.id);
            // A tag returned empty stays empty: the engine moved its text elsewhere, so putting it back would double it.
            if (!this.isExcluded(live)) this.into(live, [...live.childNodes], item.children, null);
            next.push(live);
        }
        // An element the engine dropped is put back, so no link, input or image is lost.
        for (const node of current) {
            if (node.nodeType !== ELEMENT_NODE || next.includes(node)) continue;
            const id = this.elements.indexOf(/** @type {Element} */ (node));
            if (id !== -1 && !this.used.has(id)) next.push(node);
        }
        // Nodes never sent (comments, <style>, <script>) stay before the content if they were before it, else after.
        const isContent = (/** @type {ChildNode} */ node) =>
            node.nodeType === TEXT_NODE || (node.nodeType === ELEMENT_NODE && this.elements.includes(/** @type {Element} */ (node)));
        const firstContent = current.findIndex(isContent);
        const leading = current.filter((node, i) => !isContent(node) && (firstContent === -1 || i < firstContent));
        const trailing = current.filter((node, i) => !isContent(node) && firstContent !== -1 && i > firstContent);
        next.unshift(...leading);
        next.push(...trailing);
        if (!sameList(current, next)) {
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
            setText(node, text);
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
 * @param {CharacterData} node
 * @param {string} data
 */
function setText(node, data) {
    if (node.data !== data) node.data = data;
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
