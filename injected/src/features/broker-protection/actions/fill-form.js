import { getElement, generateRandomInt } from '../utils/utils.js';
import { ErrorResponse, SuccessResponse } from '../types.js';
import { generatePhoneNumber, generateZipCode, generateStreetAddress, generateDateOfBirth, formatDateOfBirth } from './generators.js';
import { states } from '../comparisons/constants.js';
import { sameCityState } from '../comparisons/address.js';

/**
 * @param {Record<string, any>} action
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @param {Record<string, any> | null} [userProfile]
 * @return {import('../types.js').ActionResponse}
 */
export function fillForm(action, userData, root = document, userProfile = null) {
    const form = getElement(root, action.selector);
    if (!form) return new ErrorResponse({ actionID: action.id, message: 'missing form' });
    if (!userData) return new ErrorResponse({ actionID: action.id, message: 'user data was absent' });

    // ensure the element is in the current viewport
    form.scrollIntoView?.();

    const results = fillMany(form, action.elements, userData, userProfile);

    const errors = results
        .filter((x) => x.result === false)
        .map((x) => {
            if ('error' in x) return x.error;
            return 'unknown error';
        });

    if (errors.length > 0) {
        return new ErrorResponse({ actionID: action.id, message: errors.join(', ') });
    }

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: null });
}

/**
 * Try to fill form elements. Collecting results + warnings for reporting.
 * @param {HTMLElement} root
 * @param {{selector: string; type: string; min?: string; max?: string; format?: string;}[]} elements
 * @param {Record<string, any>} data
 * @param {Record<string, any> | null} [userProfile]
 * @return {({result: true} | {result: false; error: string})[]}
 */
export function fillMany(root, elements, data, userProfile = null) {
    const results = [];

    /** @type {Record<string, any> | null} */
    const address = selectAddress(data.addresses, userProfile?.addresses);
    const extras = { ...data.extras, ...address?.extras };

    // Generated once per form, so a form that splits the date of birth across separate year, month
    // and day fields fills three parts of one date rather than parts of three different dates.
    /** @type {string | null} */
    let dateOfBirth = null;

    for (const element of elements) {
        const inputElem = getElement(root, element.selector);
        if (!inputElem) {
            results.push({ result: false, error: `element not found for selector: "${element.selector}"` });
            continue;
        }

        if (element.type === '$file_id$') {
            results.push(setImageUpload(inputElem));
        } else if (element.type === '$generated_phone_number$') {
            results.push(setValueForInput(inputElem, generatePhoneNumber()));
        } else if (element.type === '$generated_zip_code$') {
            results.push(setValueForInput(inputElem, generateZipCode()));
        } else if (element.type === '$generated_dob$') {
            if (dateOfBirth === null) {
                if (!Object.prototype.hasOwnProperty.call(data, 'age')) {
                    results.push({
                        result: false,
                        error: `element found with selector '${element.selector}', but data didn't contain an 'age' to generate a date of birth from`,
                    });
                    continue;
                }
                const age = parseInt(data.age, 10);
                if (!Number.isFinite(age) || age < 0) {
                    results.push({
                        result: false,
                        error: `element found with selector '${element.selector}', but data contained an 'age' that wasn't a non-negative number`,
                    });
                    continue;
                }
                dateOfBirth = generateDateOfBirth(age);
            }

            results.push(setValueForInput(inputElem, formatDateOfBirth(dateOfBirth, element.format)));
        } else if (element.type === '$generated_random_number$') {
            if (!element.min || !element.max) {
                results.push({
                    result: false,
                    error: `element found with selector '${element.selector}', but missing min and/or max values`,
                });
                continue;
            }
            const minInt = parseInt(element?.min);
            const maxInt = parseInt(element?.max);

            if (isNaN(minInt) || isNaN(maxInt)) {
                results.push({
                    result: false,
                    error: `element found with selector '${element.selector}', but min or max was not a number`,
                });
                continue;
            }

            results.push(setValueForInput(inputElem, generateRandomInt(parseInt(element.min), parseInt(element.max)).toString()));
        } else if (element.type === '$generated_street_address$') {
            results.push(setValueForInput(inputElem, generateStreetAddress()));

            // This is a composite of existing (but separate) city and state fields
        } else if (element.type === 'cityState') {
            const city = Object.prototype.hasOwnProperty.call(data, 'city') ? data.city : address?.city;
            const state = Object.prototype.hasOwnProperty.call(data, 'state') ? data.state : address?.state;
            if (!city || !state) {
                results.push({
                    result: false,
                    error: `element found with selector '${element.selector}', but data didn't contain the keys 'city' and 'state'`,
                });
                continue;
            }
            results.push(setValueForInput(inputElem, city + ', ' + state));
        } else if (element.type === 'fullState') {
            const state = Object.prototype.hasOwnProperty.call(data, 'state') ? data.state : address?.state;
            if (!state) {
                results.push({
                    result: false,
                    error: `element found with selector '${element.selector}', but data didn't contain the key 'state'`,
                });
                continue;
            }

            if (!Object.prototype.hasOwnProperty.call(states, state)) {
                results.push({
                    result: false,
                    error: `element found with selector '${element.selector}', but data contained an invalid 'state' abbreviation`,
                });
                continue;
            }

            const stateFull = states[state];

            results.push(setValueForInput(inputElem, stateFull));
        } else {
            const value = lookupValue(element.type, data, address, extras);
            if (!value) {
                if (isElementTypeOptional(element.type)) {
                    continue;
                }
                results.push({
                    result: false,
                    error:
                        value === undefined
                            ? `element found with selector '${element.selector}', but data didn't contain the key '${element.type}'`
                            : `data contained the key '${element.type}', but it wasn't something we can fill: ${value}`,
                });
                continue;
            }
            results.push(setValueForInput(inputElem, value));
        }
    }

    return results;
}

/**
 * Resolve a form element's `type` against the fill sources, in precedence order:
 * 1. a flat key on the profile (how `userProfile` data arrives)
 * 2. the selected address's own `city`/`state` — schema fields, so not present in its extras
 * 3. extras (profile-level, overlaid by address-level)
 *
 * @param {string} type
 * @param {Record<string, any>} data
 * @param {Record<string, any> | null} address
 * @param {Record<string, any>} extras
 * @return {any}
 */
function lookupValue(type, data, address, extras) {
    if (Object.prototype.hasOwnProperty.call(data, type)) return data[type];
    if ((type === 'city' || type === 'state') && address?.[type]) return address[type];
    if (Object.prototype.hasOwnProperty.call(extras, type)) return extras[type];
    return undefined;
}

/**
 * Pick the address to fill from: the first profile address whose city/state matches any of the
 * user's addresses, otherwise the first profile address, otherwise `null` when there are none.
 *
 * @template {{city: string; state: string | null}} T
 * @param {T[]} [profileAddresses]
 * @param {{city: string; state: string | null}[]} [userAddresses]
 * @return {T | null}
 */
export function selectAddress(profileAddresses, userAddresses) {
    if (!profileAddresses || profileAddresses.length === 0) return null;
    const matched = profileAddresses.find((address) => userAddresses?.some((user) => sameCityState(user, address)));
    return matched ?? profileAddresses[0];
}

/**
 * @param { string } type
 * @returns Boolean
 */
function isElementTypeOptional(type) {
    if (type === 'middleName') {
        return true;
    }

    return false;
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
function setValueForInput(el, val) {
    // Access the original setters
    // originally needed to bypass React's implementation on mobile
    let target;
    if (el.tagName === 'INPUT') target = window.HTMLInputElement;
    if (el.tagName === 'SELECT') target = window.HTMLSelectElement;
    if (el.tagName === 'TEXTAREA') target = window.HTMLTextAreaElement;

    // Bail early if we cannot fill this element
    if (!target) {
        return { result: false, error: `input type was not supported: ${el.tagName}` };
    }

    const originalSet = Object.getOwnPropertyDescriptor(target.prototype, 'value')?.set;

    // ensure it's a callable method
    if (!originalSet || typeof originalSet.call !== 'function') {
        return { result: false, error: 'cannot access original value setter' };
    }

    try {
        // separate strategies for inputs vs selects
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            // set the input value
            el.dispatchEvent(new Event('keydown', { bubbles: true }));
            originalSet.call(el, val);
            const events = [
                new Event('input', { bubbles: true }),
                new Event('keyup', { bubbles: true }),
                new Event('change', { bubbles: true }),
            ];
            events.forEach((ev) => el.dispatchEvent(ev));
            originalSet.call(el, val);
            events.forEach((ev) => el.dispatchEvent(ev));
            el.blur();
        } else if (el.tagName === 'SELECT') {
            /** @type {HTMLSelectElement} */
            const selectElement = /** @type {HTMLSelectElement} */ (el);

            // Attempt to find the matching value in the select options, ignoring case
            const selectValues = [...selectElement.options].map((o) => o.value);
            const valStr = String(val);
            const matchingValue = selectValues.find((option) => option.toLowerCase() === valStr.toLowerCase());

            if (matchingValue === undefined) {
                return { result: false, error: `could not find matching value for select element: ${val}` };
            }

            // set the select value
            originalSet.call(el, matchingValue);
            const events = [
                new Event('mousedown', { bubbles: true }),
                new Event('mouseup', { bubbles: true }),
                new Event('click', { bubbles: true }),
                new Event('change', { bubbles: true }),
            ];
            events.forEach((ev) => el.dispatchEvent(ev));
            events.forEach((ev) => el.dispatchEvent(ev));
            el.blur();
        }

        return { result: true };
    } catch (e) {
        return { result: false, error: `setValueForInput exception: ${e}` };
    }
}

/**
 * @param element
 * @return {{result: true}|{result: false, error: string}}
 */
function setImageUpload(element) {
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/B8AAusB9VF9PmUAAAAASUVORK5CYII=';
    try {
        // Convert the Base64 string to a Blob
        const binaryString = window.atob(base64PNG);

        // Convert binary string to a Typed Array
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create the Blob from the Typed Array
        const blob = new Blob([bytes], { type: 'image/png' });

        // Create a DataTransfer object and append the Blob
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File([blob], 'id.png', { type: 'image/png' }));

        // Step 4: Assign the Blob to the Input Element
        /** @type {any} */
        element.files = dataTransfer.files;
        return { result: true };
    } catch (e) {
        // failed
        return { result: false, error: e.toString() };
    }
}
