import { firstString, selectStrings, stringToList } from '../actions/extract.js';
import parseAddress from 'parse-address';
import { states } from '../comparisons/constants.js';

/**
 * The street-line components returned by `parse-address`. Any of them may be absent depending on the
 * input; only the ones needed to rebuild the street line are typed here.
 *
 * @typedef {Object} ParsedAddress
 * @property {string} [number]
 * @property {string} [prefix]
 * @property {string} [street]
 * @property {string} [type]
 * @property {string} [suffix]
 * @property {string} [sec_unit_type]
 * @property {string} [sec_unit_num]
 * @property {string} [city]
 * @property {string|null} [state]
 * @property {string} [zip]
 */

/**
 * A postal address parsed from a single combined string. The original text is kept as `fullAddress`
 * next to the components an opt-out form needs, so the form can be filled with the same street/zip
 * the broker displays.
 *
 * @typedef {Object} FullAddress
 * @property {string|null} streetAddress
 * @property {string} city
 * @property {string|null} state
 * @property {string|null} zip
 * @property {string} fullAddress
 */

/**
 * City/state text read from separate elements, before normalisation. An empty string for either
 * means nothing was found there.
 * @typedef {{city: string, state: string}} CityStatePart
 */

/**
 * Extract city/state combos from one of the two shapes a {@link import('../actions/extract.js').CityStateSpec} can take:
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
    if (isNestedCityStateSpec(spec)) {
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
 * Whether a city/state spec is the nested shape (per-row `city`/`state` sub-selectors) rather than a
 * combined "City, ST" selector. Uses an own-property check, not `in`, so a polluted
 * `Object.prototype.city` can't force nested mode.
 *
 * @param {import('../actions/extract.js').CityStateSpec} spec
 * @return {spec is import('../actions/extract.js').NestedCityStateSpec}
 */
function isNestedCityStateSpec(spec) {
    return (
        Object.prototype.hasOwnProperty.call(spec, 'city') &&
        Boolean(/** @type {import('../actions/extract.js').NestedCityStateSpec} */ (spec).city?.selector)
    );
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
 * Extract full postal addresses, keeping the broker's original text next to the parsed
 * street/city/state/zip so an opt-out form can be filled with the same values it displays.
 *
 * @param {import('../actions/extract.js').Select} select
 * @param {import('../actions/extract.js').ElementLike} root
 * @param {import('../actions/extract.js').TextFieldSpec} spec
 * @return {FullAddress[]}
 */
export function extractAddressFull(select, root, spec) {
    return (
        selectStrings(select, root, spec)
            .flatMap((str) => addressStrings(str, spec.separator))
            .map((fullAddress) => ({ fullAddress, parsed: /** @type {ParsedAddress} */ (parseAddress.parseLocation(fullAddress) || {}) }))
            // at least 'city' is required.
            .filter(({ parsed }) => Boolean(parsed.city))
            .map(({ fullAddress, parsed }) => ({
                streetAddress: formatStreetAddress(parsed),
                city: /** @type {string} */ (parsed.city),
                state: parsed.state || null,
                zip: parsed.zip || null,
                fullAddress,
            }))
    );
}

/**
 * A newline conventionally separates an address's street line from its city/state line, so it is
 * treated as intra-address whitespace. This is the default list delimiter for addresses with the
 * newline removed, so a multi-line single address is not split apart. A configured `separator`
 * still overrides it.
 * @type {RegExp}
 */
const ADDRESS_LIST_SEPARATOR = /[|•·]/;

/**
 * Split a selected string into individual address strings, then collapse each one's internal
 * whitespace (including the street/city newline) to single spaces so it parses as one line and its
 * `fullAddress` reads back cleanly. Splitting happens first so a configured newline `separator` or
 * the default delimiters still divide a list of addresses.
 *
 * @param {string} value
 * @param {string} [separator]
 * @return {string[]}
 */
function addressStrings(value, separator) {
    return stringToList(value, separator ?? ADDRESS_LIST_SEPARATOR).map((address) => address.replace(/\s+/g, ' '));
}

/**
 * Reassemble the parsed street-line components into the value an opt-out street-address input
 * expects. Uses `parse-address`'s normalised tokens (e.g. "Street" becomes "St"), which match how
 * brokers store the record; the broker's verbatim text remains available separately as `fullAddress`.
 *
 * @param {ParsedAddress} address
 * @return {string|null}
 */
function formatStreetAddress(address) {
    const unit = [address.sec_unit_type, address.sec_unit_num].filter(Boolean).join(' ');
    const streetAddress = [address.number, address.prefix, address.street, address.type, address.suffix, unit].filter(Boolean).join(' ');
    return streetAddress || null;
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
