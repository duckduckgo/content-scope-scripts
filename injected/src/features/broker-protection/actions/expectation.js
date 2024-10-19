import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'
import { execute } from '../execute.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document} root
 * @return {import('../types.js').ActionResponse}
 */
export function expectation (action, userData, root = document) {
    const results = expectMany(action.expectations, root)

    const errors = results.filter(x => x.result === false).map(x => {
        if ('error' in x) return x.error
        return 'unknown error'
    })

    if (errors.length > 0) {
        return new ErrorResponse({ actionID: action.id, message: errors.join(', ') })
    }

    if (action.actions?.length) {
        action.actions.forEach((myAction) => {
            execute(myAction, userData, root)
        })
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
}

/**
 * Return a true/false result for every expectation
 *
 * @param {import("../types").Expectation[]} expectations
 * @param {Document | HTMLElement} root
 * @return {import("../types").BooleanResult[]}
 */
export function expectMany (expectations, root) {
    return expectations.map(expectation => {
        switch (expectation.type) {
        case 'element': return elementExpectation(expectation, root)
        case 'text': return textExpectation(expectation, root)
        case 'url': return urlExpectation(expectation)
        default: {
            return {
                result: false,
                error: `unknown expectation type: ${expectation.type}`
            }
        }
        }
    })
}

/**
 * Verify that an element exists. If the `.parent` property exists,
 * scroll it into view first
 *
 * @param {import("../types").Expectation} expectation
 * @param {Document | HTMLElement} root
 * @return {import("../types").BooleanResult}
 */
export function elementExpectation (expectation, root) {
    if (expectation.parent) {
        const parent = getElement(root, expectation.parent)
        if (!parent) {
            return {
                result: false,
                error: `parent element not found with selector: ${expectation.parent}`
            }
        }
        parent.scrollIntoView()
    }

    const elementExists = getElement(root, expectation.selector) !== null

    if (!elementExists && !expectation.failSilently) {
        return {
            result: false,
            error: `element with selector ${expectation.selector} not found.`
        }
    }
    return { result: true }
}

/**
 * Check that an element includes a given text string
 *
 * @param {import("../types").Expectation} expectation
 * @param {Document | HTMLElement} root
 * @return {import("../types").BooleanResult}
 */
export function textExpectation (expectation, root) {
    // get the target element first
    const elem = getElement(root, expectation.selector)
    if (!elem && !expectation.failSilently) {
        return {
            result: false,
            error: `element with selector ${expectation.selector} not found.`
        }
    }

    // todo: remove once we have stronger types
    if (!expectation.expect) {
        return {
            result: false,
            error: 'missing key: \'expect\''
        }
    }

    // todo: is this too strict a match? we may also want to try innerText
    const textExists = Boolean(elem?.textContent?.includes(expectation.expect))

    if (!textExists && !expectation.failSilently) {
        return {
            result: false,
            error: `expected element with selector ${expectation.selector} to have text: ${expectation.expect}, but it didn't`
        }
    }

    return { result: true }
}

/**
 * Check that the current URL includes a given string
 *
 * @param {import("../types").Expectation} expectation
 * @return {import("../types").BooleanResult}
 */
export function urlExpectation (expectation) {
    const url = window.location.href

    // todo: remove once we have stronger types
    if (!expectation.expect) {
        return {
            result: false,
            error: 'missing key: \'expect\''
        }
    }

    if (!url.includes(expectation.expect) && !expectation.failSilently) {
        return {
            result: false,
            error: `expected URL to include ${expectation.expect}, but it didn't`
        }
    }

    return { result: true }
}
