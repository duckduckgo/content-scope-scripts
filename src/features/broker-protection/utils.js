/**
 * Get a single element.
 *
 * @param {Node} doc
 * @param {string} selector
 * @return {HTMLElement | null}
 */
export function getElement (doc = document, selector) {
    if (isXpath(selector)) {
        return safeQuerySelectorXPath(doc, selector)
    }

    return safeQuerySelector(doc, selector)
}

/**
 * Get an array of elements
 *
 * @param {Node} doc
 * @param {string} selector
 * @return {HTMLElement[] | null}
 */
export function getElements (doc = document, selector) {
    if (isXpath(selector)) {
        return safeQuerySelectorAllXpath(doc, selector)
    }

    return safeQuerySelectorAll(doc, selector)
}

/**
 * Test if a given selector matches an element.
 *
 * @param {HTMLElement} element
 * @param {string} selector
 */
export function getElementMatches (element, selector) {
    try {
        if (isXpath(selector)) {
            return matchesXPath(element, selector) ? element : null
        } else {
            return element.matches(selector) ? element : null
        }
    } catch (e) {
        console.error('getElementMatches threw: ', e)
        return null
    }
}

/**
 * This is a xpath version of `element.matches(CSS_SELECTOR)`
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

/**
 * @param {unknown} selector
 * @returns {boolean}
 */
function isXpath (selector) {
    if (!(typeof selector === 'string')) return false
    return selector.startsWith('//') || selector.startsWith('./') || selector.startsWith('(')
}

/**
 * @param {Element|Node} element
 * @param selector
 * @returns {HTMLElement[] | null}
 */
function safeQuerySelectorAll (element, selector) {
    try {
        if (element && 'querySelectorAll' in element) {
            return Array.from(element?.querySelectorAll?.(selector))
        }
        return null
    } catch (e) {
        return null
    }
}
/**
 * @param {Element|Node} element
 * @param selector
 * @returns {HTMLElement | null}
 */
function safeQuerySelector (element, selector) {
    try {
        if (element && 'querySelector' in element) {
            return element?.querySelector?.(selector)
        }
        return null
    } catch (e) {
        return null
    }
}

/**
 * @param {Node} element
 * @param selector
 * @returns {HTMLElement | null}
 */
function safeQuerySelectorXPath (element, selector) {
    try {
        const match = document.evaluate(selector, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        const single = match?.singleNodeValue
        if (single) {
            return /** @type {HTMLElement} */(single)
        }
        return null
    } catch (e) {
        console.log('safeQuerySelectorXPath threw', e)
        return null
    }
}

/**
 * @param {Element|Node} element
 * @param selector
 * @returns {HTMLElement[] | null}
 */
function safeQuerySelectorAllXpath (element, selector) {
    try {
        // gets all elements matching the xpath query
        const xpathResult = document.evaluate(selector, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        if (xpathResult) {
            /** @type {HTMLElement[]} */
            const matchedNodes = []
            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                const item = xpathResult.snapshotItem(i)
                if (item) matchedNodes.push(/** @type {HTMLElement} */(item))
            }
            return /** @type {HTMLElement[]} */(matchedNodes)
        }
        return null
    } catch (e) {
        console.log('safeQuerySelectorAllXpath threw', e)
        return null
    }
}
