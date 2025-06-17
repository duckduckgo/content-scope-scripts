/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 */

export const WATCH_LINK_CLICK_EVENT = 'ddg-iframe-watch-link-click';

/**
 * @implements IframeFeature
 */
export class ReplaceWatchLinks {
    /**
     * @param {string} videoId
     */
    constructor(videoId) {
        this.videoId = videoId;
    }
    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        const doc = iframe.contentDocument;
        const win = iframe.contentWindow;

        if (!doc) {
            console.log('could not access contentDocument');
            return () => {};
        }

        const updateLink = (elem) => {
            if (elem.href && this.isWatchLink(elem.href)) {
                console.log('Adding click listener to', elem);
                elem.addEventListener('click', (e) => {
                    console.log('Watch link clicked', e);
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent(WATCH_LINK_CLICK_EVENT));
                });
            }
        };

        if (win && doc) {
            const clickableElements = Array.from(doc.querySelectorAll('a'));
            console.log('LinkCapture: Found clickable elements:', clickableElements);
            clickableElements.forEach((/** @type {HTMLAnchorElement} */ elem) => {
                updateLink(elem);
            });

            // Create a MutationObserver instance
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    // Check for added nodes
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach((node) => {
                            // If the node is an element, check for a tags
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = /** @type {Element} */ (node);

                                // Check if the added node itself is an anchor tag
                                if (element.tagName === 'A') {
                                    updateLink(element);
                                }

                                // Check for anchor tags within the added node
                                const anchorTags = element.querySelectorAll('a');
                                anchorTags.forEach((/** @type {HTMLAnchorElement} */ anchor) => {
                                    updateLink(anchor);
                                });
                            }
                        });
                    }
                }
            });

            // Start observing the iframe's document for changes
            observer.observe(doc, {
                childList: true,
                subtree: true, // Observe all descendants of the body
            });
        } else {
            console.warn('could not access iframe?.contentWindow && iframe?.contentDocument');
        }

        return null;
    }

    /**
     * @param {string} href
     * @return {boolean}
     */
    isWatchLink(href) {
        if (!this.videoId || !href) {
            return false;
        }
        const url = new URL(href);
        return url.hostname.endsWith('youtube.com') && url.pathname.includes('/watch') && url.searchParams.get('v') === this.videoId;
    }
}
