import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'

/**
 * @param action // TODO: get type based on actionType
 * @return {import('../types.js').ActionResponse}
 */
export function click (action) {
    // there can be multiple elements provided by the action
    for (const element of action.elements) {
        const elem = getElement(document, element.selector)
        if (!elem) {
            return new ErrorResponse({ actionID: action.id, message: `could not find element to click with selector '${element.selector}'!` })
        }
        elem.click()
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
}
