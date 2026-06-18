import { aggregateFields, createProfile, stringsFromElements } from '../src/features/broker-protection/actions/extract.js';
import { cleanArray } from '../src/features/broker-protection/utils/utils.js';

const ROOT = {};

describe('create profiles from extracted data', () => {
    describe('cleanArray', () => {
        it('should filter out null, undefined, and empty strings', () => {
            /**
             * @type {any[]}
             */
            const items = [
                { input: ['a', '', '  ', '    '], expected: ['a'] },
                { input: 'a', expected: ['a'] },
                { input: ['a'], expected: ['a'] },
                { input: null, expected: [] },
                { input: [], expected: [] },
                { input: ['', '    ', 'def'], expected: ['def'] },
                { input: [null], expected: [] },
                { input: [[[]]], expected: [] },
                { input: [null, '', 0, '  '], expected: [0] },
                { input: [null, '000'], expected: ['000'] },
            ];
            for (const item of items) {
                const actual = cleanArray(item.input);
                expect(actual).toEqual(item.expected);
            }
        });
    });
    it('handles combined, single strings', () => {
        const selectors = {
            name: {
                selector: '.name',
                beforeText: ',',
            },
            age: {
                selector: '.name',
                afterText: ',',
            },
        };

        const elementExamples = [
            { text: 'John smith, 39', expected: { name: 'John smith', age: '39' } },
            { text: 'John smith  , 39', expected: { name: 'John smith', age: '39' } },
            { text: 'John\nsmith  , 39', expected: { name: 'John smith', age: '39' } },
            { text: 'John\nsmith  , 39 anything', expected: { name: 'John smith', age: '39' } },
            { text: '   John smith, 39', expected: { name: 'John smith', age: '39' } },
            { text: '   John smith,39', expected: { name: 'John smith', age: '39' } },
            { text: '   John smith, ~39', expected: { name: 'John smith', age: '39' } },
            { text: 'Jane Doe, 45', expected: { name: 'Jane Doe', age: '45' } },
            { text: '   Robert Johnson,22', expected: { name: 'Robert Johnson', age: '22' } },
            { text: 'Emily Wilson , 29 ', expected: { name: 'Emily Wilson', age: '29' } },
            { text: 'Daniel Miller\n\n, 56', expected: { name: 'Daniel Miller', age: '56' } },
            { text: 'Henry White   ,46', expected: { name: 'Henry White', age: '46' } },
            { text: 'Linda Brown ~ , 35', expected: { name: 'Linda Brown ~', age: '35' } },
            { text: 'Emma Green, 30 any', expected: { name: 'Emma Green', age: '30' } },
            { text: '  Sophia Blue, 26', expected: { name: 'Sophia Blue', age: '26' } },

            // examples where age is absent, so the result should be null
            { text: 'John smith', expected: { name: 'John smith', age: null } },
            { text: 'John smith   ,   ', expected: { name: 'John smith', age: null } },
            { text: 'John smith   \n,\n   ', expected: { name: 'John smith', age: null } },
        ];

        for (const elementExample of elementExamples) {
            const select = () => [{ innerText: elementExample.text }];
            const profile = createProfile(select, ROOT, selectors);
            expect(profile).toEqual(elementExample.expected);
        }
    });
    it('handles multiple strings', () => {
        const elementExamples = [
            {
                selectors: {
                    alternativeNamesList: {
                        selector: 'example',
                        afterText: 'Also Known as:',
                        separator: ',',
                    },
                },
                elements: [{ innerText: 'Also Known as: John Smith, Jon Smith' }],
                expected: {
                    alternativeNamesList: ['John Smith', 'Jon Smith'],
                },
            },
            {
                selectors: {
                    alternativeNamesList: {
                        selector: 'example',
                        findElements: true,
                        afterText: 'Also Known as:',
                    },
                },
                elements: [{ innerText: 'Also Known as: John Smith' }, { innerText: 'Jon Smith' }],
                expected: {
                    alternativeNamesList: ['John Smith', 'Jon Smith'],
                },
            },
            {
                selectors: {
                    alternativeNamesList: {
                        selector: 'example',
                        findElements: true,
                        beforeText: ', ',
                    },
                },
                elements: [{ innerText: 'John Smith, 89' }, { innerText: 'Jon Smith, 78' }],
                expected: {
                    alternativeNamesList: ['John Smith', 'Jon Smith'],
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, elementExample.selectors);
            expect(profile).toEqual(elementExample.expected);
        }
    });
    it('should omit invalid addresses', () => {
        const elementExamples = [
            {
                selectors: {
                    addressCityState: {
                        selector: 'example',
                    },
                },
                elements: [{ innerText: 'anything, here' }],
                expected: {
                    addressCityState: [],
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, elementExample.selectors);
            expect(profile).toEqual(elementExample.expected);
        }
    });

    it('should omit duplicate addresses when aggregated', () => {
        const elementExamples = [
            {
                selectors: {
                    addressCityState: {
                        selector: 'example',
                        findElements: true,
                    },
                },
                elements: [{ innerText: 'Dallas, TX' }, { innerText: 'Dallas, TX' }],
                expected: {
                    addresses: [{ city: 'Dallas', state: 'TX' }],
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, elementExample.selectors);
            const aggregated = aggregateFields(profile);
            expect(aggregated.addresses).toEqual(elementExample.expected.addresses);
        }
    });

    it('should handle addressCityStateList (with string or regex separator)', () => {
        const elementExamples = [
            {
                selectors: {
                    addressCityStateList: {
                        selector: 'example',
                    },
                },
                elements: [{ innerText: 'Dallas, TX • The Colony, TX • Carrollton, TX • +1 more' }],
                expected: {
                    addresses: [
                        { city: 'Carrollton', state: 'TX' },
                        { city: 'Dallas', state: 'TX' },
                        { city: 'The Colony', state: 'TX' },
                    ],
                },
            },
            {
                selectors: {
                    addressCityStateList: {
                        selector: 'example',
                        separator: '/(?<=, [A-Z]{2}), /',
                    },
                },
                elements: [{ innerText: 'Dallas, TX, The Colony, TX, Carrollton, TX' }],
                expected: {
                    addresses: [
                        { city: 'Carrollton', state: 'TX' },
                        { city: 'Dallas', state: 'TX' },
                        { city: 'The Colony', state: 'TX' },
                    ],
                },
            },
            {
                selectors: {
                    addressCityStateList: {
                        selector: 'example',
                        separator: '(?<=, [A-Z]{2}), ',
                    },
                },
                elements: [{ innerText: 'Dallas, TX, The Colony, TX, Carrollton, TX' }],
                expected: {
                    addresses: [{ city: 'Dallas TX The Colony TX Carrollton', state: 'TX' }],
                },
            },
            {
                selectors: {
                    addressCityStateList: {
                        selector: 'example',
                        separator: '/(?<=, [A-Z]{2}), /',
                    },
                },
                elements: [{ innerText: 'Dallas, TX' }],
                expected: {
                    addresses: [{ city: 'Dallas', state: 'TX' }],
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, elementExample.selectors);
            const aggregated = aggregateFields(profile);
            expect(aggregated.addresses).toEqual(elementExample.expected.addresses);
        }
    });

    it('should include addresses from `addressFullList` - https://app.asana.com/0/0/1206856260863051/f', () => {
        const elementExamples = [
            {
                selectors: {
                    addressFullList: {
                        selector: 'example',
                        findElements: true,
                    },
                },
                elements: [{ innerText: '123 fake street,\nDallas, TX 75215' }, { innerText: '123 fake street,\nMiami, FL 75215' }],
                expected: {
                    addresses: [
                        { city: 'Miami', state: 'FL' },
                        { city: 'Dallas', state: 'TX' },
                    ],
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, /** @type {any} */ (elementExample.selectors));
            const aggregated = aggregateFields(profile);
            expect(aggregated.addresses).toEqual(elementExample.expected.addresses);
        }
    });

    it('should exclude common prefixes/suffixes https://app.asana.com/0/0/1206808591178551/f', () => {
        const selectors = {
            relativesList: {
                selector: 'example',
                findElements: true,
                afterText: 'AKA:',
            },
        };
        const select = () => [
            { innerText: 'AKA: Jane Smith' },
            { innerText: 'John Smith - ' },
            { innerText: 'Jimmy Smith +1 more' },
            { innerText: 'Jimmy Smith + 1 more' },
            { innerText: 'Jimmy Smith +3 more like this' },
            { innerText: 'Jill Johnson +4 more' },
            { innerText: 'Jack Johnson - ' },
            { innerText: 'John Smith, 39 - ' },
            { innerText: 'John Smith, 39 years old' },
            { innerText: 'Jimmy Smith, 39 +1 more' },
            { innerText: 'Jimmy Smith, 39 + 1 more' },
            { innerText: 'Jimmy Smith, 39 +3 more like this' },
            { innerText: 'Jill Johnson, 39 +4 more' },
            { innerText: 'Jack Johnson, 39 - ' },
        ];
        const scraped = createProfile(select, ROOT, /** @type {any} */ (selectors));
        expect(scraped).toEqual({
            relativesList: [
                'Jane Smith',
                'John Smith',
                'Jimmy Smith',
                'Jimmy Smith',
                'Jimmy Smith',
                'Jill Johnson',
                'Jack Johnson',
                'John Smith',
                'John Smith',
                'Jimmy Smith',
                'Jimmy Smith',
                'Jimmy Smith',
                'Jill Johnson',
                'Jack Johnson',
            ],
        });
    });

    it('(1) Addresses: general validation [validation] https://app.asana.com/0/0/1206808587680141/f', () => {
        const selectors = {
            name: { selector: '.name' },
            age: { selector: '.age' },
            addressCityState: { selector: '.address', findElements: true },
        };
        const select = (_root, selector) =>
            ({
                '.name': [{ innerText: 'Shane Osbourne' }],
                '.age': [{ innerText: '39' }],
                '.address': [{ innerText: 'Dallas, TX' }, { innerText: 'anything, here' }],
            })[selector ?? ''] ?? [];
        const expected = [{ city: 'Dallas', state: 'TX' }];

        const scraped = createProfile(select, ROOT, /** @type {any} */ (selectors));
        const actual = aggregateFields(scraped);
        expect(actual.addresses).toEqual(expected);
    });

    it('should handle relativesList (with string or regex separator)', () => {
        const elementExamples = [
            {
                selectors: {
                    relativesList: {
                        selector: 'example',
                    },
                },
                elements: [{ innerText: 'Alice Smith • Bob Jones • Carol Lee' }],
                expected: {
                    relatives: ['Alice Smith', 'Bob Jones', 'Carol Lee'],
                },
            },
            {
                selectors: {
                    relativesList: {
                        selector: 'example',
                        separator: ',',
                    },
                },
                elements: [{ innerText: 'Alice Smith, Bob Jones, Carol Lee' }],
                expected: {
                    relatives: ['Alice Smith', 'Bob Jones', 'Carol Lee'],
                },
            },
            {
                selectors: {
                    relativesList: {
                        selector: 'example',
                        separator: '(?<=, [A-Z]{2}), ',
                    },
                },
                elements: [{ innerText: 'Alice Smith, Bob Jones, Carol Lee' }],
                /*
                    This result is a bit unintuitive. First, the regex is invalid, so we treat it as a string (and return no matches).
                    Then, relativesMatcher splits the string by , and returns the first result. This is primarily to work around a few
                    brokers that listed relatives in the following format: "Relative Name, Age"
                */
                expected: {
                    relatives: ['Alice Smith'],
                },
            },
            {
                selectors: {
                    relativesList: {
                        selector: 'example',
                        separator: '/(?<=\\d+), /',
                    },
                },
                elements: [{ innerText: 'John Smith, 39, Jane Doe, 45, Bob Jones, 28' }],
                expected: {
                    relatives: ['Bob Jones', 'Jane Doe', 'John Smith'],
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, elementExample.selectors);
            const aggregated = aggregateFields(profile);
            expect(aggregated.relatives).toEqual(elementExample.expected.relatives);
        }
    });

    it('should sort relatives by name alphabetically', () => {
        const selectors = {
            relativesList: {
                selector: 'example',
                findElements: true,
            },
        };
        const select = () => [
            { innerText: 'Dale Johnson' },
            { innerText: 'John Smith' },
            { innerText: 'Jimmy Smith' },
            { innerText: 'Jill Johnson' },
            { innerText: 'Jack Johnson' },
        ];
        const scraped = createProfile(select, ROOT, /** @type {any} */ (selectors));
        const actual = aggregateFields(scraped);

        expect(actual.relatives).toEqual(['Dale Johnson', 'Jack Johnson', 'Jill Johnson', 'Jimmy Smith', 'John Smith']);
    });

    it('should sort phone numbers numerically', () => {
        const selectors = {
            phoneList: {
                selector: 'example',
                findElements: true,
            },
        };
        const select = () => [
            { innerText: '123-456-7895' },
            { innerText: '123-456-7894' },
            { innerText: '123-456-7892' },
            { innerText: '123-456-7891' },
            { innerText: '123-456-7890' },
        ];
        const scraped = createProfile(select, ROOT, /** @type {any} */ (selectors));
        const actual = aggregateFields(scraped);

        expect(actual.phoneNumbers).toEqual(['1234567890', '1234567891', '1234567892', '1234567894', '1234567895']);
    });

    it('should sort alternative names alphabetically', () => {
        const selectors = {
            alternativeNamesList: {
                selector: 'example',
                findElements: true,
            },
        };
        const select = () => [
            { innerText: 'Jerry Doug' },
            { innerText: 'Marvin Smith' },
            { innerText: 'Roger Star' },
            { innerText: 'Fred Firth' },
        ];
        const scraped = createProfile(select, ROOT, /** @type {any} */ (selectors));
        const actual = aggregateFields(scraped);

        expect(actual.alternativeNames).toEqual(['Fred Firth', 'Jerry Doug', 'Marvin Smith', 'Roger Star']);
    });

    it('should extract innerText by default', () => {
        const element = {
            innerText: 'John Smith, 39',
            textContent: 'Ignore me',
        };
        expect(stringsFromElements([element], { selector: 'example' })).toEqual(['John Smith, 39']);
    });

    it('should extract textElement if innerText is not present', () => {
        const element = {
            textContent: 'John Smith, 39',
        };
        expect(stringsFromElements([element], { selector: 'example' })).toEqual(['John Smith, 39']);
    });

    it('strips known leading labels (prefixes) from the text', () => {
        expect(stringsFromElements([{ innerText: 'Related to: John Smith' }], { selector: 'x' })).toEqual(['John Smith']);
        expect(stringsFromElements([{ innerText: 'AKA: Jane Doe' }], { selector: 'x' })).toEqual(['Jane Doe']);
        expect(stringsFromElements([{ innerText: 'RESIDES IN Dallas' }], { selector: 'x' })).toEqual(['Dallas']);
    });

    describe("'attribute' extraction", () => {
        const originalLocation = globalThis.location;
        beforeEach(() => {
            // @ts-expect-error - mocking location
            globalThis.location = { href: 'https://broker.example.com/search?q=john' };
        });
        afterEach(() => {
            globalThis.location = originalLocation;
        });

        /**
         * @param {Record<string, string|null>} attributes
         * @param {Record<string, any>} [extras]
         */
        const fakeElement = (attributes, extras = {}) => ({
            getAttribute: (/** @type {string} */ name) => attributes[name] ?? null,
            ...extras,
        });

        it('reads a named attribute instead of the element text', () => {
            const element = fakeElement({ 'data-age': '42' }, { innerText: 'ignore me' });
            expect(stringsFromElements([element], { selector: '.age', attribute: 'data-age' })).toEqual(['42']);
        });

        it('keeps an absolute profileUrl attribute unchanged', () => {
            const element = fakeElement({ 'data-link': 'https://example.com/1234' });
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: '.view-profile', attribute: 'data-link' } });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://example.com/1234',
                identifier: 'https://example.com/1234',
            });
        });

        it('resolves a relative profileUrl attribute to an absolute URL', () => {
            const element = fakeElement({ 'data-link': '/profile/John-Smith/BMFrB9EB' });
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: '.view-profile', attribute: 'data-link' } });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://broker.example.com/profile/John-Smith/BMFrB9EB',
                identifier: 'https://broker.example.com/profile/John-Smith/BMFrB9EB',
            });
        });

        it('prefers the profileUrl attribute over the resolved href', () => {
            const element = fakeElement({ href: '/raw/relative' }, { href: 'https://resolved.example.com/abs' });
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: 'a', attribute: 'href' } });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://broker.example.com/raw/relative',
                identifier: 'https://broker.example.com/raw/relative',
            });
        });

        it('returns null when the attribute is absent', () => {
            const element = fakeElement({});
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: 'a', attribute: 'data-missing' } });
            expect(profile.profileUrl).toBeNull();
        });

        it('uses the raw value as the identifier when it is not a valid URL', () => {
            // a relative attribute value can't be parsed by `new URL()`, so the id parser returns it unchanged
            const element = fakeElement({ 'data-link': '/relative/path' });
            const profile = createProfile(() => [element], ROOT, {
                profileUrl: { selector: 'a', attribute: 'data-link', identifierType: 'param', identifier: 'id' },
            });
            expect(profile.profileUrl).toEqual({ profileUrl: '/relative/path', identifier: '/relative/path' });
        });
    });

    describe("source 'pageUrl'", () => {
        const originalLocation = globalThis.location;
        afterEach(() => {
            globalThis.location = originalLocation;
        });

        it('reads profileUrl from the current page URL without touching the DOM', () => {
            // @ts-expect-error - mocking location
            globalThis.location = { href: 'https://example.com/results?id=abc' };
            const select = () => {
                throw new Error('select should not be called for a pageUrl source');
            };
            const profile = createProfile(select, ROOT, { profileUrl: { source: 'pageUrl' } });
            expect(profile).toEqual({
                profileUrl: { profileUrl: 'https://example.com/results?id=abc', identifier: 'https://example.com/results?id=abc' },
            });
        });

        it('parses an identifier param out of the page URL', () => {
            // @ts-expect-error - mocking location
            globalThis.location = { href: 'https://example.com/results?profileId=xyz789' };
            const profile = createProfile(() => [], ROOT, {
                profileUrl: { source: 'pageUrl', identifierType: 'param', identifier: 'profileId' },
            });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://example.com/results?profileId=xyz789',
                identifier: 'xyz789',
            });
        });

        it('coexists with selector-based fields', () => {
            // @ts-expect-error - mocking location
            globalThis.location = { href: 'https://example.com/p?id=1' };
            const select = (_root, selector) => (selector === '.age' ? [{ innerText: '42' }] : []);
            const profile = createProfile(select, ROOT, {
                age: { selector: '.age' },
                profileUrl: { source: 'pageUrl' },
            });
            expect(profile.age).toEqual('42');
            expect(profile.profileUrl).toEqual({ profileUrl: 'https://example.com/p?id=1', identifier: 'https://example.com/p?id=1' });
        });
    });
});

describe('nested city/state extraction', () => {
    it('reads city and state per row, normalizing and keeping a missing state as null', () => {
        const ROW1 = {};
        const ROW2 = {};
        const ROW3 = {};
        const cells = new Map([
            [ROW1, { './/city': [{ textContent: 'Dallas' }], './/state': [{ textContent: 'Florida' }] }],
            [ROW2, { './/city': [{ textContent: 'Reno' }] }], // no state element
            [ROW3, { './/city': [{ textContent: 'Nowhere' }], './/state': [{ textContent: 'ZZ' }] }], // invalid state
        ]);
        const select = (root, selector) => {
            if (root === ROOT) return selector === '.row' ? [ROW1, ROW2, ROW3] : [];
            return cells.get(root)?.[selector ?? ''] ?? [];
        };

        const profile = createProfile(select, ROOT, {
            addressCityStateList: {
                selector: '.row',
                findElements: true,
                city: { selector: './/city' },
                state: { selector: './/state' },
            },
        });

        expect(profile).toEqual({
            addressCityStateList: [
                { city: 'Dallas', state: 'FL' }, // full state name normalized
                { city: 'Reno', state: null }, // no state element → kept as null
                // Nowhere dropped: its state element is present but unparseable
            ],
        });
    });
});
