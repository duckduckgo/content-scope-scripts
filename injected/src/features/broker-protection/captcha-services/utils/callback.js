/**
 * Extracts a site key from a captcha element's HTML attribute.
 *
 * @param {Object} options - The options object
 * @param {HTMLElement | null} options.captchaContainerElement - The DOM element containing the captcha
 * @param {string} options.callbackAttrName - The name of the attribute containing the callback
 * @returns {string | null} The callback extracted from the captcha element's attribute or null if not found
 * @throws {Error}
 */
export function getCallbackFromAttribute({ captchaContainerElement, callbackAttrName }) {
    if (!captchaContainerElement) {
        throw Error('[getCallbackFromAttribute] could not find captcha');
    }

    if (!captchaContainerElement.hasAttribute(callbackAttrName)) {
        throw Error('[getCallbackFromAttribute] missing callback attribute');
    }

    return captchaContainerElement.getAttribute(callbackAttrName);
}