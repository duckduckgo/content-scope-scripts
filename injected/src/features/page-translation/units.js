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
const EXCLUDED = 'script, style, noscript, template';
const LETTER = /\p{L}/u;

/**
 * Finds the translatable units under `root`, in document order.
 * @param {Element} root
 * @param {{ sourceLanguage: string, skip?: (node: Node) => boolean }} _options
 * @returns {UnitTarget[]}
 */
export function findUnits(root, _options) {
    const walk = new Walk();
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
    const el = target.kind === 'run' ? target.parent : target.element;
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

/** Per-walk state, so computed styles are read once per element. */
class Walk {
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
        for (const child of el.children) this.visit(child, units);
    }

    /** @param {Element} el */
    isExcluded(el) {
        return el.matches(EXCLUDED);
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
            if (child.nodeType === TEXT_NODE && LETTER.test(child.nodeValue || '')) return true;
            if (
                child.nodeType === ELEMENT_NODE &&
                !this.isExcluded(/** @type {Element} */ (child)) &&
                this.hasLetter(/** @type {Element} */ (child))
            ) {
                return true;
            }
        }
        return false;
    }
}
