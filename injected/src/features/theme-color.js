import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

export class ThemeColor extends ContentFeature {
    init() {
        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return;

        window.addEventListener('DOMContentLoaded', () => {
            // send once, immediately
            this.send();
        });
    }

    send() {
        const themeColor = getThemeColor();
        this.notify('themeColorStatus', { themeColor, documentUrl: document.URL });
    }
}

export default ThemeColor;

/**
 * Gets current theme color considering media queries
 * Follows browser behavior by returning the last matching meta tag in document order
 * @returns {string|null} The theme color value or null if not found
 */
function getThemeColor() {
    const metaTags = document.head.querySelectorAll('meta[name="theme-color"]');
    if (metaTags.length === 0) {
        return null;
    }

    let lastMatchingTag = null;
    for (const meta of metaTags) {
        const mediaAttr = meta.getAttribute('media');
        if (!mediaAttr || window.matchMedia(mediaAttr).matches) {
            lastMatchingTag = meta;
        }
    }
    return lastMatchingTag ? lastMatchingTag.getAttribute('content') : null;
}
