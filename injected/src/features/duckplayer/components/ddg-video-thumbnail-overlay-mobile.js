import mobilecss from '../assets/mobile-video-thumbnail-overlay.css';
import { createPolicy, html } from '../../../dom-utils.js';

/**
 * @typedef {ReturnType<import("../text").overlayCopyVariants>} TextVariants
 * @typedef {TextVariants[keyof TextVariants]} Text
 */

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class DDGVideoThumbnailOverlay extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-thumbnail-overlay-mobile';

    policy = createPolicy();
    /** @type {boolean} */
    testMode = false;

    connectedCallback() {
        this.createMarkupAndStyles();
    }

    createMarkupAndStyles() {
        const shadow = this.attachShadow({ mode: this.testMode ? 'open' : 'closed' });
        const style = document.createElement('style');
        style.innerText = mobilecss;
        const container = document.createElement('div');
        const content = this.mobileHtml();
        container.innerHTML = this.policy.createHTML(content);
        shadow.append(style, container);
        this.container = container;
    }

    /**
     * @returns {string}
     */
    mobileHtml() {
        return html`
            <div class="ddg-video-player-overlay">
                <div class="bg ddg-vpo-bg"></div>
                <div class="logo"></div>
                <div class="ddg-vpo-spinner" aria-hidden="true">
                    <div class="ddg-vpo-spinner__container">
                        <div class="ddg-vpo-spinner__rotator">
                            <div class="ddg-vpo-spinner__left"><div class="ddg-vpo-spinner__circle"></div></div>
                            <div class="ddg-vpo-spinner__right"><div class="ddg-vpo-spinner__circle"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `.toString();
    }

    /**
     * Swap the play logo for the buffering spinner. Used while the overlay is held
     * on screen after opt-out, until the underlying video renders its first frame.
     */
    showLoadingState() {
        this.container?.querySelector('.ddg-video-player-overlay')?.classList.add('loading');
    }

    /**
     * Paint a poster behind the spinner, trying each candidate in order until one
     * loads. Already-cached images (e.g. a poster this overlay painted before opt-out)
     * paint without a network round trip; 404s fall through to the next candidate.
     * @param {string[]} candidates
     */
    setPosterCandidates(candidates) {
        const bg = this.container?.querySelector('.ddg-vpo-bg');
        if (!(bg instanceof HTMLElement)) return;
        const list = candidates.filter(Boolean);
        const tryAt = (index) => {
            if (index >= list.length) return;
            const url = list[index];
            const img = new Image();
            img.onload = () => {
                bg.style.backgroundImage = `url("${url}")`;
                bg.style.backgroundSize = 'cover';
            };
            img.onerror = () => tryAt(index + 1);
            img.src = url;
        };
        tryAt(0);
    }
}
