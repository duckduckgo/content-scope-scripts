import { PirError } from '../../types';
//import { svgToBase64Jpg } from './utils/image';

/**
 * @import { CaptchaProvider } from './provider.interface';
 * @implements {CaptchaProvider}
 */
export class ImageProvider {
    getType() {
        return 'image';
    }

    /**
     * @param {HTMLElement} _captchaImageElement - The captcha image element
     */
    isSupportedForElement(_captchaImageElement) {
        // Ensure that the captcha container is an image of either png, jpg, or svg type
        return true;
    }

    /**
     * @param {HTMLElement} _captchaImageElement - The captcha image element
     */
    async getCaptchaIdentifier(_captchaImageElement) {
        // check the file type of the image, if it's already PNG / JPG then we can just get the base64. If SVG we'll need to convert.
        return null;
    }

    getSupportingCodeToInject() {
        return null;
    }

    /**
     * @param {HTMLElement} _captchaInputElement - The captcha input element
     */
    canSolve(_captchaInputElement) {
        // Ensure that the element passed is an input
        return false;
    }

    /**
     * @param {HTMLElement} _captchaInputElement - The captcha input element
     * @param {string} _token - The solved captcha token
     */
    injectToken(_captchaInputElement, _token) {
        if (!_captchaInputElement) {
            return PirError.create('No captcha input element found');
        }

        if (_captchaInputElement instanceof HTMLInputElement) {
            _captchaInputElement.value = _token;
            // Put the solution into the element
            return PirError.create('Provided element is not an input element');
        } else {
            return PirError.create('Provided element is not an input element');
        }
    }

    /**
     * @param {HTMLElement} _captchaInputElement - The element containing the captcha
     * @param {string} _token - The solved captcha token
     */
    getSolveCallback(_captchaInputElement, _token) {
        // No callback needed here
        return null;
    }
}
