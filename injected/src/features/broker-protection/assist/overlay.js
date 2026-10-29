import { logoImg } from '../../click-to-load/ctl-assets.js';

export const CURSOR_MOVE_MS = 520;

const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; }
.layer { position: absolute; top: 0; left: 0; width: 0; height: 0; pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; --ease: cubic-bezier(.2,.8,.2,1); }
.field { position: absolute; border-radius: 4px; box-shadow: 0 0 0 1.5px #1074cc; }
.caret { position: absolute; width: 1px; background: #000; animation: blink 1s steps(1) infinite; }
.ring { position: absolute; border-radius: 4px; outline: 3px solid #f5a623; outline-offset: 3px; animation: ring 1.6s ease-in-out infinite; }
.badge { position: absolute; padding: 3px 10px; border-radius: 999px; background: #ffc95c; color: #3d2a00;
    font-size: 12px; font-weight: 500; line-height: 16px; white-space: nowrap; }
.tag { display: flex; align-items: center; gap: 4px; width: max-content; padding: 4px 12px 4px 4px; border-radius: 2px 12px 12px 16px;
    background: #045eb2; color: #fff; font-size: 14px; font-weight: 700; line-height: 16px; white-space: nowrap; }
.tag img { width: 16px; height: 16px; }
.pill { position: absolute; border-radius: 12px; }
.cursor { position: absolute; width: 32px; height: 32px; transform: translate(-10.5px, -8.5px); transform-origin: 10.5px 8.5px;
    transition: left var(--move-ms) var(--ease), top var(--move-ms) var(--ease), opacity 240ms var(--ease), transform 320ms var(--ease); }
.cursor.hidden { opacity: 0; transform: translate(-10.5px, -8.5px) scale(.7); transition: opacity 160ms ease-out, transform 160ms ease-out; }
.cursor svg { position: absolute; left: 0; top: 0; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.25)); }
.cursor path { fill: #333; stroke: #fff; stroke-width: 1.4; stroke-linejoin: round; }
.cursor .tag { position: absolute; left: 32px; top: 20px; }
[hidden] { display: none !important; }
@keyframes blink { 50% { opacity: 0; } }
@keyframes ring { 50% { outline-offset: 6px; outline-color: rgba(245,166,35,.55); } }
@media (prefers-reduced-motion: reduce) {
    .ring, .caret { animation: none; }
    .cursor, .cursor.hidden { transition: opacity 150ms; transform: translate(-10.5px, -8.5px); }
}
`;

/**
 * @param {string} label
 */
function tagMarkup(label) {
    return `<img src="${logoImg}" alt=""><span>${label}</span>`;
}

/**
 * Decorations drawn over the broker's page while PIR works on it: an agent cursor, field highlights,
 * a typing caret and the "Your turn" treatment for a widget the user needs to solve.
 *
 * Everything lives in a closed shadow root and ignores the pointer, so the page's own layout and the
 * user's clicks are unaffected. Positions are in document coordinates and refreshed every frame
 * while the overlay is attached, which keeps them aligned through scrolling, resizes and reflows.
 */
export class AssistOverlay {
    /** @type {HTMLElement | null} */
    host = null;
    /** @type {Record<'layer'|'cursor'|'cursorLabel'|'field'|'caret'|'ring'|'badge'|'pill', HTMLElement> | null} */
    els = null;
    /** @type {{ element: Element, dx: number, dy: number } | null} */
    cursorTarget = null;
    /** @type {Element | null} */
    fieldTarget = null;
    /** @type {number | null} */
    caretX = null;
    /** @type {Element | null} */
    turnTarget = null;
    turnActive = false;
    /** @type {number | null} */
    frame = null;

    attach() {
        if (this.host?.isConnected) return this.requireEls();
        const host = document.createElement('ddg-pir-assist');
        host.style.cssText =
            'position: absolute !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; z-index: 2147483647 !important; pointer-events: none !important;';
        const shadow = host.attachShadow({ mode: 'closed' });
        shadow.innerHTML = `<style>${STYLES}</style>
            <div class="layer" aria-hidden="true">
                <div class="field" hidden></div>
                <div class="caret" hidden></div>
                <div class="ring" hidden></div>
                <div class="badge" hidden>Your turn</div>
                <div class="pill tag" hidden>${tagMarkup('Waiting for you')}</div>
                <div class="cursor hidden">
                    <svg width="32" height="32" viewBox="0 0 32 32"><path d="M10.5 8.5 L13.4 20.6 L15.7 17 L19.5 20.9 L21.1 19.3 L17.3 15.5 L21.4 14.6 Z"/></svg>
                    <div class="tag">${tagMarkup('Moving')}</div>
                </div>
            </div>`;
        /** @param {string} selector */
        const q = (selector) => /** @type {HTMLElement} */ (shadow.querySelector(selector));
        this.els = {
            layer: q('.layer'),
            cursor: q('.cursor'),
            cursorLabel: q('.cursor .tag span'),
            field: q('.field'),
            caret: q('.caret'),
            ring: q('.ring'),
            badge: q('.badge'),
            pill: q('.pill'),
        };
        document.documentElement.appendChild(host);
        this.host = host;
        this.startLoop();
        return this.els;
    }

    requireEls() {
        if (!this.els) throw new Error('AssistOverlay used before attach');
        return this.els;
    }

    /**
     * Moves the agent cursor to a point relative to an element's top-left corner, resolving once it gets there.
     *
     * @param {Element} element
     * @param {{ dx: number, dy: number, label?: string, durationMs?: number }} options
     */
    async moveCursor(element, { dx, dy, label, durationMs = CURSOR_MOVE_MS }) {
        const els = this.attach();
        if (label) els.cursorLabel.textContent = label;
        els.cursor.style.setProperty('--move-ms', `${durationMs}ms`);
        this.cursorTarget = { element, dx, dy };
        const wasHidden = els.cursor.classList.contains('hidden');
        if (wasHidden) {
            // Appear at the destination rather than sliding in from wherever the cursor was last.
            els.cursor.style.transition = 'none';
            this.position();
            void els.cursor.offsetWidth;
            els.cursor.style.transition = '';
            els.cursor.classList.remove('hidden');
            return;
        }
        this.position();
        await wait(durationMs);
    }

    hideCursor() {
        this.els?.cursor.classList.add('hidden');
        this.cursorTarget = null;
    }

    /**
     * @param {Element | null} element
     */
    highlightField(element) {
        this.fieldTarget = element;
        this.caretX = null;
        if (element) this.attach();
        this.position();
    }

    /**
     * @param {number | null} x - offset of the caret from the field's left edge, or null to hide it
     */
    setCaret(x) {
        this.caretX = x;
        this.position();
    }

    /**
     * @param {Element | null} widget - the element the user has to solve, if it can be found
     */
    showTurn(widget) {
        this.attach();
        this.turnActive = true;
        this.turnTarget = widget;
        this.hideCursor();
        this.highlightField(null);
        widget?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        this.position();
    }

    /**
     * @param {Element | null} widget
     */
    updateTurnTarget(widget) {
        if (!this.turnActive || widget === this.turnTarget) return;
        const isFirstSighting = !this.turnTarget;
        this.turnTarget = widget;
        if (isFirstSighting) widget?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        this.position();
    }

    clearTurn() {
        this.turnActive = false;
        this.turnTarget = null;
        this.position();
    }

    destroy() {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.host?.remove();
        this.host = null;
        this.els = null;
        this.cursorTarget = null;
        this.fieldTarget = null;
        this.turnTarget = null;
        this.turnActive = false;
    }

    startLoop() {
        const tick = () => {
            this.position();
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }

    position() {
        const els = this.els;
        if (!els) return;

        if (this.cursorTarget) {
            const box = documentBox(this.cursorTarget.element);
            if (box) {
                els.cursor.style.left = `${box.left + Math.min(Math.max(box.width - 12, 0), this.cursorTarget.dx)}px`;
                els.cursor.style.top = `${box.top + this.cursorTarget.dy}px`;
            }
        }

        const field = this.fieldTarget && documentBox(this.fieldTarget);
        place(els.field, field);
        if (field && this.fieldTarget) els.field.style.borderRadius = getComputedStyle(this.fieldTarget).borderRadius;
        const caretHeight = field ? Math.min(field.height - 8, 16) : 0;
        place(
            els.caret,
            field && this.caretX !== null
                ? { left: field.left + this.caretX, top: field.top + (field.height - caretHeight) / 2, width: 1, height: caretHeight }
                : null,
        );

        const widget = this.turnActive && this.turnTarget ? documentBox(this.turnTarget) : null;
        place(els.ring, widget);
        els.badge.hidden = !widget;
        if (widget) {
            els.badge.style.left = `${widget.left}px`;
            els.badge.style.top = `${widget.top - els.badge.offsetHeight - 10}px`;
        }
        els.pill.hidden = !this.turnActive;
        if (this.turnActive) {
            if (widget) {
                els.pill.style.left = `${widget.left + widget.width + 16}px`;
                els.pill.style.top = `${widget.top + widget.height / 2 - els.pill.offsetHeight / 2}px`;
            } else {
                els.pill.style.left = `${window.scrollX + window.innerWidth / 2 - els.pill.offsetWidth / 2}px`;
                els.pill.style.top = `${window.scrollY + 16}px`;
            }
        }
    }
}

/**
 * @param {Element} element
 * @returns {{ left: number, top: number, width: number, height: number } | null}
 */
function documentBox(element) {
    if (!element.isConnected) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
}

/**
 * @param {HTMLElement} el
 * @param {{ left: number, top: number, width: number, height: number } | null} box
 */
function place(el, box) {
    el.hidden = !box;
    if (!box) return;
    el.style.left = `${box.left}px`;
    el.style.top = `${box.top}px`;
    el.style.width = `${box.width}px`;
    el.style.height = `${box.height}px`;
}

/**
 * @param {number} ms
 */
export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
