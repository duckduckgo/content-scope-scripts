import { getElements } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'
import { extractProfiles } from './extract.js'
import { processTemplateStringWithUserData } from './build-url-transforms.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @return {import('../types.js').ActionResponse}
 */
export function click (action, userData, root = document) {
    /** @type {Array<any> | null} */
    let elements = []

    if (action.choices?.length) {
        elements = evaluateChoices(action, userData)

        // Elements returns null if the default action is defined as such, and we can just move on
        if (elements === null) {
            return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
        }
    } else {
        if (!('elements' in action)) {
            return new ErrorResponse({ actionID: action.id, message: 'No elements provided to click action' })
        }

        elements = action.elements
    }

    if (!elements || !elements.length) {
        return new ErrorResponse({ actionID: action.id, message: 'No elements provided to click action' })
    }

    // there can be multiple elements provided by the action
    for (const element of elements) {
        const rootElement = selectRootElement(element, userData, root)
        const elements = getElements(rootElement, element.selector)

        if (!elements?.length) {
            return new ErrorResponse({ actionID: action.id, message: `could not find element to click with selector '${element.selector}'!` })
        }

        const loopLength = element.multiple && element.multiple === true ? elements.length : 1

        for (let i = 0; i < loopLength; i++) {
            const elem = elements[i]

            if ('disabled' in elem) {
                if (elem.disabled) {
                    return new ErrorResponse({ actionID: action.id, message: `could not click disabled element ${element.selector}'!` })
                }
            }
            if ('click' in elem && typeof elem.click === 'function') {
                elem.click()
            }
        }
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
}

/**
 * @param {{parent?: {profileMatch?: Record<string, any>}}} clickElement
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @return {Node}
 */
function selectRootElement (clickElement, userData, root = document) {
    // if there's no 'parent' field, just use the document
    if (!clickElement.parent) return root

    // if the 'parent' field contains 'profileMatch', try to match it
    if (clickElement.parent.profileMatch) {
        const extraction = extractProfiles(clickElement.parent.profileMatch, userData, root)
        if ('results' in extraction) {
            const sorted = extraction.results
                .filter(x => x.result === true)
                .sort((a, b) => b.score - a.score)
            const first = sorted[0]
            if (first && first.element) {
                return first.element
            }
        }
    }

    throw new Error('`parent` was present on the element, but the configuration is not supported')
}

/**
 * Evaluate a comparator and return the appropriate function
 * @param {string} operator
 * @returns {(a: any, b: any) => boolean}
 */
export function getComparisonFunction (operator) {
    switch (operator) {
    case '=':
    case '==':
    case '===':
        return (a, b) => a === b
    case '!=':
    case '!==':
        return (a, b) => a !== b
    case '<':
        return (a, b) => a < b
    case '<=':
        return (a, b) => a <= b
    case '>':
        return (a, b) => a > b
    case '>=':
        return (a, b) => a >= b
    default:
        throw new Error(`Invalid operator: ${operator}`)
    }
}

/**
 * Evaluates the defined choices (and/or the default) and returns an array of the elements to be clicked
 *
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @returns {[Record<string, any>] | null}
 */
function evaluateChoices (action, userData) {
    if ('elements' in action) {
        throw new ErrorResponse({ actionID: action.id, message: 'Elements should be nested inside of choices' })
    }

    for (const choice of action.choices) {
        if (!('condition' in choice) || !('elements' in choice)) {
            throw new ErrorResponse({ actionID: action.id, message: 'All choices must have a condition and elements' })
        }

        const result = runComparison(choice, action, userData)

        if (result) {
            return choice.elements
        }
    }

    // If there's no default defined, return an error.
    if (!('default' in action)) {
        throw new ErrorResponse({ actionID: action.id, message: 'All conditions failed and no default action was provided' })
    }

    // If there is a default and it's null (meaning skip any further action) return success.
    if (action.default === null) {
        // Nothing else to do, return null
        return null
    }

    // If the default is defined and not null (without elements), return an error.
    if (!('elements' in action.default)) {
        throw new ErrorResponse({ actionID: action.id, message: 'No elements were provided in the default action' })
    }

    return action.default.elements
}

/**
 * Attempts to turn a choice definition into an executable comparison and returns the result
 *
 * @param {Record<string, any>} choice
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @returns {Boolean}
 */
function runComparison (choice, action, userData) {
    let compare
    let left
    let right

    try {
        compare = getComparisonFunction(choice.condition.operation)
    } catch (error) {
        throw new ErrorResponse({ actionID: action.id, message: `Unable to get comparison function: ${error.message}` })
    }

    try {
        left = processTemplateStringWithUserData(choice.condition.left, action, userData)
        right = processTemplateStringWithUserData(choice.condition.right, action, userData)
    } catch (error) {
        throw new ErrorResponse({ actionID: action.id, message: `Unable to resolve left/right comparison arguments ${error.message}` })
    }

    let result

    try {
        result = compare(left, right)
    } catch (error) {
        throw new ErrorResponse({ actionID: action.id, message: `Comparison failed with the following error: ${error.message}` })
    }

    return result
}
