import { SuccessResponse, ErrorResponse, getElement } from './actions.js'

/**
 * @param action
 * @return {Promise<SuccessResponse | ErrorResponse>}
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
            return !!elem?.textContent?.includes(expectation.expect)
        } else if (expectation.type === 'url') {
            const url = window.location.href
            return url.includes(expectation.expect)
        }

        return false
    })

    if (!allExpectationsMatch) {
        return Promise.resolve(new ErrorResponse({ actionID: action.id, message: 'Expectation not found.' }))
    } else {
        return Promise.resolve(new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null }))
    }
}
