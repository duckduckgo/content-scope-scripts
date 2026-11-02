/** @typedef {import('./types.js').UnitTarget} UnitTarget */

// Captured at load: the page can replace these later.
const computedStyle = window.getComputedStyle.bind(window);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

// Block-level by default. A `display: none` element's computed display says nothing about how it flows when shown,
// so it falls back to its tag's usual display.
const BLOCK_TAGS = new Set(
    'address article aside blockquote caption center dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr legend li main menu nav ol p pre search section summary table tbody td tfoot th thead tr ul'.split(
        ' ',
    ),
);
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
// Never translated.
const EXCLUDED_TAGS = 'script, style, noscript, template, textarea, code, kbd, samp, var, math, svg, iframe, embed, object, ddg-autofill';
const LETTER = /\p{L}/u;

/**
 * Finds the translatable units under `root`, in document order.
 * @param {Element} root
 * @returns {UnitTarget[]}
 */
export function findUnits(root) {
    const walk = new Walk();
    /** @type {UnitTarget[]} */
    const units = [];
    walk.visit(root, units);
    // A <select> or <datalist> goes empty inside its sentence, and each option is a plain-text unit of its own.
    for (const option of root.querySelectorAll('select option, datalist option')) {
        if (LETTER.test(option.textContent || '') && !isInExcluded(option)) units.push({ kind: 'element', element: option });
    }
    // Attributes come after the content: the page's <meta> description first (nothing else in <head>, so the
    // <title> is left alone), then every element under root in document order.
    const metas = root === document.body && document.head ? [...document.head.querySelectorAll(META)] : [];
    for (const el of [...metas, root, ...root.querySelectorAll('*')]) {
        for (const attribute of translatableAttributes(el)) units.push({ kind: 'attribute', element: el, attribute });
    }
    return units;
}

const META = 'meta[name="description" i], meta[name="keywords" i]';
// Never on form controls: Autofill reads their attributes, and changing them is deferred until it reads originals.
const FORM_CONTROLS = 'input, select, textarea, button';
/** @type {[string, string[]][]} */
const ATTRIBUTES = [
    ['*', ['title', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext']],
    ['img, area', ['alt']],
    ['track, optgroup, option', ['label']],
    ['th', ['abbr']],
    [META, ['content']],
];

/**
 * The attributes of `el` that hold text to translate.
 * @param {Element} el
 * @returns {string[]}
 */
function translatableAttributes(el) {
    /** @type {string[]} */
    const found = [];
    for (const [selector, names] of ATTRIBUTES) {
        // Cheapest test first: almost no element carries any of these attributes.
        const present = names.filter((name) => LETTER.test(el.getAttribute(name) || ''));
        if (present.length > 0 && el.matches(selector)) found.push(...present);
    }
    // Only then the costlier checks, which walk the element's ancestors.
    return found.length > 0 && !el.matches(FORM_CONTROLS) && !isInExcluded(el) ? found : [];
}

/**
 * Whether `el` or an ancestor is excluded.
 * @param {Element} el
 */
function isInExcluded(el) {
    for (let node = /** @type {Element | null} */ (el); node; node = node.parentElement) {
        if (isExcluded(node)) return true;
    }
    return false;
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
    const onScreen = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    return onScreen && rect.width > 0 && rect.height > 0 && isVisible(target.kind === 'run' ? target.parent : target.element);
}

/**
 * Whether `el` is rendered and not made invisible (hidden, `visibility: hidden`, `opacity: 0`, closed `<details>`).
 * @param {Element} el
 * @returns {boolean}
 */
function isVisible(el) {
    if (typeof el.checkVisibility === 'function') {
        return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    }
    for (let node = /** @type {Element | null} */ (el); node; node = node.parentElement) {
        const style = computedStyle(node);
        if (style.display === 'none' || style.opacity === '0') return false;
    }
    return computedStyle(el).visibility !== 'hidden';
}

/**
 * Whether `el` goes to the engine as an empty tag inside its unit and is put back untouched: an excluded element, or a
 * `<select>` or `<datalist>` (their options are translated as units of their own).
 * @param {Element} el
 * @returns {boolean}
 */
export function isSentEmpty(el) {
    return el.localName === 'select' || el.localName === 'datalist' || isExcluded(el);
}

/**
 * Whether `el` and everything inside it must stay as it is, whatever the page's language.
 * @param {Element} el
 * @returns {boolean}
 */
export function isExcluded(el) {
    if (el.matches(EXCLUDED_TAGS)) return true;
    if (el.getAttribute('translate')?.trim().toLowerCase() === 'no' || el.classList.contains('notranslate')) return true;
    return !!(/** @type {HTMLElement} */ (el).isContentEditable);
}

/**
 * Whether `el` is marked as a language other than `sourceLanguage`. Checked at apply time, once native knows the
 * page's language: such content is extracted and translated, but never written back.
 * @param {Element} el
 * @param {string} sourceLanguage
 * @returns {boolean}
 */
export function isOtherLanguage(el, sourceLanguage) {
    if (!sourceLanguage.trim()) return false;
    // The <html> lang is ignored: it's often wrong, and we overwrite it.
    const lang = el === document.documentElement ? null : el.getAttribute('lang');
    return !!lang?.trim() && primaryLanguage(lang) !== primaryLanguage(sourceLanguage);
}

/**
 * Whether `el` or an ancestor below <html> is marked as another language. The nearest `lang` wins.
 * @param {Element} el
 * @param {string} sourceLanguage
 * @returns {boolean}
 */
export function isInOtherLanguage(el, sourceLanguage) {
    const marked = el.closest('[lang]');
    return !!marked && isOtherLanguage(marked, sourceLanguage);
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
    /** @type {Map<Element, boolean>} */
    #inline = new Map();
    /** @type {Map<Element, boolean>} */
    #blockInside = new Map();

    /**
     * @param {Element} el
     * @param {UnitTarget[]} units
     */
    visit(el, units) {
        if (this.isSentEmpty(el)) return;
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
            if (this.isInline(childEl) && (this.isSentEmpty(childEl) || !this.hasBlockInside(childEl))) {
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
    isSentEmpty(el) {
        return isSentEmpty(el);
    }

    /** @param {Element} el */
    isInline(el) {
        let inline = this.#inline.get(el);
        if (inline === undefined) {
            const style = computedStyle(el);
            if (style.display === 'none') {
                inline = !BLOCK_TAGS.has(el.localName);
            } else {
                // A float (e.g. a drop cap) flows inside the text around it, even though its computed display is block.
                inline = INLINE_DISPLAY.has(style.display) || (style.float !== '' && style.float !== 'none');
            }
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
                if (this.isSentEmpty(child)) continue;
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
        return !this.isSentEmpty(el) && this.hasLetter(el);
    }
}
