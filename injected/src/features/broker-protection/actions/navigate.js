import { getSupportingCodeToInject } from '../captcha-services/captcha.service';
import { ErrorResponse, SuccessResponse } from '../types';
import { buildUrl } from './build-url';

/**
 * This builds the proper URL given the URL template and userData.
 * Also, if the action requires a captcha handler, it will inject the necessary code.
 *
 * @param {import('../types.js').PirAction} action
 * @param {Record<string, any>} userData
 * @return {import('../types.js').ActionResponse}
 */
export const navigate = (action, userData) => {
    const { id: actionID, actionType, injectCaptchaHandler } = action;
    try {
        const urlResult = buildUrl(action, userData);
        if (urlResult instanceof ErrorResponse) {
            return urlResult;
        }

        const codeToInject = injectCaptchaHandler ? getSupportingCodeToInject(injectCaptchaHandler) : null;
        const response = {
            ...urlResult.success.response,
            ...(codeToInject && { code: codeToInject }),
        };

        return new SuccessResponse({ actionID, actionType, response });
    } catch (e) {
        return new ErrorResponse({ actionID, message: `[navigate] ${e.message}` });
    }
};
