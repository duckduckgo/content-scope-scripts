import { getElement } from '../utils/utils.js';
import { removeUrlQueryParams } from '../utils/url.js';
import { ErrorResponse, PirError, SuccessResponse } from '../types';
import { getCaptchaProvider, getCaptchaSolveProvider } from './get-captcha-provider';
import { captchaFactory } from './providers/registry.js';
import { selectRootElement } from '../utils/select-root-element.js';
import { getCaptchaInfo as getCaptchaInfoDeprecated, solveCaptcha as solveCaptchaDeprecated } from '../actions/captcha-deprecated';

/**
 * @import { ActionResponse, PirAction, ProfileData } from '../types.js'
 */

/**
 *
 * @param {Document | HTMLElement} root
 * @param {PirAction['selector']} [selector]
 * @returns {HTMLElement | PirError}
 */
const getCaptchaContainer = (root, selector) => {
    if (!selector) {
        return PirError.create('missing selector');
    }

    const captchaContainer = getElement(root, selector);
    if (!captchaContainer) {
        return PirError.create(`could not find captcha container with selector ${selector}`);
    }

    return captchaContainer;
};

/**
 * @param {PirAction} action
 * @param {ProfileData|null} userData
 * @param {Document | HTMLElement} root
 * @returns {Document | HTMLElement | PirError}
 */
const getCaptchaRoot = (action, userData, root) => {
    return selectRootElement(action, userData ?? {}, root);
};

/**
 * Returns the supporting code to inject for the given captcha type
 *
 * @param {PirAction} action
 * @return {ActionResponse}
 */
export function getSupportingCodeToInject(action) {
    const { id: actionID, actionType, injectCaptchaHandler: captchaType } = action;
    const createError = ErrorResponse.generateErrorResponseFunction({ actionID, context: 'getSupportingCodeToInject' });
    if (!captchaType) {
        // ensures backward compatibility with old actions
        return SuccessResponse.create({ actionID, actionType, response: {} });
    }

    const captchaProvider = captchaFactory.getProviderByType(captchaType);
    if (!captchaProvider) {
        return createError(`could not find captchaProvider with type ${captchaType}`);
    }

    return SuccessResponse.create({ actionID, actionType, response: { code: captchaProvider.getSupportingCodeToInject() } });
}

/**
 * Gets the captcha information to send to the backend
 *
 * @param {PirAction} action
 * @param {ProfileData|null} userData
 * @param {Document} root
 * @return {Promise<ActionResponse>}
 */
export async function getCaptchaInfo(action, userData, root = document) {
    const { id: actionID, actionType, captchaType, selector } = action;
    if (!captchaType) {
        // ensures backward compatibility with old actions
        return getCaptchaInfoDeprecated(action, root);
    }

    const createError = ErrorResponse.generateErrorResponseFunction({ actionID, context: `[getCaptchaInfo] captchaType: ${captchaType}` });
    const captchaRoot = getCaptchaRoot(action, userData, root);
    if (PirError.isError(captchaRoot)) {
        return createError(captchaRoot.error.message);
    }

    const captchaContainer = getCaptchaContainer(captchaRoot, selector);
    if (PirError.isError(captchaContainer)) {
        return createError(captchaContainer.error.message);
    }

    const captchaProvider = getCaptchaProvider(root, captchaContainer, captchaType);
    if (PirError.isError(captchaProvider)) {
        return createError(captchaProvider.error.message);
    }

    const captchaIdentifier = await captchaProvider.getCaptchaIdentifier(captchaContainer);
    if (!captchaIdentifier) {
        return createError(`could not extract captcha identifier from the container with selector ${selector}`);
    }

    if (PirError.isError(captchaIdentifier)) {
        return createError(captchaIdentifier.error.message);
    }

    // Determine the type to report to dbp-api. When the requested captchaType resolved to its
    // provider (including via an alias such as 'red-circle' → ImageProvider), echo the requested
    // type back so aliased captchas are reported under the distinct type the backend expects. If
    // we instead fell back to detection because the requested type didn't match the element, report
    // the detected provider's canonical type.
    const reportedType = captchaFactory.getProviderByType(captchaType) === captchaProvider ? captchaType : captchaProvider.getType();

    const response = {
        url: removeUrlQueryParams(window.location.href), // query params (which may include PII)
        siteKey: captchaIdentifier,
        type: reportedType,
    };

    return SuccessResponse.create({ actionID, actionType, response });
}

/**
 * Takes the solved captcha token and injects it into the page to solve the captcha
 *
 * @param {PirAction} action
 * @param {string} token
 * @param {ProfileData|null} userData
 * @param {Document} root
 * @return {ActionResponse}
 */
export function solveCaptcha(action, token, userData, root = document) {
    const { id: actionID, actionType, captchaType, selector } = action;
    if (!captchaType) {
        // ensures backward compatibility with old actions
        return solveCaptchaDeprecated(action, token, root);
    }

    const createError = ErrorResponse.generateErrorResponseFunction({ actionID, context: `[solveCaptcha] captchaType: ${captchaType}` });
    if (action.parent && !userData) {
        return createError('no profile available to scope the captcha solve');
    }

    const captchaRoot = getCaptchaRoot(action, userData, root);
    if (PirError.isError(captchaRoot)) {
        return createError(captchaRoot.error.message);
    }

    const captchaContainer = getCaptchaContainer(captchaRoot, selector);
    if (PirError.isError(captchaContainer)) {
        return createError(captchaContainer.error.message);
    }

    const captchaSolveProvider = getCaptchaSolveProvider(captchaContainer, captchaType);
    if (PirError.isError(captchaSolveProvider)) {
        return createError(captchaSolveProvider.error.message);
    }

    if (!captchaSolveProvider.canSolve(captchaContainer)) {
        return createError('cannot solve captcha');
    }

    const callback = captchaSolveProvider.getSolveCallback(captchaContainer, token);
    if (PirError.isError(callback)) {
        return createError(callback.error.message);
    }

    const tokenResponse = captchaSolveProvider.injectToken(captchaContainer, token);
    if (PirError.isError(tokenResponse)) {
        return createError(tokenResponse.error.message);
    }

    if (!tokenResponse.response.injected) {
        return createError('could not inject token');
    }

    return SuccessResponse.create({
        actionID,
        actionType,
        response: { callback: { eval: callback } },
    });
}
