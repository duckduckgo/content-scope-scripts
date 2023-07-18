import { SuccessResponse, getElement, getElements, getElementMatches } from './actions.js'
import { isSameAge, isSameName, matchAddressFromAddressListCityState, matchAddressFull } from './comparison-functions.js' // Assuming you have imported the address comparison function

/**
 * Adding these types here so that we can switch to generated ones later
 * @typedef {Record<string, any>} Action
 */

/**
 * @typedef {Object} ExtractProfileProperty
 * For example: {
 *   "selector": ".//div[@class='col-sm-24 col-md-8 relatives']//li"
 * }
 * @property {string} selector - xpath or css selector
 * @property {boolean} [findElements] - whether to get all occurrences of the selector
 * @property {string} [afterText] - get all text after this string
 * @property {string} [beforeText] - get all text before this string
 * @property {string} [separator] - split the text on this string
 */

/**
 * @param {Action} action
 * @param {Record<string, any>} userData
 * @return {Promise<SuccessResponse>}
 */
// eslint-disable-next-line require-await
export async function extractProfiles (action, userData) {
    const profilesElementList =
      Array.from(document.querySelectorAll(action.selector)) ?? []

    const matchedProfiles = profilesElementList
        // first, convert each profile element list into a profile
        .map((element) => createProfile(element, action.profile))
        // only include profiles that match the user data
        .filter((profile) => profileMatchesUserData(userData, profile))
        // aggregate some fields
        .map((profile) => aggregateProfileFields(profile))

    return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: matchedProfiles })
}

/**
 * @param {HTMLElement} profileElement
 * @param {Record<string, ExtractProfileProperty>} extractData
 * @return {Record<string, any>}
 */
function createProfile (profileElement, extractData) {
    const output = {}
    for (const [key, value] of Object.entries(extractData)) {
        if (!value?.selector) {
            output[key] = null
        } else {
            const evaluatedValue = value?.findElements
                ? findFromElements(profileElement, key, value)
                : findFromElement(profileElement, key, value)

            const extractedValue = extractValue(key, value, evaluatedValue)
            // counts an empty string as null since that is essentially a blank extracted value
            output[key] = extractedValue || evaluatedValue || null
        }
    }
    return output
}

/**
 * @param {HTMLElement} profileElement
 * @param {string} key
 * @param {ExtractProfileProperty} extractField
 */
function findFromElements (profileElement, key, extractField) {
    const elements = getElements(profileElement, extractField.selector) || null
    const elementValues = []
    if (elements) {
        for (const element of elements) {
            let elementValue = rules[key]?.(element) ?? element?.innerText ?? null
            if (extractField?.afterText) {
                elementValue = elementValue?.split(extractField.afterText)[1]?.trim() || elementValue
            }
            if (extractField?.beforeText) {
                elementValue = elementValue?.split(extractField.beforeText)[0].trim() || elementValue
            }
            elementValues.push(elementValue)
        }
    }
    return elementValues
}

/**
 * @param {HTMLElement} profileElement
 * @param {string} dataKey - such as 'name', 'age' etc
 * @param {ExtractProfileProperty} extractField
 * @return {string}
 */
function findFromElement (profileElement, dataKey, extractField) {
    const element = getElement(profileElement, extractField.selector) ||
        getElementMatches(profileElement, extractField.selector)

    // todo: should we use textContent here?
    let elementValue = rules[dataKey]?.(element) ?? element?.innerText ?? null

    if (extractField?.afterText) {
        elementValue = elementValue?.split(extractField.afterText)[1]?.trim() || elementValue
    }
    // there is a case where we may want to get the text "after" and "before" certain text
    if (extractField?.beforeText) {
        elementValue = elementValue?.split(extractField.beforeText)[0].trim() || elementValue
    }
    return elementValue
}

/**
 * @param {Record<string, any>} userData
 * @param {Record<string, any>} profile
 * @return {boolean}
 */
function profileMatchesUserData (userData, profile) {
    if (!isSameName(profile.name, userData.firstName, userData.middleName, userData.lastName)) return false

    if (profile.age) {
        if (!isSameAge(profile.age, userData.age)) {
            return false
        }
    }

    if (profile.addressCityState) {
        // addressCityState is now being put in a list so can use matchAddressFromAddressListCityState
        if (matchAddressFromAddressListCityState(userData.addresses, profile.addressCityState)) {
            return true
        }
    }

    // it's possible to have both addressCityState and addressCityStateList
    if (profile.addressCityStateList) {
        if (matchAddressFromAddressListCityState(userData.addresses, profile.addressCityStateList)) {
            return true
        }
    }

    if (profile.addressFull) {
        if (matchAddressFull(userData.addresses, profile.addressFull)) { return true }
    }

    if (profile.phone) {
        if (userData.phone === profile.phone) { return true }
    }

    // if phone number matches
    return false
}

/**
 * @param {Record<string, any>} profile
 */
export function aggregateProfileFields (profile) {
    const addressCityStateArray = profile.addressCityState || []
    const addressCityStateListArray = profile.addressCityStateList || []
    const addresses = [...new Set([...addressCityStateArray, ...addressCityStateListArray])]

    const phoneArray = profile.phone || []
    const phoneListArray = profile.phoneList || []
    const phoneNumbers = [...new Set([...phoneArray, ...phoneListArray])]

    return {
        name: profile.name,
        alternativeNames: profile.alternativeNamesList,
        age: profile.age,
        addresses,
        phoneNumbers,
        relatives: profile.relativesList,
        profileUrl: profile.profileUrl
    }
}

/**
 * @param {string} key
 * @param {ExtractProfileProperty} value
 * @param {any} elementValue
 * @return {string|string[]|null}
 */
function extractValue (key, value, elementValue) {
    if (!elementValue) return null

    const extractors = {
        name: () => elementValue.trim(),
        age: () => elementValue.match(/\d+/)?.[0],
        alternativeNamesList: () => stringToList(elementValue, value.separator),
        addressCityStateList: () => {
            const cityStateList = stringToList(elementValue, value.separator)
            return getCityStateCombos(cityStateList)
        },
        addressCityState: () => {
            const cityStateList = stringToList(elementValue)
            return getCityStateCombos(cityStateList)
        },
        addressFullList: () => stringToList(elementValue, value.separator),
        phone: () => {
            const phoneNumber = elementValue.replace(/\D/g, '')
            if (!phoneNumber) {
                return null
            }
            return stringToList(phoneNumber)
        },
        phoneList: () => stringToList(elementValue, value.separator),
        relativesList: () => stringToList(elementValue, value.separator)
    }

    if (key in extractors) {
        return extractors[key]()
    }

    return null
}

/**
 * @param {string|any[]} inputList
 * @param {string} [separator]
 * @return {string[]}
 */
export function stringToList (inputList, separator) {
    // if the list is already an array then we can return the list
    if (Array.isArray(inputList)) return inputList
    if (inputList === '') return []

    if (separator) {
        return inputList
            .split(separator)
            .map(item => item.trim())
            .filter(Boolean)
    }

    return inputList
        .split(/[|\n•·]/)
        .map(item => item.trim())
        .filter(Boolean)
}

/**
 * @param {string[]} inputList
 * @return {{ city: string, state: string|null }[] }
 */
export function getCityStateCombos (inputList) {
    const output = []
    for (const item of inputList) {
        let words
        if (item.includes(',')) {
            words = item.split(',').map(item => item.trim())
        } else {
            words = item.split(' ').map(item => item.trim())
        }
        // we are removing this partial city/state combos at the end (i.e. Chi...)
        if (words.length === 1) { continue }

        const state = words.pop()
        const city = words.join(' ')

        output.push({ city, state: state || null })
    }
    return output
}

// For extraction
const rules = {
    profileUrl: function (link) {
        return link?.href ?? null
    }
}
