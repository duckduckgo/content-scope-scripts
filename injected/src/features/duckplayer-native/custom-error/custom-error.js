import css from './custom-error.css';
import { Logger } from '../util';
import { createPolicy, html } from '../../../dom-utils.js';
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js';

/** @import {YouTubeError} from '../error-detection' */

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class CustomError extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-error';

    policy = createPolicy();
    /** @type {Logger} */
    logger;
    /** @type {boolean} */
    testMode = false;
    /** @type {YouTubeError} */
    error;
    /** @type {string} */
    title = '';
    /** @type {string[]} */
    messages = [];

    static register() {
        if (!customElementsGet(CustomError.CUSTOM_TAG_NAME)) {
            customElementsDefine(CustomError.CUSTOM_TAG_NAME, CustomError);
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

        this.logger?.log('Created', CustomError.CUSTOM_TAG_NAME, 'with container', container);
    }

    /**
     * @returns {string}
     */
    render() {
        if (!this.title || !this.messages) {
            console.warn('Missing error title or messages. Please assign before rendering');
            return '';
        }

        const { title, messages } = this;
        const messagesHtml = messages.map((message) => html`<p>${message}</p>`);

        return html`
            <div class="error mobile">
                <div class="container">
                    <span class="icon"></span>

                    <div class="content">
                        <h1 class="heading">${title}</h1>
                        <div class="messages">${messagesHtml}</div>
                    </div>
                </div>
            </div>
        `.toString();
    }
}

/**
 * @param {import('../environment').Environment} environment
 * @param {YouTubeError} errorId
 */
function getErrorStrings(environment, errorId) {
    // TODO: get from environment strings
    console.log('TODO: Get translations for ', errorId, 'from', environment);
    return {
        title: 'YouTube won’t let Duck Player load this video',
        messages: [
            'YouTube doesn’t allow this video to be viewed outside of YouTube.',
            'You can still watch this video on YouTube, but without the added privacy of Duck Player.',
        ],
    };
}

/**
 *
 * @param {HTMLElement} targetElement
 * @param {import('../environment').Environment} environment
 * @param {YouTubeError} errorId
 */
export function showError(targetElement, environment, errorId) {
    const { title, messages } = getErrorStrings(environment, errorId);
    const logger = new Logger({
        id: 'CUSTOM_ERROR',
        shouldLog: () => environment.isTestMode(),
    });

    CustomError.register();

    const customError = /** @type {CustomError} */ (document.createElement(CustomError.CUSTOM_TAG_NAME));
    customError.logger = logger;
    customError.testMode = environment.isTestMode();
    customError.title = title;
    customError.messages = messages;
    targetElement.appendChild(customError);

    return () => {
        document.querySelector(CustomError.CUSTOM_TAG_NAME)?.remove();
    };
}
