import { PirError, PirSuccess } from '../../types';
import { safeCallWithError } from '../../utils/safe-call';
import { getElementByTagName } from '../../utils/utils';

/**
 * Inject a token into a named element
 * @import { PirResponse } from '../../types';
 * @param {object} params
 * @param {HTMLElement} params.captchaContainerElement  - The element containing the captcha
 * @param {string} params.elementName - Name attribute of the element to inject into
 * @param {string} params.token - The token to inject
 * @returns {PirResponse<{ injected: boolean }>} - Whether the token was injected
 */
export function injectTokenIntoElement({ captchaContainerElement, elementName, token }) {
    const element = getElementByTagName(captchaContainerElement, elementName);
    if (!element) {
        return PirError.create(`[injectTokenIntoElement] could not find element with name ${elementName}`);
    }

    return safeCallWithError(
        () => {
            element.innerHTML = token;
            return PirSuccess.create({ injected: true });
        },
        { errorMessage: `[injectTokenIntoElement] error injecting token into element ${elementName}` },
    );
}
