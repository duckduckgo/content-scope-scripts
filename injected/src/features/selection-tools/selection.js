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
 * @property {string} text
 * @property {boolean} editable
 * @property {Element | null} element The field or editing host, or else the element the selection starts in
 * @property {(scratch: Node) => Rect} bounds Viewport rect of the selected text, measured now. Fields lay their text
 *   out again in a hidden mirror appended to `scratch`, which should be somewhere the page can't see.
 */

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
 * same box and font, wrap the selected part in a span, and map the span's boxes back onto the field.
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {number} start
 * @param {number} end
 * @param {Node} scratch
 * @returns {Rect}
 */
function fieldSelectionBounds(field, start, end, scratch) {
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
    mirror.remove();
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
        return { text, editable: true, element: active, bounds: (scratch) => fieldSelectionBounds(active, start, end, scratch) };
    }
    // Any other focused field (a password, a read-only input) has a selection we leave alone.
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return null;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
    const text = selection.toString();
    if (text.trim().length < minChars) return null;
    const range = selection.getRangeAt(0).cloneRange();
    const host = editingHostOf(elementOf(range.commonAncestorContainer));
    // Where the selection starts, rather than the common ancestor: a triple-clicked paragraph's range ends at the start
    // of the next block, so its common ancestor is the parent and would lose the paragraph's lang or code marking.
    const element = host ?? elementOf(range.startContainer);
    return { text, editable: host !== null, element, bounds: () => range.getBoundingClientRect() };
}

/**
 * Whether the visible selection is collapsed, for hiding the toolbar as soon as the user clicks away.
 */
export function isSelectionCollapsed() {
    const active = deepActiveElement();
    if (isTextField(active)) return active.selectionStart === active.selectionEnd;
    return window.getSelection()?.isCollapsed ?? true;
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
    return element?.closest('pre, code, kbd, samp') != null;
}

/**
 * The page's language marking for an element, canonicalised, or null.
 * @param {Element | null} element
 * @returns {string | null}
 */
export function markedLanguageOf(element) {
    const marked = element?.closest('[lang]');
    const tag = (marked instanceof HTMLElement ? marked.lang : '') || document.documentElement.lang;
    if (!tag) return null;
    try {
        return Intl.getCanonicalLocales(tag)[0] ?? null;
    } catch {
        return null;
    }
}

/**
 * A selection inside an open modal dialog, popover or fullscreen element is in the browser's top layer, above the
 * toolbar, so the toolbar would be hidden behind it (or, behind a modal, unclickable). A fullscreen page is the page
 * itself, so it doesn't count.
 * @param {Element | null} element
 */
export function isInTopLayer(element) {
    if (!element) return false;
    try {
        const layer = element.closest(':modal, :popover-open, :fullscreen');
        return layer !== null && layer !== document.documentElement;
    } catch {
        // Engines without one of these selectors throw; treat the selection as on the page.
        return false;
    }
}
