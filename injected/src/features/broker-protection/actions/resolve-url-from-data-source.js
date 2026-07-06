import { ErrorResponse, SuccessResponse } from '../types.js';

/**
 * @param {string} value
 * @return {boolean}
 */
const isValidUrl = (value) => {
    try {
        new URL(value);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * @param {import('../types.js').PirAction} action
 * @param {Record<string, any> | null} userData
 * @return {import('../types.js').ActionResponse | null}
 */
export const resolveUrlFromDataSource = (action, userData) => {
    if (!action.dataSource || !action.url || isValidUrl(action.url)) {
        return null;
    }

    const { id: actionID, actionType } = action;
    const value = userData?.[action.url];

    if (typeof value !== 'string' || !isValidUrl(value)) {
        return new ErrorResponse({ actionID, message: `'${action.url}' did not resolve to a valid URL from '${action.dataSource}'` });
    }

    return new SuccessResponse({ actionID, actionType, response: { url: value } });
};
