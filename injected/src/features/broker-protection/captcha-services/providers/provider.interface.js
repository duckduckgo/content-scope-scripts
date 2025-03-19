/**
 * Base interface for captcha providers
 * @import {PirError, PirResponse} from '../../types';
 * @interface
 * @abstract
 */
export class CaptchaProvider {
    /**
     * Returns the unique identifier for this captcha provider
     * @abstract
     * @returns {string} The provider's unique type identifier
     */
    getType() {
        throw new Error('getType() missing implementation');
    }

    /**
     * Checks if this provider supports the given element
     * @abstract
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @returns {boolean} True if this provider can handle the element
     */
    isSupportedForElement(captchaContainerElement) {
        throw new Error('isSupportedForElement() missing implementation');
    }

    /**
     * Extracts the site key from the captcha container element
     * @abstract
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @returns {PirError | string | null} The site key or null if not found
     */
    getCaptchaIdentifier(captchaContainerElement) {
        throw new Error('getCaptchaIdentifier() missing implementation');
    }

    /**
     * Returns code that should be injected before page load to support this captcha provider
     * @returns {string|null} Code to inject or null if not needed
     */
    getSupportingCodeToInject() {
        return null;
    }

    /**
     * Checks if this provider can solve the captcha on the current page
     * @abstract
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @returns {boolean} True if provider can solve captchas found in the document
     */
    canSolve(captchaContainerElement) {
        throw new Error('canSolve() missing implementation');
    }

    /**
     * Injects the solved token into the captcha on the page
     * @abstract
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @param {string} token - The solved captcha token
     * @returns {PirResponse<{ injected: boolean }>} - Whether the token was injected
     */
    injectToken(captchaContainerElement, token) {
        throw new Error('injectToken() missing implementation');
    }

    /**
     * Creates a callback function to execute when the captcha is solved
     * @abstract
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @param {string} token - The solved captcha token
     * @returns {PirError|string|null} Callback function to execute when the captcha is solved
     */
    getSolveCallback(captchaContainerElement, token) {
        throw new Error('getSolveCallback() missing implementation');
    }
}
