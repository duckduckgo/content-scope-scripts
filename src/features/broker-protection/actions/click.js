import { getElement } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'
import { extractProfile } from './extract.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @return {import('../types.js').ActionResponse}
 */
export function click (action, userData) {
    /** @type {HTMLElement[]} */
    const clicked = []

    for (const element of action.elements) {
        if (element.type !== 'button') return new ErrorResponse({ actionID: action.id, message: 'unsupported type' })

        /** @type {HTMLElement | Document | null} */
        let rootElement = document

        // should we change the root element by looking up a profile first?
        if (element.parent?.profile) {
            const profileMatcher = new ProfileMatch(element.parent.profile, userData)
            rootElement = profileMatcher.match()

            // check the root element is still set
            if (!rootElement) return new ErrorResponse({ actionID: action.id, message: 'root element not available' })
        }

        // now try to match the given selector from the root.
        // Note: `.` will be interpreted as 'this element'
        const matcher = new SelectorMatch(/** @type {any} */(rootElement), element.selector)
        const match = matcher.match()

        if (!match) {
            return new ErrorResponse({ actionID: action.id, message: `could not find element to click with selector '${element.selector}'!` })
        }

        if (typeof match.click !== 'function') {
            return new ErrorResponse({ actionID: action.id, message: 'could not click that element' })
        }
        // console.log({ typeof: typeof match.click })
        // perform the click, and record the fact we did so
        match.click()
        clicked.push(match)
    }

    if (clicked.length === action.elements.length) {
        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
    }

    return new ErrorResponse({ actionID: action.id, message: `only clicked ${clicked.length} items, ${action.elements.length} wanted.` })
}

/**
 * @typedef {{ match: (userData: Record<string, any>) => HTMLElement | null }} ElementMatcher
 */

/**
 * @implements {ElementMatcher}
 */
class SelectorMatch {
    /**
     * @param {HTMLElement} root
     * @param {string} selector
     */
    constructor (root, selector) {
        this.root = root
        this.selector = selector
    }

    /**
     * @return {HTMLElement | null}
     */
    match () {
        if (this.selector === '.') return this.root
        return getElement(this.root, this.selector)
    }
}

/**
 * @implements {ElementMatcher}
 */
class ProfileMatch {
    /**
     * @param {object} profile
     * @param {string} profile.selector - the parent selector for the element in question
     * @param {object} profile.profileSelectors - the selectors to be used for matching a profile
     * @param {Record<string, any>} userData
     */
    constructor (profile, userData) {
        this.profile = profile
        this.userData = userData
    }

    /**
     * @return {HTMLElement | null}
     */
    match () {
        const result = extractProfile(this.profile, this.userData)

        // ignore errors
        if ('error' in result) return null

        // find the first match that can be clicked
        const matched = result.success.find(result => {
            return result.matched && result.element?.isConnected && typeof result.element.click === 'function'
        })

        return matched?.element ?? null
    }
}
