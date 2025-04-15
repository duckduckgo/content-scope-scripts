import mobilecss from './thumbnail-overlay.css';
import { createPolicy, html } from '../../../dom-utils.js';
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js';
import { VideoParams, appendImageAsBackground } from '../../duckplayer/util';

export function registerCustomElements() {
    if (!customElementsGet(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME, DDGVideoThumbnailOverlay);
    }
}

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class DDGVideoThumbnailOverlay extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-thumbnail-overlay-mobile';

    policy = createPolicy();
    /** @type {boolean} */
    testMode = false;
    /** @type {HTMLElement} */
    container;

    connectedCallback() {
        this.createMarkupAndStyles();
    }

    createMarkupAndStyles() {
        const shadow = this.attachShadow({ mode: this.testMode ? 'open' : 'closed' });
        const style = document.createElement('style');
        style.innerText = mobilecss;
        const container = document.createElement('div');
        const content = this.render();
        container.innerHTML = this.policy.createHTML(content);
        shadow.append(style, container);
        this.container = container;
        this.appendThumbnail();
    }

    appendThumbnail() {
        const params = VideoParams.forWatchPage(this.getPlayerPageHref());
        const videoId = params?.id;

        const imageUrl = this.getLargeThumbnailSrc(videoId);
        console.log('Image url', imageUrl);
        appendImageAsBackground(this.container, '.ddg-vpo-bg', imageUrl);
    }

    getLargeThumbnailSrc(videoId) {
        const url = new URL(`/vi/${videoId}/maxresdefault.jpg`, 'https://i.ytimg.com');
        return url.href;
    }

    /**
     * This is the URL of the page that the user is currently on
     * It's abstracted so that we can mock it in tests
     * @return {string}
     */
    getPlayerPageHref() {
        if (this.testMode) {
            const url = new URL(window.location.href);
            if (url.hostname === 'www.youtube.com') return window.location.href;

            // reflect certain query params, this is useful for testing
            if (url.searchParams.has('v')) {
                const base = new URL('/watch', 'https://youtube.com');
                base.searchParams.set('v', url.searchParams.get('v') || '');
                return base.toString();
            }

            return 'https://youtube.com/watch?v=123';
        }
        return window.location.href;
    }

    /**
     * @returns {string}
     */
    render() {
        return html`
            <div class="ddg-video-player-overlay">
                <div class="bg ddg-vpo-bg"></div>
                <div class="logo"></div>
            </div>
        `.toString();
    }
}





/**
 *
 * @param {HTMLElement} targetElement
 */
export function appendThumbnailOverlay(targetElement) {
    registerCustomElements();
    console.log('Appending thumbnail overlay');
    const overlay = /** @type {DDGVideoThumbnailOverlay} */ (document.createElement(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME));
    console.log('Overlay', overlay, targetElement);
    overlay.testMode = true;
    targetElement.appendChild(overlay);

    return () => {
        document.querySelector(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)?.remove();
    };
}
