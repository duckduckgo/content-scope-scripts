import { getElements } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'
import { extractProfiles } from './extract.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @return {import('../types.js').ActionResponse}
 */
export function click (action, userData, root = document) {
    // there can be multiple elements provided by the action
    for (const element of action.elements) {
        const rootElement = selectRootElement(element, userData, root)
        const elements = getElements(rootElement, element.selector)

        if (!elements?.length) {
            return new ErrorResponse({ actionID: action.id, message: `could not find element to click with selector '${element.selector}'!` })
        }

        const loopLength = element.multiple ? elements.length : 1

        for (let i = 0; i < loopLength; i++) {
            const elem = elements[i]

            if ('disabled' in element) {
                if (element.disabled) {
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
