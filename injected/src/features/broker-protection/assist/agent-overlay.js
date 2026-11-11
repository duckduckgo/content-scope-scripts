import { logoImg } from '../../click-to-load/ctl-assets.js';
import { wait } from '../../../timer-utils.js';
import { OverlayLayer, clamp, documentBox, place, query, setStyle } from './layer.js';
import styles from './agent-overlay.css';

const CURSOR_MOVE_MS = 520;

const MARKUP = `
    <div class="field" hidden></div>
    <div class="typed" hidden></div>
    <div class="caret" hidden></div>
    <div class="cursor hidden">
        <svg width="32" height="32" viewBox="0 0 32 32"><path d="M10.5 8.5 L10.5 25.5 L14.4 21.8 L17 27.6 L19.9 26.4 L17.3 20.6 L22.6 20.6 Z"/></svg>
        <div class="tag"><img src="${logoImg}" alt=""><span>Moving</span></div>
    </div>`;

/**
 * @typedef {Record<'cursor'|'cursorLabel'|'field'|'typed'|'caret', HTMLElement>} AgentElements
 */

/**
 * PIR's agent drawn over the broker's page: a cursor, field highlights and a typing caret.
 */
export class AgentOverlay {
    /** @type {{ element: Element, dx: number, dy: number } | null} */
    cursorTarget = null;
    /** @type {Element | null} */
    fieldTarget = null;
    fieldRadius = '';
    /** @type {number | null} */
    caretX = null;
    /** @type {{ field: Element, left: number, top: number, right: number, bottom: number } | null} */
    typing = null;
    /** @type {OverlayLayer<AgentElements>} */
    layer = new OverlayLayer({
        styles,
        markup: MARKUP,
        select: (root) => {
            for (const img of root.querySelectorAll('img')) {
                // A page's img-src CSP can block the data: URI; drop the logo rather than show a broken image.
                img.addEventListener('error', () => img.remove());
            }
            return {
                cursor: query(root, '.cursor'),
                cursorLabel: query(root, '.cursor .tag span'),
                field: query(root, '.field'),
                typed: query(root, '.typed'),
                caret: query(root, '.caret'),
            };
        },
        position: (els) => {
            this.positionCursor(els);
            this.positionField(els);
        },
    });

    /**
     * Moves the agent cursor to a point relative to an element's top-left corner, resolving once it gets there.
     *
     * @param {Element} element
     * @param {{ dx: number, dy: number, label?: string, durationMs?: number }} options
     */
    async moveCursor(element, options) {
        const durationMs = this.placeCursor(element, options);
        await wait(durationMs);
    }

    /**
     * Starts the cursor towards a point relative to an element and returns how long the move takes
     * (0 when the cursor appears there instead).
     *
     * @param {Element} element
     * @param {{ dx: number, dy: number, label?: string, durationMs?: number }} options
     */
    placeCursor(element, { dx, dy, label, durationMs = CURSOR_MOVE_MS }) {
        const els = this.layer.attach();
        if (label) els.cursorLabel.textContent = label;
        els.cursor.style.setProperty('--move-ms', `${durationMs}ms`);
        this.cursorTarget = { element, dx, dy };
        const wasHidden = els.cursor.classList.contains('hidden');
        if (wasHidden) {
            // Appear at the destination rather than sliding in from wherever the cursor was last.
            els.cursor.style.transition = 'none';
            this.layer.position();
            void els.cursor.offsetWidth;
            els.cursor.style.transition = '';
            els.cursor.classList.remove('hidden');
            return 0;
        }
        this.layer.position();
        return durationMs;
    }

    /**
     * @param {string} label
     */
    setCursorLabel(label) {
        if (this.layer.els) this.layer.els.cursorLabel.textContent = label;
    }

    hideCursor() {
        this.layer.els?.cursor.classList.add('hidden');
        this.cursorTarget = null;
    }

    /**
     * @param {Element | null} element
     */
    highlightField(element) {
        this.fieldTarget = element;
        this.fieldRadius = element ? getComputedStyle(element).borderRadius : '';
        this.caretX = null;
        if (element) this.layer.attach();
        this.layer.position();
    }

    /**
     * @param {number | null} x - offset of the caret from the field's left edge, or null to hide it
     */
    setCaret(x) {
        this.caretX = x;
        this.layer.position();
    }

    /**
     * Covers the field's text so `setTypedText` can draw what's being typed in its place.
     *
     * @param {HTMLElement} field
     */
    startTyping(field) {
        const els = this.layer.attach();
        const style = getComputedStyle(field);
        const px = (/** @type {string} */ value) => parseFloat(value) || 0;
        this.typing = {
            field,
            left: px(style.borderLeftWidth) + px(style.paddingLeft),
            top: px(style.borderTopWidth) + px(style.paddingTop),
            right: px(style.borderRightWidth) + px(style.paddingRight),
            bottom: px(style.borderBottomWidth) + px(style.paddingBottom),
        };
        Object.assign(els.typed.style, {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontStyle: style.fontStyle,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            lineHeight: style.lineHeight,
            color: style.color,
            background: opaqueBackground(field),
            alignItems: field instanceof HTMLTextAreaElement ? 'flex-start' : 'center',
        });
        els.typed.textContent = '';
        this.layer.position();
    }

    /**
     * @param {string} text
     */
    setTypedText(text) {
        if (this.layer.els) this.layer.els.typed.textContent = text;
    }

    stopTyping() {
        this.typing = null;
        this.layer.position();
    }

    /**
     * @param {AgentElements} els
     */
    positionCursor(els) {
        const box = this.cursorTarget && documentBox(this.cursorTarget.element);
        if (!box || !this.cursorTarget) return;
        // Keep the cursor inside the element, even when it's narrower than the requested offset.
        const dx = clamp(this.cursorTarget.dx, 0, box.width - 12);
        setStyle(els.cursor, 'left', `${box.left + dx}px`);
        setStyle(els.cursor, 'top', `${box.top + this.cursorTarget.dy}px`);
    }

    /**
     * The field highlight, the typed text covering the field's own text, and the caret.
     *
     * @param {AgentElements} els
     */
    positionField(els) {
        const field = this.fieldTarget && documentBox(this.fieldTarget);
        place(els.field, field);
        setStyle(els.field, 'borderRadius', this.fieldRadius);

        const typingBox = this.typing && documentBox(this.typing.field);
        if (typingBox && this.typing) {
            const inset = this.typing;
            place(els.typed, {
                left: typingBox.left + inset.left,
                top: typingBox.top + inset.top,
                width: Math.max(typingBox.width - inset.left - inset.right, 0),
                height: Math.max(typingBox.height - inset.top - inset.bottom, 0),
            });
        } else {
            place(els.typed, null);
        }

        const caretHeight = field ? clamp(field.height - 4, 0, 15) : 0;
        if (field && this.caretX !== null && caretHeight > 0) {
            place(els.caret, {
                left: field.left + clamp(this.caretX + 1, 0, field.width - 4),
                top: field.top + (field.height - caretHeight) / 2,
                width: 1,
                height: caretHeight,
            });
        } else {
            place(els.caret, null);
        }
    }
}

/**
 * The colour behind a field's text: its own background, or the nearest ancestor's if it's transparent.
 *
 * @param {Element} field
 */
function opaqueBackground(field) {
    for (let el = /** @type {Element | null} */ (field); el; el = el.parentElement) {
        const color = getComputedStyle(el).backgroundColor;
        if (color !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(color)) return color;
    }
    return '#fff';
}
