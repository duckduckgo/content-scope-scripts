import { ErrorResponse, SuccessResponse } from '../types.js';

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document} root
 * @return {Promise<import('../types.js').ActionResponse>}
 */
export async function executeScript(action, userData, root) {
    if (typeof action.script !== 'string' || !action.script.length) {
        return new ErrorResponse({ actionID: action.id, message: 'No script provided to executeScript action' });
    }

    try {
        // eslint-disable-next-line no-new-func -- compiling the configured script body at runtime requires new Function
        const fn = new Function('userProfile', 'root', action.script);
        await fn(userData, root);
        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return new ErrorResponse({ actionID: action.id, message: `executeScript failed: ${message}` });
    }
}
