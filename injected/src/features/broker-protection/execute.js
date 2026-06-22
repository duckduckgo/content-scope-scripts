// eslint-disable-next-line no-redeclare
import { navigate, extract, click, scroll, expectation, fillForm, getCaptchaInfo, solveCaptcha, condition } from './actions/actions';
import { ErrorResponse } from './types';

/**
 * @typedef {import('./types.js').PirAction} PirAction
 * @typedef {import('./types.js').ActionResponse} ActionResponse
 * @typedef {import('../../types/broker-protection.js').ActionData} ActionData
 * @typedef {import('../../types/broker-protection.js').UserProfile} UserProfile
 * @typedef {import('../../types/broker-protection.js').ExtractedProfile} ExtractedProfile
 */

/**
 * @param {PirAction} action
 * @param {ActionData} inputData
 * @param {Document} [root] - optional root element
 * @return {Promise<ActionResponse>}
 */
export async function execute(action, inputData, root = document) {
    try {
        switch (action.actionType) {
            case 'navigate': {
                const userProfile = /** @type {UserProfile} */ (data(action, inputData, 'userProfile'));
                return navigate(action, userProfile);
            }
            case 'extract': {
                const userProfile = /** @type {UserProfile} */ (data(action, inputData, 'userProfile'));
                return await extract(action, userProfile, root);
            }
            case 'click': {
                const userProfile = /** @type {UserProfile} */ (data(action, inputData, 'userProfile'));
                return click(action, userProfile, root);
            }
            case 'expectation':
                return expectation(action, root);
            case 'fillForm': {
                const extractedProfile = /** @type {ExtractedProfile} */ (data(action, inputData, 'extractedProfile'));
                return fillForm(action, extractedProfile, root);
            }
            case 'getCaptchaInfo':
                return await getCaptchaInfo(action, root);
            case 'solveCaptcha': {
                const token = /** @type {string} */ (data(action, inputData, 'token'));
                return solveCaptcha(action, token, root);
            }
            case 'condition':
                return condition(action, root);
            case 'scroll':
                return scroll(action, root);
            default: {
                // exhaustive switch ⇒ `action` is `never` here; cast to report an unimplemented actionType
                const unknownAction = /** @type {{ id: string; actionType: string }} */ (action);
                return new ErrorResponse({
                    actionID: unknownAction.id,
                    message: `unimplemented actionType: ${unknownAction.actionType}`,
                });
            }
        }
    } catch (e) {
        console.log('unhandled exception: ', e);
        return new ErrorResponse({
            actionID: action.id,
            message: `unhandled exception: ${e.message}`,
        });
    }
}

/**
 * @param {{dataSource?: string}} action
 * @param {ActionData} data
 * @param {string} defaultSource
 * @return {ActionData[keyof ActionData]} the selected bundle value, looked up by the dynamic `dataSource` key (or null when absent). `valueof ActionData` is `unknown` because the bundle allows extra keys, so each call site asserts the concrete bundle it expects.
 */
function data(action, data, defaultSource) {
    if (!data) return null;
    const source = action.dataSource || defaultSource;
    if (Object.prototype.hasOwnProperty.call(data, source)) {
        return data[source];
    }
    return null;
}
