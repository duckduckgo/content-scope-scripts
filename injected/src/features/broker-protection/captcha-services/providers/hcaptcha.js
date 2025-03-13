import { PirError } from '../../types';
import { getUrlHashParameter, getUrlParameter } from '../../utils/url';
import { getElementByName, getElementWithSrcStart } from '../../utils/utils';
import { stringifyFunction } from '../utils/stringify-function';
import { injectTokenIntoElement } from '../utils/token';

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @implements {CaptchaProvider}
 */
export class HCaptchaProvider {
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
     */
    getCaptchaIdentifier(captchaContainerElement) {
        const captchaElement = this._getCaptchaElement(captchaContainerElement);
        if (!captchaElement) {
            return PirError.create('[getCaptchaIdentifier] could not find captcha');
        }

        const siteKey = this._getSiteKeyFromElement(captchaElement) || this._getSiteKeyFromUrl(captchaElement);
        if (!siteKey) {
            return PirError.create('[HCaptchaProvider.getCaptchaIdentifier] could not extract site key');
        }

        return siteKey;
    }

    getSupportingCodeToInject() {
        return null;
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
