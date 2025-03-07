import { getElementByName, getElementWithSrcStart } from '../../utils';
import { injectTokenIntoElement, getSiteKeyFromSearchParam, stringifyFunction } from '../utils';
// TODO move on the same folder level once we deprecate the existing captcha scripts
import { captchaCallback } from '../../actions/captcha-callback';

/**
 * @import {CaptchaProvider} from './provider.interface'
 * @implements {CaptchaProvider}
 */
export class ReCaptchaV2Provider {
    /**
     * @param {object} params
     * @param {string} [params.type]
     * @param {string} [params.providerUrl]
     * @param {string} [params.responseElementName]
     */
    constructor({
        type = 'recaptcha2',
        providerUrl = 'https://www.google.com/recaptcha/api2',
        responseElementName = 'g-recaptcha-response',
    }) {
        this.type = type;
        this.providerUrl = providerUrl;
        this.responseElementName = responseElementName;
    }

    getType() {
        return this.type;
    }

    /**
     * @protected
     */
    getCaptchaProviderUrl() {
        return this.providerUrl;
    }

    /**
     * @protected
     */
    getCaptchaResponseElementName() {
        return this.responseElementName;
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     */
    isSupportedForElement(captchaContainerElement) {
        return !!this._getCaptchaElement(captchaContainerElement);
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     * @throws {Error}
     */
    getCaptchaIdentifier(captchaContainerElement) {
        return getSiteKeyFromSearchParam({ captchaElement: this._getCaptchaElement(captchaContainerElement), siteKeyAttrName: 'k' });
    }

    /**
     * @param {string} token
     */
    getSolveCallback(token) {
        return stringifyFunction({
            functionBody: captchaCallback,
            functionName: 'captchaCallback',
            args: { token },
        });
    }

    /**
     * @param {Document} root
     */
    canSolve(root) {
        return !!getElementByName(root, this.getCaptchaResponseElementName());
    }

    /**
     * @param {Document} root
     * @param {string} token
     */
    injectToken(root, token) {
        return injectTokenIntoElement({ root, elementName: this.getCaptchaResponseElementName(), token });
    }

    /**
     * @private
     * @param {HTMLElement} captchaContainerElement
     */
    _getCaptchaElement(captchaContainerElement) {
        return getElementWithSrcStart(captchaContainerElement, this.getCaptchaProviderUrl());
    }

    getSupportingCodeToInject() {
        return null;
    }
}
