/**
 * @import { ActionParent } from '../../../src/features/broker-protection/types.js'
 */

/**
 * @typedef {object} Address
 * @property {string} addressLine1
 * @property {string} city
 * @property {string} state
 */

/**
 * @typedef {object} UserProfile
 * @property {string} firstName
 * @property {string} [middleName]
 * @property {string} lastName
 * @property {string} age
 * @property {Address[]} addresses
 */

/**
 * @param {Partial<UserProfile>} [overrides]
 * @returns {UserProfile}
 */
export function createUserProfile(overrides = {}) {
    return {
        firstName: 'James',
        middleName: 'William',
        lastName: 'Daly',
        age: '52',
        addresses: [{ addressLine1: '123 Fake St', city: 'Gilbert', state: 'AZ' }],
        ...overrides,
    };
}

/**
 * @returns {ActionParent}
 */
export function createProfileMatchParent() {
    return {
        profileMatch: {
            selector: '#people-search-results li',
            profile: {
                name: {
                    selector:
                        ".//div[contains(concat(' ', normalize-space(@class), ' '), ' !text-black-900 ') and contains(concat(' ', normalize-space(@class), ' '), ' text-lg ')]",
                },
                age: { selector: ".//div[@class='text-lg']" },
                addressCityStateList: {
                    selector: ".//div[@class='text-xs']/following-sibling::div",
                    findElements: true,
                },
            },
        },
    };
}
