import { createProfile } from '../src/features/broker-protection/actions/extract.js'

describe('create profiles from extracted data', () => {
    it('handles combined, single strings', () => {
        const selectors = {
            name: {
                selector: '.name',
                beforeText: ','
            },
            age: {
                selector: '.name',
                afterText: ','
            }
        }

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
            { text: 'John smith   \n,\n   ', expected: { name: 'John smith', age: null } }
        ]

        for (const elementExample of elementExamples) {
            const elementFactory = () => {
                return [{ innerText: elementExample.text }]
            }
            const profile = createProfile(elementFactory, selectors)
            expect(profile).toEqual(elementExample.expected)
        }
    })
    it('handles multiple strings', () => {
        const elementExamples = [
            {
                selectors: {
                    alternativeNamesList: {
                        selector: 'example',
                        afterText: 'Also Known as:',
                        separator: ','
                    }
                },
                elements: [{ innerText: 'Also Known as: John Smith, Jon Smith' }],
                expected: {
                    alternativeNamesList: ['John Smith', 'Jon Smith']
                }
            },
            {
                selectors: {
                    alternativeNamesList: {
                        selector: 'example',
                        findElements: true,
                        afterText: 'Also Known as:'
                    }
                },
                elements: [
                    { innerText: 'Also Known as: John Smith' },
                    { innerText: 'Jon Smith' }
                ],
                expected: {
                    alternativeNamesList: ['John Smith', 'Jon Smith']
                }
            },
            {
                selectors: {
                    alternativeNamesList: {
                        selector: 'example',
                        findElements: true,
                        beforeText: ', '
                    }
                },
                elements: [
                    { innerText: 'John Smith, 89' },
                    { innerText: 'Jon Smith, 78' }
                ],
                expected: {
                    alternativeNamesList: ['John Smith', 'Jon Smith']
                }
            }
        ]

        for (const elementExample of elementExamples) {
            const elementFactory = () => elementExample.elements
            const profile = createProfile(elementFactory, elementExample.selectors)
            expect(profile).toEqual(elementExample.expected)
        }
    })
    it('handles addressFull', () => {
        const elementExamples = [
            {
                selectors: {
                    addressFull: {
                        selector: 'example'
                    }
                },
                elements: [{ innerText: 'abc, Dallas, Tx' }],
                expected: {
                    addressFull: 'abc, Dallas, Tx'
                }
            }
        ]

        for (const elementExample of elementExamples) {
            const elementFactory = () => elementExample.elements
            const profile = createProfile(elementFactory, elementExample.selectors)
            expect(profile).toEqual(elementExample.expected)
        }
    })
})
