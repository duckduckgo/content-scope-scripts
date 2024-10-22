import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'
import { execute } from '../execute.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document} root
 * @return {Promise<import('../types.js').ActionResponse>}
 */
export async function expectation (action, userData, root = document) {
    const results = expectMany(action.expectations, root)

    // filter out good results + silent failures, leaving only fatal errors
    const errors = results
        .filter((x, index) => {
            if (x.result === true) return false
            if (action.expectations[index].failSilently) return false
            return true
        }).map((x) => {
            return 'error' in x ? x.error : 'unknown error'
        })

    if (errors.length > 0) {
        return new ErrorResponse({ actionID: action.id, message: 'bees ' + errors.join(', ') + ' error length ' + errors.length })
    }

    // only run later actions if every expectation was met
    const runActions = results.every(x => x.result === true)
    const secondaryErrors = []

    if (action.actions?.length && runActions) {
        for (const subAction of action.actions) {
            const result = await execute(subAction, userData, root)

            if ('error' in result) {
                secondaryErrors.push(result.error)
            }
        }

        if (secondaryErrors.length > 0) {
            return new ErrorResponse({ actionID: action.id, message: secondaryErrors.join(', ') })
        }
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

    if (!elementExists) {
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
    if (!elem) {
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

    if (!textExists) {
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

    if (!url.includes(expectation.expect)) {
        return {
            result: false,
            error: `expected URL to include ${expectation.expect}, but it didn't`
        }
    }

    return { result: true }
}
