import { getElementWithSrcStart } from '../../utils/utils';
import { PirError } from '../../types';
import { getSiteKeyFromAttribute } from '../utils/sitekey';
import { safeCallWithError } from '../../utils/safe-call';

/**
 * @typedef {Object} CloudFlareTurnstileProviderConfig
 * @property {string} type - The captcha type
 * @property {string} providerUrl - The captcha provider URL
 * @property {string} responseElementName - The name of the captcha response element
 */

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @implements {CaptchaProvider}
 */
export class CloudFlareTurnstileProvider {

    /**
     * @type {CloudFlareTurnstileProviderConfig}
     */
    #config;

    /**
     * @param {CloudFlareTurnstileProviderConfig} config
    */
    constructor(config) {
        this.#config = config;
    }

    getType() {
        return this.#config.type;
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     */
    isSupportedForElement(captchaContainerElement) {
        return !!this._getCaptchaElement(captchaContainerElement);
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     */
    getCaptchaIdentifier(captchaContainerElement) {
        return safeCallWithError(
            () => getSiteKeyFromAttribute({ captchaElement: this._getCaptchaElement(captchaContainerElement), siteKeyAttrName: 'data-sitekey' }),
            { errorMessage: '[CloudFlareTurnstileProvider.getCaptchaIdentifier] could not extract site key' },
        );
    }

    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {Document} root - The document root to search for captchas
     */
    canSolve(root) {
        // TODO: Implement
        return false;
    }

    /**
     * @param {Document} root - The document root containing the captcha
     * @param {string} token - The solved captcha token
     */
    injectToken(root, token) {
        // TODO: Implement
        return PirError.create('Not implemented');
    }

    /**
     * @param {string} token - The solved captcha token
     */
    getSolveCallback(token) {
        return null;
    }

    /**
     * @private
     * @param {HTMLElement} captchaContainerElement
     */
    _getCaptchaElement(captchaContainerElement) {
        return getElementWithSrcStart(captchaContainerElement, this.#config.providerUrl);
    }
}
