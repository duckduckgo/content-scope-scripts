import { getElement, generateRandomInt } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @return {import('../types.js').ActionResponse}
 */
export function fillForm (action, userData, root = document) {
    const form = getElement(root, action.selector)
    if (!form) return new ErrorResponse({ actionID: action.id, message: 'missing form' })
    if (!userData) return new ErrorResponse({ actionID: action.id, message: 'user data was absent' })

    // ensure the element is in the current viewport
    form.scrollIntoView?.()

    const results = fillMany(form, action.elements, userData)

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
 * Try to fill form elements. Collecting results + warnings for reporting.
 * @param {HTMLElement} root
 * @param {{selector: string; type: string}[]} elements
 * @param {Record<string, any>} data
 * @return {({result: true} | {result: false; error: string})[]}
 */
export function fillMany (root, elements, data) {
    const results = []

    for (const element of elements) {
        const inputElem = getElement(root, element.selector)
        if (!inputElem) {
            results.push({ result: false, error: `element not found for selector: "${element.selector}"` })
            continue
        }

        if (element.type === '$file_id$') {
            results.push(setImageUpload(inputElem))
        } else if (element.type === '$generated_phone_number$') {
            results.push(setValueForInput(inputElem, generatePhoneNumber()))
        } else {
            if (!Object.prototype.hasOwnProperty.call(data, element.type)) {
                results.push({ result: false, error: `element found with selector '${element.selector}', but data didn't contain the key '${element.type}'` })
                continue
            }
            if (!data[element.type]) {
                results.push({ result: false, error: `data contained the key '${element.type}', but it wasn't something we can fill: ${data[element.type]}` })
                continue
            }
            results.push(setValueForInput(inputElem, data[element.type]))
        }
    }

    return results
}

/**
 * NOTE: This code comes from Autofill, the reasoning is to make React autofilling work on Chrome and Safari.
 *
 * Ensures the value is set properly and dispatches events to simulate real user action
 *
 * @param {HTMLElement} el
 * @param {string} val
 * @return {{result: true} | {result: false; error: string}}
 */
function setValueForInput (el, val) {
    // Access the original setters
    // originally needed to bypass React's implementation on mobile
    let target
    if (el.tagName === 'INPUT') target = window.HTMLInputElement
    if (el.tagName === 'SELECT') target = window.HTMLSelectElement

    // Bail early if we cannot fill this element
    if (!target) {
        return { result: false, error: `input type was not supported: ${el.tagName}` }
    }

    const originalSet = Object.getOwnPropertyDescriptor(target.prototype, 'value')?.set

    // ensure it's a callable method
    if (!originalSet || typeof originalSet.call !== 'function') {
        return { result: false, error: 'cannot access original value setter' }
    }

    try {
        // separate strategies for inputs vs selects
        if (el.tagName === 'INPUT') {
            // set the input value
            el.dispatchEvent(new Event('keydown', { bubbles: true }))
            originalSet.call(el, val)
            const events = [
                new Event('input', { bubbles: true }),
                new Event('keyup', { bubbles: true }),
                new Event('change', { bubbles: true })
            ]
            events.forEach((ev) => el.dispatchEvent(ev))
            originalSet.call(el, val)
            events.forEach((ev) => el.dispatchEvent(ev))
            el.blur()
        } else if (el.tagName === 'SELECT') {
            // set the select value
            originalSet.call(el, val)
            const events = [
                new Event('mousedown', { bubbles: true }),
                new Event('mouseup', { bubbles: true }),
                new Event('click', { bubbles: true }),
                new Event('change', { bubbles: true })
            ]
            events.forEach((ev) => el.dispatchEvent(ev))
            events.forEach((ev) => el.dispatchEvent(ev))
            el.blur()
        }

        return { result: true }
    } catch (e) {
        return { result: false, error: `setValueForInput exception: ${e}` }
    }
}

/**
 * @param element
 * @return {{result: true}|{result: false, error: string}}
 */
function setImageUpload (element) {
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/B8AAusB9VF9PmUAAAAASUVORK5CYII='
    try {
        // Convert the Base64 string to a Blob
        const binaryString = window.atob(base64PNG)

        // Convert binary string to a Typed Array
        const length = binaryString.length
        const bytes = new Uint8Array(length)
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }

        // Create the Blob from the Typed Array
        const blob = new Blob([bytes], { type: 'image/png' })

        // Create a DataTransfer object and append the Blob
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(new File([blob], 'id.png', { type: 'image/png' }));

        // Step 4: Assign the Blob to the Input Element
        /** @type {any} */(element).files = dataTransfer.files
        return { result: true }
    } catch (e) {
        // failed
        return { result: false, error: e.toString() }
    }
}

export function generatePhoneNumber () {
    /**
     * 3 digits, 2-8, last two digits technically can't end in two 1s, but we'll ignore that requirement
     * Source: https://math.stackexchange.com/questions/920972/how-many-different-phone-numbers-are-possible-within-an-area-code/1115411#1115411
     */
    const areaCode = generateRandomInt(200, 899).toString()

    // 555-0100 through 555-0199 are for fictional use (https://en.wikipedia.org/wiki/555_(telephone_number)#Fictional_usage)
    const exchangeCode = '555'
    const lineNumber = generateRandomInt(100, 199).toString().padStart(4, '0')

    return `${areaCode}${exchangeCode}${lineNumber}`
}
