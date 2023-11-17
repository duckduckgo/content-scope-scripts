import { capitalize, getStateFromAbbreviation } from './comparison-functions.js'

/**
 * @typedef {Omit<import('../../types/dbp-messages.js').NavigateAction, 'actionType'>} BuildUrlAction
 * @typedef {Record<string, string|number>} UserData
 */

/**
 * Input: { url: 'https://example.com/a/${firstName}-${lastName}' }
 * Output: { url: 'https://example.com/a/John-Smith' }
 *
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 * @return {{ url: string } | { error: string }}
 */
export function transformUrl (action, userData) {
    const url = new URL(action.url)

    /**
     * assign the updated pathname + search params
     */
    url.search = processSearchParams(url.searchParams, action, userData).toString()
    url.pathname = processPathname(url.pathname, action, userData)

    /**
     * Finally, convert back to a full URL
     */
    return { url: url.toString() }
}

/** @type {Record<string, ((value: string, action: BuildUrlAction) => string)>} */
const transforms = {
    hyphenated: (value) => value.split(' ').join('-'),
    capitalize: (value) => capitalize(value),
    downcase: (value) => value.toLowerCase(),
    upcase: (value) => value.toUpperCase(),
    snakecase: (value) => value.split(' ').join('_'),
    stateFull: (value) => getStateFromAbbreviation(value),
    ageRange: (value, action) => {
        if (!action.ageRange) return value
        const ageNumber = Number(value)
        // find matching age range
        const ageRange = action.ageRange.find(range => {
            const [min, max] = range.split('-')
            return ageNumber >= Number(min) && ageNumber <= Number(max)
        })
        return ageRange || value
    }
}

/** @type {Record<string, ((value: string) => string)>} */
const baseTransforms = {
    firstName: (value) => capitalize(value),
    lastName: (value) => capitalize(value),
    state: (value) => value.toLowerCase(),
    city: (value) => capitalize(value),
    age: (value) => value.toString()
}

/**
 * Take an instance of URLSearchParams and process a new one, with each value
 * processed
 *
 * @param {URLSearchParams} searchParams
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 * @return {URLSearchParams}
 */
function processSearchParams (searchParams, action, userData) {
    /**
     * For each key/value pair in the URL Search params, process the value
     * part only.
     */
    const updatedPairs = [...searchParams].map(([key, value]) => {
        const processedValue = processOne(value, action, userData)
        return [key, processedValue]
    })

    return new URLSearchParams(updatedPairs)
}

/**
 *
 * @param {string} pathname
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 */
function processPathname (pathname, action, userData) {
    return pathname
        .split('/')
        .filter(Boolean)
        .map(segment => processOne(segment, action, userData))
        .join('/')
}

/**
 * @param {string} input
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 */
export function processOne (input, action, userData) {
    return String(input).replace(/\$%7B(.+?)%7D|\$\{(.+?)}/g, (match, value) => {
        const comparison = value || match.slice(2, -1)
        const [dataKey, ...modifiers] = comparison.split('|')
        const data = userData[dataKey]
        return applyToDataKey(dataKey, data, modifiers, action)
    })
}

/**
 * @param {string} dataKey
 * @param {string|number} value
 * @param {string[]} modifiers
 * @param {BuildUrlAction} action
 */
function applyToDataKey (dataKey, value, modifiers, action) {
    const baseTransform = Object.prototype.hasOwnProperty.call(baseTransforms, dataKey)
        ? baseTransforms[dataKey]
        : undefined

    // apply base transform
    const initialString = baseTransform
        ? baseTransform(String(value || ''))
        : String(value)

    // apply additional modifiers
    return modifiers.reduce((acc, modifier) => {
        if (!Object.prototype.hasOwnProperty.call(transforms, modifier)) {
            console.warn('missing value modifier', modifier)
            return acc
        }
        return transforms[modifier](acc, action)
    }, initialString)
}
