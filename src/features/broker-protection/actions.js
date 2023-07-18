import { buildUrl } from './buildUrl.js'
import { extractProfiles } from './extract.js'
import { fillForm } from './fillForm.js'
import { getCaptchaInfo, solveCaptcha } from './captcha.js'
import { click } from './click.js'
import { expectation } from './expectation.js'

/**
 * @param {object} action
 * @param {string} action.id
 * @param {"extract" | "fillForm" | "click" | "expectation" | "getCaptchaInfo" | "solveCaptcha" | "navigate"} action.actionType
 * @param {any} data
 * @return {Promise<SuccessResponse | ErrorResponse>}
 */
export function execute (action, data) {
    try {
        switch (action.actionType) {
        case 'navigate':
            return buildUrl(action, data)
        case 'extract':
            return extractProfiles(action, data)
        case 'click':
            return click(action)
        case 'expectation':
            return expectation(action)
        case 'fillForm':
            return fillForm(action, data)
        case 'getCaptchaInfo':
            return getCaptchaInfo(action)
        case 'solveCaptcha':
            return solveCaptcha(action, data.token)
        default: {
            const error = new ErrorResponse({
                actionID: action.id,
                message: `unimplemented actionType: ${action.actionType}`
            })
            return Promise.resolve(error)
        }
        }
    } catch (e) {
        console.log('unhandled exception: ', e)
        const error = new ErrorResponse({
            actionID: action.id,
            message: `unhandled exception: ${e.message}`
        })
        return Promise.resolve(error)
    }
}

// Generic Get Element
/**
 * @param {HTMLElement|Element|Node|Document} doc
 * @param {string} selector
 * @return {HTMLElement|null}
 */
export function getElement (doc = document, selector) {
    if (selector.startsWith('//') || selector.startsWith('./') || selector.startsWith('(')) {
        let element
        try {
            element = document.evaluate(selector, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue
        } catch (e) {
            element = null
        }

        if (element) {
            return /** @type {HTMLElement} */(element)
        }
        return null
    }

    if ('querySelector' in doc) {
        return doc.querySelector(selector)
    }

    return null
}

/**
 * @param {HTMLElement} element
 * @param {string} selector
 */
export function getElementMatches (element, selector) {
    if (selector.startsWith('//') || selector.startsWith('./') || selector.startsWith('(')) {
        return matchesXPath(element, selector) ? element : null
    } else {
        try {
            return element.matches(selector) ? element : null
        } catch (e) {
            console.error('getElementMatches threw: ', e)
            return null
        }
    }
}

/**
 * This is an xpath version of `element.matches(CSS_SELECTOR)`9
 * @param {HTMLElement} element
 * @param {string} selector
 * @return {boolean}
 */
function matchesXPath (element, selector) {
    const xpathResult = document.evaluate(
        selector,
        element,
        null,
        XPathResult.BOOLEAN_TYPE,
        null
    )

    return xpathResult.booleanValue
}

// Generic Get Element
/**
 * @param {HTMLElement|Element|Node|Document} doc
 * @param {string} selector
 * @return {NodeListOf<HTMLElement>|HTMLElement[]|null}
 */
export function getElements (doc = document, selector) {
    if (selector.startsWith('//') || selector.startsWith('./') || selector.startsWith('(')) {
        // gets all elements matching the xpath query
        const xpathResult = document.evaluate(selector, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        if (xpathResult) {
            const matchedNodes = []
            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                matchedNodes.push(xpathResult.snapshotItem(i))
            }
            return /** @type {HTMLElement[]} */(matchedNodes)
        }
        return null
    }

    if ('querySelector' in doc) {
        return doc.querySelectorAll(selector)
    }

    return null
}

/**
* Represents an error
*/
export class ErrorResponse {
    /**
     * @param {object} params
     * @param {string} params.actionID
     * @param {string} params.message
     */
    constructor (params) {
        this.error = params
    }
}

/**
 * Represents success, `response` can contain other complex types
 */
export class SuccessResponse {
    /**
     * @param {object} params
     * @param {string} params.actionID
     * @param {string} params.actionType
     * @param {any} params.response
     */
    constructor (params) {
        this.success = params
    }
}
