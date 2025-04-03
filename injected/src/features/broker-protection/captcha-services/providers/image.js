import { PirError } from '../../types';
import { svgToBase64Jpg, imageToBase64 } from '../utils/image';
import { injectTokenIntoElement } from '../utils/token';
import { isElementType } from '../utils/element';
import { stringifyFunction } from '../utils/stringify-function';

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @implements {CaptchaProvider}
 */
export class ImageProvider {
    getType() {
        return 'image';
    }

    /**
     * @param {HTMLElement} captchaImageElement - The captcha image element
     */
    isSupportedForElement(captchaImageElement) {
        if (!captchaImageElement) {
            return false;
        }

        return isElementType(captchaImageElement, ['img', 'svg']);
    }

    /**
     * @param {HTMLElement} captchaImageElement - The captcha image element
     */
    async getCaptchaIdentifier(captchaImageElement) {
        if (captchaImageElement.tagName.toLocaleLowerCase() === 'svg') {
            const base64Image = await svgToBase64Jpg(captchaImageElement);
            return base64Image;
        }

        if (captchaImageElement.tagName.toLocaleLowerCase() === 'img') {
            const base64Image = imageToBase64(captchaImageElement);
            return base64Image;
        }

        return PirError.create('[ImageProvider.getCaptchaIdentifier] could not extract Base64 from image');
    }

    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {HTMLElement} captchaInputElement - The captcha input element
     */
    canSolve(captchaInputElement) {
        return isElementType(captchaInputElement, ['input', 'textarea']);
    }

    /**
     * @param {HTMLInputElement} captchaInputElement - The captcha input element
     * @param {string} token - The solved captcha token
     */
    injectToken(captchaInputElement, token) {
        return injectTokenIntoElement({ captchaInputElement, token });
    }

    /**
     * @param {HTMLElement} _captchaInputElement - The element containing the captcha
     * @param {string} _token - The solved captcha token
     */
    getSolveCallback(_captchaInputElement, _token) {
        return stringifyFunction({
            functionBody: function callbackNoop() {},
            functionName: 'callbackNoop',
            args: {},
        });
    }
}
