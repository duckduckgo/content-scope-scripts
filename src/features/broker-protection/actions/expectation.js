import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'

/**
 * @param {Record<string, any>} action
 * @param {Document | HTMLElement} root
 * @return {import('../types.js').ActionResponse}
 */
export function expectation (action, root = document) {
    const expectations = action.expectations

    const allExpectationsMatch = expectations.every(expectation => {
        if (expectation.type === 'element-exists') {
            return getElement(root, expectation.selector) !== null
        }
        if (expectation.type === 'text') {
            // get the target element text
            const elem = getElement(root, expectation.selector)
            return Boolean(elem?.textContent?.includes(expectation.expect))
        } else if (expectation.type === 'url') {
            const url = window.location.href
            return url.includes(expectation.expect)
        }

        return false
    })

    if (!allExpectationsMatch) {
        return new ErrorResponse({ actionID: action.id, message: 'Expectation not found.' })
    } else {
        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
    }
}
