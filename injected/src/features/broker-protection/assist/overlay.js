import baseStyles from './overlay.css';

// Below reCAPTCHA's challenge popup (2000000000) and hCaptcha's (clamped to 2147483647), so a puzzle
// opened during the user's turn is never covered, while staying above nearly all page content.
const Z_INDEX = 1999999999;

/**
 * Something drawn over the broker's page. Each instance is one `<ddg-pir-assist>` element, added to
 * the page when it's constructed and taken off by `remove()`. Subclasses set `styles` and `markup`,
 * and draw themselves in `position()`.
 *
 * Everything lives in a closed shadow root and ignores the pointer, so the page's own layout and the
 * user's clicks are unaffected. Positions are in document coordinates and refreshed every frame,
 * which keeps them aligned through scrolling, resizes and reflows. Every state change should also
 * call `update()` straight away, because WebKit throttles animation frames in windows that are
 * hidden or occluded and the overlay should still be right in the next paint.
 */
export class Overlay {
    static styles = '';
    static markup = '';

    /** @type {number | null} */
    frame = null;

    constructor() {
        const { styles, markup } = /** @type {typeof Overlay} */ (this.constructor);
        const css = baseStyles + styles;
        this.host = document.createElement('ddg-pir-assist');
        this.host.style.cssText = `position: absolute !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; z-index: ${Z_INDEX} !important; pointer-events: none !important;`;
        this.root = this.host.attachShadow({ mode: 'closed' });
        const sheet = constructedStyleSheet(css);
        if (sheet) this.root.adoptedStyleSheets = [sheet];
        this.root.innerHTML = `${sheet ? '' : `<style>${css}</style>`}<div class="layer" aria-hidden="true">${markup}</div>`;
        document.documentElement.appendChild(this.host);
        const tick = () => {
            this.update();
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }

    update() {
        // Pages that rewrite the document can drop the host along with everything else.
        if (!this.host.isConnected) document.documentElement.appendChild(this.host);
        this.position();
    }

    position() {}

    remove() {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.host.remove();
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
 * Shows an element over the given box.
 *
 * @param {HTMLElement} el
 * @param {{ left: number, top: number, width: number, height: number }} box
 */
export function place(el, box) {
    el.hidden = false;
    Object.assign(el.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
}
