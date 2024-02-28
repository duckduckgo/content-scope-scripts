import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'
import { extractProfiles } from './extract.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @return {import('../types.js').ActionResponse}
 */
export function click (action, userData) {
    // there can be multiple elements provided by the action
    for (const element of action.elements) {
        const root = selectRootElement(element, userData)
        const elem = getElement(root, element.selector)

        if (!elem) {
            return new ErrorResponse({ actionID: action.id, message: `could not find element to click with selector '${element.selector}'!` })
        }
        if ('disabled' in elem) {
            if (elem.disabled) {
                return new ErrorResponse({ actionID: action.id, message: `could not click disabled element ${element.selector}'!` })
            }
        }
        if ('click' in elem && typeof elem.click === 'function') {
            elem.click()
        }
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
}

/**
 * @param {{parent?: {profileMatch?: Record<string, any>}}} clickElement
 * @param {Record<string, any>} userData
 * @return {Node}
 */
function selectRootElement (clickElement, userData) {
    // if there's no 'parent' field, just use the document
    if (!clickElement.parent) return document

    // if the 'parent' field contains 'profileMatch', try to match it
    if (clickElement.parent.profileMatch) {
        const extraction = extractProfiles(clickElement.parent.profileMatch, userData)
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
