import fc from 'fast-check';
import { cleanArray } from '../src/features/broker-protection/utils/utils.js';
import { extractPhone } from '../src/features/broker-protection/extractors/phone.js';
import { extractProfileUrl } from '../src/features/broker-protection/extractors/profile-url.js';
import {
    cityStateCombosFromStrings,
    cityStatePartToCombo,
    extractAddressFull,
    extractCityState,
    normalizeState,
} from '../src/features/broker-protection/extractors/address.js';

const ROOT = {};

/**
 * @param {Record<string, string|null>} attributes
 * @param {Record<string, any>} [extras]
 */
const fakeElement = (attributes, extras = {}) => ({
    getAttribute: (/** @type {string} */ name) => attributes[name] ?? null,
    ...extras,
});

describe('individual extractors', () => {
    describe('extractPhone', () => {
        it('should extract digits only', () => {
            fc.assert(
                fc.property(fc.array(fc.string()), (s) => {
                    const cleanInput = cleanArray(s);
                    // feed each string in as an element's text and assert the parsed numbers are digit-only
                    const numbers = extractPhone(() => cleanInput.map((str) => ({ innerText: str })), ROOT, {});
                    const cleanOutput = cleanArray(numbers);
                    return cleanOutput.every((num) => num.match(/^\d+$/));
                }),
            );
        });
    });
    describe('extractProfileUrl', () => {
        /**
         * @typedef {import("../src/features/broker-protection/actions/extract.js").IdentifierType} IdentifierType
         */
        const testCases = [
            {
                identifierType: /** @type {IdentifierType} */ ('path'),
                // eslint-disable-next-line no-template-curly-in-string
                identifier: 'https://duckduckgo.com/my/profile/${firstName}-${lastName}/${id}',
                profileUrl: 'https://duckduckgo.com/my/profile/john-smith/223',
                expected: 'https://duckduckgo.com/my/profile/john-smith/223',
            },
            {
                identifierType: /** @type {IdentifierType} */ ('param'),
                identifier: 'pid',
                profileUrl: 'https://duckduckgo.com/my/profile?id=test',
                expected: 'https://duckduckgo.com/my/profile?id=test',
            },
            {
                identifierType: /** @type {IdentifierType} */ ('param'),
                // eslint-disable-next-line no-template-curly-in-string
                identifier: 'https://duckduckgo.com/my/profile/${firstName}-${lastName}/${id}',
                profileUrl: 'https://duckduckgo.com/my/profile/john-smith/223',
                expected: 'https://duckduckgo.com/my/profile/john-smith/223',
            },
            {
                identifierType: /** @type {IdentifierType} */ ('param'),
                identifier: 'id',
                profileUrl: 'https://duckduckgo.com/my/profile?id=test',
                expected: 'test',
            },
        ];

        testCases.forEach(({ identifierType, identifier, profileUrl, expected }) => {
            it(`should return the correct identifier when identifierType is "${identifierType}" and identifier is "${identifier}"`, () => {
                const profile = extractProfileUrl(() => [{ innerText: profileUrl }], ROOT, { identifierType, identifier });

                expect(profile?.identifier).toEqual(expected);
            });
        });
    });

    describe('extractAddressFull', () => {
        it('extracts street and zip from a plain full-address string', () => {
            const select = () => [{ innerText: '2323 Bay Hill Dr, Baytown TX 77523' }];
            expect(extractAddressFull(select, ROOT, { selector: '.address' })).toEqual([
                { city: 'Baytown', state: 'TX', extras: { street: '2323 Bay Hill Dr', zip: '77523' } },
            ]);
        });

        it('reads a full address out of a title attribute (afterText)', () => {
            const select = () => [fakeElement({ title: 'the address 2323 Bay Hill Dr, Baytown TX 77523' })];
            expect(extractAddressFull(select, ROOT, { selector: 'a', attribute: 'title', afterText: 'the address ' })).toEqual([
                { city: 'Baytown', state: 'TX', extras: { street: '2323 Bay Hill Dr', zip: '77523' } },
            ]);
        });

        it('tidies a messy href slug (lowercase city/state, hyphenated number) into cased output', () => {
            const select = () => [fakeElement({ href: '/address/14155-walton-dr/manassas-va-20112' })];
            expect(extractAddressFull(select, ROOT, { selector: 'a', attribute: 'href', afterText: 'address/' })).toEqual([
                { city: 'Manassas', state: 'VA', extras: { street: '14155 Walton Dr', zip: '20112' } },
            ]);
        });

        it('keeps punctuation inside a street part, trimming only what trails it', () => {
            const select = () => [{ innerText: '1234-5 Elm Ave, Dallas, TX 75215' }];
            expect(extractAddressFull(select, ROOT, { selector: '.address' })).toEqual([
                { city: 'Dallas', state: 'TX', extras: { street: '1234-5 Elm Ave', zip: '75215' } },
            ]);
        });

        it('omits an extras part parse-address did not find (zip absent → street only)', () => {
            const select = () => [{ innerText: 'County Road, Dallas, TX' }];
            expect(extractAddressFull(select, ROOT, { selector: '.address' })).toEqual([
                { city: 'Dallas', state: 'TX', extras: { street: 'County Rd' } },
            ]);
        });
    });

    describe('extractCityState', () => {
        it('yields plain {city, state} combos, never extras', () => {
            const select = () => [{ innerText: 'Dallas, TX' }];
            const combos = extractCityState(select, ROOT, { selector: '.loc' });
            expect(combos).toEqual([{ city: 'Dallas', state: 'TX' }]);
            expect('extras' in combos[0]).toBe(false);
        });
    });
});

describe('normalizeState', () => {
    const cases = [
        // abbreviations (any case) -> uppercase abbreviation
        { input: 'FL', expected: 'FL' },
        { input: 'fl', expected: 'FL' },
        { input: ' Fl ', expected: 'FL' },
        { input: 'DC', expected: 'DC' },
        // full names (case-insensitive) -> abbreviation
        { input: 'Florida', expected: 'FL' },
        { input: 'florida', expected: 'FL' },
        { input: 'FLORIDA ', expected: 'FL' },
        { input: 'New York', expected: 'NY' },
        { input: 'district of columbia', expected: 'DC' },
        // unrecognised -> null
        { input: 'XX', expected: null },
        { input: 'Florrida', expected: null },
        { input: '', expected: null },
        { input: '   ', expected: null },
    ];

    cases.forEach(({ input, expected }) => {
        it(`normalizes "${input}" to ${JSON.stringify(expected)}`, () => {
            expect(normalizeState(input)).toEqual(expected);
        });
    });
});

describe('city/state combos', () => {
    describe('cityStatePartToCombo (structured {city, state} parts)', () => {
        it('keeps the city and normalizes the state', () => {
            expect(cityStatePartToCombo({ city: 'Orlando', state: 'Florida' })).toEqual([{ city: 'Orlando', state: 'FL' }]);
        });

        it('trims surrounding whitespace on the city and state', () => {
            expect(cityStatePartToCombo({ city: '  Dallas ', state: ' tx ' })).toEqual([{ city: 'Dallas', state: 'TX' }]);
        });

        it('keeps a part with no state as { state: null }', () => {
            expect(cityStatePartToCombo({ city: 'Dallas', state: '' })).toEqual([{ city: 'Dallas', state: null }]);
        });

        it('drops a part whose state is present but unparseable', () => {
            expect(cityStatePartToCombo({ city: 'Nowhere', state: 'XX' })).toEqual([]);
        });

        it('drops a part with no city', () => {
            expect(cityStatePartToCombo({ city: '', state: 'TX' })).toEqual([]);
        });

        it('handles several parts, dropping only the invalid ones', () => {
            const parts = [
                { city: 'Dallas', state: 'TX' },
                { city: 'Reno', state: '' },
                { city: 'Nowhere', state: 'ZZ' },
                { city: '', state: 'TX' },
            ];
            expect(parts.flatMap(cityStatePartToCombo)).toEqual([
                { city: 'Dallas', state: 'TX' },
                { city: 'Reno', state: null },
            ]);
        });
    });

    describe('cityStateCombosFromStrings (combined "City, ST" strings)', () => {
        it('splits a "City, ST" string', () => {
            expect(cityStateCombosFromStrings(['Dallas, TX'])).toEqual([{ city: 'Dallas', state: 'TX' }]);
        });

        it('splits a space-separated "City ST" string (no comma)', () => {
            expect(cityStateCombosFromStrings(['Chicago IL'])).toEqual([{ city: 'Chicago', state: 'IL' }]);
        });

        it('strips a trailing zip code', () => {
            expect(cityStateCombosFromStrings(['Chicago IL 60611', 'River Forest IL 60305-1243'])).toEqual([
                { city: 'Chicago', state: 'IL' },
                { city: 'River Forest', state: 'IL' },
            ]);
        });

        it('skips a partial single-token entry', () => {
            expect(cityStateCombosFromStrings(['Fores...'])).toEqual([]);
        });

        it('splits a delimited list of combos', () => {
            expect(cityStateCombosFromStrings(['Dallas, TX • Austin, TX'])).toEqual([
                { city: 'Dallas', state: 'TX' },
                { city: 'Austin', state: 'TX' },
            ]);
        });

        it('normalizes a full state name in combined text', () => {
            expect(cityStateCombosFromStrings(['Orlando, Florida'])).toEqual([{ city: 'Orlando', state: 'FL' }]);
        });

        it('drops combined text with an invalid state', () => {
            expect(cityStateCombosFromStrings(['Nowhere, ZZ'])).toEqual([]);
        });
    });
});
