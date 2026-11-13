import styles from './agent-overlay.css';
import { logoImg } from '../../click-to-load/ctl-assets.js';
import { wait } from '../../../timer-utils.js';
import { Overlay, documentBox, place } from './overlay.js';

const CURSOR_MOVE_MS = 520;

const MARKUP = `
    <div class="field" hidden></div>
    <div class="typed" hidden><span></span></div>
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
    /** @type {Element | null} */
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
        this.typedText = /** @type {HTMLElement} */ (this.root.querySelector('.typed span'));
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
        if (this.cursor.classList.contains('hidden')) {
            // A hidden cursor doesn't transition left and top, so moving it before showing it makes it
            // appear at the destination rather than slide in from wherever it was last.
            this.update();
            void this.cursor.offsetWidth;
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
        this.field.style.borderRadius = element ? getComputedStyle(element).borderRadius : '';
        this.update();
    }

    /**
     * Covers the field's text so `setTypedText` can draw what's being typed in its place, followed by a caret.
     *
     * @param {HTMLElement} field
     */
    startTyping(field) {
        const style = getComputedStyle(field);
        this.typing = field;
        Object.assign(this.typed.style, {
            borderWidth: `${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`,
            padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontStyle: style.fontStyle,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            lineHeight: style.lineHeight,
            color: style.color,
            backgroundColor: opaqueBackground(field),
            alignItems: field instanceof HTMLTextAreaElement ? 'flex-start' : 'center',
        });
        this.typedText.textContent = '';
        this.update();
    }

    /**
     * @param {string} text
     * @returns {number} offset of the end of the text from the field's left edge
     */
    setTypedText(text) {
        this.typedText.textContent = text;
        return this.typing ? this.typedText.getBoundingClientRect().right - this.typing.getBoundingClientRect().left : 0;
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
        const dx = Math.min(Math.max(this.cursorTarget.dx, 0), Math.max(box.width - 12, 0));
        this.cursor.style.left = `${box.left + dx}px`;
        this.cursor.style.top = `${box.top + this.cursorTarget.dy}px`;
    }

    /**
     * The field highlight, and the typed text covering the field's own text.
     */
    positionField() {
        const field = this.fieldTarget && documentBox(this.fieldTarget);
        if (field) {
            place(this.field, field);
        } else {
            this.field.hidden = true;
        }

        const typing = this.typing && documentBox(this.typing);
        if (typing) {
            place(this.typed, typing);
        } else {
            this.typed.hidden = true;
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
