import { getElement } from '../utils/utils.js';
import { PirError } from '../types';

/**
 *
 * @param {Document | HTMLElement} root
 * @param {string} [selector]
 * @returns {HTMLElement | PirError}
 */
export function getCaptchaContainer(root, selector) {
    if (!selector) {
        return PirError.create('missing selector');
    }

    const captchaContainer = getElement(root, selector);
    if (!captchaContainer) {
        return PirError.create(`could not find captcha container with selector ${selector}`);
    }

    return captchaContainer;
}
