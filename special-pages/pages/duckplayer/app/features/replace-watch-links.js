/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 */

import { VideoParams } from 'injected/src/features/duckplayer/util';

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

        if (win && doc) {
            doc.addEventListener(
                'click',
                (e) => {
                    /** @type {HTMLLinkElement|null} */
                    const closestLink = /** @type {Element} */ (e.target).closest('a[href]');
                    if (closestLink && this.isWatchLink(closestLink.href)) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent(WATCH_LINK_CLICK_EVENT));
                    }
                },
                {
                    capture: true,
                },
            );
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
        const videoParams = VideoParams.forWatchPage(href);
        return videoParams?.id === this.videoId;
    }
}
