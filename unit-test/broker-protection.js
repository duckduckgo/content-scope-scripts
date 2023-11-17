import { replaceTemplatedUrl } from '../src/features/broker-protection/buildUrl.js'
import { getNicknames, isSameAge, isSameName, matchAddressCityState, matchAddressFromAddressListCityState, matchAddressFull } from '../src/features/broker-protection/comparison-functions.js'
import { getCityStateCombos, stringToList } from '../src/features/broker-protection/extract.js'
import fc from 'fast-check'
import { processOne } from '../src/features/broker-protection/buildUrl-transforms.js'

describe('Actions', () => {
    describe('extract', () => {
        describe('isSameAge', () => {
            it('evaluate as the same as if the age is within 2 years', () => {
                expect(isSameAge(40, 41)).toBe(true)
            })

            it('evaluate as the same as if the age is within 2 years and given as a string', () => {
                expect(isSameAge(40, '41')).toBe(true)
            })

            it('does not evaluate as the same as if the age is not within 2 years', () => {
                expect(isSameAge(40, 44)).toBe(false)
            })

            it('does not evaluate as the same age if one is not a number', () => {
                expect(isSameAge(40, 'John Smith')).toBe(false)
            })
        })

        describe('getNicknames', () => {
            it('should return nicknames for a name in our nickname list', () => {
                expect(getNicknames('Jon')).toEqual(['jon', 'jonathan'])
            })

            it("should return the name if it's not in the list", () => {
                expect(getNicknames('John')).toEqual(['john'])
            })

            it("should return the name if it's not in the list", () => {
                expect(getNicknames(null)).toEqual([])
            })
        })

        describe('isSameName', () => {
            const userName = {
                firstName: 'Jon',
                middleName: 'Andrew',
                lastName: 'Smith',
                suffix: null
            }

            it('should match if exact match', () => {
                expect(isSameName('Jon Smith', userName.firstName, userName.middleName, userName.lastName)).toBe(true)
            })

            it('should match if nickname is given', () => {
                expect(isSameName('Jonathan Smith', userName.firstName, userName.middleName, userName.lastName)).toBe(true)
            })

            it('should match middle name', () => {
                expect(isSameName('Jon Andrew Smith', userName.firstName, userName.middleName, userName.lastName)).toBe(true)
            })

            it('should not if middle name is missing from user data', () => {
                expect(isSameName('Jon Andrew Smith', userName.firstName, null, userName.lastName)).toBe(false)
            })
        })

        describe('get correct city state combos from list', () => {
            const cityStateLists = [
                'Chicago IL, River Forest IL, Forest Park IL, Oak Park IL'
            ]
            const separator = ','

            it('should match when city/state is the same', () => {
                for (const cityStateList of cityStateLists) {
                    const list = stringToList(cityStateList, separator)
                    expect(list).toEqual([
                        'Chicago IL',
                        'River Forest IL',
                        'Forest Park IL',
                        'Oak Park IL'
                    ])
                    const result = getCityStateCombos(list)
                    expect(result).toEqual([
                        { city: 'Chicago', state: 'IL' },
                        { city: 'River Forest', state: 'IL' },
                        { city: 'Forest Park', state: 'IL' },
                        { city: 'Oak Park', state: 'IL' }
                    ])
                }
            })
        })

        describe('get correct city state combos from malformedlist', () => {
            const malformedCityStateList = [
                'Chicago IL, River Forest IL, Fores...'
            ]
            const separator = ','
            it('shouldshow partial address', () => {
                for (const cityStateList of malformedCityStateList) {
                    const list = stringToList(cityStateList, separator)
                    expect(list).toEqual([
                        'Chicago IL',
                        'River Forest IL',
                        'Fores...'
                    ])
                    const result = getCityStateCombos(list)
                    expect(result).toEqual([
                        { city: 'Chicago', state: 'IL' },
                        { city: 'River Forest', state: 'IL' }
                    ])
                }
            })
        })

        describe('get correct city state combos with separator', () => {
            const cityStateList = [
                { listString: 'Chicago IL\nRiver Forest IL\nForest Park IL\nOak Park IL', separator: '\n', list: ['Chicago IL', 'River Forest IL', 'Forest Park IL', 'Oak Park IL'] },
                { listString: 'Chicago, IL\nRiver Forest, IL\nForest Park, IL\nOak Park, IL', separator: '\n', list: ['Chicago, IL', 'River Forest, IL', 'Forest Park, IL', 'Oak Park, IL'] },
                { listString: 'Chicago IL | River Forest IL | Forest Park IL | Oak Park IL', separator: '|', list: ['Chicago IL', 'River Forest IL', 'Forest Park IL', 'Oak Park IL'] },
                { listString: 'Chicago, IL | River Forest, IL | Forest Park, IL | Oak Park, IL', separator: '|', list: ['Chicago, IL', 'River Forest, IL', 'Forest Park, IL', 'Oak Park, IL'] },
                { listString: 'Chicago, IL • River Forest, IL • Forest Park, IL • Oak Park, IL', separator: '•', list: ['Chicago, IL', 'River Forest, IL', 'Forest Park, IL', 'Oak Park, IL'] },
                { listString: 'Chicago IL • River Forest IL • Forest Park IL • Oak Park IL', separator: '•', list: ['Chicago IL', 'River Forest IL', 'Forest Park IL', 'Oak Park IL'] },
                { listString: 'Chicago IL   ·   River Forest IL   ·   Forest Park IL   ·   Oak Park IL', list: ['Chicago IL', 'River Forest IL', 'Forest Park IL', 'Oak Park IL'] }
            ]
            it('should get correct city state with separator', () => {
                for (const item of cityStateList) {
                    const list = stringToList(item.listString, item.separator)
                    expect(list).toEqual(item.list)

                    const result = getCityStateCombos(list)
                    expect(result).toEqual([
                        { city: 'Chicago', state: 'IL' },
                        { city: 'River Forest', state: 'IL' },
                        { city: 'Forest Park', state: 'IL' },
                        { city: 'Oak Park', state: 'IL' }
                    ])
                }
            })
        })

        describe('Address Matching', () => {
            const userData = {
                names: [
                    {
                        firstName: 'John',
                        middleName: null,
                        lastName: 'Smith'
                    }
                ],
                userAge: '40',
                addresses: [
                    {
                        addressLine1: '123 Fake St',
                        city: 'Chicago',
                        state: 'IL',
                        zip: '60602'
                    }
                ]
            }
            describe('isSameAddressCityState', () => {
                const userData = {
                    names: [
                        {
                            firstName: 'John',
                            middleName: null,
                            lastName: 'Smith'
                        }
                    ],
                    userAge: '40',
                    addresses: [
                        {
                            addressLine1: '123 Fake St',
                            city: 'Chicago',
                            state: 'IL',
                            zip: '60602'
                        }
                    ]
                }

                it('should match when city/state is the same', () => {
                    expect(matchAddressCityState(userData.addresses, 'chicago, il')).toBe(true)
                })
            })

            describe('matchAddressFromAddressListCityState', () => {
                it('should match when city/state is present', () => {
                    expect(matchAddressFromAddressListCityState(userData.addresses, ['chicago, il', 'schaumburg, il']))
                })

                it('should not match when city/state is not present', () => {
                    expect(matchAddressFromAddressListCityState(userData.addresses, ['los angeles, ca', 'portland, or']))
                })
            })

            describe('matchAddressFull', () => {
                it('should match when address is the same', () => {
                    expect(matchAddressFull(userData.addresses, '123 fake street, chicago, il, 60602')).toBe(true)
                })

                it('should not match when address line 1 is not the same', () => {
                    expect(matchAddressFull(userData.addresses, '218 fake st, chicago, il, 60602')).toBe(false)
                })

                it('should not match when city is not the same', () => {
                    expect(matchAddressFull(userData.addresses, '123 fake st, not chicago, il, 60602')).toBe(false)
                })
            })
        })
    })

    describe('buildUrl', () => {
        const userData = {
            firstName: 'John',
            lastName: 'Smith',
            city: 'Chicago',
            state: 'IL',
            age: '24'
        }

        const userData2 = {
            firstName: 'John',
            lastName: 'Smith',
            city: 'West Montego',
            state: 'NY',
            age: '24'
        }

        it('should build url without params', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/optout'
            }, userData)
            expect(result).toEqual({ url: 'https://example.com/optout' })
        })

        it('should build url when given valid data from path segments', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/${firstName}-${lastName}/a/b/c/search?state=${state}&city=${city|hyphenated}&fage=${age}'
            }, userData)
            expect(result).toEqual({ url: 'https://example.com/profile/John-Smith/a/b/c/search?state=il&city=Chicago&fage=24' })
        })

        it('should build url when given valid data from path segments with modifiers path and url', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/${firstName|downcase}-${lastName|downcase}/a/b/c/search?state=${state|downcase}&city=${city|downcase}&fage=${age}'
            }, userData)
            expect(result).toEqual({ url: 'https://example.com/profile/john-smith/a/b/c/search?state=il&city=chicago&fage=24' })
        })

        it('should build url when given valid data from url-search param segments', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/a/b/c/search?name=${firstName}-${lastName}&other=foobar'
            }, userData)
            expect(result).toEqual({ url: 'https://example.com/profile/a/b/c/search?name=John-Smith&other=foobar' })
        })

        it('should build url when given valid data', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city|hyphenated}&fage=${age}'
            }, userData)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=il&city=Chicago&fage=24' })
        })

        it('should build hyphenated url when given hyphenated city', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city|hyphenated}&fage=${age}'
            }, userData2)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=ny&city=West-Montego&fage=24' })
        })

        it('should build downcased hyphenated url when given a downcased hyphenated city', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city|downcase|hyphenated}&fage=${age}'
            }, userData2)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=ny&city=west-montego&fage=24' })
        })

        it('should build downcased hyphenated url when given a downcased hyphenated city in a different order', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city|hyphenated|downcase}&fage=${age}'
            }, userData2)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=ny&city=west-montego&fage=24' })
        })

        it('should build downcased snakecase url when given a downcased snakecase city', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city|snakecase|downcase}&fage=${age}'
            }, userData2)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=ny&city=west_montego&fage=24' })
        })

        it('should build hyphenated url when given hyphenated state', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state|stateFull|hyphenated}&city=${city}&fage=${age}'
            }, userData2)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=New-York&city=West+Montego&fage=24' })
        })

        it('should build url when given valid data and age range', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                url: 'https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city}&fage=${age|ageRange}',
                ageRange: ['18-30', '31-40', '41-50']
            }, userData)

            expect(result).toEqual({ url: 'https://example.com/profile/search?fname=John&lname=Smith&state=il&city=Chicago&fage=18-30' })
        })

        it('should error when given an invalid action', () => {
            const result = replaceTemplatedUrl({
                id: '0',
                // @ts-expect-error - test
                url: null
            }, userData)

            expect(result).toEqual({ error: 'Error: No url provided.' })
        })

        it('should accept any inputs and not crash', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.anything(),
                        fc.record({
                            url: fc.anything()
                        })
                    ),
                    fc.oneof(
                        fc.anything(),
                        fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean()))
                    ),
                    (action, userData) => {
                        const result = replaceTemplatedUrl(/** @type {any} */(action), userData)
                        expect('url' in result || 'error' in result)
                        if ('error' in result) {
                            expect(typeof result.error).toEqual('string')
                        }
                        if ('url' in result) {
                            const url = new URL(result.url)
                            expect(url).toBeDefined()
                        }
                    }
                )
            )
        })

        it('should template the url with random inputs and produce a valid URL', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        url: fc.constant('https://example.com/profile/search?fname=${firstName}&lname=${lastName}&state=${state}&city=${city|hyphenated}&fage=${age}')
                    }),
                    fc.record({
                        firstName: fc.string(),
                        lastName: fc.string(),
                        city: fc.string(),
                        state: fc.string(),
                        age: fc.oneof(fc.string(), fc.integer())
                    }),
                    (action, userData) => {
                        const result = replaceTemplatedUrl(/** @type {any} */(action), userData)
                        expect('url' in result || 'error' in result)
                        if ('url' in result) {
                            const url = new URL(result.url)
                            expect(url).toBeDefined()
                        }
                    }
                )
            )
        })
        it('should test the regex replacer with random values', () => {
            const variable = fc.string().map(randomMiddle => {
                return '${' + randomMiddle + '}'
            })

            const padded = variable.map(randomMiddle => {
                return '--' + randomMiddle + '--'
            })

            fc.assert(
                fc.property(
                    padded,
                    fc.object(),
                    fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
                    (input, action, userData) => {
                        const output = processOne(input, /** @type {any} */(action), userData)
                        expect(typeof output).toEqual('string')
                    }
                )
            )
        })
    })
})
