import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

export class Favicon extends ContentFeature {
    init() {
        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return;

        window.addEventListener('DOMContentLoaded', () => {
            // send once, immediately
            this.send();

            // then optionally watch for changes
            this.monitorChanges();
        });
    }

    monitorChanges() {
        // if there was an explicit opt-out, do nothing
        // this allows the remote config to be absent for this feature
        if (this.getFeatureSetting('monitor') === false) return;

        let trailing;
        let lastEmitTime = performance.now();
        const interval = 50;

        monitor(() => {
            clearTimeout(trailing);
            const currentTime = performance.now();
            const delta = currentTime - lastEmitTime;
            if (delta >= interval) {
                this.send();
            } else {
                trailing = setTimeout(() => {
                    this.send();
                }, 50);
            }
            lastEmitTime = currentTime;
        });
    }

    send() {
        const favicons = this.getFaviconList();
        this.notify('faviconFound', { favicons, documentUrl: document.URL });
    }

    /**
     * Gets the list of favicons from the page, filtering SVGs for iOS
     * @returns {import('../types/favicon.js').FaviconAttrs[]}
     */
    getFaviconList() {
        const favicons = getFaviconList();

        // Filter out SVGs for iOS since native side can't handle them
        if (this.platform.name === 'ios') {
            return favicons.filter((favicon) => !isSvgFavicon(favicon.href, favicon.type || ''));
        }

        return favicons;
    }
}

export default Favicon;

/**
 * Checks if a favicon link is an SVG based on href or type attribute
 * @param {string} href - The favicon URL
 * @param {string} type - The type attribute value
 * @returns {boolean}
 */
function isSvgFavicon(href, type) {
    return href.includes('.svg') || type.includes('svg');
}

/**
 * Standalone function to get favicon list (without SVG filtering).
 * Used by page-context feature for AI chat context gathering.
 * @returns {import('../types/favicon.js').FaviconAttrs[]}
 */
export function getFaviconList() {
    const selectors = [
        "link[href][rel='favicon']",
        "link[href][rel*='icon']",
        "link[href][rel='apple-touch-icon']",
        "link[href][rel='apple-touch-icon-precomposed']",
    ];
    const elements = document.head.querySelectorAll(selectors.join(','));
    return Array.from(elements).map((/** @type {HTMLLinkElement} */ link) => {
        const href = link.href || '';
        const rel = link.getAttribute('rel') || '';
        const type = link.type || '';
        return { href, rel, type };
    });
}

/**
 * @param {()=>void} changeObservedCallback
 */
function monitor(changeObservedCallback) {
    const target = document.head;
    if (!target) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target instanceof HTMLLinkElement) {
                changeObservedCallback();
                return;
            }
            if (mutation.type === 'childList') {
                for (const addedNode of mutation.addedNodes) {
                    if (addedNode instanceof HTMLLinkElement) {
                        changeObservedCallback();
                        return;
                    }
                }
                for (const removedNode of mutation.removedNodes) {
                    if (removedNode instanceof HTMLLinkElement) {
                        changeObservedCallback();
                        return;
                    }
                }
            }
        }
    });

    observer.observe(target, { attributeFilter: ['rel', 'href', 'type'], attributes: true, subtree: true, childList: true });
}
