/**
 * Extracts a callback function name from a captcha container element's attributes.
 *
 * @param {Object} options - The options object
 * @param {HTMLElement | null} options.captchaContainerElement - The DOM element containing the captcha
 * @param {string} options.callbackAttrName - The name of the attribute containing the callback function name
 * @returns {string} The callback function name extracted from the captcha element's attributes
 */
export function getCallbackFromAttribute({ captchaContainerElement, callbackAttrName }) {
    if (!captchaContainerElement) {
        throw Error('[getCallbackFromAttribute] could not find captcha');
    }

    const callbackFunctionName = captchaContainerElement.getAttribute(callbackAttrName);
    if (!callbackFunctionName) {
        throw Error(`[getCallbackFromAttribute] missing ${callbackAttrName} attribute`);
    }

    return callbackFunctionName;
}
