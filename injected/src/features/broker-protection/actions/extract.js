import { cleanArray, getElement, getElementMatches, getElements, sortAddressesByStateAndCity } from '../utils/utils.js'; // Assuming you have imported the address comparison function
import { ErrorResponse, ProfileResult, SuccessResponse } from '../types.js';
import { isSameAge } from '../comparisons/is-same-age.js';
import { isSameName } from '../comparisons/is-same-name.js';
import { addressMatch } from '../comparisons/address.js';
import { extractAge } from '../extractors/age.js';
import { extractAlternativeNames, extractName } from '../extractors/name.js';
import { extractAddressFull, extractCityState } from '../extractors/address.js';
import { extractPhone } from '../extractors/phone.js';
import { extractRelatives } from '../extractors/relatives.js';
import { extractProfileUrl, ProfileHashTransformer } from '../extractors/profile-url.js';

/**
 * Adding these types here so that we can switch to generated ones later
 * @typedef {Record<string, any>} Action
 */

/**
 * How a profile-URL identifier is located: a query `param`, a `path` segment, or the URL `hash`.
 * @typedef {'param'|'path'|'hash'} IdentifierType
 */

/**
 * The text-shaping knobs every selector-based field shares: where the value lives and how to clean
 * the text once read. This is the spec for the majority of fields (name, age, phone, …); city/state
 * and profileUrl extend it (see {@link CityStateSpec}, {@link ProfileUrlSpec}).
 *
 * For example: { "selector": ".//div[@class='col-sm-24 col-md-8 relatives']//li" }
 *
 * @typedef {Object} TextFieldSpec
 * @property {string} [selector] - xpath or css selector
 * @property {boolean} [findElements] - whether to get all occurrences of the selector
 * @property {string} [afterText] - get all text after this string
 * @property {string} [beforeText] - get all text before this string
 * @property {string} [separator] - split the text on this string, or use a regex by passing "/pattern/" (e.g. "/(?<=, [A-Z]{2}), /")
 * @property {string} [attribute] - read this attribute (e.g. "data-link") instead of the element's text
 */

/**
 * City/state can be located three ways, hence a union discriminated on the presence of `city`:
 * - combined: a `selector` whose text is "City, ST" (a plain {@link TextFieldSpec})
 * - nested + state: a `selector` for each result row, with `city` and `state` sub-selectors read
 *   relative to that row (the state selector may even reach outside the row, e.g. a shared `<h1>`)
 * - nested, city only: as above but with `state` omitted (kept as `{ state: null }`)
 *
 * @typedef {TextFieldSpec | (TextFieldSpec & { city: TextFieldSpec, state?: TextFieldSpec })} CityStateSpec
 */

/**
 * Extends {@link TextFieldSpec} with the knobs unique to profileUrl: a non-DOM `source`, and
 * `identifier`/`identifierType` for parsing an id out of the resolved URL.
 *
 * @typedef {TextFieldSpec & { source?: 'pageUrl', identifier?: string, identifierType?: IdentifierType }} ProfileUrlSpec
 * @property {'pageUrl'} [source] - read the value from the current page URL (`globalThis.location.href`) instead of a `selector`
 * @property {string} [identifier] - the identifier itself (either a param name, or a templated URI)
 * @property {IdentifierType} [identifierType] - how to locate the identifier within the URL
 */

/**
 * Any single field's spec. Most fields are a plain {@link TextFieldSpec}.
 * @typedef {TextFieldSpec | CityStateSpec | ProfileUrlSpec} FieldSpec
 */

/**
 * The `profile` block of an `extract` action: a map of output field name -> how to locate that
 * field. `null` disables a field. This is the per-broker config the native layer sends; the field
 * keys are a contract with that config.
 *
 * @typedef {Object} ProfileSpec
 * @property {TextFieldSpec | null} [name]
 * @property {TextFieldSpec | null} [age]
 * @property {TextFieldSpec | null} [alternativeNamesList]
 * @property {TextFieldSpec | null} [relativesList]
 * @property {TextFieldSpec | null} [phone]
 * @property {TextFieldSpec | null} [phoneList]
 * @property {TextFieldSpec | null} [addressFull]
 * @property {TextFieldSpec | null} [addressFullList]
 * @property {CityStateSpec | null} [addressCityState]
 * @property {CityStateSpec | null} [addressCityStateList]
 * @property {ProfileUrlSpec | null} [profileUrl]
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
 * Each profile field is parsed by a plain `(select, root, fieldSpec) -> value` function. This map
 * is the single point where an output field name selects its parser. Several output keys alias the
 * same parser (e.g. `phone`/`phoneList`).
 *
 * @type {Record<string, (select: Select, root: ElementLike, spec: any) => any>}
 */
const extractors = {
    name: extractName,
    age: extractAge,
    alternativeNamesList: extractAlternativeNames,
    relativesList: extractRelatives,
    phone: extractPhone,
    phoneList: extractPhone,
    addressFull: extractAddressFull,
    addressFullList: extractAddressFull,
    addressCityState: extractCityState,
    addressCityStateList: extractCityState,
    profileUrl: extractProfileUrl,
};

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
 * @param {ProfileSpec} profileSpec - the `profile` block of an extract action; `null` disables a field
 * @return {Record<string, any>}
 */
export function createProfile(select, root, profileSpec) {
    const output = {};
    for (const [field, fieldSpec] of Object.entries(profileSpec)) {
        const extractField = extractors[field];
        if (!extractField) continue;
        output[field] = extractField(select, root, fieldSpec ?? {}) || null;
    }
    return output;
}

/**
 * Select elements for a field and shape each match into a cleaned string. This is the common path
 * every selector-based field uses to turn its `spec` into candidate strings.
 *
 * @param {Select} select
 * @param {ElementLike} root
 * @param {TextFieldSpec} spec
 * @return {string[]}
 */
export function selectStrings(select, root, spec) {
    return cleanArray(stringsFromElements(select(root, spec.selector, spec.findElements), spec));
}

/**
 * Shape each element into a string: read its text (or `attribute`), then apply the field's
 * `afterText`/`beforeText`/common-affix transforms. A falsy raw value is passed through untouched
 * (and later dropped by `cleanArray`).
 *
 * @param {ElementLike[]} elements
 * @param {TextFieldSpec} spec
 * @return {(string | null | undefined)[]}
 */
export function stringsFromElements(elements, spec) {
    return elements.map((element) => {
        const value = readElementText(element, spec);
        return value ? shapeString(value, spec) : value;
    });
}

/**
 * Read an element's value: the named `attribute` if set, otherwise the element's text (`innerText`,
 * falling back to `textContent` for text() node tests where innerText is undefined).
 *
 * @param {ElementLike} element
 * @param {TextFieldSpec} spec
 * @return {string | null | undefined}
 */
function readElementText(element, spec) {
    if (spec.attribute && 'getAttribute' in element) {
        return element.getAttribute?.(spec.attribute) ?? null;
    }
    if ('innerText' in element) {
        return element.innerText ?? null;
    }
    if ('textContent' in element) {
        return element.textContent ?? null;
    }
    return undefined;
}

/**
 * Apply a field's text transforms: keep the text after `afterText` and/or before `beforeText`, then
 * strip common prefixes/suffixes.
 *
 * @param {string} value
 * @param {TextFieldSpec} spec
 * @return {string}
 */
export function shapeString(value, spec) {
    if (spec.afterText) {
        value = value.split(spec.afterText)[1]?.trim() || value;
    }
    // there is a case where we may want to get the text "after" and "before" certain text
    if (spec.beforeText) {
        value = value.split(spec.beforeText)[0].trim() || value;
    }
    return removeCommonSuffixesAndPrefixes(value);
}

/**
 * Returns `''` rather than `undefined` for an empty or non-string input, since callers feed the
 * result straight into string operations.
 * @param {string[]} strings
 * @return {string}
 */
export function firstString(strings) {
    const [value] = strings;
    return typeof value === 'string' ? value : '';
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
 * A list of transforms that should be applied to the profile after extraction/aggregation
 *
 * @param {Record<string, any>} profile
 * @param {ProfileSpec} profileSpec - the original `profile` block from the action
 * @return {Promise<Record<string, any>>}
 */
async function applyPostTransforms(profile, profileSpec) {
    /** @type {import("../types.js").AsyncProfileTransform[]} */
    const transforms = [
        // creates a hash if needed
        new ProfileHashTransformer(),
    ];

    let output = profile;
    for (const knownTransform of transforms) {
        output = await knownTransform.transform(output, profileSpec);
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
