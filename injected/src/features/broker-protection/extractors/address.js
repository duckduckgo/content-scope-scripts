import { firstString, selectStrings, stringToList } from '../actions/extract.js';
import parseAddress from 'parse-address';
import { states } from '../comparisons/constants.js';

/**
 * City/state text read from separate elements, before normalisation. An empty string for either
 * means nothing was found there.
 * @typedef {{city: string, state: string}} CityStatePart
 */

/**
 * Extract city/state combos from one of the three shapes a {@link import('../actions/extract.js').CityStateSpec} can take:
 * - combined: `selector` resolves to "City, ST" text (optionally a delimited list)
 * - nested: `selector` resolves to each result row, with `city` (and optional `state`) sub-selectors
 *   read relative to that row. `state` may be omitted, or may even reach outside the row.
 *
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').CityStateSpec} spec
 * @return {{ city: string, state: string|null }[]}
 */
export function extractCityState(select, root, spec) {
    if ('city' in spec && spec.city) {
        const { city, state } = spec;
        return select(root, spec.selector, spec.findElements).flatMap((row) =>
            cityStatePartToCombo({
                city: firstString(selectStrings(select, row, city)),
                state: state ? firstString(selectStrings(select, row, state)) : '',
            }),
        );
    }
    return cityStateCombosFromStrings(selectStrings(select, root, spec), spec.separator);
}

/**
 * Parse combined "City, ST" strings (each possibly a delimited list of combos) into city/state combos.
 *
 * @param {string[]} strings
 * @param {string} [separator]
 * @return {{ city: string, state: string|null }[]}
 */
export function cityStateCombosFromStrings(strings, separator) {
    return strings.flatMap((value) => getCityStateCombos(stringToList(value, separator)));
}

/**
 * Convert a structured `{city, state}` part (city and state read from separate elements) into a
 * city/state combo. City is required; state is optional: when the state element yields no text the
 * combo is kept as `{ city, state: null }`. That's deliberate — it lets us scrape pages that don't
 * show a state anywhere. A state that is present but unrecognised drops the combo.
 *
 * @param {CityStatePart} part
 * @return {{ city: string, state: string|null }[]}
 */
export function cityStatePartToCombo({ city, state }) {
    const trimmedCity = city.trim();
    if (!trimmedCity) return [];

    const trimmedState = state.trim();
    if (!trimmedState) return [{ city: trimmedCity, state: null }];

    const normalized = normalizeState(trimmedState);
    return normalized ? [{ city: trimmedCity, state: normalized }] : [];
}

/**
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {{ city: string, state: string|null }[]}
 */
export function extractAddressFull(select, root, spec) {
    return (
        selectStrings(select, root, spec)
            .map((str) => str.replace('\n', ' '))
            .flatMap((str) => stringToList(str, spec.separator))
            .map((str) => parseAddress.parseLocation(str) || {})
            // at least 'city' is required.
            .filter((parsed) => Boolean(parsed?.city))
            .map((addr) => {
                return { city: addr.city, state: addr.state || null };
            })
    );
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
    if (Object.prototype.hasOwnProperty.call(states, upper)) {
        // own-prop check, not `in`, to ignore a polluted prototype
        return upper;
    }

    if (stateNameToAbbreviation === null) {
        stateNameToAbbreviation = /** @type {Record<string, string>} */ (Object.create(null)); // null proto, no inherited keys
        for (const [abbreviation, name] of Object.entries(states)) {
            stateNameToAbbreviation[name.toLowerCase()] = abbreviation;
        }
    }

    return stateNameToAbbreviation[trimmed.toLowerCase()] ?? null;
}
