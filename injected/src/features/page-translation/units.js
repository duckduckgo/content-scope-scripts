/** @typedef {import('./types.js').UnitTarget} UnitTarget */

// Captured at load: the page can replace these later.
const computedStyle = window.getComputedStyle.bind(window);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const INLINE_DISPLAY = new Set([
    'inline',
    'inline-block',
    'inline-flex',
    'inline-grid',
    'inline-table',
    'contents',
    'ruby',
    'ruby-base',
    'ruby-text',
]);
// Never translated. `select` is temporary: its options would change form values until value pinning exists.
const EXCLUDED_TAGS =
    'script, style, noscript, template, textarea, code, kbd, samp, var, math, svg, iframe, embed, object, ddg-autofill, select';
const LETTER = /\p{L}/u;

/**
 * Finds the translatable units under `root`, in document order.
 * @param {Element} root
 * @param {{ sourceLanguage: string, skip?: (node: Node) => boolean }} options
 * @returns {UnitTarget[]}
 */
export function findUnits(root, options) {
    const walk = new Walk(options.sourceLanguage);
    /** @type {UnitTarget[]} */
    const units = [];
    walk.visit(root, units);
    return units;
}

/**
 * @param {UnitTarget} target
 * @returns {boolean}
 */
export function isInViewport(target) {
    let rect;
    if (target.kind === 'run') {
        const first = target.nodes[0];
        const last = target.nodes[target.nodes.length - 1];
        if (!first || !last) return false;
        const range = document.createRange();
        range.setStartBefore(first);
        range.setEndAfter(last);
        rect = range.getBoundingClientRect();
    } else {
        rect = target.element.getBoundingClientRect();
    }
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

/**
 * Whether `el` and everything inside it must stay as it is.
 * @param {Element} el
 * @param {string} sourceLanguage
 * @returns {boolean}
 */
export function isExcluded(el, sourceLanguage) {
    if (el.matches(EXCLUDED_TAGS)) return true;
    if (el.getAttribute('translate')?.trim().toLowerCase() === 'no' || el.classList.contains('notranslate')) return true;
    if (/** @type {HTMLElement} */ (el).isContentEditable) return true;
    // The <html> lang is ignored: it's often wrong, and we overwrite it.
    const lang = el === document.documentElement ? null : el.getAttribute('lang');
    return !!lang?.trim() && primaryLanguage(lang) !== primaryLanguage(sourceLanguage);
}

/** @param {string} tag */
function primaryLanguage(tag) {
    let canonical = tag.trim();
    try {
        canonical = Intl.getCanonicalLocales(canonical)[0] ?? canonical;
    } catch {
        // Not a valid tag: compare it as written.
    }
    return canonical.toLowerCase().split(/[-_]/)[0];
}

/** Per-walk state, so computed styles are read once per element. */
class Walk {
    /** @param {string} sourceLanguage */
    constructor(sourceLanguage) {
        this.sourceLanguage = sourceLanguage;
    }

    /** @type {Map<Element, boolean>} */
    #inline = new Map();
    /** @type {Map<Element, boolean>} */
    #blockInside = new Map();

    /**
     * @param {Element} el
     * @param {UnitTarget[]} units
     */
    visit(el, units) {
        if (this.isExcluded(el)) return;
        if (!this.isInline(el) && !this.hasBlockInside(el)) {
            if (this.hasLetter(el)) units.push({ kind: 'element', element: el });
            return;
        }
        // A container of blocks: each run of text and inline elements between its blocks is one unit.
        /** @type {ChildNode[]} */
        let run = [];
        for (const child of el.childNodes) {
            if (child.nodeType !== ELEMENT_NODE) {
                run.push(child);
                continue;
            }
            const childEl = /** @type {Element} */ (child);
            if (this.isInline(childEl) && (this.isExcluded(childEl) || !this.hasBlockInside(childEl))) {
                run.push(child);
                continue;
            }
            this.addRun(el, run, units);
            run = [];
            this.visit(childEl, units);
        }
        this.addRun(el, run, units);
    }

    /**
     * Adds `nodes` as a run unit, trimmed of blank edges, if it holds a letter.
     * @param {Element} parent
     * @param {ChildNode[]} nodes
     * @param {UnitTarget[]} units
     */
    addRun(parent, nodes, units) {
        const isBlank = (/** @type {number} */ i) => {
            const node = nodes[i];
            return !!node && node.nodeType !== ELEMENT_NODE && !(node.nodeType === TEXT_NODE && (node.nodeValue || '').trim());
        };
        let start = 0;
        let end = nodes.length;
        while (start < end && isBlank(start)) start++;
        while (end > start && isBlank(end - 1)) end--;
        const trimmed = nodes.slice(start, end);
        if (trimmed.some((node) => this.nodeHasLetter(node))) units.push({ kind: 'run', parent, nodes: trimmed });
    }

    /** @param {Element} el */
    isExcluded(el) {
        return isExcluded(el, this.sourceLanguage);
    }

    /** @param {Element} el */
    isInline(el) {
        let inline = this.#inline.get(el);
        if (inline === undefined) {
            const style = computedStyle(el);
            // A float (e.g. a drop cap) flows inside the text around it, even though its computed display is block.
            inline = INLINE_DISPLAY.has(style.display) || (style.float !== '' && style.float !== 'none');
            this.#inline.set(el, inline);
        }
        return inline;
    }

    /**
     * Whether a block element sits below `el`, reached through inline elements only.
     * @param {Element} el
     * @returns {boolean}
     */
    hasBlockInside(el) {
        let found = this.#blockInside.get(el);
        if (found === undefined) {
            found = false;
            for (const child of el.children) {
                if (this.isExcluded(child)) continue;
                if (!this.isInline(child) || this.hasBlockInside(child)) {
                    found = true;
                    break;
                }
            }
            this.#blockInside.set(el, found);
        }
        return found;
    }

    /**
     * Whether `el` holds a letter outside excluded elements.
     * @param {Element} el
     * @returns {boolean}
     */
    hasLetter(el) {
        for (const child of el.childNodes) {
            if (this.nodeHasLetter(child)) return true;
        }
        return false;
    }

    /** @param {ChildNode} node */
    nodeHasLetter(node) {
        if (node.nodeType === TEXT_NODE) return LETTER.test(node.nodeValue || '');
        if (node.nodeType !== ELEMENT_NODE) return false;
        const el = /** @type {Element} */ (node);
        return !this.isExcluded(el) && this.hasLetter(el);
    }
}
