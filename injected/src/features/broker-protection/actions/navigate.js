import { getSupportingCodeToInject } from '../captcha-services/captcha.service';
import { ErrorResponse, SuccessResponse } from '../types';
import { buildUrl } from './build-url';

/**
 * @typedef {import('../types.js').NavigateAction} NavigateAction
 * @typedef {import('../types.js').ActionResponse} ActionResponse
 */

/**
 * This builds the proper URL given the URL template and userData.
 * Also, if the action requires a captcha handler, it will inject the necessary code.
 *
 * @param {NavigateAction} action
 * @param {Record<string, any>} userData
 * @return {ActionResponse}
 */
export function navigate(action, userData) {
    const { id: actionID, actionType } = action;
    const urlResult = buildUrl(action, userData);
    if (urlResult instanceof ErrorResponse) {
        return urlResult;
    }

    const codeToInjectResponse = getSupportingCodeToInject(action);
    if (codeToInjectResponse instanceof ErrorResponse) {
        return codeToInjectResponse;
    }

    const response = {
        ...urlResult.success.response,
        ...codeToInjectResponse.success.response,
    };

    return new SuccessResponse({ actionID, actionType, response });
}
