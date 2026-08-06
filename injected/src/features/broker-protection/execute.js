// eslint-disable-next-line no-redeclare
import { navigate, extract, click, scroll, expectation, fillForm, getCaptchaInfo, solveCaptcha, condition } from './actions/actions';
import { ErrorResponse } from './types';

/**
 * @param {import('./types.js').PirAction} action
 * @param {Record<string, any>} inputData
 * @param {Document} [root] - optional root element
 * @return {Promise<import('./types.js').ActionResponse>}
 */
export async function execute(action, inputData, root = document) {
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
            case 'fillForm':
                return fillForm(action, data(action, inputData, 'extractedProfile'), root);
            case 'getCaptchaInfo':
                return await getCaptchaInfo(action, data(action, inputData, 'userProfile'), root);
            case 'solveCaptcha':
                // the token is read via the action's dataSource (defaulting to 'token'), while the
                // user profile — used for `parent.profileMatch` targeting — always comes from 'userProfile'
                return solveCaptcha(action, data(action, inputData, 'token'), inputData?.userProfile ?? null, root);
            case 'condition':
                return condition(action, root);
            case 'scroll':
                return scroll(action, root);
            default: {
                return new ErrorResponse({
                    actionID: action.id,
                    message: `unimplemented actionType: ${action.actionType}`,
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
