import mobilecss from './custom-error.css';
import { createPolicy, html } from '../../../dom-utils.js';
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js';

/** @typedef {import('../error-detection').YouTubeError} YouTubeError */

export function registerCustomElements() {
    if (!customElementsGet(CustomError.CUSTOM_TAG_NAME)) {
        customElementsDefine(CustomError.CUSTOM_TAG_NAME, CustomError);
    }
}

/**
 * The custom element that we use to present our UI elements
 * over the YouTube player
 */
export class CustomError extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-video-error';

    policy = createPolicy();
    /** @type {boolean} */
    testMode = false;
    /** @type {YouTubeError} */
    error;
    /** @type {string} */
    title = '';
    /** @type {string[]} */
    messages = [];

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
    }

    /**
     * @returns {string}
     */
    render() {
        if (!this.title || !this.messages) {
            console.warn('missing error text. Please assign before rendering');
            return '';
        }

        const messagesHtml = this.messages.map((message) => html`<p>${message}</p>`);

        return html`
            <div class="error mobile">
                <div class="container">
                    <span class="icon"></span>

                    <div class="content">
                        <h1 class="heading">{heading}</h1>
                        <div class="messages">${messagesHtml}</div>
                    </div>
                </div>
            </div>
        `.toString();
    }
}

/**
 *
 * @param {HTMLElement} targetElement
 * @param {object} options
 * @param {string} options.title
 * @param {string[]} options.messages
 */
export function showError(targetElement, { title, messages }) {
    registerCustomElements();
    console.log('Appending custom error view');
    const customError = /** @type {CustomError} */ (document.createElement(CustomError.CUSTOM_TAG_NAME));
    customError.testMode = true;
    customError.title = title;
    customError.messages = messages;
    console.log('Custom error view', customError, targetElement);
    targetElement.appendChild(customError);

    return () => {
        document.querySelector(CustomError.CUSTOM_TAG_NAME)?.remove();
    };
}
