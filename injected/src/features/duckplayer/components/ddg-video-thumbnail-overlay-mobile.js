import mobilecss from '../assets/mobile-video-thumbnail-overlay.css';
import { createPolicy, html } from '../../../dom-utils.js';
import { paintFirstUsablePoster } from '../poster.js';

/**
 * @typedef {ReturnType<import("../text").overlayCopyVariants>} TextVariants
 * @typedef {TextVariants[keyof TextVariants]} Text
 * @typedef {import("../poster.js").PosterCandidate} PosterCandidate
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
    /** @type {AbortController | null} */
    posterLoad = null;

    get overlay() {
        return this.container?.querySelector('.ddg-video-player-overlay');
    }

    connectedCallback() {
        this.createMarkupAndStyles();
    }

    disconnectedCallback() {
        this.posterLoad?.abort();
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
     * Enter the buffering hold: drop the play logo, since Duck Player has been
     * declined and the overlay is now only standing in for the player's own startup.
     */
    showLoadingState() {
        this.overlay?.classList.add('loading');
    }

    showSpinner() {
        this.overlay?.classList.add('spinning');
    }

    /**
     * Withdraw the spinner but keep the poster, so a video that never arrives settles on
     * a still frame instead of the black frame the hold exists to cover.
     */
    hideSpinner() {
        this.overlay?.classList.remove('spinning');
    }

    /**
     * Paint a poster behind the spinner, cancelling the walk if the overlay goes away first.
     * @param {PosterCandidate[]} candidates
     */
    setPosterCandidates(candidates) {
        const bg = this.container?.querySelector('.ddg-vpo-bg');
        if (!(bg instanceof HTMLElement)) return;

        const controller = new AbortController();
        this.posterLoad = controller;
        void paintFirstUsablePoster(
            bg,
            candidates.map(({ url, source }) => ({ url, verify: source === 'ytimg' })),
            { signal: controller.signal },
        );
    }
}
