import { OverlayLayer, documentBox, place, query, setHidden, setStyle } from './layer.js';

const STYLES = `
.ring {
    position: absolute;
    border-radius: 4px;
    outline: 3px solid #f5a623;
    outline-offset: 3px;
    animation: ring 1.6s ease-in-out infinite;
}

.badge {
    position: absolute;
    padding: 3px 10px;
    border-radius: 999px;
    background: #ffc95c;
    color: #3d2a00;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
}

@keyframes ring {
    50% {
        outline-offset: 6px;
        outline-color: rgba(245, 166, 35, 0.55);
    }
}

@media (prefers-reduced-motion: reduce) {
    .ring {
        animation: none;
    }
}
`;

const BADGE_GAP = 8;
// 16px line height plus 3px padding top and bottom (.badge).
const BADGE_HEIGHT = 22;

/**
 * The "Your turn" ring and badge around a widget the user has to solve.
 */
export class TurnOverlay {
    /** @type {Element | null} */
    widget = null;
    radius = '';
    badgeBesideWidget = false;
    layer = new OverlayLayer({
        styles: STYLES,
        markup: '<div class="ring" hidden></div><div class="badge" hidden>Your turn</div>',
        select: (root) => ({ ring: query(root, '.ring'), badge: query(root, '.badge') }),
        position: (els) => this.position(els),
    });

    /**
     * @param {Element} widget
     */
    show(widget) {
        widget.scrollIntoView({ block: 'center', inline: 'nearest' });
        this.widget = widget;
        this.radius = getComputedStyle(widget).borderRadius;
        this.badgeBesideWidget = hasContentAbove(widget);
        this.layer.attach();
        this.layer.position();
    }

    clear() {
        this.widget = null;
        this.layer.destroy();
    }

    /**
     * @param {{ ring: HTMLElement, badge: HTMLElement }} els
     */
    position({ ring, badge }) {
        const widget = this.widget && documentBox(this.widget);
        place(ring, widget);
        setStyle(ring, 'borderRadius', this.radius);
        setHidden(badge, !widget);
        if (!widget) return;
        if (this.badgeBesideWidget) {
            setStyle(badge, 'left', `${widget.left + widget.width + 16}px`);
            setStyle(badge, 'top', `${widget.top + (widget.height - BADGE_HEIGHT) / 2}px`);
        } else {
            setStyle(badge, 'left', `${widget.left}px`);
            setStyle(badge, 'top', `${widget.top - BADGE_HEIGHT - BADGE_GAP}px`);
        }
    }
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
