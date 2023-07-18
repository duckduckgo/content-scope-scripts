import { SuccessResponse, getElement, ErrorResponse } from './actions.js'

/**
 * Takes the solved captcha token and injects it into the page to solve the captcha
 *
 * @param action
 * @return {Promise<SuccessResponse | ErrorResponse>}
 */
// eslint-disable-next-line require-await
export async function fillForm (action, userData) {
    const form = getElement(document, action.selector)
    if (!form) return new ErrorResponse({ actionID: action.id, message: 'missing form' })

    // fill out form for each step
    for (const element of action.elements) {
        // get the correct field of the form
        const inputElem = getElement(form, element.selector)
        // this works for IDs (i.e. #url wouldb e form.elements['url'])
        // let inputElem = form.elements[element.selector]
        // find the correct userData to put in the form
        if (inputElem) {
            // @ts-expect-error - double check if this is strict enough
            // todo: determine if this requires any events to be dispatched also
            setValueForInput(inputElem, userData[element.type])
        }
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null })
}

/**
 * NOTE: This code comes from Autofill, the reasoning is to make React autofilling work on Chrome and Safari.
 *
 * Ensures the value is set properly and dispatches events to simulate real user action
 * @param {HTMLInputElement} el
 * @param {string} val
 * @return {boolean}
 */
const setValueForInput = (el, val) => {
    // todo(Shane): Not sending a 'key' property on these events can cause exceptions on 3rd party listeners that expect it
    el.dispatchEvent(new Event('keydown', { bubbles: true }))

    // Access the original setter (needed to bypass React's implementation on mobile)
    // @ts-expect-error - Object will not be undefined on this case
    const originalSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    originalSet?.call(el, val)

    const events = [
        new Event('input', { bubbles: true }),
        // todo(Shane): Not sending a 'key' property on these events can cause exceptions on 3rd party listeners that expect it
        new Event('keyup', { bubbles: true }),
        new Event('change', { bubbles: true })
    ]
    events.forEach((ev) => el.dispatchEvent(ev))
    // We call this again to make sure all forms are happy
    originalSet?.call(el, val)
    events.forEach((ev) => el.dispatchEvent(ev))
    el.blur()

    return true
}
