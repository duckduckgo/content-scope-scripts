// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Extractor } from '../types.js';
import { stringToList } from '../actions/extract.js';
import parseAddress from 'parse-address';
import { states } from '../comparisons/constants.js';

/**
 * @implements {Extractor<{city:string; state: string|null}[]>}
 */
export class CityStateExtractor {
    /**
     * Accepts either plain strings (combined "City, ST" text, split + parsed here) or
     * structured `{city, state}` parts (city and state read from separate elements).
     *
     * @param {Array<string | import('../actions/extract.js').CityStatePart>} values
     * @param {import('../actions/extract.js').ExtractorParams} extractorParams
     */
    extract(values, extractorParams) {
        return values.flatMap((value) =>
            typeof value === 'string' ? getCityStateCombos(stringToList(value, extractorParams.separator)) : cityStatePartToCombo(value),
        );
    }
}

/**
 * Convert a structured `{city, state}` part (text from dedicated sub-elements) into a
 * city/state combo. The city is trusted; the state is optional and normalised:
 * - no state text → `{ city, state: null }` (kept, like `AddressFullExtractor`)
 * - unparseable state text → dropped (consistent with `getCityStateCombos`)
 *
 * @param {import('../actions/extract.js').CityStatePart} part
 * @return {{ city: string, state: string|null }[]}
 */
function cityStatePartToCombo({ city, state }) {
    const trimmedCity = city.trim();
    if (!trimmedCity) return [];

    const trimmedState = state.trim();
    if (!trimmedState) return [{ city: trimmedCity, state: null }];

    const normalized = normalizeState(trimmedState);
    return normalized ? [{ city: trimmedCity, state: normalized }] : [];
}

/**
 * @implements {Extractor<{city:string; state: string|null}[]>}
 */
export class AddressFullExtractor {
    /**
     * @param {string[]} strs
     * @param {import('../actions/extract.js').ExtractorParams} extractorParams
     */
    extract(strs, extractorParams) {
        return (
            strs
                .map((str) => str.replace('\n', ' '))
                .map((str) => stringToList(str, extractorParams.separator))
                .flat()
                .map((str) => parseAddress.parseLocation(str) || {})
                // at least 'city' is required.
                .filter((parsed) => Boolean(parsed?.city))
                .map((addr) => {
                    return { city: addr.city, state: addr.state || null };
                })
        );
    }
}

/**
 * @param {string[]} inputList
 * @return {{ city: string, state: string|null }[] }
 */
function getCityStateCombos(inputList) {
    const output = [];
    for (let item of inputList) {
        let words;
        // Strip out the zip code since we're only interested in city/state here.
        item = item.replace(/,?\s*\d{5}(-\d{4})?/, '');

        // Replace any commas at the end of the string that could confuse the city/state split.
        item = item.replace(/,$/, '');

        if (item.includes(',')) {
            words = item.split(',').map((item) => item.trim());
        } else {
            words = item.split(' ').map((item) => item.trim());
        }
        // we are removing this partial city/state combos at the end (i.e. Chi...)
        if (words.length === 1) {
            continue;
        }

        const stateCandidate = words.pop();
        const city = words.join(' ');

        // Normalise the candidate to a state abbreviation. Full state names (e.g. "Florida")
        // are accepted and converted; anything we don't recognise is discarded.
        const state = stateCandidate ? normalizeState(stateCandidate) : null;
        if (stateCandidate && !state) {
            continue;
        }

        output.push({ city, state });
    }
    return output;
}

/**
 * Reverse lookup of the `states` constant: lowercased full state name -> uppercase abbreviation.
 * Built lazily and memoised, since most tokens are already abbreviations and never need it.
 * @type {Record<string, string> | null}
 */
let stateNameToAbbreviation = null;

/**
 * Normalise a state token to its uppercase abbreviation.
 *
 * Accepts either a valid abbreviation ("fl", "FL") or a full state name ("Florida", "florida"),
 * matched case-insensitively. Returns null for anything we don't recognise.
 *
 * @param {string} token
 * @return {string|null}
 */
export function normalizeState(token) {
    const trimmed = token.trim();
    if (!trimmed) {
        return null;
    }

    const upper = trimmed.toUpperCase();
    if (upper in states) {
        return upper;
    }

    if (stateNameToAbbreviation === null) {
        stateNameToAbbreviation = {};
        for (const [abbreviation, name] of Object.entries(states)) {
            stateNameToAbbreviation[name.toLowerCase()] = abbreviation;
        }
    }

    return stateNameToAbbreviation[trimmed.toLowerCase()] ?? null;
}
