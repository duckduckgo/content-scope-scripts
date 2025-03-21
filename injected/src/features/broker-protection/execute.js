import { resolveActionHandlers } from './actions/actions';
import { ErrorResponse } from './types';

/**
 * @param {import('./types.js').PirAction} action
 * @param {Record<string, any>} inputData
 * @param {Document} [root] - optional root element
 * @param {Object} [options] - optional options
 * @param {boolean} [options.useEnhancedCaptchaSystem] - optional flag to use new action handlers
 * @return {Promise<import('./types.js').ActionResponse>}
 */
export async function execute(action, inputData, root = document, options = {}) {
    try {
        const { useEnhancedCaptchaSystem = false } = options;
        const { navigate, extract, click, expectation, fillForm, getCaptchaInfo, solveCaptcha } = resolveActionHandlers({
            useEnhancedCaptchaSystem,
        });

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
                return getCaptchaInfo(action, root);
            case 'solveCaptcha':
                return solveCaptcha(action, data(action, inputData, 'token'), root);
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
