import css from './thumbnail-overlay.css';
import { createPolicy, html } from '../../../dom-utils.js';
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js';
import { VideoParams, appendImageAsBackground, Logger } from '../util';

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class DDGVideoThumbnailOverlay extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-thumbnail-overlay-mobile';

    policy = createPolicy();
    /** @type {Logger} */
    logger;
    /** @type {boolean} */
    testMode = false;
    /** @type {HTMLElement} */
    container;
    /** @type {string} */
    href;

    static register() {
        if (!customElementsGet(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)) {
            customElementsDefine(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME, DDGVideoThumbnailOverlay);
        }
    }

    connectedCallback() {
        this.createMarkupAndStyles();
    }

    createMarkupAndStyles() {
        const shadow = this.attachShadow({ mode: this.testMode ? 'open' : 'closed' });

        const style = document.createElement('style');
        style.innerText = css;

        const container = document.createElement('div');
        container.classList.add('wrapper');
        const content = this.render();
        container.innerHTML = this.policy.createHTML(content);
        shadow.append(style, container);
        this.container = container;

        this.logger?.log('Created', DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME, 'with container', container);
        this.appendThumbnail();
    }

    appendThumbnail() {
        const params = VideoParams.forWatchPage(this.href);
        const imageUrl = params?.toLargeThumbnailUrl();

        if (!imageUrl) {
            this.logger?.warn('Could not get thumbnail url for video id', params?.id);
            return;
        }

        if (this.testMode) {
            this.logger?.log('Appending thumbnail', imageUrl);
        }
        appendImageAsBackground(this.container, '.ddg-vpo-bg', imageUrl);
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
 * @param {import('../environment').Environment} environment
 */
export function appendThumbnailOverlay(targetElement, environment) {
    const logger = new Logger({
        id: 'THUMBNAIL_OVERLAY',
        shouldLog: () => environment.isTestMode(),
    });

    DDGVideoThumbnailOverlay.register();

    const overlay = /** @type {DDGVideoThumbnailOverlay} */ (document.createElement(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME));
    overlay.logger = logger;
    overlay.testMode = environment.isTestMode();
    overlay.href = environment.getPlayerPageHref();

    targetElement.appendChild(overlay);

    return () => {
        document.querySelector(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)?.remove();
    };
}
