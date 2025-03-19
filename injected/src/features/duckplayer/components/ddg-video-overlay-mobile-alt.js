import mobilecss from '../assets/mobile-video-overlay-alt.css';
import { createPolicy, html } from '../../../dom-utils.js';

/**
 * @typedef {ReturnType<import("../text").overlayCopyVariants>} TextVariants
 * @typedef {TextVariants[keyof TextVariants]} Text
 */

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class DDGVideoOverlayMobileAlt extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-overlay-mobile-alt';
    // static OPT_OUT = 'opt-out';

    policy = createPolicy();
    /** @type {boolean} */
    testMode = false;
    /** @type {Text | null} */
    text = null;
    /** @type {HTMLElement} */
    overlay;

    connectedCallback() {
        this.createMarkupAndStyles();
    }

    createMarkupAndStyles() {
        const shadow = this.attachShadow({ mode: this.testMode ? 'open' : 'closed' });
        const style = document.createElement('style');
        style.innerText = mobilecss;
        const overlayElement = document.createElement('div');
        const content = this.mobileHtml();
        overlayElement.innerHTML = this.policy.createHTML(content);
        shadow.append(style, overlayElement);
        this.setupEventHandlers(overlayElement);
        this.container = overlayElement;
    }

    /**
     * @returns {string}
     */
    mobileHtml() {
        if (!this.text) {
            console.warn('missing `text`. Please assign before rendering');
            return '';
        }
        return html`
            <div class="ddg-video-player-overlay">
                <div class="bg ddg-vpo-bg"></div>
                <div class="logo"></div>
            </div>
        `.toString();
    }

    /**
     * @param {HTMLElement} containerElement
     */
    setupEventHandlers(containerElement) {
        const overlay = containerElement.querySelector('.ddg-video-player-overlay');

        if (!overlay) {
            return console.warn('missing elements');
        }

        // overlay.addEventListener('click', (e) => {
        //     console.log('BACKGROUND CLICKED');
        //     if (!e.isTrusted) return;
        //     e.preventDefault();
        //     e.stopImmediatePropagation();
        //     this.dispatchEvent(
        //         new CustomEvent(DDGVideoOverlayMobileAlt.OPT_OUT),
        //     );
        // });
        this.overlay = /** @type {HTMLElement} */ (overlay);
    }
}
