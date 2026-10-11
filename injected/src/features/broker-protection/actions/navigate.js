import { getSupportingCodeToInject } from '../captcha-services/captcha.service.js';
import { ErrorResponse, SuccessResponse } from '../types.js';
import { buildUrl } from './build-url.js';
import { resolveUrlFromDataSource } from './resolve-url-from-data-source.js';

/**
 * This builds the proper URL given the URL template and userData.
 * Also, if the action requires a captcha handler, it will inject the necessary code.
 *
 * @param {import('../types.js').PirAction} action
 * @param {Record<string, any>} userData
 * @return {import('../types.js').ActionResponse}
 */
export function navigate(action, userData) {
    const { id: actionID, actionType } = action;
    const urlResult = resolveUrlFromDataSource(action, userData) ?? buildUrl(action, userData);
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
