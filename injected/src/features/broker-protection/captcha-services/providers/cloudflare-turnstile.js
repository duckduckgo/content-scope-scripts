import { CaptchaProvider } from './provider.interface';

export class CloudFlareTurnstileProvider extends CaptchaProvider {
    getType() {
        return 'cloudflareTurnstile';
    }

    /**
     * @param {HTMLElement} captchaContainerElement
     */
    isSupportedForElement(captchaContainerElement) {
        // TODO: Implement
        return false;
    }

    /**
     * @param {HTMLElement} captchaContainerElement - The element containing the captcha
     */
    getCaptchaIdentifier(captchaContainerElement) {
        // TODO: Implement
        return null;
    }

    getSupportingCodeToInject() {
        // TODO: Implement
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
        return false;
    }

    /**
     * @param {string} token - The solved captcha token
     */
    getSolveCallback(token) {
        return null;
    }
}
