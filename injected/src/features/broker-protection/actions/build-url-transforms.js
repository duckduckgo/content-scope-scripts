import { getStateFromAbbreviation } from '../comparisons/address.js';

/**
 * @typedef {{url: string, ageRange?: string[]} & Record<string, unknown>} BuildUrlAction
 * @typedef {Record<string, unknown>} BuildActionWithoutUrl
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
export function transformUrl(action, userData) {
    const url = new URL(action.url);

    /**
     * assign the updated pathname + search params
     */
    url.search = processSearchParams(url.searchParams, action, userData).toString();
    url.pathname = processPathname(url.pathname, action, userData);

    /**
     * Finally, convert back to a full URL
     */
    return { url: url.toString() };
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
    ['age', (value) => value.toString()],
]);

/**
 * These are optional transforms, will be applied when key is found in the
 * variable syntax
 *
 * Example, `/a/b/${name|capitalize}` -> applies the `capitalize` transform
 * to the name field
 *
 * @type {Map<string, ((value: string, action: BuildUrlAction | BuildActionWithoutUrl, argument?: string) => string)>}
 */
const optionalTransforms = new Map([
    ['hyphenated', (value, _action) => value.split(' ').join('-')],
    ['capitalize', (value, _action) => capitalize(value)],
    ['downcase', (value, _action) => value.toLowerCase()],
    ['upcase', (value, _action) => value.toUpperCase()],
    ['snakecase', (value, _action) => value.split(' ').join('_')],
    ['stateFull', (value, _action) => getStateFromAbbreviation(value)],
    ['defaultIfEmpty', (value, _action, argument = '') => value || argument || ''],
    [
        'ageRange',
        (value, action) => {
            const ageRanges = Array.isArray(action?.ageRange) ? action.ageRange : [];
            if (ageRanges.length === 0) return value;
            const ageNumber = Number(value);
            // find matching age range
            const ageRange = ageRanges.find((/** @type {string} */ range) => {
                const [min, max] = range.split('-');
                return ageNumber >= Number(min) && ageNumber <= Number(max);
            });
            return ageRange ?? value;
        },
    ],
]);

/**
 * Take an instance of URLSearchParams and produce a new one, with each variable
 * replaced with a value, or a transformed value.
 *
 * @param {URLSearchParams} searchParams
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 * @return {URLSearchParams}
 */
function processSearchParams(searchParams, action, userData) {
    /**
     * For each key/value pair in the URL Search params, process the value
     * part *only*.
     */
    const updatedPairs = [...searchParams].map(([key, value]) => {
        const processedValue = processTemplateStringWithUserData(value, action, userData);
        return [key, processedValue];
    });

    return new URLSearchParams(updatedPairs);
}

/**
 * @param {string} pathname
 * @param {BuildUrlAction} action
 * @param {Record<string, string|number>} userData
 */
function processPathname(pathname, action, userData) {
    return pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => processTemplateStringWithUserData(segment, action, userData))
        .join('/');
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
 * @param {BuildUrlAction | BuildActionWithoutUrl} action
 * @param {Record<string, string|number>} userData
 */
export function processTemplateStringWithUserData(input, action, userData) {
    /**
     * Note: this regex covers both pathname + query params.
     * This is why we're handling both encoded and un-encoded.
     */
    return String(input).replace(/\$%7B(.+?)%7D|\$\{(.+?)}/g, (_, encodedValue, plainValue) => {
        const comparison = encodedValue ?? plainValue;
        const [dataKey, ...transforms] = comparison.split(/\||%7C/);
        const data = userData[dataKey];
        return applyTransforms(dataKey, data ?? '', transforms, action);
    });
}

/**
 * @param {string} dataKey
 * @param {string|number} value
 * @param {string[]} transformNames
 * @param {BuildUrlAction | BuildActionWithoutUrl} action
 */
function applyTransforms(dataKey, value, transformNames, action) {
    const subject = String(value || '');
    const baseTransform = baseTransforms.get(dataKey);

    // apply base transform to the incoming string
    let outputString = baseTransform ? baseTransform(subject) : subject;

    for (const transformName of transformNames) {
        const parts = transformName.split(':');
        const name = parts[0];
        const argument = parts[1];
        const transform = name !== undefined ? optionalTransforms.get(name) : undefined;
        if (transform) {
            const arg = argument ?? '';
            outputString = transform(outputString, action, arg);
        }
    }

    return outputString;
}

/**
 * @param {string} s
 * @returns {string}
 */
function capitalize(s) {
    const words = s.split(' ');
    const capitalizedWords = words.map((/** @type {string} */ word) => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.join(' ');
}
