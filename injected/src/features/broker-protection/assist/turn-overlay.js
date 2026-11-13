import styles from './turn-overlay.css';
import { Overlay, documentBox, place } from './overlay.js';

const BADGE_GAP = 8;
// 16px line height plus 3px padding top and bottom (.badge).
const BADGE_HEIGHT = 22;

/**
 * The "Your turn" ring and badge around a widget the user has to solve.
 */
class TurnOverlay extends Overlay {
    static styles = styles;
    static markup = '<div class="ring" hidden></div><div class="badge" hidden>Your turn</div>';

    /**
     * @param {Element} widget
     */
    constructor(widget) {
        widget.scrollIntoView({ block: 'center', inline: 'nearest' });
        const badgeBesideWidget = hasContentAbove(widget);
        super();
        this.widget = widget;
        this.badgeBesideWidget = badgeBesideWidget;
        this.ring = /** @type {HTMLElement} */ (this.root.querySelector('.ring'));
        this.ring.style.borderRadius = getComputedStyle(widget).borderRadius;
        this.badge = /** @type {HTMLElement} */ (this.root.querySelector('.badge'));
        this.update();
    }

    position() {
        const widget = documentBox(this.widget);
        if (!widget) {
            this.ring.hidden = true;
            this.badge.hidden = true;
            return;
        }
        place(this.ring, widget);
        this.badge.hidden = false;
        if (this.badgeBesideWidget) {
            this.badge.style.left = `${widget.left + widget.width + 16}px`;
            this.badge.style.top = `${widget.top + (widget.height - BADGE_HEIGHT) / 2}px`;
        } else {
            this.badge.style.left = `${widget.left}px`;
            this.badge.style.top = `${widget.top - BADGE_HEIGHT - BADGE_GAP}px`;
        }
    }
}

/** @type {TurnOverlay | null} */
let current = null;

/**
 * @param {Element} widget
 */
export function show(widget) {
    current?.remove();
    current = new TurnOverlay(widget);
}

export function clear() {
    current?.remove();
    current = null;
}

/**
 * The badge sits above the widget by default, but pages often have a label or field there, so check
 * before covering it.
 *
 * @param {Element} widget
 */
function hasContentAbove(widget) {
    const rect = widget.getBoundingClientRect();
    const badgeSpace = BADGE_HEIGHT + BADGE_GAP;
    if (rect.top < badgeSpace) return false;
    // Sample a small grid of points across where the badge would go.
    const xs = [4, 40, 80].map((dx) => rect.left + Math.min(dx, rect.width));
    const ys = [2, badgeSpace / 2, badgeSpace - 2].map((dy) => rect.top - dy);
    return ys.some((y) =>
        xs.some((x) => {
            const hit = document.elementFromPoint(x, y);
            return hit !== null && !hit.contains(widget);
        }),
    );
}
