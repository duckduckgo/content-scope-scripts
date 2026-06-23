import { cleanArray, getElement, getElementMatches, getElements, sortAddressesByStateAndCity } from '../utils/utils.js'; // Assuming you have imported the address comparison function
import { ErrorResponse, ProfileResult, SuccessResponse } from '../types.js';
import { isSameAge } from '../comparisons/is-same-age.js';
import { isSameName } from '../comparisons/is-same-name.js';
import { addressMatch } from '../comparisons/address.js';
import { AgeExtractor } from '../extractors/age.js';
import { AlternativeNamesExtractor, NameExtractor } from '../extractors/name.js';
import { AddressFullExtractor, CityStateExtractor } from '../extractors/address.js';
import { PhoneExtractor } from '../extractors/phone.js';
import { RelativesExtractor } from '../extractors/relatives.js';
import { ProfileHashTransformer, ProfileUrlExtractor } from '../extractors/profile-url.js';

/**
 * Adding these types here so that we can switch to generated ones later
 * @typedef {Record<string, any>} Action
 */

/**
 * How a profile-URL identifier is located: a query `param`, a `path` segment, or the URL `hash`.
 * @typedef {'param'|'path'|'hash'} IdentifierType
 */

/**
 * Where a profile property's value comes from, used instead of a `selector`.
 * - `'pageUrl'`: read the value from the current page URL (`globalThis.location.href`)
 * @typedef {'pageUrl'} SourceType
 */

/**
 * Per-field config telling the extractor where a profile value lives and how to shape it.
 * For example: {
 *   "selector": ".//div[@class='col-sm-24 col-md-8 relatives']//li"
 * }
 * @typedef {Object} ExtractProfileProperty
 * @property {string} [selector] - xpath or css selector (omit when reading from a `source` instead)
 * @property {boolean} [findElements] - whether to get all occurrences of the selector
 * @property {string} [afterText] - get all text after this string
 * @property {string} [beforeText] - get all text before this string
 * @property {string} [separator] - split the text on this string, or use a regex by passing "/pattern/" (e.g. "/(?<=, [A-Z]{2}), /")
 * @property {IdentifierType} [identifierType] - the type (path/param) of the identifier
 * @property {string} [identifier] - the identifier itself (either a param name, or a templated URI)
 * @property {string} [attribute] - read this attribute (e.g. "data-link") instead of the element's text. The raw attribute value is used, except for `profileUrl` which is resolved to an absolute URL against the page (like an `<a href>`)
 * @property {SourceType} [source] - read the value from this source instead of a `selector`
 * @property {CityStateSubField} [city] - sub-field locating the city, relative to each matched element (addressCityState* only)
 * @property {CityStateSubField} [state] - sub-field locating the state, relative to each matched element (addressCityState* only)
 */

/**
 * A `city`/`state` sub-field: an extract-field restricted to locating a single string (a
 * selector plus the usual text transforms), with no `findElements`/`source`/nested fields.
 * @typedef {Pick<ExtractProfileProperty, 'selector' | 'afterText' | 'beforeText' | 'separator' | 'attribute'>} CityStateSubField
 */

/**
 * What an extractor needs to shape an already-selected value — the field config minus the parts
 * used to find elements, since selection has already happened by the time an extractor runs.
 * @typedef {Omit<ExtractProfileProperty, 'selector' | 'findElements'>} ExtractorParams
 */

/**
 * The minimal element shape the extraction pipeline reads, so tests can pass plain objects in place
 * of real DOM nodes.
 * @typedef {Partial<Pick<HTMLElement, 'innerText' | 'textContent' | 'getAttribute'>>} ElementLike
 */

/**
 * Selects elements for `selector` within a `root` scope, returning every match when `all` is set
 * and otherwise the first. Injected into `createProfile` so the DOM dependency can be stubbed in tests.
 * @typedef {(root: ElementLike, selector?: string, all?: boolean) => ElementLike[]} Select
 */

/**
 * The extracted value of a nested city/state field (as opposed to `CityStateSubField`, its config):
 * the transformed text of each sub-field before an extractor parses it. An empty string for either
 * means nothing was found there.
 * @typedef {{city: string, state: string}} CityStatePart
 */

/**
 * A raw candidate value for a profile field, before an extractor parses it: either plain
 * text, or a structured city/state part.
 * @typedef {string | CityStatePart} FieldValue
 */

/**
 * @param {Action} action
 * @param {Record<string, any>} userData
 * @param {Document | HTMLElement} root
 * @return {Promise<import('../types.js').ActionResponse>}
 */
export async function extract(action, userData, root = document) {
    const extractResult = extractProfiles(action, userData, root);

    if ('error' in extractResult) {
        return new ErrorResponse({ actionID: action.id, message: extractResult.error });
    }

    const filteredPromises = extractResult.results
        .filter((x) => x.result === true)
        .map((x) => aggregateFields(x.scrapedData))
        .map((profile) => applyPostTransforms(profile, action.profile));

    const filtered = await Promise.all(filteredPromises);

    // omit the DOM node from data transfer

    const debugResults = extractResult.results.map((result) => result.asData());

    return new SuccessResponse({
        actionID: action.id,
        actionType: action.actionType,
        response: filtered,
        meta: {
            userData,
            extractResults: debugResults,
        },
    });
}

/**
 * The one place DOM selection happens, so it can be injected into `createProfile` and stubbed with
 * fixtures in tests (which have no live `document`/XPath engine).
 *
 * With `all`, returns every match; otherwise the first — falling back to `root` itself when it
 * matches, since a profile element may *be* the target (e.g. a link).
 *
 * @param {ElementLike} root
 * @param {string} [selector]
 * @param {boolean} [all]
 * @return {ElementLike[]}
 */
function select(root, selector, all = false) {
    if (!selector) return [];
    const node = /** @type {HTMLElement} */ (root);
    return all ? cleanArray(getElements(node, selector)) : cleanArray(getElement(node, selector) || getElementMatches(node, selector));
}

/**
 * @param {Action} action
 * @param {Record<string, any>} userData
 * @param {Element | Document} [root]
 * @return {{error: string} | {results: ProfileResult[]}}
 */
export function extractProfiles(action, userData, root = document) {
    const profilesElementList = getElements(root, action.selector) ?? [];

    if (profilesElementList.length === 0) {
        if (!action.noResultsSelector) {
            return { error: 'no root elements found for ' + action.selector };
        }

        // Look for the Results Not Found element
        const foundNoResultsElement = getElement(root, action.noResultsSelector);

        if (!foundNoResultsElement) {
            return { error: 'no results found for ' + action.selector + ' or the no results selector ' + action.noResultsSelector };
        }
    }

    return {
        results: profilesElementList.map((element) => {
            const scrapedData = createProfile(select, element, action.profile);
            const { result, score, matchedFields } = scrapedDataMatchesUserData(userData, scrapedData);
            return new ProfileResult({
                scrapedData,
                result,
                score,
                element,
                matchedFields,
            });
        }),
    };
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
 * @param {Select} select - resolves a field's selector to elements within a scope (injectable for tests)
 * @param {ElementLike} root - the scope selectors are resolved within (a single profile element)
 * @param {Record<string, ExtractProfileProperty | null>} extractData
 * @return {Record<string, any>}
 */
export function createProfile(select, root, extractData) {
    const output = {};
    for (const [key, value] of Object.entries(extractData)) {
        output[key] = extractValue(key, value ?? {}, valuesForProfileField(select, root, key, value)) || null;
    }
    return output;
}

/**
 * Resolve a profile field's raw candidate values from whichever source it declares: a non-DOM
 * `source` (e.g. the page URL), nested `city`/`state` sub-fields, or DOM elements matched by its
 * `selector`. Most fields yield strings; `city`/`state` fields yield `CityStatePart`s, since the
 * two halves may live in separate (even non-adjacent) elements.
 *
 * @param {Select} select
 * @param {ElementLike} root
 * @param {string} key
 * @param {ExtractProfileProperty | null} value - null when a field is explicitly disabled in config (e.g. `"alternativeNamesList": null`)
 * @return {FieldValue[]}
 */
function valuesForProfileField(select, root, key, value) {
    if (value?.source === 'pageUrl') {
        return cleanArray(globalThis.location.href);
    }
    const elements = select(root, value?.selector, value?.findElements);
    if (value?.city?.selector && value?.state?.selector) {
        const cityField = value.city;
        const stateField = value.state;
        return elements.map((row) => ({
            city: firstString(valuesForProfileField(select, row, key, cityField)),
            state: firstString(valuesForProfileField(select, row, key, stateField)),
        }));
    }
    return cleanArray(stringValuesFromElements(elements, key, value));
}

/**
 * The first entry of `values` if it's a string, otherwise `''`.
 * @param {FieldValue[]} values
 * @return {string}
 */
function firstString(values) {
    const [value] = values;
    return typeof value === 'string' ? value : '';
}

/**
 * @param {ElementLike[]} elements
 * @param {string} key
 * @param {ExtractProfileProperty | null} extractField
 * @return {string[]}
 */
export function stringValuesFromElements(elements, key, extractField) {
    return elements.map((element) => {
        let elementValue;

        if (extractField?.attribute && 'getAttribute' in element) {
            elementValue = element.getAttribute?.(extractField.attribute) ?? null;
        } else if ('innerText' in element) {
            elementValue = rules[key]?.(element) ?? element?.innerText ?? null;

            // In instances where we use the text() node test, innerText will be undefined, and we fall back to textContent
        } else if ('textContent' in element) {
            elementValue = rules[key]?.(element) ?? element?.textContent ?? null;
        }

        if (!elementValue) {
            return elementValue;
        }

        if (extractField?.afterText) {
            elementValue = elementValue?.split(extractField.afterText)[1]?.trim() || elementValue;
        }
        // there is a case where we may want to get the text "after" and "before" certain text
        if (extractField?.beforeText) {
            elementValue = elementValue?.split(extractField.beforeText)[0].trim() || elementValue;
        }

        elementValue = removeCommonSuffixesAndPrefixes(elementValue);

        return elementValue;
    });
}

/**
 * Try to filter partial data based on the user's actual profile data
 * @param {Record<string, any>} userData
 * @param {Record<string, any>} scrapedData
 * @return {{score: number, matchedFields: string[], result: boolean}}
 */
export function scrapedDataMatchesUserData(userData, scrapedData) {
    const matchedFields = [];

    // the name matching is always a *requirement*
    if (isSameName(scrapedData.name, userData.firstName, userData.middleName, userData.lastName)) {
        matchedFields.push('name');
    } else {
        return { matchedFields, score: matchedFields.length, result: false };
    }

    // if the age field was present in the scraped data, then we consider this check a *requirement*
    if (scrapedData.age) {
        if (isSameAge(scrapedData.age, userData.age)) {
            matchedFields.push('age');
        } else {
            return { matchedFields, score: matchedFields.length, result: false };
        }
    }

    const addressFields = ['addressCityState', 'addressCityStateList', 'addressFull', 'addressFullList'];

    for (const addressField of addressFields) {
        if (addressField in scrapedData) {
            if (addressMatch(userData.addresses, scrapedData[addressField])) {
                matchedFields.push(addressField);
                return { matchedFields, score: matchedFields.length, result: true };
            }
        }
    }

    if (scrapedData.phone) {
        if (userData.phone === scrapedData.phone) {
            matchedFields.push('phone');
            return { matchedFields, score: matchedFields.length, result: true };
        }
    }

    // if we get here we didn't consider it a match
    return { matchedFields, score: matchedFields.length, result: false };
}

/**
 * @param {Record<string, any>} profile
 */
export function aggregateFields(profile) {
    // addresses
    const combinedAddresses = [
        ...(profile.addressCityState || []),
        ...(profile.addressCityStateList || []),
        ...(profile.addressFullList || []),
        ...(profile.addressFull || []),
    ];
    const addressMap = new Map(combinedAddresses.map((addr) => [`${addr.city},${addr.state}`, addr]));
    const addresses = sortAddressesByStateAndCity([...addressMap.values()]);

    // phone
    const phoneArray = profile.phone || [];
    const phoneListArray = profile.phoneList || [];
    const phoneNumbers = [...new Set([...phoneArray, ...phoneListArray])].sort((a, b) => parseInt(a) - parseInt(b));

    // relatives
    const relatives = [...new Set(profile.relativesList)].sort();

    // aliases
    const alternativeNames = [...new Set(profile.alternativeNamesList)].sort();

    return {
        name: profile.name,
        alternativeNames,
        age: profile.age,
        addresses,
        phoneNumbers,
        relatives,
        ...profile.profileUrl,
    };
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
 *   "elementValues": ["Age 71"]
 * }
 * ```
 *
 * @param {string} outputFieldKey
 * @param {ExtractProfileProperty} extractorParams
 * @param {FieldValue[]} elementValues
 * @return {any}
 */
export function extractValue(outputFieldKey, extractorParams, elementValues) {
    // City/state is the only field that can arrive as structured {city, state} parts; its extractor
    // takes those and plain strings alike. Every other field is string-only, hence the cast below.
    if (outputFieldKey === 'addressCityState' || outputFieldKey === 'addressCityStateList') {
        return new CityStateExtractor().extract(elementValues, extractorParams);
    }

    const strings = /** @type {string[]} */ (elementValues);
    switch (outputFieldKey) {
        case 'age':
            return new AgeExtractor().extract(strings, extractorParams);
        case 'name':
            return new NameExtractor().extract(strings, extractorParams);

        // all addresses are processed the same way
        case 'addressFull':
        case 'addressFullList':
            return new AddressFullExtractor().extract(strings, extractorParams);

        case 'alternativeNamesList':
            return new AlternativeNamesExtractor().extract(strings, extractorParams);
        case 'relativesList':
            return new RelativesExtractor().extract(strings, extractorParams);
        case 'phone':
        case 'phoneList':
            return new PhoneExtractor().extract(strings, extractorParams);
        case 'profileUrl':
            return new ProfileUrlExtractor().extract(strings, extractorParams);
    }
    return null;
}

/**
 * A list of transforms that should be applied to the profile after extraction/aggregation
 *
 * @param {Record<string, any>} profile
 * @param {Record<string, ExtractProfileProperty>} params
 * @return {Promise<Record<string, any>>}
 */
async function applyPostTransforms(profile, params) {
    /** @type {import("../types.js").AsyncProfileTransform[]} */
    const transforms = [
        // creates a hash if needed
        new ProfileHashTransformer(),
    ];

    let output = profile;
    for (const knownTransform of transforms) {
        output = await knownTransform.transform(output, params);
    }

    return output;
}

/**
 * Coerce separator from JSON to a string or RegExp for use with String#split.
 * If separator is a string in the form "/pattern/", the middle is used as a regex pattern.
 *
 * @param {string} [separator]
 * @return {string|RegExp|undefined}
 */
function parseRegexSeparator(separator) {
    if (typeof separator === 'string' && separator.length >= 2 && separator.startsWith('/') && separator.endsWith('/')) {
        return new RegExp(separator.slice(1, -1));
    }
    return separator;
}

/**
 * @param {string} inputList
 * @param {string} [separator] - literal string, or "/pattern/" for regex (JSON-safe)
 * @return {string[]}
 */
export function stringToList(inputList, separator) {
    const defaultSeparator = /[|\n•·]/;
    const splitOn = parseRegexSeparator(separator) || defaultSeparator;
    return cleanArray(inputList.split(splitOn));
}

// For extraction
const rules = {
    profileUrl: function (link) {
        return link?.href ?? null;
    },
};

/**
 * Remove common prefixes and suffixes such as
 *
 * - AKA: <value>
 * - <value> + 1 more
 * - <value> -
 *
 * @param {string} elementValue
 * @return {string}
 */
function removeCommonSuffixesAndPrefixes(elementValue) {
    const regexes = [
        // match text such as +3 more when it appears at the end of a string
        /\+\s*\d+.*$/,
    ];
    // strings that are always safe to remove from the start
    const startsWith = [
        'Associated persons:',
        'AKA:',
        'Known as:',
        'Also known as:',
        'Has lived in:',
        'Used to live:',
        'Used to live in:',
        'Lives in:',
        'Related to:',
        'No other aliases.',
        'RESIDES IN',
    ];

    // strings that are always safe to remove from the end
    const endsWith = [' -', 'years old'];

    for (const regex of regexes) {
        elementValue = elementValue.replace(regex, '').trim();
    }
    for (const prefix of startsWith) {
        if (elementValue.startsWith(prefix)) {
            elementValue = elementValue.slice(prefix.length).trim();
        }
    }
    for (const suffix of endsWith) {
        if (elementValue.endsWith(suffix)) {
            elementValue = elementValue.slice(0, 0 - suffix.length).trim();
        }
    }

    return elementValue;
}
