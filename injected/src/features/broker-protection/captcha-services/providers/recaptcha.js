import { getElementByTagName, getElementWithSrcStart } from '../../utils/utils';
import { getSiteKeyFromSearchParam } from '../utils/sitekey';
import { stringifyFunction } from '../utils/stringify-function';
import { injectTokenIntoElement } from '../utils/token';
// TODO move on the same folder level once we deprecate the existing captcha scripts
import { captchaCallback } from '../../actions/captcha-callback';
import { safeCallWithError } from '../../utils/safe-call';
import { PirError } from '../../types.js';

// define the config below to reuse it in the class
/**
 * @typedef {Object} ReCaptchaProviderConfig
 * @property {string} type - The captcha type
 * @property {string} providerUrl - The captcha provider URL
 * @property {string} responseElementName - The name of the captcha response element
 */

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @implements {CaptchaProvider}
 */
export class ReCaptchaProvider {
    /**
     * @type {ReCaptchaProviderConfig}
     */
    #config;

    /**
     * @param {ReCaptchaProviderConfig} config
     */
    constructor(config) {
        this.#config = config;
    }

    getType() {
        return this.#config.type;
    }

    /**
     * @param {Document | HTMLElement} _root
     * @param {HTMLElement} captchaContainerElement
     */
    isSupportedForElement(_root, captchaContainerElement) {
        return !!this._getCaptchaElement(captchaContainerElement);
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     */
    getCaptchaIdentifier(captchaContainerElement) {
        return Promise.resolve(
            safeCallWithError(
                () => getSiteKeyFromSearchParam({ captchaElement: this._getCaptchaElement(captchaContainerElement), siteKeyAttrName: 'k' }),
                { errorMessage: '[ReCaptchaProvider.getCaptchaIdentifier] could not extract site key' },
            ),
        );
    }

    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @param {string} token
     */
    getSolveCallback(captchaContainerElement, token) {
        const responseElement = getElementByTagName(captchaContainerElement, this.#config.responseElementName);
        const callbackArgs = createCaptchaCallbackArgs(responseElement, this.#config.responseElementName, token);
        if (PirError.isError(callbackArgs)) {
            return callbackArgs;
        }

        return stringifyFunction({
            functionBody: captchaCallback,
            functionName: 'captchaCallback',
            args: callbackArgs,
        });
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     */
    canSolve(captchaContainerElement) {
        return !!getElementByTagName(captchaContainerElement, this.#config.responseElementName);
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     * @param {string} token
     */
    injectToken(captchaContainerElement, token) {
        return injectTokenIntoElement({ captchaContainerElement, elementName: this.#config.responseElementName, token });
    }

    /**
     * @private
     * @param {HTMLElement} captchaContainerElement
     */
    _getCaptchaElement(captchaContainerElement) {
        return getElementWithSrcStart(captchaContainerElement, this.#config.providerUrl);
    }
}

/**
 * @param {HTMLElement | null} responseElement
 * @param {string} responseElementName
 * @param {string} token
 */
function createCaptchaCallbackArgs(responseElement, responseElementName, token) {
    if (!responseElement) {
        return PirError.create('could not find the reCAPTCHA response element for the matched record');
    }

    if (responseElement.id === responseElementName) {
        return { token, widgetId: 0 };
    }

    const prefix = `${responseElementName}-`;
    if (!responseElement.id.startsWith(prefix)) {
        return PirError.create('could not resolve a unique reCAPTCHA widget for the matched record');
    }

    const widgetId = responseElement.id.slice(prefix.length);
    if (!/^\d+$/.test(widgetId)) {
        return PirError.create('could not resolve a unique reCAPTCHA widget for the matched record');
    }

    return { token, widgetId: Number(widgetId) };
}
