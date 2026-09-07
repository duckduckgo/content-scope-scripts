import { ErrorResponse, SuccessResponse } from '../types.js';

/**
 * Runs a configured function body once. Native owns the action timeout and
 * failSilently handling; every failure must be reported for native telemetry.
 *
 * @param {import('../types.js').PirAction} action
 * @param {import('../types.js').ProfileData | null} userProfile
 * @param {Document} root
 * @return {Promise<import('../types.js').ActionResponse>}
 */
export async function executeScript(action, userProfile, root) {
    if (typeof action.script !== 'string' || !action.script.trim()) {
        return new ErrorResponse({
            actionID: action.id,
            message: 'executeScript failed: Error: No script provided to executeScript action',
        });
    }

    try {
        // eslint-disable-next-line no-new-func -- compiling the configured script body at runtime requires new Function
        const fn = new Function('userProfile', 'root', action.script);
        // Only returned promises delay completion. Returned values never reach native.
        await fn(userProfile, root);
        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
    } catch (e) {
        return new ErrorResponse({ actionID: action.id, message: formatScriptError(e) });
    }
}

/**
 * Native forwards this message to an error pixel. Omit stacks and strip control
 * characters (including Unicode line separators) before limiting the whole message.
 * @param {unknown} error
 * @returns {string}
 */
function formatScriptError(error) {
    let name = 'Error';
    let message = 'Unknown error';
    try {
        // Also handles errors from another realm, such as an iframe on the page.
        if (error !== null && typeof error === 'object' && 'message' in error) {
            const errorName = 'name' in error ? error.name : undefined;
            if (typeof errorName === 'string' && errorName) name = errorName;
            message = String(error.message);
        } else {
            message = String(error);
        }
    } catch {
        // Scripts may throw objects whose getters or string conversion also throw.
        // Keep a bounded error response even when those objects cannot be inspected.
    }
    // eslint-disable-next-line no-control-regex -- remove control characters from native telemetry
    return `executeScript failed: ${name}: ${message}`.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').slice(0, 500);
}
