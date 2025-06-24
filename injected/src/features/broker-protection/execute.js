import { navigate, extract, click, expectation, fillForm, getCaptchaInfo, solveCaptcha } from './actions/actions';
import { ErrorResponse } from './types';

/**
 * @param {import('./types.js').PirAction} action
 * @param {Record<string, any>} inputData
 * @param {Document} [root] - optional root element
 * @return {Promise<import('./types.js').ActionResponse>}
 */
export async function execute(action, inputData, root = document) {
    let result;

    try {
        switch (action.actionType) {
            case 'navigate':
                result = navigate(action, data(action, inputData, 'userProfile'));
                break;
            case 'extract':
                result = await extract(action, data(action, inputData, 'userProfile'), root);
                break;
            case 'click':
                result = click(action, data(action, inputData, 'userProfile'), root);
                break;
            case 'expectation':
                result = expectation(action, root);
                break;
            case 'fillForm':
                result = fillForm(action, data(action, inputData, 'extractedProfile'), root);
                break;
            case 'getCaptchaInfo':
                result = await getCaptchaInfo(action, root);
                break;
            case 'solveCaptcha':
                result = solveCaptcha(action, data(action, inputData, 'token'), root);
                break;
            default: {
                result = new ErrorResponse({
                    actionID: action.id,
                    message: `unimplemented actionType: ${action.actionType}`,
                });
            }
        }
    } catch (e) {
        console.log('unhandled exception: ', e);
        result = new ErrorResponse({
            actionID: action.id,
            message: `unhandled exception: ${e.message}`,
        });
    }

    // Handle universal wait attribute
    if (action.wait?.ms && typeof action.wait?.ms === 'number') {
        await new Promise(resolve => setTimeout(resolve, action.wait?.ms));
    }

    return result;
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
