import { getElement, generateRandomInt } from '../utils.js'
import { ErrorResponse, SuccessResponse } from '../types.js'

/**
 * @param action
 * @return {import('../types.js').ActionResponse}
 */
export function fillForm (action, userData) {
    const form = getElement(document, action.selector)
    if (!form) return new ErrorResponse({ actionID: action.id, message: 'missing form' })

    /**
     * @type {({result: true} | {result: false; error: string})[]}
     */
    const results = []

    // fill out form for each step
    for (const element of action.elements) {
        // get the correct field of the form
        const inputElem = getElement(form, element.selector)
        // this works for IDs (i.e. #url would be form.elements['url'])
        // let inputElem = form.elements[element.selector]
        // find the correct userData to put in the form
        if (inputElem) {
            if (element.type === '$file_id$') {
                results.push(setImageUpload(inputElem))
            } else if (element.type === '$generated_phone_number$') {
                // @ts-expect-error - double check if this is strict enough
                setValueForInput(inputElem, generatePhoneNumber())
                results.push({ result: true })
            } else {
                // @ts-expect-error - double check if this is strict enough
                // todo: determine if this requires any events to be dispatched also
                setValueForInput(inputElem, userData[element.type])
                results.push({ result: true })
            }
        }
    }

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
 * NOTE: This code comes from Autofill, the reasoning is to make React autofilling work on Chrome and Safari.
 *
 * Ensures the value is set properly and dispatches events to simulate real user action
 *
 * @param {HTMLInputElement} el
 * @param {string} val
 * @return {{result: boolean}}
 */
function setValueForInput (el, val) {
    el.dispatchEvent(new Event('keydown', { bubbles: true }))

    // Access the original setter (needed to bypass React's implementation on mobile)
    // @ts-expect-error - Object will not be undefined on this case
    const originalSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    originalSet?.call(el, val)

    const events = [
        new Event('input', { bubbles: true }),
        new Event('keyup', { bubbles: true }),
        new Event('change', { bubbles: true })
    ]
    events.forEach((ev) => el.dispatchEvent(ev))
    // We call this again to make sure all forms are happy
    originalSet?.call(el, val)
    events.forEach((ev) => el.dispatchEvent(ev))
    el.blur()

    return { result: true }
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
    const exchangeCode = '55'
    const lineNumber = generateRandomInt(100, 199).toString().padStart(4, '0')

    return `${areaCode}${exchangeCode}${lineNumber}`
}
