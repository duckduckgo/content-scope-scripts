import { transformUrl } from './build-url-transforms.js';
import { ErrorResponse, SuccessResponse } from '../types.js';

/**
 * This builds the proper URL given the URL template and userData.
 *
 * @param {Record<string, any> & {id: string, actionType: string}} action
 * @param {Record<string, any>} userData
 * @return {import('../types.js').ActionResponse}
 */
export function buildUrl(action, userData) {
    const result = replaceTemplatedUrl(action, userData);
    if ('error' in result) {
        return new ErrorResponse({ actionID: action.id, message: result.error });
    }

    return new SuccessResponse({ actionID: action.id, actionType: /** @type {import('../types.js').PirAction['actionType']} */ (action.actionType), response: { url: result.url } });
}

/**
 * Perform some basic validations before we continue into the templating.
 *
 * @param {any} action
 * @param {any} userData
 * @return {{url: string} | {error: string}}
 */
export function replaceTemplatedUrl(action, userData) {
    const url = action?.url;
    if (!url) {
        return { error: 'Error: No url provided.' };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = new URL(url);
    } catch (e) {
        return { error: 'Error: Invalid URL provided.' };
    }

    if (!userData) {
        return { url };
    }

    return transformUrl(/** @type {import('./build-url-transforms.js').BuildUrlAction} */ (action), userData);
}
