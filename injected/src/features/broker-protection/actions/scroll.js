import { ErrorResponse, SuccessResponse } from '../types';
import { getElement } from '../utils/utils';

/**
 * @param {Record<string, any>} action
 * @param {Document} root
 * @return {import('../types.js').ActionResponse}
 */
// eslint-disable-next-line no-redeclare
export function scroll(action, root = document) {
    const element = getElement(root, action.selector);
    if (!element) return new ErrorResponse({ actionID: action.id, message: 'missing element' });
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
}
