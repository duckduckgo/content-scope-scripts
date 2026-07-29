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
    /** @type {AbortController | null} */
    posterLoad = null;

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
                <div class="ddg-vpo-status" role="status"></div>
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

    /**
     * Announce the hold to assistive technology through the visually-hidden live region;
     * the poster and spinner are decorative and marked aria-hidden.
     * @param {string} label
     */
    setLoadingLabel(label) {
        const status = this.container?.querySelector('.ddg-vpo-status');
        if (status instanceof HTMLElement) status.textContent = label;
    }

    showSpinner() {
        this.overlay?.classList.add('spinning');
    }

    /**
     * Withdraw the spinner but keep the poster, so a video that never arrives settles
     * on a still frame instead of claiming to still be loading.
     */
    hideSpinner() {
        this.overlay?.classList.remove('spinning');
    }

    get overlay() {
        return this.container?.querySelector('.ddg-video-player-overlay');
    }

    /**
     * Paint a poster behind the spinner, trying each candidate in order until one
     * displays, so the spinner never sits on black. A `verify` candidate is a
     * synthesised i.ytimg.com URL: YouTube answers a thumbnail a video does not have
     * with a valid placeholder image under a 404 status, so its load event fires on the
     * placeholder and cannot be trusted; the HEAD status is the only reliable signal.
     * Page-supplied candidates are painted on load, with no extra round trip.
     * @param {{url: string, verify: boolean}[]} candidates
     */
    setPosterCandidates(candidates) {
        const bg = this.container?.querySelector('.ddg-vpo-bg');
        if (!(bg instanceof HTMLElement)) return;

        /** @type {{url: string, verify: boolean}[]} */
        const list = [];
        for (const candidate of candidates) {
            const url = safePosterUrl(candidate.url);
            if (url) list.push({ url, verify: candidate.verify });
        }
        if (list.length === 0) return;

        const controller = new AbortController();
        this.posterLoad = controller;
        const { signal } = controller;

        const paint = (/** @type {string} */ url) => {
            bg.style.backgroundImage = `url("${url}")`;
            bg.style.backgroundSize = 'cover';
        };

        const tryAt = async (/** @type {number} */ index) => {
            if (signal.aborted) return;
            const candidate = list[index];
            if (!candidate) return;

            if (candidate.verify) {
                let ok = false;
                try {
                    ok = (await fetch(candidate.url, { method: 'HEAD', signal })).ok;
                } catch {
                    ok = false;
                }
                if (signal.aborted) return;
                if (ok) return paint(candidate.url);
                return tryAt(index + 1);
            }

            const img = new Image();
            img.onload = () => {
                if (!signal.aborted) paint(candidate.url);
            };
            img.onerror = () => {
                if (!signal.aborted) void tryAt(index + 1);
            };
            img.src = candidate.url;
        };
        void tryAt(0);
    }
}

/**
 * Normalise a poster URL and reject anything that cannot be trusted inside the CSS
 * url() it is interpolated into. One candidate is scraped from a computed style, so it
 * is page-controlled text. Returns the normalised href, or null to skip the candidate.
 * @param {string} url
 * @returns {string | null}
 */
function safePosterUrl(url) {
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'data:') return null;
        return parsed.href;
    } catch {
        return null;
    }
}
