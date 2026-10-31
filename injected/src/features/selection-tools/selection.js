/**
 * Reads the user's selection from the page: text, whether it's editable, and where it is on screen.
 *
 * @typedef {object} Rect
 * @property {number} left
 * @property {number} top
 * @property {number} right
 * @property {number} bottom
 *
 * @typedef {object} SelectionSnapshot
 * @property {string} text What the user can see of the selection
 * @property {string} browserText The selection as the browser reports it, hidden text included
 * @property {boolean} editable
 * @property {Element | null} element The field or editing host, or else the element the selection starts in
 * @property {() => Rect} bounds Viewport rect of the selected text in CSS pixels, measured now
 */

// Captured before page script runs, so a page can't patch it to reach into the closed shadow root.
const attachShadow = Element.prototype.attachShadow;
const HOST_TAG = 'ddg-selection-tools';

/** Smaller text, or text this faint, is taken as hidden. */
const MIN_READABLE_FONT_PX = 4;
const MIN_VISIBLE_ALPHA = 0.1;

/** Password fields are excluded on purpose: their contents must never be offered anywhere. */
const TEXT_INPUT_TYPES = ['text', 'search', 'email', 'url', ''];

const MIRROR_STYLES = /** @type {const} */ ([
    'boxSizing',
    'width',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontFamily',
    'lineHeight',
    'letterSpacing',
    'wordSpacing',
    'textTransform',
    'textIndent',
    'tabSize',
]);

function deepActiveElement() {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
    }
    return active;
}

/**
 * @param {Element | null} node
 * @returns {node is HTMLInputElement | HTMLTextAreaElement}
 */
function isTextField(node) {
    if (node instanceof HTMLTextAreaElement) return !node.readOnly && !node.disabled;
    return node instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(node.type) && !node.readOnly && !node.disabled;
}

/**
 * @param {Node | null} node
 * @returns {Element | null}
 */
function elementOf(node) {
    return node instanceof Element ? node : (node?.parentElement ?? null);
}

/**
 * The outermost contenteditable ancestor, or null.
 * @param {Element | null} element
 * @returns {HTMLElement | null}
 */
function editingHostOf(element) {
    if (!(element instanceof HTMLElement) || !element.isContentEditable) return null;
    let host = element;
    while (host.parentElement?.isContentEditable) {
        host = host.parentElement;
    }
    return host;
}

/**
 * Text fields expose no geometry for their selection, so lay the field's text out again in a hidden mirror with the
 * same box and font, wrap the selected part in a span, and map the span's boxes back onto the field. The mirror holds
 * the field's text, so it goes in a closed shadow root that's in the document only while it's measured.
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {number} start
 * @param {number} end
 * @returns {Rect}
 */
function fieldSelectionBounds(field, start, end) {
    const host = document.createElement(HOST_TAG);
    for (const [name, value] of Object.entries({
        display: 'block',
        position: 'fixed',
        inset: '0',
        visibility: 'hidden',
        'pointer-events': 'none',
    })) {
        host.style.setProperty(name, value, 'important');
    }
    try {
        const shadow = /** @type {ShadowRoot} */ (attachShadow.call(host, { mode: 'closed' }));
        document.documentElement.appendChild(host);
        return measureInMirror(field, start, end, shadow);
    } catch {
        // A page that defines this element itself can make attaching the shadow root throw.
        const box = field.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    } finally {
        host.remove();
    }
}

/**
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {number} start
 * @param {number} end
 * @param {Node} scratch
 * @returns {Rect}
 */
function measureInMirror(field, start, end, scratch) {
    const style = getComputedStyle(field);
    const mirror = document.createElement('div');
    for (const name of MIRROR_STYLES) {
        mirror.style[name] = style[name];
    }
    Object.assign(mirror.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        height: 'auto',
        overflow: 'hidden',
        visibility: 'hidden',
        borderColor: 'transparent',
        whiteSpace: field instanceof HTMLInputElement ? 'pre' : 'pre-wrap',
        overflowWrap: 'break-word',
    });
    mirror.textContent = field.value.slice(0, start);
    const marked = document.createElement('span');
    marked.textContent = field.value.slice(start, end);
    mirror.append(marked);
    scratch.appendChild(mirror);
    const origin = mirror.getBoundingClientRect();
    const box = field.getBoundingClientRect();
    const dx = box.left - origin.left - field.scrollLeft;
    const dy = box.top - origin.top - field.scrollTop;
    // Clipped to the field, since part of the selection can be scrolled out of view inside it.
    const lines = [...marked.getClientRects()]
        .map((r) => ({
            left: Math.max(r.left + dx, box.left),
            right: Math.min(r.right + dx, box.right),
            top: Math.max(r.top + dy, box.top),
            bottom: Math.min(r.bottom + dy, box.bottom),
        }))
        .filter((r) => r.right > r.left && r.bottom > r.top);
    if (!lines.length) {
        return { left: box.left, right: box.left, top: box.top, bottom: box.top };
    }
    return {
        left: Math.min(...lines.map((r) => r.left)),
        right: Math.max(...lines.map((r) => r.right)),
        top: Math.min(...lines.map((r) => r.top)),
        bottom: Math.max(...lines.map((r) => r.bottom)),
    };
}

/**
 * Alpha of a computed colour, such as "rgba(0, 0, 0, 0)" or "oklch(0.5 0.1 200 / 0.5)"; 1 when it has none.
 * @param {string} color
 */
function alphaOf(color) {
    const match = /^rgba\(.*,\s*([\d.]+)\)$/.exec(color) ?? /\/\s*([\d.]+)(%?)\s*\)$/.exec(color);
    if (!match) return 1;
    const [, alpha = '1', percent] = match;
    return parseFloat(alpha) / (percent ? 100 : 1);
}

/**
 * Whether text drawn in an element can't be seen: transparent, too small to read, or clipped to a pixel, the ways a page
 * hides instructions inside a selection so they reach Duck.ai unseen. Text in the same colour as its background still
 * passes.
 * @param {Element} element
 * @param {Map<Element, boolean>} seen
 * @returns {boolean}
 */
function isHidden(element, seen) {
    const known = seen.get(element);
    if (known !== undefined) return known;
    let hidden = false;
    const style = getComputedStyle(element);
    // checkVisibility counts display: contents as hidden for want of a box, though what's in it shows. Some sites wrap
    // their whole article in one.
    if (style.display !== 'contents' && element.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) === false) {
        hidden = true;
    } else {
        // Gradient text is drawn through a transparent colour.
        const clippedToText = style.backgroundClip === 'text' || style.getPropertyValue('-webkit-background-clip') === 'text';
        // An element shrunk to a pixel with its overflow cut off, as screen-reader-only text is. The root elements and
        // display: contents have no box of their own to go by.
        const hasOwnBox = element !== document.documentElement && element !== document.body && style.display !== 'contents';
        const box = element.getBoundingClientRect();
        hidden =
            parseFloat(style.fontSize) < MIN_READABLE_FONT_PX ||
            (alphaOf(style.color) < MIN_VISIBLE_ALPHA && !clippedToText) ||
            parseFloat(style.opacity) < MIN_VISIBLE_ALPHA ||
            (hasOwnBox && (box.width <= 1 || box.height <= 1) && style.overflow !== 'visible');
        const parent = element.parentElement ?? hostOf(element);
        hidden ||= parent !== null && isHidden(parent, seen);
    }
    seen.set(element, hidden);
    return hidden;
}

/**
 * The selected text without the parts the user can't see. Text between hidden parts is read range by range, so the line
 * breaks the browser puts between blocks are kept.
 * @param {Range} range
 */
function visibleText(range) {
    const root = range.commonAncestorContainer;
    /** @type {Map<Element, boolean>} */
    const seen = new Map();
    if (root instanceof Text) return root.parentElement && isHidden(root.parentElement, seen) ? '' : range.toString();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    /** @type {string[]} */
    const parts = [];
    let part = range.cloneRange();
    let open = true;
    let skipped = false;
    for (let node = /** @type {Text | null} */ (walker.nextNode()); node; node = /** @type {Text | null} */ (walker.nextNode())) {
        if (!range.intersectsNode(node) || !node.data.trim() || !node.parentElement) continue;
        if (isHidden(node.parentElement, seen)) {
            if (open) {
                part.setEndBefore(node);
                parts.push(part.toString());
                open = false;
            }
            skipped = true;
        } else if (!open) {
            part = range.cloneRange();
            if (node !== range.startContainer) part.setStartBefore(node);
            open = true;
        }
    }
    if (!skipped) return range.toString();
    if (open) parts.push(part.toString());
    return parts.join('');
}

/**
 * The shadow host of a node in a shadow root, or null.
 * @param {Node} node
 * @returns {Element | null}
 */
function hostOf(node) {
    const root = node.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
}

/**
 * The nearest element matching a selector, looking out through shadow roots to their hosts.
 * @param {Element | null} element
 * @param {string} selector
 * @returns {Element | null}
 */
function closestComposed(element, selector) {
    let current = element;
    while (current) {
        const match = current.closest(selector);
        if (match) return match;
        current = hostOf(current);
    }
    return null;
}

/**
 * The range inside the given open shadow roots. Chromium keeps a selection per shadow root, scoped to it. The standard
 * getComposedRanges is the fallback: it can end outside the root, as a triple-click's does, where its live copy loses
 * the shadow text.
 * @param {Selection} selection
 * @param {ShadowRoot[]} roots
 * @returns {Range | null}
 */
function rangeWithin(selection, roots) {
    const root = /** @type {{ getSelection?: () => Selection | null }} */ (/** @type {unknown} */ (roots[roots.length - 1]));
    const scoped = root.getSelection?.();
    if (scoped && scoped.rangeCount > 0) return scoped.getRangeAt(0);
    const composable = /** @type {{ getComposedRanges?: (options: { shadowRoots: ShadowRoot[] }) => StaticRange[] }} */ (
        /** @type {unknown} */ (selection)
    );
    try {
        const [composed] = composable.getComposedRanges?.({ shadowRoots: roots }) ?? [];
        if (composed) {
            const range = document.createRange();
            range.setStart(composed.startContainer, composed.startOffset);
            range.setEnd(composed.endContainer, composed.endOffset);
            return range;
        }
    } catch {
        // Engines that take the roots as arguments, or have neither, report nothing for the shadow root.
    }
    return null;
}

/**
 * The selected range, including one inside open shadow roots, or null when nothing is selected. A selection inside a
 * shadow root shows in the document as a collapsed range at its host, though the selection's type is still "Range".
 * @param {Selection} selection
 * @returns {Range | null}
 */
function selectedRange(selection) {
    if (selection.rangeCount === 0) return null;
    let range = selection.getRangeAt(0);
    /** @type {ShadowRoot[]} */
    const roots = [];
    while (range.collapsed && selection.type === 'Range') {
        const { startContainer, startOffset } = range;
        const host = [startContainer.childNodes[startOffset], startContainer.childNodes[startOffset - 1]].find(
            (node) => node instanceof Element && node.shadowRoot,
        );
        const root = host instanceof Element ? host.shadowRoot : null;
        if (!root || roots.includes(root)) return null;
        roots.push(root);
        const inner = rangeWithin(selection, roots);
        if (!inner) return null;
        range = inner;
    }
    return range.collapsed ? null : range;
}

/**
 * @param {number} minChars
 * @returns {SelectionSnapshot | null}
 */
export function readSelection(minChars) {
    const active = deepActiveElement();
    if (isTextField(active)) {
        const { selectionStart: start, selectionEnd: end } = active;
        if (start === null || end === null) return null;
        const text = active.value.slice(start, end);
        if (text.trim().length < minChars) return null;
        return { text, browserText: text, editable: true, element: active, bounds: () => fieldSelectionBounds(active, start, end) };
    }
    // Any other focused field (a password, a read-only input) has a selection we leave alone.
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return null;

    const selection = window.getSelection();
    const selected = selection && selectedRange(selection);
    if (!selection || !selected) return null;
    const range = selected.cloneRange();
    const text = visibleText(range);
    if (text.trim().length < minChars) return null;
    const host = editingHostOf(elementOf(range.commonAncestorContainer));
    // Where the selection starts, rather than the common ancestor: a triple-clicked paragraph's range ends at the start
    // of the next block, so its common ancestor is the parent and would lose the paragraph's lang or code marking.
    const element = host ?? elementOf(range.startContainer);
    return {
        text,
        browserText: selection.toString(),
        editable: host !== null,
        element,
        bounds: () => {
            const { left, top, right, bottom } = range.getBoundingClientRect();
            return { left, top, right, bottom };
        },
    };
}

/**
 * Whether the visible selection is collapsed, for clearing the report as soon as the user clicks away.
 */
export function isSelectionCollapsed() {
    const active = deepActiveElement();
    if (isTextField(active)) return active.selectionStart === active.selectionEnd;
    const selection = window.getSelection();
    return !selection || selectedRange(selection) === null;
}

/**
 * Whether focus is somewhere the user edits text, where select-all takes only that text rather than the whole page.
 */
export function isEditingFocused() {
    const active = deepActiveElement();
    return isTextField(active) || (active instanceof HTMLElement && active.isContentEditable);
}

/**
 * @param {Element | null} element
 */
export function isInCode(element) {
    return closestComposed(element, 'pre, code, kbd, samp') !== null;
}

/**
 * The page's language marking for an element, canonicalised, or null.
 * @param {Element | null} element
 * @returns {string | null}
 */
export function markedLanguageOf(element) {
    const marked = closestComposed(element, '[lang]');
    const tag = (marked instanceof HTMLElement ? marked.lang : '') || document.documentElement.lang;
    if (!tag) return null;
    try {
        return Intl.getCanonicalLocales(tag)[0] ?? null;
    } catch {
        return null;
    }
}

/**
 * Whether a selection is inside an open modal dialog, popover or fullscreen element, in the browser's top layer.
 * Selections there aren't reported. A fullscreen page is the page itself, so it doesn't count.
 * @param {Element | null} element
 */
export function isInTopLayer(element) {
    if (!element) return false;
    try {
        const layer = closestComposed(element, ':modal, :popover-open, :fullscreen');
        return layer !== null && layer !== document.documentElement;
    } catch {
        // Engines without one of these selectors throw; treat the selection as on the page.
        return false;
    }
}
