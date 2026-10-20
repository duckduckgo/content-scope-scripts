/**
 * Where the toolbar and its menus go, in viewport coordinates. Pure, so it can be unit tested.
 *
 * @typedef {import('./selection.js').Rect} Rect
 * @typedef {{ width: number, height: number }} Size
 */

export const VIEWPORT_MARGIN = 8;
const SELECTION_GAP = 8;
/** Lifted a little further off the bottom edge than the usual margin when floating over the selection */
const PINNED_LIFT = 30;
const MENU_GAP = 4;
/** Between the toolbar and a menu that opens below or above it */
const TOOLBAR_MENU_GAP = 0;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

/**
 * Just above the selection, left-aligned with it. A selection at the top of the viewport gets the toolbar below it;
 * one that runs past the bottom gets it floating over the selection near the bottom of the viewport.
 * @param {Rect} selection
 * @param {Size} toolbar
 * @param {Size} viewport
 * @returns {{ left: number, top: number, visible: boolean }}
 */
export function toolbarPosition(selection, toolbar, viewport) {
    const above = selection.top - SELECTION_GAP - toolbar.height;
    const below = selection.bottom + SELECTION_GAP;
    const pinned = viewport.height - VIEWPORT_MARGIN - PINNED_LIFT - toolbar.height;
    let top = pinned;
    if (selection.bottom <= viewport.height) {
        if (above >= VIEWPORT_MARGIN) {
            top = above;
        } else if (below + toolbar.height <= viewport.height - VIEWPORT_MARGIN) {
            top = below;
        }
    }
    return {
        left: Math.round(clamp(selection.left, VIEWPORT_MARGIN, viewport.width - toolbar.width - VIEWPORT_MARGIN)),
        top: Math.round(clamp(top, VIEWPORT_MARGIN, viewport.height - toolbar.height - VIEWPORT_MARGIN)),
        visible: selection.bottom > 0 && selection.top < viewport.height,
    };
}

/**
 * Below its button, flipping above the toolbar when it would run off the bottom.
 * @param {Rect} button
 * @param {Rect} toolbar
 * @param {Size} menu
 * @param {Size} viewport
 */
export function menuPosition(button, toolbar, menu, viewport) {
    let top = toolbar.bottom + TOOLBAR_MENU_GAP;
    if (top + menu.height > viewport.height - VIEWPORT_MARGIN) {
        top = toolbar.top - TOOLBAR_MENU_GAP - menu.height;
    }
    return {
        left: Math.round(clamp(button.left - MENU_GAP, VIEWPORT_MARGIN, viewport.width - menu.width - VIEWPORT_MARGIN)),
        top: Math.round(clamp(top, VIEWPORT_MARGIN, viewport.height - menu.height - VIEWPORT_MARGIN)),
    };
}

/**
 * Beside its item, on the right unless that runs off the viewport, then on the left.
 * @param {Rect} item
 * @param {Rect} menu
 * @param {Size} submenu
 * @param {Size} viewport
 */
export function submenuPosition(item, menu, submenu, viewport) {
    const right = menu.right + MENU_GAP;
    const left = right + submenu.width <= viewport.width - VIEWPORT_MARGIN ? right : menu.left - MENU_GAP - submenu.width;
    return {
        left: Math.round(clamp(left, VIEWPORT_MARGIN, viewport.width - submenu.width - VIEWPORT_MARGIN)),
        top: Math.round(clamp(item.top - MENU_GAP, VIEWPORT_MARGIN, viewport.height - submenu.height - VIEWPORT_MARGIN)),
    };
}
