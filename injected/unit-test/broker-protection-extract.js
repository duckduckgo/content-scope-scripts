import {
    aggregateFields,
    createProfile,
    parseRegexFromString,
    stringsFromElements,
} from '../src/features/broker-protection/actions/extract.js';
import { cleanArray } from '../src/features/broker-protection/utils/utils.js';

const ROOT = {};

describe('create profiles from extracted data', () => {
    /**
     * A stand-in DOM element exposing `getAttribute` (and any extra props like `innerText`/`href`).
     * @param {Record<string, string|null>} attributes
     * @param {Record<string, any>} [extras]
     */
    const fakeElement = (attributes, extras = {}) => ({
        getAttribute: (/** @type {string} */ name) => attributes[name] ?? null,
        ...extras,
    });

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
                        {
                            streetAddress: '123 fake St',
                            city: 'Miami',
                            state: 'FL',
                            zip: '75215',
                            fullAddress: '123 fake street, Miami, FL 75215',
                        },
                        {
                            streetAddress: '123 fake St',
                            city: 'Dallas',
                            state: 'TX',
                            zip: '75215',
                            fullAddress: '123 fake street, Dallas, TX 75215',
                        },
                    ],
                    street: '123 fake St',
                    city: 'Dallas',
                    state: 'TX',
                    zipCode: '75215',
                },
            },
        ];

        for (const elementExample of elementExamples) {
            const select = () => elementExample.elements;
            const profile = createProfile(select, ROOT, /** @type {any} */ (elementExample.selectors));
            const aggregated = aggregateFields(profile);
            expect(aggregated.addresses).toEqual(elementExample.expected.addresses);
            // The first address in page order is treated as current even though the addresses list
            // is sorted for stable output (Miami appears before Dallas above).
            expect(aggregated.street).toEqual(elementExample.expected.street);
            expect(aggregated.city).toEqual(elementExample.expected.city);
            expect(aggregated.state).toEqual(elementExample.expected.state);
            expect(aggregated.zipCode).toEqual(elementExample.expected.zipCode);
        }
    });

    it('parses the street/city/state/zip and keeps the original text for a full address', () => {
        // The street line and city/state line arrive on separate lines; the newline is collapsed so
        // the address parses as one string and `fullAddress` reads back as a single line.
        const select = () => [{ innerText: '42 W Main St Apt 7,\nAustin, TX 78701-1234' }];
        const profile = createProfile(select, ROOT, {
            addressFull: {
                selector: 'example',
            },
        });

        expect(profile.addressFull).toEqual([
            {
                streetAddress: '42 W Main St Apt 7',
                city: 'Austin',
                state: 'TX',
                zip: '78701',
                fullAddress: '42 W Main St Apt 7, Austin, TX 78701-1234',
            },
        ]);
    });

    it('keeps a secondary unit in the parsed street address', () => {
        const select = () => [{ innerText: '2600 Arville St, Apt A7; Las Vegas, NV 89102-5739' }];
        const profile = createProfile(select, ROOT, { addressFull: { selector: 'example' } });

        expect(profile.addressFull).toEqual([
            {
                streetAddress: '2600 Arville St Apt A7',
                city: 'Las Vegas',
                state: 'NV',
                zip: '89102',
                fullAddress: '2600 Arville St, Apt A7; Las Vegas, NV 89102-5739',
            },
        ]);
    });

    it('splits a delimited list of full addresses without breaking each street/city line', () => {
        const select = () => [{ innerText: '123 Main St, Boston, MA 02108 • 456 Oak Ave, Miami, FL 33101' }];
        const profile = createProfile(select, ROOT, { addressFullList: { selector: 'example' } });

        expect(profile.addressFullList).toEqual([
            { streetAddress: '123 Main St', city: 'Boston', state: 'MA', zip: '02108', fullAddress: '123 Main St, Boston, MA 02108' },
            { streetAddress: '456 Oak Ave', city: 'Miami', state: 'FL', zip: '33101', fullAddress: '456 Oak Ave, Miami, FL 33101' },
        ]);
    });

    it('collapses same city/state history to one entry but anchors the current address to page order', () => {
        const aggregated = aggregateFields({
            addressFullList: [
                { streetAddress: '1 First St', city: 'Reno', state: 'NV', zip: '89501', fullAddress: '1 First St, Reno, NV 89501' },
                { streetAddress: '2 Second St', city: 'Reno', state: 'NV', zip: '89502', fullAddress: '2 Second St, Reno, NV 89502' },
            ],
        });

        // Two distinct streets in the same city/state collapse to a single representative entry: this
        // list is only a city/state-level match aid, so the loss of street granularity is acceptable.
        expect(aggregated.addresses).toEqual([
            { streetAddress: '2 Second St', city: 'Reno', state: 'NV', zip: '89502', fullAddress: '2 Second St, Reno, NV 89502' },
        ]);
        // The address that actually fills the form is taken from page order, not the deduped list.
        expect(aggregated.street).toBe('1 First St');
        expect(aggregated.zipCode).toBe('89501');
    });

    it('flattens the singular current address ahead of address history', () => {
        const aggregated = aggregateFields({
            addressFull: [{ streetAddress: '1 Current St', city: 'Boston', state: 'MA', zip: '02108' }],
            addressFullList: [{ streetAddress: '2 Previous St', city: 'Salem', state: 'MA', zip: '01970' }],
        });

        expect(aggregated.street).toBe('1 Current St');
        expect(aggregated.city).toBe('Boston');
        expect(aggregated.state).toBe('MA');
        expect(aggregated.zipCode).toBe('02108');
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

    it('should exclude common prefixes/suffixes case-insensitively https://app.asana.com/0/0/1215654750660649/f', () => {
        const selectors = {
            relativesList: {
                selector: 'example',
                findElements: true,
            },
        };
        const select = () => [
            { innerText: 'aka: Jane Smith' },
            { innerText: 'Aka: John Smith' },
            { innerText: 'also known as: Jenny Smith' },
            { innerText: 'RESIDES IN Springfield' },
            { innerText: 'resides in Shelbyville' },
            // suffix with no comma so it isn't masked by the relatives "remove after comma" age logic
            { innerText: 'Jack Johnson YEARS OLD' },
        ];
        const scraped = createProfile(select, ROOT, /** @type {any} */ (selectors));
        expect(scraped).toEqual({
            relativesList: ['Jane Smith', 'John Smith', 'Jenny Smith', 'Springfield', 'Shelbyville', 'Jack Johnson'],
        });
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
            {
                // "/pattern/i" splits on either case; the uppercase "AKA" only matches with the flag.
                selectors: {
                    relativesList: {
                        selector: 'example',
                        separator: '/\\s*aka\\s*/i',
                    },
                },
                elements: [{ innerText: 'John Smith aka Jane Doe AKA Bob Jones' }],
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

    describe('stringsFromElements (reading element values)', () => {
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

        it('reads the named attribute instead of the text', () => {
            const element = fakeElement({ 'data-age': '42' }, { innerText: 'ignore me' });
            expect(stringsFromElements([element], { selector: '.age', attribute: 'data-age' })).toEqual(['42']);
        });

        it('strips known leading labels (prefixes) from the text', () => {
            expect(stringsFromElements([{ innerText: 'Related to: John Smith' }], { selector: 'x' })).toEqual(['John Smith']);
            expect(stringsFromElements([{ innerText: 'AKA: Jane Doe' }], { selector: 'x' })).toEqual(['Jane Doe']);
            expect(stringsFromElements([{ innerText: 'RESIDES IN Dallas' }], { selector: 'x' })).toEqual(['Dallas']);
        });
    });

    describe('addressCityState / addressCityStateList', () => {
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

        it('reads city per row when only a city sub-selector is configured, keeping state null', () => {
            const ROW1 = {};
            const ROW2 = {};
            const cells = new Map([
                [ROW1, { './/city': [{ textContent: 'Dallas' }] }],
                [ROW2, { './/city': [{ textContent: 'Reno' }] }],
            ]);
            const select = (root, selector) => {
                if (root === ROOT) return selector === '.row' ? [ROW1, ROW2] : [];
                return cells.get(root)?.[selector ?? ''] ?? [];
            };

            const profile = createProfile(select, ROOT, {
                addressCityStateList: {
                    selector: '.row',
                    findElements: true,
                    city: { selector: './/city' },
                    // no state sub-selector: each row yields a city with state null
                },
            });

            expect(profile).toEqual({
                addressCityStateList: [
                    { city: 'Dallas', state: null },
                    { city: 'Reno', state: null },
                ],
            });
        });
    });

    describe('profileUrl', () => {
        const originalLocation = globalThis.location;
        beforeEach(() => {
            // @ts-expect-error - mocking location
            globalThis.location = { href: 'https://broker.example.com/search?q=john' };
        });
        afterEach(() => {
            globalThis.location = originalLocation;
        });

        it('keeps an absolute attribute value unchanged', () => {
            const element = fakeElement({ 'data-link': 'https://example.com/1234' });
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: '.view-profile', attribute: 'data-link' } });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://example.com/1234',
                identifier: 'https://example.com/1234',
            });
        });

        it('resolves a relative attribute value to an absolute URL against the page', () => {
            const element = fakeElement({ 'data-link': '/profile/John-Smith/BMFrB9EB' });
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: '.view-profile', attribute: 'data-link' } });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://broker.example.com/profile/John-Smith/BMFrB9EB',
                identifier: 'https://broker.example.com/profile/John-Smith/BMFrB9EB',
            });
        });

        it('attribute takes precedence over the resolved href, then resolves to absolute', () => {
            // The element has both a resolved `href` property and a raw `href` attribute; the configured
            // attribute wins, and its (relative) value is resolved against the page like an `<a href>`.
            const element = fakeElement({ href: '/raw/relative' }, { href: 'https://resolved.example.com/abs' });
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: 'a', attribute: 'href' } });
            expect(profile.profileUrl).toEqual({
                profileUrl: 'https://broker.example.com/raw/relative',
                identifier: 'https://broker.example.com/raw/relative',
            });
        });

        it('falls back to null when the attribute is absent', () => {
            const element = fakeElement({});
            const profile = createProfile(() => [element], ROOT, { profileUrl: { selector: 'a', attribute: 'data-missing' } });
            expect(profile.profileUrl).toBeNull();
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

    describe('parseRegexFromString', () => {
        it('returns plain strings unchanged (literal)', () => {
            expect(parseRegexFromString('age:')).toBe('age:');
            expect(parseRegexFromString('Also Known as:')).toBe('Also Known as:');
            expect(parseRegexFromString('')).toBe('');
        });

        it('returns non-string values unchanged', () => {
            expect(parseRegexFromString(undefined)).toBe(undefined);
            expect(parseRegexFromString(null)).toBe(null);
        });

        it('parses "/pattern/" into a flagless RegExp', () => {
            const result = parseRegexFromString('/x/');
            expect(result instanceof RegExp).toBe(true);
            expect(/** @type {RegExp} */ (result).source).toBe('x');
            expect(/** @type {RegExp} */ (result).flags).toBe('');
        });

        it('parses "/pattern/i" into a case-insensitive RegExp', () => {
            const result = parseRegexFromString('/age:?\\s*/i');
            expect(result instanceof RegExp).toBe(true);
            expect(/** @type {RegExp} */ (result).source).toBe('age:?\\s*');
            expect(/** @type {RegExp} */ (result).flags).toBe('i');
        });

        it('leaves strings with unsupported flags literal (e.g. "/x/g")', () => {
            expect(parseRegexFromString('/x/g')).toBe('/x/g');
            expect(parseRegexFromString('/x/gi')).toBe('/x/gi');
        });

        it('leaves degenerate slash strings literal ("/" and "//")', () => {
            // Needs at least one character between the slashes to be a pattern.
            expect(parseRegexFromString('/')).toBe('/');
            expect(parseRegexFromString('//')).toBe('//');
        });

        it('leaves a string that only starts (or only ends) with a slash literal', () => {
            expect(parseRegexFromString('/age')).toBe('/age');
            expect(parseRegexFromString('age/')).toBe('age/');
        });
    });

    describe('afterText / beforeText with regex patterns', () => {
        it('matches case-insensitively with the /i flag (afterText)', () => {
            expect(stringsFromElements([{ innerText: 'AGE: 39' }], { selector: 'x', afterText: '/age:?\\s*/i' })).toEqual(['39']);
            expect(stringsFromElements([{ innerText: 'Age 39' }], { selector: 'x', afterText: '/age:?\\s*/i' })).toEqual(['39']);
        });

        it('matches case-insensitively with the /i flag (beforeText)', () => {
            expect(
                stringsFromElements([{ innerText: 'John Smith AKA Johnny' }], {
                    selector: 'x',
                    beforeText: '/\\s+aka\\s+/i',
                }),
            ).toEqual(['John Smith']);
        });

        it('falls back to the original value when the regex does not match', () => {
            expect(stringsFromElements([{ innerText: 'no label here' }], { selector: 'x', afterText: '/age:?\\s*/i' })).toEqual([
                'no label here',
            ]);
            expect(stringsFromElements([{ innerText: 'no label here' }], { selector: 'x', beforeText: '/\\s+aka\\s+/i' })).toEqual([
                'no label here',
            ]);
        });

        it('keeps everything after the first regex match (multi-occurrence)', () => {
            // match + slice keeps everything after the FIRST match. Literal String#split(x)[1]
            // would instead return only the text between the first two matches ("x2").
            expect(stringsFromElements([{ innerText: 'x1 SEP x2 SEP x3' }], { selector: 'x', afterText: '/\\s*sep\\s*/i' })).toEqual([
                'x2 SEP x3',
            ]);
            expect(stringsFromElements([{ innerText: 'x1 SEP x2 SEP x3' }], { selector: 'x', afterText: ' SEP ' })).toEqual(['x2']);
        });

        it('keeps everything before the first regex match (multi-occurrence)', () => {
            expect(stringsFromElements([{ innerText: 'x1 SEP x2 SEP x3' }], { selector: 'x', beforeText: '/\\s*sep\\s*/i' })).toEqual([
                'x1',
            ]);
        });

        it('does not leak capture groups into the result', () => {
            // match + slice (not String#split) means a capture group never interleaves into the output.
            expect(stringsFromElements([{ innerText: 'Age 39' }], { selector: 'x', afterText: '/(age):?\\s*/i' })).toEqual(['39']);
        });
    });
});
