import { getElement } from '../utils/utils.js';
import { removeUrlQueryParams } from '../utils/url.js';
import { ErrorResponse, SuccessResponse } from '../types';
import { getCaptchaProvider, getCaptchaSolveProvider } from './get-captcha-provider';
import { captchaFactory } from './providers/registry.js';

/**
 * Returns the supporting code to inject for the given captcha type
 *
 * @param {import('../types.js').PirAction['captchaType']} captchaType
 * @return string
 * @throws {Error}
 */
export const getSupportingCodeToInject = (captchaType) => {
    const captchaProvider = captchaFactory.getProviderByType(captchaType);
    if (!captchaProvider) {
        throw new Error(`[injectCaptchaHandler] could not find captchaProvider with type ${captchaType}`);
    }

    return captchaProvider.getSupportingCodeToInject();
};

/**
 * Gets the captcha information to send to the backend
 *
 * @param {import('../types.js').PirAction} action
 * @param {Document | HTMLElement} root
 * @return {import('../types.js').ActionResponse}
 */
export const getCaptchaInfo = (action, root = document) => {
    const { id: actionID, selector, actionType, captchaType } = action;
    try {
        if (!selector) {
            throw new Error('missing selector');
        }

        const captchaContainer = getElement(root, selector);
        if (!captchaContainer) {
            throw new Error(`could not find captchaContainer with selector ${selector}`);
        }

        const captchaProvider = getCaptchaProvider(captchaContainer, captchaType);
        const captchaIdentifier = captchaProvider.getCaptchaIdentifier(captchaContainer);
        if (!captchaIdentifier) {
            throw new Error(`could not extract captcha identifier from ${captchaType} captcha`);
        }

        const response = {
            url: removeUrlQueryParams(window.location.href), // query params (which may include PII)
            siteKey: captchaIdentifier,
            type: captchaProvider.getType(),
        };
        return new SuccessResponse({ actionID, actionType, response });
    } catch (e) {
        return new ErrorResponse({ actionID, message: `[getCaptchaInfo] ${e.message}` });
    }
};

/**
 * Takes the solved captcha token and injects it into the page to solve the captcha
 *
 * @param {import('../types.js').PirAction} action
 * @param {string} token
 * @param {Document} root
 * @return {import('../types.js').ActionResponse}
 */
export const solveCaptcha = (action, token, root = document) => {
    const { id: actionID, actionType, captchaType } = action;
    try {
        if (!captchaType) {
            throw new Error('missing captchaType');
        }

        const captchaSolveProvider = getCaptchaSolveProvider(root, captchaType);
        if (!captchaSolveProvider.canSolve(root)) {
            throw new Error(`[solveCaptcha] cannot solve captcha with type ${captchaType}`);
        }

        captchaSolveProvider.injectToken(root, token);
        return new SuccessResponse({
            actionID,
            actionType,
            response: { callback: { eval: captchaSolveProvider.getSolveCallback(token) } },
        });
    } catch (e) {
        return new ErrorResponse({ actionID, message: `[solveCaptcha] ${e.message}` });
    }
};
