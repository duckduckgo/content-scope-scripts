import { getUrlHashParameter, getUrlParameter } from '../../utils/url';
import { getElementByName, getElementWithSrcStart } from '../../utils/utils';
import { stringifyFunction } from '../utils/stringify-function';
import { injectTokenIntoElement } from '../utils/token';
import { CaptchaProvider } from './provider.interface';

/**
 * Provider for hCaptcha
 */
export class HCaptchaProvider extends CaptchaProvider {
    #CAPTCHA_URL = 'https://newassets.hcaptcha.com/captcha';
    #CAPTCHA_RESPONSE_ELEMENT_NAME = 'h-captcha-response';

    getType() {
        return 'hcaptcha';
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element to check
     */
    isSupportedForElement(captchaContainerElement) {
        return !!this._getCaptchaElement(captchaContainerElement);
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element to check
     * @returns {string|null} - The site key or null if not found
     * @throws {Error}
     */
    getCaptchaIdentifier(captchaContainerElement) {
        const captchaElement = this._getCaptchaElement(captchaContainerElement);
        if (!captchaElement) {
            throw new Error('[getCaptchaIdentifier] could not find captcha');
        }

        const siteKey = this._getSiteKeyFromElement(captchaElement) || this._getSiteKeyFromUrl(captchaElement);
        if (!siteKey) {
            throw new Error('[HCaptchaProvider.getCaptchaIdentifier] could not extract site key');
        }

        return siteKey;
    }

    /**
     * @param {string} token - The solved captcha token
     */
    getSolveCallback(token) {
        return stringifyFunction({
            functionBody: hCaptchaCallback,
            functionName: 'hCaptchaCallback',
            args: { token },
        });
    }

    /**
     * @param {Document} root - The document root
     * @returns {boolean}
     */
    canSolve(root) {
        return !!getElementByName(root, this.#CAPTCHA_RESPONSE_ELEMENT_NAME);
    }

    /**
     * Injects the token to solve the captcha
     * @param {Document} root - The document root
     * @param {string} token - The solved captcha token
     * @returns {boolean} - Whether the injection was successful
     */
    injectToken(root, token) {
        return injectTokenIntoElement({ root, elementName: this.#CAPTCHA_RESPONSE_ELEMENT_NAME, token });
    }

    /**
     * @private
     * @param {HTMLElement} root - The root element to search from
     * @returns {HTMLElement|null}
     */
    _getCaptchaElement(root) {
        return getElementWithSrcStart(root, this.#CAPTCHA_URL);
    }

    /**
     * @private
     * @param {HTMLElement} captchaElement
     * @returns {string|null} The site key or null if not found
     */
    _getSiteKeyFromElement(captchaElement) {
        return captchaElement instanceof Element ? captchaElement.getAttribute('data-sitekey') : null;
    }

    /**
     * @private
     * @param {HTMLElement} captchaElement
     * @returns {string|null} The site key or null if not found
     */
    _getSiteKeyFromUrl(captchaElement) {
        if (!('src' in captchaElement)) {
            return null;
        }

        const captchaUrl = String(captchaElement.src);
        return getUrlParameter(captchaUrl, 'sitekey') || getUrlHashParameter(captchaUrl, 'sitekey');
    }
}

const hCaptchaCallback = () => {
    // TODO: Implementation
};
