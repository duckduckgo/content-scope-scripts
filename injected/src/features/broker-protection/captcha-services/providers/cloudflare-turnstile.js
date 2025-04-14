import { PirError } from '../../types';

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @implements {CaptchaProvider}
 */
export class CloudFlareTurnstileProvider {
    getType() {
        return 'cloudflareTurnstile';
    }

    /**
     * @param {HTMLElement} _captchaContainerElement
     */
    isSupportedForElement(_captchaContainerElement) {
        // TODO: Implement
        return false;
    }

    /**
     * @param {HTMLElement} _captchaContainerElement - The element containing the captcha
     */
    getCaptchaIdentifier(_captchaContainerElement) {
        // TODO: Implement
        return Promise.resolve(null);
    }

    getSupportingCodeToInject() {
        // TODO: Implement
        return null;
    }

    /**
     * @param {HTMLElement} _captchaContainerElement - The element containing the captcha
     */
    canSolve(_captchaContainerElement) {
        // TODO: Implement
        return false;
    }

    /**
     * @param {HTMLElement} _captchaContainerElement - The element containing the captcha
     * @param {string} _token - The solved captcha token
     */
    injectToken(_captchaContainerElement, _token) {
        // TODO: Implement
        return PirError.create('Not implemented');
    }

    /**
     * @param {HTMLElement} _captchaContainerElement - The element containing the captcha
     * @param {string} _token - The solved captcha token
     */
    getSolveCallback(_captchaContainerElement, _token) {
        return null;
    }
}
