import {
    navigate,
    extract,
    click,
    // eslint-disable-next-line no-redeclare
    scroll,
    expectation,
    fillForm,
    getCaptchaInfo,
    solveCaptcha,
    condition,
    executeScript,
    userAssist,
} from './actions/actions';
import { ErrorResponse } from './types';

/**
 * @import { ActionResponse, PirAction, PirInputData, ProfileData, UserAssistAction } from './types.js'
 */

/**
 * @param {PirAction | UserAssistAction} action
 * @param {Record<string, any>} inputData
 * @param {Document} [root] - optional root element
 * @param {(actionID: string) => void} [onHandOff] - needed for `userAssist`
 * @return {Promise<ActionResponse>}
 */
export async function execute(action, inputData, root = document, onHandOff) {
    try {
        switch (action.actionType) {
            case 'navigate':
                return navigate(action, data(action, inputData, 'userProfile'));
            case 'extract':
                return await extract(action, data(action, inputData, 'userProfile'), root);
            case 'click':
                return click(action, data(action, inputData, 'userProfile'), root);
            case 'expectation':
                return expectation(action, root);
            case 'fillForm': {
                const userProfile = inputData?.userProfile ?? null; // Don't use `data()` as it honours `action.dataSource`, which would return the extracted profile.
                return fillForm(action, data(action, inputData, 'extractedProfile'), root, userProfile);
            }
            case 'getCaptchaInfo':
                return await getCaptchaInfo(action, profileForMatching(inputData), root);
            case 'solveCaptcha':
                return solveCaptcha(action, data(action, inputData, 'token'), profileForMatching(inputData), root);
            case 'condition':
                return condition(action, root);
            case 'scroll':
                return scroll(action, root);
            case 'executeScript':
                return await executeScript(action, data(action, inputData, 'userProfile'), root);
            case 'userAssist':
                // Only BrokerProtection is sent userAssist actions, and it always passes a hand-off.
                return await userAssist(action, root, /** @type {(actionID: string) => void} */ (onHandOff));
            default: {
                // Every known type is handled above, but native may send one this build doesn't know.
                const unknown = /** @type {{ id: string, actionType: string }} */ (action);
                return new ErrorResponse({
                    actionID: unknown.id,
                    message: `unimplemented actionType: ${unknown.actionType}`,
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
 * @param {PirInputData} inputData
 * @returns {ProfileData|null}
 */
function profileForMatching(inputData) {
    return inputData?.userProfile ?? inputData?.extractedProfile ?? null;
}

/**
 * @param {{dataSource?: string}} action
 * @param {Record<string, any>} data
 * @param {string} defaultSource
 */
function data(action, data, defaultSource) {
    if (!data) return null;
    const source = action.dataSource || defaultSource;
    if (Object.prototype.hasOwnProperty.call(data, source)) {
        return data[source];
    }
    return null;
}
