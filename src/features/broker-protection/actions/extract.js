import { getElement, getElementMatches, getElements } from '../utils.js' // Assuming you have imported the address comparison function
import { ErrorResponse, SuccessResponse } from '../types.js'
import { isSameAge } from '../comparisons/is-same-age.js'
import { isSameName } from '../comparisons/is-same-name.js'
import { matchesFullAddress } from '../comparisons/matches-full-address.js'
import { matchAddressFromAddressListCityState } from '../comparisons/address.js'

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
 * @return {import('../types.js').ActionResponse}
 */
export function extract (action, userData) {
    const matchedProfiles = extractProfile(action, userData)

    if ('success' in matchedProfiles) {
        const profiles = matchedProfiles.success
            .filter(x => x.matched.result === true)
            .map(x => x.aggregateFields)
        return new SuccessResponse({ actionID: action.id, actionType: action.actionType, response: profiles })
    }

    return new ErrorResponse({ actionID: action.id, message: matchedProfiles.error })
}

/**
 * @param action
 * @param userData
 * @return {{
 *   success: {
 *    element: HTMLElement,
 *    scraped: Record<string, any>,
 *    aggregateFields: Record<string, any>,
 *    matched: ReturnType<scrapedDataMatchesUserData>
 *  }[]} | { error: string }}
 */
export function extractProfile (action, userData) {
    const profilesElementList = getElements(document, action.selector) ?? []

    if (profilesElementList.length === 0) {
        return { error: 'no matches for root profile selector' }
    }

    return {
        success: profilesElementList
            .map((element) => {
                const scraped = createProfile(element, action.profile)
                return {
                    element,
                    scraped,
                    matched: scrapedDataMatchesUserData(userData, scraped),
                    aggregateFields: aggregateFields(scraped)
                }
            })
    }
}

/**
 * Produces structures like this:
 *
 * {
 *   "name": "John V Smith",
 *   "alternativeNamesList": [
 *     "John Inc Smith",
 *     "John Vsmith",
 *     "John Smithl"
 *   ],
 *   "age": "97",
 *   "addressCityStateList": [
 *     {
 *       "city": "Orlando",
 *       "state": "FL"
 *     }
 *   ],
 *   "profileUrl": "https://example.com/1234"
 * }
 *
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

            // Note: This can return a string, string[], or null
            const extractedValue = extractValue(key, value, evaluatedValue)

            // try to use the extracted value first, then the originally evaluated, falling back to null
            output[key] = extractedValue || evaluatedValue || null
        }
    }
    return output
}

/**
 * @param {HTMLElement} profileElement
 * @param {string} key
 * @param {ExtractProfileProperty} extractField
 * @returns {string[]}
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
 * @typedef {{ kind: "matchesAddress"; }
 *   | { kind: "matchesAddressCityStateList"; }
 *   | { kind: "matchesFullAddress"; }
 *   | { kind: "matchesPhone"; }
 * } MatchReason
 *
 * @typedef {{ kind: "isSameName";  }
 *   | { kind: "isSameAge";  }
 *   | { kind: "none";  }
 * } FailReason
 *
 * Try to filter partial data based on the user's actual profile data
 * @param {Record<string, any>} userData
 * @param {Record<string, any>} scrapedData
 * @return {{result: true; reason: MatchReason} | {result: false; reason: FailReason}}
 */
function scrapedDataMatchesUserData (userData, scrapedData) {
    const negative = {
        isSameName: () => {
            if (!isSameName(scrapedData.name, userData.firstName, userData.middleName, userData.lastName)) {
                return false
            }
            return null
        },
        isSameAge: () => {
            if (scrapedData.age) {
                if (!isSameAge(scrapedData.age, userData.age)) {
                    return false
                }
            }
            return null
        }
    }
    const positive = {
        matchesAddress: () => {
            if (scrapedData.addressCityState) {
                if (matchAddressFromAddressListCityState(userData.addresses, scrapedData.addressCityState)) {
                    return true
                }
            }
            return null
        },
        matchesAddressCityStateList: () => {
            if (scrapedData.addressCityStateList) {
                if (matchAddressFromAddressListCityState(userData.addresses, scrapedData.addressCityStateList)) {
                    return true
                }
            }
            return null
        },
        matchesFullAddress: () => {
            if (matchesFullAddress(userData.addresses, scrapedData.addressFull)) {
                return true
            }
            return null
        },
        matchesPhone: () => {
            if (scrapedData.phone) {
                if (userData.phone === scrapedData.phone) {
                    return true
                }
            }
            return null
        }
    }

    /** @type {(keyof negative)[]} */
    const negativeChecks = [
        'isSameName',
        'isSameAge'
    ]
    /** @type {(keyof positive)[]} */
    const positiveChecks = [
        'matchesAddress',
        'matchesAddressCityStateList',
        'matchesFullAddress',
        'matchesPhone'
    ]

    for (const item of negativeChecks) {
        const result = negative[item]()
        if (result === false) {
            return { result: false, reason: { kind: item } }
        }
    }

    for (const item of positiveChecks) {
        const result = positive[item]()
        if (result === true) {
            return { result: true, reason: { kind: item } }
        }
    }

    return { result: false, reason: { kind: 'none' } }
}

/**
 * @param {Record<string, any>} profile
 */
export function aggregateFields (profile) {
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
 * Example input to this:
 *
 * ```json
 * {
 *   "key": "age",
 *   "value": {
 *     "selector": ".//div[@class='col-md-8']/div[2]"
 *   },
 *   "elementValue": "Age 71"
 * }
 * ```
 *
 * todo: Rework this `extract` functionality to reduce mixing of types
 *
 * @param {string} key
 * @param {ExtractProfileProperty} value
 * @param {string | string[]} elementValue
 * @return {string|string[]|null}
 */
function extractValue (key, value, elementValue) {
    if (!elementValue) return null

    const extractors = {
        name: () => typeof elementValue === 'string' && elementValue.trim(),
        age: () => typeof elementValue === 'string' && elementValue.match(/\d+/)?.[0],
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
            const phoneNumber = typeof elementValue === 'string' && elementValue.replace(/\D/g, '')
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
