import styles from './agent-overlay.css';
import { logoImg } from '../../click-to-load/ctl-assets.js';
import { wait } from '../../../timer-utils.js';
import { Overlay, clamp, documentBox, place } from './overlay.js';

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
 * PIR's agent drawn over the broker's page: a cursor, field highlights and a typing caret.
 */
export class AgentOverlay extends Overlay {
    static styles = styles;
    static markup = MARKUP;

    /** @type {{ element: Element, dx: number, dy: number } | null} */
    cursorTarget = null;
    /** @type {Element | null} */
    fieldTarget = null;
    fieldRadius = '';
    /** @type {number | null} */
    caretX = null;
    /** @type {{ field: Element, left: number, top: number, right: number, bottom: number } | null} */
    typing = null;

    constructor() {
        super();
        for (const img of this.root.querySelectorAll('img')) {
            // A page's img-src CSP can block the data: URI; drop the logo rather than show a broken image.
            img.addEventListener('error', () => img.remove());
        }
        this.cursor = /** @type {HTMLElement} */ (this.root.querySelector('.cursor'));
        this.cursorLabel = /** @type {HTMLElement} */ (this.root.querySelector('.cursor .tag span'));
        this.field = /** @type {HTMLElement} */ (this.root.querySelector('.field'));
        this.typed = /** @type {HTMLElement} */ (this.root.querySelector('.typed'));
        this.caret = /** @type {HTMLElement} */ (this.root.querySelector('.caret'));
    }

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
        if (label) this.cursorLabel.textContent = label;
        this.cursor.style.setProperty('--move-ms', `${durationMs}ms`);
        this.cursorTarget = { element, dx, dy };
        const wasHidden = this.cursor.classList.contains('hidden');
        if (wasHidden) {
            // Appear at the destination rather than sliding in from wherever the cursor was last.
            this.cursor.style.transition = 'none';
            this.update();
            void this.cursor.offsetWidth;
            this.cursor.style.transition = '';
            this.cursor.classList.remove('hidden');
            return 0;
        }
        this.update();
        return durationMs;
    }

    /**
     * @param {string} label
     */
    setCursorLabel(label) {
        this.cursorLabel.textContent = label;
    }

    hideCursor() {
        this.cursor.classList.add('hidden');
        this.cursorTarget = null;
    }

    /**
     * @param {Element | null} element
     */
    highlightField(element) {
        this.fieldTarget = element;
        this.fieldRadius = element ? getComputedStyle(element).borderRadius : '';
        this.caretX = null;
        this.update();
    }

    /**
     * @param {number | null} x - offset of the caret from the field's left edge, or null to hide it
     */
    setCaret(x) {
        this.caretX = x;
        this.update();
    }

    /**
     * Covers the field's text so `setTypedText` can draw what's being typed in its place.
     *
     * @param {HTMLElement} field
     */
    startTyping(field) {
        const style = getComputedStyle(field);
        const px = (/** @type {string} */ value) => parseFloat(value) || 0;
        this.typing = {
            field,
            left: px(style.borderLeftWidth) + px(style.paddingLeft),
            top: px(style.borderTopWidth) + px(style.paddingTop),
            right: px(style.borderRightWidth) + px(style.paddingRight),
            bottom: px(style.borderBottomWidth) + px(style.paddingBottom),
        };
        Object.assign(this.typed.style, {
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
        this.typed.textContent = '';
        this.update();
    }

    /**
     * @param {string} text
     */
    setTypedText(text) {
        this.typed.textContent = text;
    }

    stopTyping() {
        this.typing = null;
        this.update();
    }

    position() {
        this.positionCursor();
        this.positionField();
    }

    positionCursor() {
        const box = this.cursorTarget && documentBox(this.cursorTarget.element);
        if (!box || !this.cursorTarget) return;
        // Keep the cursor inside the element, even when it's narrower than the requested offset.
        const dx = clamp(this.cursorTarget.dx, 0, box.width - 12);
        this.cursor.style.left = `${box.left + dx}px`;
        this.cursor.style.top = `${box.top + this.cursorTarget.dy}px`;
    }

    /**
     * The field highlight, the typed text covering the field's own text, and the caret.
     */
    positionField() {
        const field = this.fieldTarget && documentBox(this.fieldTarget);
        if (field) {
            place(this.field, field);
            this.field.style.borderRadius = this.fieldRadius;
        } else {
            this.field.hidden = true;
        }

        const typingBox = this.typing && documentBox(this.typing.field);
        if (typingBox && this.typing) {
            const inset = this.typing;
            place(this.typed, {
                left: typingBox.left + inset.left,
                top: typingBox.top + inset.top,
                width: Math.max(typingBox.width - inset.left - inset.right, 0),
                height: Math.max(typingBox.height - inset.top - inset.bottom, 0),
            });
        } else {
            this.typed.hidden = true;
        }

        const caretHeight = field ? clamp(field.height - 4, 0, 15) : 0;
        if (field && this.caretX !== null && caretHeight > 0) {
            place(this.caret, {
                left: field.left + clamp(this.caretX + 1, 0, field.width - 4),
                top: field.top + (field.height - caretHeight) / 2,
                width: 1,
                height: caretHeight,
            });
        } else {
            this.caret.hidden = true;
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
