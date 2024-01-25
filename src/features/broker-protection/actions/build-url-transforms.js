import { getStateFromAbbreviation } from '../comparisons/address.js'

/**
 * @typedef {{url: string} & Record<string, any>} BuildUrlAction
 * @typedef {Record<string, string|number>} UserData
 */

/**
 * Input: { url: 'https://example.com/a/${firstName}-${lastName}', ... }
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

/**
 * These will be applied by default if the key exists in the data.
 *
 * @type {Map<string, ((value: string) => string)>}
 */
const baseTransforms = new Map([
    ['firstName', (value) => capitalize(value)],
    ['lastName', (value) => capitalize(value)],
    ['state', (value) => value.toLowerCase()],
    ['city', (value) => capitalize(value)],
    ['age', (value) => value.toString()]
])

/**
 * These are optional transforms, will be applied when key is found in the
 * variable syntax
 *
 * Example, `/a/b/${name|capitalize}` -> applies the `capitalize` transform
 * to the name field
 *
 * @type {Map<string, ((value: string, action: BuildUrlAction) => string)>}
 */
const optionalTransforms = new Map([
    ['hyphenated', (value) => value.split(' ').join('-')],
    ['capitalize', (value) => capitalize(value)],
    ['downcase', (value) => value.toLowerCase()],
    ['upcase', (value) => value.toUpperCase()],
    ['snakecase', (value) => value.split(' ').join('_')],
    ['stateFull', (value) => getStateFromAbbreviation(value)],
    ['ageRange', (value, action) => {
        if (!action.ageRange) return value
        const ageNumber = Number(value)
        // find matching age range
        const ageRange = action.ageRange.find(range => {
            const [min, max] = range.split('-')
            return ageNumber >= Number(min) && ageNumber <= Number(max)
        })
        return ageRange || value
    }]
])

/**
 * Take an instance of URLSearchParams and produce a new one, with each variable
 * replaced with a value, or a transformed value.
 *
 * @param {URLSearchParams} searchParams
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 * @return {URLSearchParams}
 */
function processSearchParams (searchParams, action, userData) {
    /**
     * For each key/value pair in the URL Search params, process the value
     * part *only*.
     */
    const updatedPairs = [...searchParams].map(([key, value]) => {
        const processedValue = processTemplateStringWithUserData(value, action, userData)
        return [key, processedValue]
    })

    return new URLSearchParams(updatedPairs)
}

/**
 * @param {string} pathname
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 */
function processPathname (pathname, action, userData) {
    return pathname
        .split('/')
        .filter(Boolean)
        .map(segment => processTemplateStringWithUserData(segment, action, userData))
        .join('/')
}

/**
 * Process strings like /a/b/${name|lowercase}-${age}
 * Where the first segment of any variable is the data key, and any
 * number of subsequent strings are expected to be known transforms
 *
 * In that example:
 *
 *  - `name` would be processed with the 'lowercase' transform
 *  - `age` would be used without processing
 *
 * The regular expression `/\$%7B(.+?)%7D|\$\{(.+?)}/g` is designed to match and capture
 * the content within template literals in two formats: encoded and plain.
 *
 * 1. Encoded Format: `\$%7B(.+?)%7D`
 *    - Matches encoded template strings that start with `$%7B` and end with `%7D`.
 *    - These occur when variables are present in the pathname of the URL
 *
 * 2. Plain Format: `\$\{(.+?)\}`
 *    - Matches plain template strings that start with `${` and end with `}`.
 *    - These occur when variables are present in the value side of any query params
 *
 * This regular expression is used to identify and process these template literals within the input string,
 * allowing the function to replace them with corresponding data from `userData` after applying any specified transformations.
 *
 * @param {string} input
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 */
export function processTemplateStringWithUserData (input, action, userData) {
    /**
     * Note: this regex covers both pathname + query params.
     * This is why we're handling both encoded and un-encoded.
     */
    return String(input).replace(/\$%7B(.+?)%7D|\$\{(.+?)}/g, (match, encodedValue, plainValue) => {
        const comparison = encodedValue ?? plainValue
        const [dataKey, ...transforms] = comparison.split(/\||%7C/)
        const data = userData[dataKey]
        return applyTransforms(dataKey, data, transforms, action)
    })
}

/**
 * @param {string} dataKey
 * @param {string|number} value
 * @param {string[]} transformNames
 * @param {BuildUrlAction} action
 */
function applyTransforms (dataKey, value, transformNames, action) {
    const baseTransform = baseTransforms.get(dataKey)

    // apply base transform to the incoming string
    let outputString = baseTransform
        ? baseTransform(String(value || ''))
        : String(value)

    for (const transformName of transformNames) {
        const transform = optionalTransforms.get(transformName)
        if (transform) {
            outputString = transform(outputString, action)
        }
    }

    return outputString
}

function capitalize (s) {
    const words = s.split(' ')
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1))
    return capitalizedWords.join(' ')
}
