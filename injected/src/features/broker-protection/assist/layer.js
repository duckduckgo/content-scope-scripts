import baseStyles from './layer.css';

// Below reCAPTCHA's challenge popup (2000000000) and hCaptcha's (clamped to 2147483647), so a puzzle
// opened during the user's turn is never covered, while staying above nearly all page content.
const Z_INDEX = 1999999999;

/**
 * A layer drawn over the broker's page.
 *
 * Everything lives in a closed shadow root and ignores the pointer, so the page's own layout and the
 * user's clicks are unaffected. Positions are in document coordinates and refreshed every frame
 * while the layer is attached, which keeps them aligned through scrolling, resizes and reflows.
 * Every state change should also call `position()` straight away, because WebKit throttles animation
 * frames in windows that are hidden or occluded and the layer should still be right in the next paint.
 *
 * @template T
 */
export class OverlayLayer {
    /** @type {HTMLElement | null} */
    host = null;
    /** @type {T | null} */
    els = null;
    /** @type {number | null} */
    frame = null;

    /**
     * @param {object} options
     * @param {string} options.styles
     * @param {string} options.markup
     * @param {(root: ShadowRoot) => T} options.select - finds the elements `position` updates
     * @param {(els: T) => void} options.position
     */
    constructor({ styles, markup, select, position }) {
        this.styles = baseStyles + styles;
        this.markup = markup;
        this.select = select;
        this.positionEls = position;
    }

    /**
     * @returns {T}
     */
    attach() {
        if (this.host?.isConnected && this.els) return this.els;
        const host = document.createElement('ddg-pir-assist');
        host.style.cssText = `position: absolute !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; z-index: ${Z_INDEX} !important; pointer-events: none !important;`;
        const shadow = host.attachShadow({ mode: 'closed' });
        const sheet = constructedStyleSheet(this.styles);
        if (sheet) shadow.adoptedStyleSheets = [sheet];
        shadow.innerHTML = `${sheet ? '' : `<style>${this.styles}</style>`}<div class="layer" aria-hidden="true">${this.markup}</div>`;
        const els = this.select(shadow);
        document.documentElement.appendChild(host);
        this.host = host;
        this.els = els;
        this.startLoop();
        return els;
    }

    position() {
        if (this.els) this.positionEls(this.els);
    }

    destroy() {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.host?.remove();
        this.host = null;
        this.els = null;
    }

    startLoop() {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        const tick = () => {
            if (!this.els) {
                this.frame = null;
                return;
            }
            this.position();
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }
}

/**
 * A page's `style-src` CSP blocks a `<style>` element in our shadow root, but not a constructed stylesheet.
 *
 * @param {string} styles
 */
function constructedStyleSheet(styles) {
    try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        return sheet;
    } catch {
        return null;
    }
}

/**
 * @param {ShadowRoot} root
 * @param {string} selector
 */
export function query(root, selector) {
    return /** @type {HTMLElement} */ (root.querySelector(selector));
}

/**
 * @param {Element} element
 * @returns {{ left: number, top: number, width: number, height: number } | null}
 */
export function documentBox(element) {
    if (!element.isConnected) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
}

/**
 * @param {HTMLElement} el
 * @param {{ left: number, top: number, width: number, height: number } | null} box
 */
export function place(el, box) {
    setHidden(el, !box);
    if (!box) return;
    setStyle(el, 'left', `${box.left}px`);
    setStyle(el, 'top', `${box.top}px`);
    setStyle(el, 'width', `${box.width}px`);
    setStyle(el, 'height', `${box.height}px`);
}

/**
 * Writes only when the value changes. Layers reposition every frame, and unchanged writes would
 * still dirty style and force the next frame's measurements to wait for layout.
 *
 * @param {HTMLElement} el
 * @param {'left' | 'top' | 'width' | 'height' | 'borderRadius'} property
 * @param {string} value
 */
export function setStyle(el, property, value) {
    if (el.style[property] !== value) el.style[property] = value;
}

/**
 * @param {HTMLElement} el
 * @param {boolean} hidden
 */
export function setHidden(el, hidden) {
    if (el.hidden !== hidden) el.hidden = hidden;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
}
