import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'

/**
 * @param action
 * @return {import('../types.js').ActionResponse}
 */
export function expectation (action) {
    const expectations = action.expectations

    const allExpectationsMatch = expectations.every(expectation => {
        if (expectation.type === 'text') {
            // get the target element text
            let elem
            try {
                elem = getElement(document, expectation.selector)
            } catch {
                elem = null
            }
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
