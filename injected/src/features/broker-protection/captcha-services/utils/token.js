import { safeCall } from '../../utils/safe-call';
import { getElementByName } from '../../utils/utils';

/**
 * Inject a token into a named element
 * @param {object} params
 * @param {Document} params.root - The document root
 * @param {string} params.elementName - Name attribute of the element to inject into
 * @param {string} params.token - The token to inject
 * @returns {boolean} - Whether the injection was successful
 */
export const injectTokenIntoElement = ({ root, elementName, token }) => {
    const element = getElementByName(root, elementName);
    if (!element) {
        return false;
    }

    return (
        safeCall(
            () => {
                element.innerHTML = token;
                return true;
            },
            { errorMessage: `[injectTokenIntoElement] error injecting token into element ${elementName}` },
        ) ?? false
    );
};
