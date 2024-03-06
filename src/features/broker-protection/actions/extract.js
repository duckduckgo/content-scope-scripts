import {
    cleanArray,
    getElement,
    getElementMatches,
    getElements
} from '../utils.js' // Assuming you have imported the address comparison function
import { ErrorResponse, ProfileResult, SuccessResponse } from '../types.js'
import { isSameAge } from '../comparisons/is-same-age.js'
import { isSameName } from '../comparisons/is-same-name.js'
import { matchesFullAddress } from '../comparisons/matches-full-address.js'
import { matchesFullAddressList } from '../comparisons/matches-full-address-list.js'
import { matchAddressFromAddressListCityState } from '../comparisons/address.js'

/**
 * Adding these types here so that we can switch to generated ones later
 * @typedef {Record<string, any>} Action
 */

/**
 * @typedef {'param'|'path'} IdentifierType
 * @typedef {Object} ExtractProfileProperty
 * For example: {
 *   "selector": ".//div[@class='col-sm-24 col-md-8 relatives']//li"
 * }
 * @property {string} selector - xpath or css selector
 * @property {boolean} [findElements] - whether to get all occurrences of the selector
 * @property {string} [afterText] - get all text after this string
 * @property {string} [beforeText] - get all text before this string
 * @property {string} [separator] - split the text on this string
 * @property {IdentifierType} [identifierType] - the type (path/param) of the identifier
 * @property {string} [identifier] - the identifier itself (either a param name, or a templated URI)
 */

/**
 * @param {Action} action
 * @param {Record<string, any>} userData
 * @return {import('../types.js').ActionResponse}
 */
export function extract (action, userData) {
    const extractResult = extractProfiles(action, userData)

    if ('error' in extractResult) {
        return new ErrorResponse({ actionID: action.id, message: extractResult.error })
    }

    const filtered = extractResult.results
        .filter(x => x.result === true)
        .map(x => aggregateFields(x.scrapedData))

    // omit the DOM node from data transfer
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const debugResults = extractResult.results.map((result) => result.asData())

    return new SuccessResponse({
        actionID: action.id,
        actionType: action.actionType,
        response: filtered,
        meta: {
            userData,
            extractResults: debugResults
        }
    })
}

/**
 * @param {Action} action
 * @param {Record<string, any>} userData
 * @param {Element | Document} [root]
 * @return {{error: string} | {results: ProfileResult[]}}
 */
export function extractProfiles (action, userData, root = document) {
    const profilesElementList = getElements(root, action.selector) ?? []

    if (profilesElementList.length === 0) {
        return { error: 'no root elements found for ' + action.selector }
    }

    return {
        results: profilesElementList.map((element) => {
            const elementFactory = (key, value) => {
                return value?.findElements
                    ? cleanArray(getElements(element, value.selector))
                    : cleanArray(getElement(element, value.selector) || getElementMatches(element, value.selector))
            }
            const scrapedData = createProfile(elementFactory, action.profile)
            const { result, score, matchedFields } = scrapedDataMatchesUserData(userData, scrapedData)
            return new ProfileResult({
                scrapedData,
                result,
                score,
                element,
                matchedFields
            })
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
 * @param {(key: string, value: ExtractProfileProperty) => {innerText: string}[]} elementFactory
 *   a function that produces elements for a given key + ExtractProfileProperty
 * @param {Record<string, ExtractProfileProperty>} extractData
 * @return {Record<string, any>}
 */
export function createProfile (elementFactory, extractData) {
    const output = {}
    for (const [key, value] of Object.entries(extractData)) {
        if (!value?.selector) {
            output[key] = null
        } else {
            const elements = elementFactory(key, value)
            const evaluatedValue = value?.findElements
                ? findFromElements(elements, key, value)
                : findFromElement(elements[0], key, value)

            // Note: This can return a string, string[], or null
            const extractedValue = extractValue(key, value, evaluatedValue)

            // try to use the extracted value, or fall back to null
            // this allows 'extractValue' to return null|undefined
            output[key] = extractedValue || null
        }
    }
    return output
}

/**
 * @param {{innerText: string}[]} elements
 * @param {string} key
 * @param {ExtractProfileProperty} extractField
 * @return {string[]}
 */
function findFromElements (elements, key, extractField) {
    const elementValues = []
    if (elements) {
        for (const element of elements) {
            const elementValue = findFromElement(element, key, extractField)
            elementValues.push(elementValue)
        }
    }
    return elementValues
}

/**
 * @param {{innerText: string}} element
 * @param {string} dataKey - such as 'name', 'age' etc
 * @param {ExtractProfileProperty} extractField
 * @return {string}
 */
function findFromElement (element, dataKey, extractField) {
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
 * Try to filter partial data based on the user's actual profile data
 * @param {Record<string, any>} userData
 * @param {Record<string, any>} scrapedData
 * @return {{score: number, matchedFields: string[], result: boolean}}
 */
function scrapedDataMatchesUserData (userData, scrapedData) {
    const matchedFields = []

    // the name matching is always a *requirement*
    if (isSameName(scrapedData.name, userData.firstName, userData.middleName, userData.lastName)) {
        matchedFields.push('name')
    } else {
        return { matchedFields, score: matchedFields.length, result: false }
    }

    // if the age field was present in the scraped data, then we consider this check a *requirement*
    if (scrapedData.age) {
        if (isSameAge(scrapedData.age, userData.age)) {
            matchedFields.push('age')
        } else {
            return { matchedFields, score: matchedFields.length, result: false }
        }
    }

    if (scrapedData.addressCityState) {
        // addressCityState is now being put in a list so can use matchAddressFromAddressListCityState
        if (matchAddressFromAddressListCityState(userData.addresses, scrapedData.addressCityState)) {
            matchedFields.push('addressCityState')
            return { matchedFields, score: matchedFields.length, result: true }
        }
    }

    // it's possible to have both addressCityState and addressCityStateList
    if (scrapedData.addressCityStateList) {
        if (matchAddressFromAddressListCityState(userData.addresses, scrapedData.addressCityStateList)) {
            matchedFields.push('addressCityStateList')
            return { matchedFields, score: matchedFields.length, result: true }
        }
    }

    if (scrapedData.addressFull) {
        if (matchesFullAddress(userData.addresses, scrapedData.addressFull)) {
            matchedFields.push('addressFull')
            return { matchedFields, score: matchedFields.length, result: true }
        }
    }

    if (scrapedData.addressFullList) {
        if (matchesFullAddressList(userData.addresses, scrapedData.addressFullList)) {
            matchedFields.push('addressFullList')
            return { matchedFields, score: matchedFields.length, result: true }
        }
    }

    if (scrapedData.phone) {
        if (userData.phone === scrapedData.phone) {
            matchedFields.push('phone')
            return { matchedFields, score: matchedFields.length, result: true }
        }
    }

    // if we get here we didn't consider it a match
    return { matchedFields, score: matchedFields.length, result: false }
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
        ...profile.profileUrl
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
 * @return {string|string[]|null|undefined}
 */
export function extractValue (key, value, elementValue) {
    if (!elementValue) return null

    const extractors = {
        name: () => typeof elementValue === 'string' && elementValue.replace(/\n/g, ' ').trim(),
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
        addressFull: () => elementValue,
        phoneList: () => stringToList(elementValue, value.separator),
        relativesList: () => stringToList(elementValue, value.separator),
        profileUrl: () => {
            const profile = {
                profileUrl: elementValue,
                identifier: elementValue
            }

            if (!value.identifierType || !value.identifier) {
                return profile
            }

            const profileUrl = Array.isArray(elementValue) ? elementValue[0] : elementValue
            profile.identifier = getIdFromProfileUrl(profileUrl, value.identifierType, value.identifier)
            return profile
        }
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
    for (let item of inputList) {
        let words
        // Strip out the zip code since we're only interested in city/state here.
        item = item.replace(/,?\s*\d{5}(-\d{4})?/, '')

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

/**
 * Parse a profile id from a profile URL
 * @param {string} profileUrl
 * @param {IdentifierType} identifierType
 * @param {string} identifier
 * @return {string}
 */
export function getIdFromProfileUrl (profileUrl, identifierType, identifier) {
    const parsedUrl = new URL(profileUrl)
    const urlParams = parsedUrl.searchParams

    // Attempt to parse out an id from the search parameters
    if (identifierType === 'param' && urlParams.has(identifier)) {
        const profileId = urlParams.get(identifier)
        return profileId || profileUrl
    }

    return profileUrl
}
