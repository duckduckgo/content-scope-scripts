import { getElementByTagName, getElementWithSrcStart } from '../../utils/utils';
import { safeCallWithError } from '../../utils/safe-call';
import { getSiteKeyFromAttribute } from '../utils/sitekey';
import { injectTokenIntoElement } from '../utils/token';
import { getCallbackFromAttribute } from '../utils/callback';
import { stringifyFunction } from '../utils/stringify-function';

/**
 * @typedef {Object} CloudFlareTurnstileProviderConfig
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
     * @param {Document | HTMLElement} root
     * @param {HTMLElement} _captchaContainerElement
     * @returns {boolean} Whether the captcha is supported for the element
     */
    isSupportedForElement(root, _captchaContainerElement) {
        // Typically we look at the captcha container for isSupportedElement, but cloudflare puts the iframe into the shadow DOM,
        // so we need to look at the script tags instead
        return !!this._getCaptchaScript(root);
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     */
    getCaptchaIdentifier(captchaContainerElement) {
        return  Promise.resolve(
            safeCallWithError(() => getSiteKeyFromAttribute({ captchaContainerElement, siteKeyAttrName: 'data-sitekey' }), {
                errorMessage: '[CloudFlareTurnstileProvider.getCaptchaIdentifier] could not extract site key',
            })
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
        const hasResponseElement = getElementByTagName(captchaContainerElement, this.#config.responseElementName);

        return !!callbackFunctionName && !!hasResponseElement;
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
        const args = { token, callbackFunctionName };

        return stringifyFunction({
            /**
             * @param {Object} args - The arguments passed to the function
             * @param {string} args.callbackFunctionName - The callback function name
             * @param {string} args.token - The solved captcha token
             */
            functionBody: function callbackFunc(args) {
                window[args.callbackFunctionName](args.token);
            },
            functionName: 'callbackFunc',
            args,
        });
    }

    /**
     * @private
     * @param {Document | HTMLElement} root - The root element to search in
     */
    _getCaptchaScript(root) {
        return getElementWithSrcStart(root, this.#config.providerUrl);
    }
}