import { CaptchaProvider } from './provider.interface';
import { getElementByName, getElementWithSrcStart } from '../../utils/utils';
import { getSiteKeyFromSearchParam } from '../utils/sitekey';
import { stringifyFunction } from '../utils/stringify-function';
import { injectTokenIntoElement } from '../utils/token';
// TODO move on the same folder level once we deprecate the existing captcha scripts
import { captchaCallback } from '../../actions/captcha-callback';

export class ReCaptchaV2Provider extends CaptchaProvider {
    getType() {
        return 'recaptcha2';
    }

    /**
     * @protected
     */
    getCaptchaProviderUrl() {
        return 'https://www.google.com/recaptcha/api2';
    }

    /**
     * @protected
     */
    getCaptchaResponseElementName() {
        return 'g-recaptcha-response';
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
}
