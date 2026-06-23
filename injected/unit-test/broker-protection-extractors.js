import fc from 'fast-check';
import { cleanArray } from '../src/features/broker-protection/utils/utils.js';
import { PhoneExtractor } from '../src/features/broker-protection/extractors/phone.js';
import { ProfileUrlExtractor } from '../src/features/broker-protection/extractors/profile-url.js';
import { CityStateExtractor, normalizeState } from '../src/features/broker-protection/extractors/address.js';

describe('individual extractors', () => {
    describe('PhoneExtractor', () => {
        it('should extract digits only', () => {
            fc.assert(
                fc.property(fc.array(fc.string()), (s) => {
                    const cleanInput = cleanArray(s);
                    const numbers = new PhoneExtractor().extract(cleanInput, {});
                    const cleanOutput = cleanArray(numbers);
                    return cleanOutput.every((num) => num.match(/^\d+$/));
                }),
            );
        });
    });
    describe('ProfileUrlExtractor', () => {
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
                const profile = new ProfileUrlExtractor().extract([profileUrl], { identifierType, identifier });

                expect(profile?.identifier).toEqual(expected);
            });
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

describe('CityStateExtractor', () => {
    /**
     * @param {Array<string | {city: string, state: string}>} values
     * @param {Record<string, any>} [params]
     */
    const extract = (values, params = {}) => new CityStateExtractor().extract(values, params);

    describe('structured {city, state} parts', () => {
        it('keeps the city and normalizes the state', () => {
            expect(extract([{ city: 'Orlando', state: 'Florida' }])).toEqual([{ city: 'Orlando', state: 'FL' }]);
        });

        it('trims surrounding whitespace on the city and state', () => {
            expect(extract([{ city: '  Dallas ', state: ' tx ' }])).toEqual([{ city: 'Dallas', state: 'TX' }]);
        });

        it('keeps a part with no state as { state: null }', () => {
            expect(extract([{ city: 'Dallas', state: '' }])).toEqual([{ city: 'Dallas', state: null }]);
        });

        it('drops a part whose state is present but unparseable', () => {
            expect(extract([{ city: 'Nowhere', state: 'XX' }])).toEqual([]);
        });

        it('drops a part with no city', () => {
            expect(extract([{ city: '', state: 'TX' }])).toEqual([]);
        });

        it('handles several parts, dropping only the invalid ones', () => {
            expect(
                extract([
                    { city: 'Dallas', state: 'TX' },
                    { city: 'Reno', state: '' },
                    { city: 'Nowhere', state: 'ZZ' },
                    { city: '', state: 'TX' },
                ]),
            ).toEqual([
                { city: 'Dallas', state: 'TX' },
                { city: 'Reno', state: null },
            ]);
        });
    });

    describe('combined "City, ST" strings', () => {
        it('splits a "City, ST" string', () => {
            expect(extract(['Dallas, TX'])).toEqual([{ city: 'Dallas', state: 'TX' }]);
        });

        it('splits a delimited list of combos', () => {
            expect(extract(['Dallas, TX • Austin, TX'])).toEqual([
                { city: 'Dallas', state: 'TX' },
                { city: 'Austin', state: 'TX' },
            ]);
        });

        it('normalizes a full state name in combined text', () => {
            expect(extract(['Orlando, Florida'])).toEqual([{ city: 'Orlando', state: 'FL' }]);
        });

        it('drops combined text with an invalid state', () => {
            expect(extract(['Nowhere, ZZ'])).toEqual([]);
        });
    });

    it('accepts a mix of strings and structured parts', () => {
        expect(extract(['Dallas, TX', { city: 'Orlando', state: 'Florida' }])).toEqual([
            { city: 'Dallas', state: 'TX' },
            { city: 'Orlando', state: 'FL' },
        ]);
    });
});
