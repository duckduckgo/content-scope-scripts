import css from './custom-error.css';
import { Logger } from '../../duckplayer/util.js';
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
 * @param {YouTubeError} errorId
 * @param {Record<string, string>} t - Localized strings from environment
 */
function getErrorStrings(errorId, t) {
    switch (errorId) {
        case 'sign-in-required':
            return {
                title: t.blockedVideoErrorHeading,
                messages: [t.signInRequiredErrorMessage1, t.signInRequiredErrorMessage2],
            };
        default:
            return {
                title: t.blockedVideoErrorHeading,
                messages: [t.blockedVideoErrorMessage1, t.blockedVideoErrorMessage2],
            };
    }
}

/**
 *
 * @param {HTMLElement} targetElement
 * @param {YouTubeError} errorId
 * @param {import('../../duckplayer/environment.js').Environment} environment
 */
export function showError(targetElement, errorId, environment) {
    const { title, messages } = getErrorStrings(errorId, environment.strings('native.json'));
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
