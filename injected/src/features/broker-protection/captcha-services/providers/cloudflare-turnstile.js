import { getElementByTagName } from '../../utils/utils';
import { safeCallWithError } from '../../utils/safe-call';
import { getElementWithSrcStart } from '../../utils/utils';
import { getSiteKeyFromAttribute } from '../utils/sitekey';
import { injectTokenIntoElement } from '../utils/token';
import { getCallbackFromAttribute } from '../utils/callback';
import { stringifyFunction } from '../utils/stringify-function';
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
        return 'cloudflareTurnstile';
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     * @returns {boolean} Whether the captcha is supported for the element
     */
    isSupportedForElement(captchaContainerElement) {
        return true;
        //return !!this._getCaptchaElement(captchaContainerElement);
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     */
    getCaptchaIdentifier(captchaContainerElement) {
        return safeCallWithError(
            () => getSiteKeyFromAttribute({ captchaContainerElement, siteKeyAttrName: 'data-sitekey' }),
            { errorMessage: '[CloudFlareTurnstileProvider.getCaptchaIdentifier] could not extract site key' },
        );
    }

    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @returns {boolean} Whether the captcha can be solved
     */
    canSolve(captchaContainerElement) {
        const callbackFunctionName = getCallbackFromAttribute({ captchaContainerElement, callbackAttrName: 'data-callback' });
        const hasCallback = callbackFunctionName && callbackFunctionName === 'function';
        const hasResponseElement = getElementByTagName(captchaContainerElement, this.#config.responseElementName);

        return !!hasCallback && !!hasResponseElement;
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @param {string} token - The solved captcha token
     */
    injectToken(captchaContainerElement, token) {
        return injectTokenIntoElement({ captchaContainerElement, elementName: this.#config.responseElementName, token });
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @param {string} token - The solved captcha token
     */
    getSolveCallback(captchaContainerElement, token) {
        const callbackFunctionName = getCallbackFromAttribute({ captchaContainerElement, callbackAttrName: 'data-callback' });

        if (!callbackFunctionName) {
            return null;
        }

        const args = { token };
        const captchaCallback = window[callbackFunctionName](args);

        return stringifyFunction({
            functionBody: captchaCallback,
            functionName: callbackFunctionName,
            args,
        });
    }

    /**
     * @private
     * @param {HTMLElement} captchaContainerElement
     */
    _getCaptchaElement(captchaContainerElement) {
        return getElementWithSrcStart(captchaContainerElement, this.#config.providerUrl);
    }
}
