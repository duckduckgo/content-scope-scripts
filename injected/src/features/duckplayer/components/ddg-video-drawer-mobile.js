import mobilecss from '../assets/mobile-video-drawer.css';
import dax from '../assets/dax.svg';
import info from '../assets/info-solid.svg';
import { createPolicy, html, trustedUnsafe } from '../../../dom-utils.js';

/**
 * @typedef {ReturnType<import("../text").overlayCopyVariants>} TextVariants
 * @typedef {TextVariants[keyof TextVariants]} Text
 */

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class DDGVideoDrawerMobile extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-drawer-mobile';
    static OPEN_INFO = 'open-info';
    static OPT_IN = 'opt-in';
    static OPT_OUT = 'opt-out';
    static DISMISS = 'dismiss';
    static THUMBNAIL_CLICK = 'thumbnail-click';

    policy = createPolicy();
    /** @type {boolean} */
    testMode = false;
    /** @type {Text | null} */
    text = null;
    /** @type {HTMLElement | null} */
    container;
    /** @type {HTMLElement | null} */
    drawer;
    /** @type {import('./ddg-video-thumbnail-overlay-mobile').DDGVideoThumbnailOverlay} */
    thumbnailOverlay;

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
        this.setupElements(overlayElement);
        this.setupEventHandlers();
        this.animateOverlay('in');
    }

    /** @param {HTMLElement} container */
    setupElements(container) {
        this.container = container;
        this.drawer = container.querySelector('.ddg-mobile-drawer');
    }

    /**
     * @returns {string}
     */
    mobileHtml() {
        if (!this.text) {
            console.warn('missing `text`. Please assign before rendering');
            return '';
        }
        const svgIcon = trustedUnsafe(dax);
        const infoIcon = trustedUnsafe(info);

        return html`
            <div class="ddg-mobile-drawer-overlay">
                <div class="ddg-mobile-drawer-background"></div>
                <div class="ddg-mobile-drawer">
                    <div class="heading">
                        <div class="logo">${svgIcon}</div>
                        <div class="title">${this.text.title}</div>
                        <div class="info">
                            <button class="info-button" type="button" aria-label="Open Information Modal">${infoIcon}</button>
                        </div>
                    </div>
                    <div class="buttons">
                        <button class="button cancel ddg-vpo-cancel" type="button">${this.text.buttonOptOut}</button>
                        <a class="button open ddg-vpo-open" href="#">${this.text.buttonOpen}</a>
                    </div>
                    <div class="remember">
                        <div class="remember-label">
                            <span class="remember-text"> ${this.text.rememberLabel} </span>
                            <span class="remember-checkbox">
                                <input id="remember" type="checkbox" name="ddg-remember" hidden />
                                <button role="switch" aria-checked="false" class="switch ios-switch">
                                    <span class="thumb"></span>
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `.toString();
    }

    /**
     *
     * @param {'in'|'out'} direction
     */
    animateOverlay(direction) {
        const overlay = this.container?.querySelector('.ddg-mobile-drawer-overlay');
        if (!overlay) return;

        switch (direction) {
            case 'in':
                overlay.classList.remove('animateOut');
                overlay.classList.add('animateIn');
                break;
            case 'out':
                overlay.classList.remove('animateIn');
                overlay.classList.add('animateOut');
                break;
        }
    }

    setupEventHandlers() {
        if (!this.container) {
            console.warn('Error setting up drawer component');
            return;
        }

        const switchElem = this.container.querySelector('[role=switch]');
        const infoButton = this.container.querySelector('.info-button');
        const remember = this.container.querySelector('input[name="ddg-remember"]');
        const cancelElement = this.container.querySelector('.ddg-vpo-cancel');
        const watchInPlayer = this.container.querySelector('.ddg-vpo-open');
        const overlay = this.container.querySelector('.ddg-mobile-drawer-overlay');
        const background = this.container.querySelector('.ddg-mobile-drawer-background');

        if (
            !cancelElement ||
            !watchInPlayer ||
            !switchElem ||
            !infoButton ||
            !overlay ||
            !background ||
            !(remember instanceof HTMLInputElement)
        ) {
            return console.warn('missing elements');
        }

        infoButton.addEventListener('click', () => {
            this.dispatchEvent(new Event(DDGVideoDrawerMobile.OPEN_INFO));
        });

        switchElem.addEventListener('pointerdown', () => {
            const current = switchElem.getAttribute('aria-checked');
            if (current === 'false') {
                switchElem.setAttribute('aria-checked', 'true');
                remember.checked = true;
            } else {
                switchElem.setAttribute('aria-checked', 'false');
                remember.checked = false;
            }
        });

        cancelElement.addEventListener('click', (e) => {
            if (!e.isTrusted) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.animateOverlay('out');
            this.dispatchEvent(new CustomEvent(DDGVideoDrawerMobile.OPT_OUT, { detail: { remember: remember.checked } }));
        });

        background.addEventListener('click', (e) => {
            if (!e.isTrusted || e.target !== background) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.animateOverlay('out');

            const mouseEvent = /** @type {MouseEvent} */ (e);
            const isClickOnOverlay = this.thumbnailOverlay?.isMouseEventWithinBounds(mouseEvent);
            const event = isClickOnOverlay ? DDGVideoDrawerMobile.THUMBNAIL_CLICK : DDGVideoDrawerMobile.DISMISS;

            this.dispatchEvent(new CustomEvent(event));
        });

        watchInPlayer.addEventListener('click', (e) => {
            if (!e.isTrusted) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.dispatchEvent(new CustomEvent(DDGVideoDrawerMobile.OPT_IN, { detail: { remember: remember.checked } }));
        });
    }
}
