import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'

/**
 * @param {Record<string, any>} action
 * @param {Document | HTMLElement} root
 * @return {import('../types.js').ActionResponse}
 */
export function expectation (action, root = document) {
    const results = expectMany(action.expectations, root)

    const errors = results.filter(x => x.result === false).map(x => {
        if ('error' in x) return x.error
        return 'unknown error'
    })

    if (errors.length > 0) {
        return new ErrorResponse({ actionID: action.id, message: errors.join(', ') })
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
}

/**
 * @param {{type: "element" | "text" | "url"; selector: string; parent?: string; expect?: string}[]} expectations
 * @param {Document | HTMLElement} root
 * @return {({result: true} | {result: false; error: string})[]}
 */
export function expectMany (expectations, root) {
    return expectations.map(expectation => {
        if (expectation.type === 'element') {
            if (expectation.parent) {
                const parent = getElement(root, expectation.parent)
                if (!parent) return { result: false, error: `parent element not found with selector: ${expectation.parent}` }
                parent.scrollIntoView()
            }
            const elementExists = getElement(root, expectation.selector) !== null
            if (elementExists) {
                return { result: true }
            }
            return { result: false, error: `element with selector ${expectation.selector} not found.` }
        }
        if (expectation.type === 'text' && expectation.expect) {
            // get the target element text
            const elem = getElement(root, expectation.selector)
            if (!elem) {
                return { result: false, error: `element with selector ${expectation.selector} not found.` }
            }
            const textExists = Boolean(elem?.textContent?.includes(expectation.expect))
            if (textExists) return { result: true }
            return { result: false, error: `expected element with selector ${expectation.selector} to have text: ${expectation.expect}, but it didn't` }
        } else if (expectation.type === 'url' && expectation.expect) {
            const url = window.location.href
            if (url.includes(expectation.expect)) {
                return { result: true }
            }
            return { result: false, error: `expected URL to include ${expectation.expect}, but it didn't` }
        }
        return { result: false, error: `unknown expectation type: ${expectation.type}` }
    })
}
