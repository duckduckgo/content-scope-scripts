import { PirError, PirSuccess } from '../../types';
import { safeCallWithError } from '../../utils/safe-call';
import { getElementByTagName } from '../../utils/utils';

/**
 * Inject a token into a named element
 * @import { PirResponse } from '../../types';
 * @param {object} params
 * @param {HTMLElement} [params.captchaContainerElement]  - The element containing the captcha
 * @param {HTMLElement} [params.captchaInputElement]  - The element containing the captcha (optional)
 * @param {string} [params.elementName] - Name attribute of the element to inject into (optional)
 * @param {string} params.token - The token to inject
 * @returns {PirResponse<{ injected: boolean }>} - Whether the token was injected
 */
export function injectTokenIntoElement({ captchaContainerElement, captchaInputElement, elementName, token }) {
    let element;

    if (captchaInputElement) {
        element = captchaInputElement;
    } else if (elementName) {
        element = getElementByTagName(captchaContainerElement, elementName);
    } else {
        return PirError.create(`[injectTokenIntoElement] must pass in either captcha input element or element name`);
    }

    if (!element) {
        return PirError.create(`[injectTokenIntoElement] could not find element to inject token into`);
    }

    return safeCallWithError(
        () => {
            if ('value' in element) { element.value = token; }
            element.innerHTML = token;

            return PirSuccess.create({ injected: true });
        },
        { errorMessage: `[injectTokenIntoElement] error injecting token into element` },
    );
}
